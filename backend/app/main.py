import os
import uuid
import json
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import redis

from .config import settings
from .database import engine, Base, get_db
from .models import MediaFile

# Create DB tables on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "originals"), exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "thumbnails"), exist_ok=True)
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        pass
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan
)

# CORS
cors_list = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files and thumbnails statically
app.mount("/static/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

def get_redis_client():
    return redis.from_url(settings.REDIS_URL)

@app.get("/health")
def health():
    return {"status": "ok", "service": "media-processor-api"}

@app.get("/api/media")
def list_media(db: Session = Depends(get_db)):
    files = db.query(MediaFile).order_by(MediaFile.created_at.desc()).all()
    return files

@app.get("/api/media/{media_id}")
def get_media(media_id: int, db: Session = Depends(get_db)):
    media = db.query(MediaFile).filter(MediaFile.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media file not found")
    return media

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files (PNG, JPG, WEBP, GIF) are supported."
        )

    ext = os.path.splitext(file.filename)[1].lower()
    stored_name = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(settings.UPLOAD_DIR, "originals", stored_name)

    content = await file.read()
    file_size = len(content)

    with open(dest_path, "wb") as f:
        f.write(content)

    # Create DB entry with PENDING status
    media = MediaFile(
        filename=file.filename,
        stored_filename=stored_name,
        content_type=file.content_type,
        file_size=file_size,
        status="PENDING"
    )
    db.add(media)
    db.commit()
    db.refresh(media)

    # Queue background task to Redis
    try:
        r = get_redis_client()
        task_payload = json.dumps({"media_id": media.id})
        r.rpush("media_processing_queue", task_payload)
    except Exception as e:
        print(f"[!] Warning: Could not push task to Redis: {e}")

    return media

@app.post("/api/media/{media_id}/reprocess")
def reprocess_media(media_id: int, db: Session = Depends(get_db)):
    media = db.query(MediaFile).filter(MediaFile.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    media.status = "PENDING"
    media.error_message = None
    db.commit()

    r = get_redis_client()
    task_payload = json.dumps({"media_id": media.id})
    r.rpush("media_processing_queue", task_payload)
    return {"message": "Reprocessing task queued", "media": media}

@app.delete("/api/media/{media_id}")
def delete_media(media_id: int, db: Session = Depends(get_db)):
    media = db.query(MediaFile).filter(MediaFile.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    # Clean up physical files
    original_path = os.path.join(settings.UPLOAD_DIR, "originals", media.stored_filename)
    if os.path.exists(original_path):
        try:
            os.remove(original_path)
        except OSError:
            pass

    if media.thumbnail_path:
        thumb_path = os.path.join(settings.UPLOAD_DIR, "thumbnails", media.thumbnail_path)
        if os.path.exists(thumb_path):
            try:
                os.remove(thumb_path)
            except OSError:
                pass

    db.delete(media)
    db.commit()
    return {"message": "Media file deleted successfully"}
