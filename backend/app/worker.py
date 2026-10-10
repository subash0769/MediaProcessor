import os
import time
import json
from datetime import datetime
import redis
from .config import settings
from .database import SessionLocal, Base, engine
from .models import MediaFile
from .processor import process_media_file

def run_worker():
    print(f"[*] Starting Media Processing Worker...")
    print(f"[*] Connecting to Redis: {settings.REDIS_URL}")
    print(f"[*] Shared upload dir: {settings.UPLOAD_DIR}")
    
    # Ensure database tables exist
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        pass
    
    r = redis.from_url(settings.REDIS_URL)
    QUEUE_NAME = "media_processing_queue"
    
    print(f"[*] Listening for tasks on queue: '{QUEUE_NAME}'...")

    while True:
        try:
            # Blocking pop with 5 second timeout
            item = r.blpop(QUEUE_NAME, timeout=5)
            if not item:
                continue

            _, payload_raw = item
            task_data = json.loads(payload_raw.decode("utf-8"))
            media_id = task_data.get("media_id")
            
            print(f"[+] Received processing task for Media ID: {media_id}")
            
            db = SessionLocal()
            try:
                media = db.query(MediaFile).filter(MediaFile.id == media_id).first()
                if not media:
                    print(f"[-] Media ID {media_id} not found in database.")
                    continue
                
                media.status = "PROCESSING"
                db.commit()

                original_path = os.path.join(settings.UPLOAD_DIR, "originals", media.stored_filename)
                thumbnails_dir = os.path.join(settings.UPLOAD_DIR, "thumbnails")

                # Simulated processing delay to see real-time status transitions
                time.sleep(1.5)

                result = process_media_file(original_path, thumbnails_dir)

                media.width = result["width"]
                media.height = result["height"]
                media.format = result["format"]
                media.color_mode = result["color_mode"]
                media.thumbnail_path = result["thumbnail_filename"]
                media.status = "COMPLETED"
                media.completed_at = datetime.utcnow()
                db.commit()
                print(f"[✔] Successfully processed Media ID: {media_id} ({result['width']}x{result['height']} {result['format']})")
            except Exception as e:
                print(f"[!] Error processing Media ID {media_id}: {e}")
                if media:
                    media.status = "FAILED"
                    media.error_message = str(e)
                    db.commit()
            finally:
                db.close()

        except redis.ConnectionError as ce:
            print(f"[!] Redis connection error: {ce}. Retrying in 3s...")
            time.sleep(3)
        except Exception as e:
            print(f"[!] Worker unexpected error: {e}")
            time.sleep(2)

if __name__ == "__main__":
    run_worker()
