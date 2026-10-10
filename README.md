# 🖼️ PixelForge — Distributed Media & Document Processing Service

**PixelForge** is a full-stack, distributed asynchronous media processing system designed for you to practice and write your own **Dockerfiles** and **Docker Compose** configurations.

---

## 🏗️ Architecture & Component Overview

```
                                  +-------------------+
                                  |    Web Browser    |
                                  | (Dashboard @ 3000)|
                                  +---------+---------+
                                            |
                         +------------------+------------------+
                         | (HTTP / Static)                     | (REST API / Uploads)
                         v                                     v
                 +---------------+                     +---------------+
                 |    frontend   |                     |      api      |
                 | (React+Nginx) |                     |   (FastAPI)   |
                 +---------------+                     +-------+-------+
                                                               |
                                          +--------------------+--------------------+
                                          | Enqueues Task                           | Writes File
                                          v                                         v
                                  +---------------+                        +-----------------+
                                  |     redis     |                        |  media_uploads  |
                                  |  (Task Queue) |                        | (Shared Volume) |
                                  +-------+-------+                        +--------+--------+
                                          |                                         ^
                                          | Worker Pops Job                         | Reads/Writes
                                          v                                         | Thumbnails
                                  +---------------+                                 |
                                  |    worker     |---------------------------------+
                                  | (Pillow/Proc) |
                                  +-------+-------+
                                          | Updates Status
                                          v
                                  +---------------+
                                  |   postgres    |
                                  |  (Media DB)   |
                                  +---------------+
```

---

## 🎯 Containerization Challenge & Specifications

Your goal is to create the **Dockerfiles** and a **`compose.yaml`** from scratch according to the specifications below.

### 1. Backend Service (`backend/`)
* **Technology**: Python 3.11, FastAPI, Uvicorn, Pillow, SQLAlchemy, Redis.
* **Dependencies**: Defined in `backend/requirements.txt` (requires `build-essential` and `libpq-dev` during build).
* **Port**: Default `8000` (FastAPI).
* **Storage**: Writes uploaded original files to `/app/uploads/originals` and thumbnails to `/app/uploads/thumbnails`.
* **Container Entrypoint**:
  * For API: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
  * For Worker: `python -m app.worker`
* **Environment Variables**:
  * `DATABASE_URL`: e.g. `postgresql://postgres:postgrespassword@postgres:5432/media_db`
  * `REDIS_URL`: e.g. `redis://redis:6379/0`
  * `UPLOAD_DIR`: Path to uploads directory (e.g. `/app/uploads`)
  * `CORS_ORIGINS`: Origins allowed to communicate with the API (e.g. `http://localhost:3000,http://localhost:5173,http://localhost,http://127.0.0.1:3000`)
* **Tip**: Use a **multi-stage build** (`python:3.11-slim` builder stage for pip wheels, and a minimal runtime stage copying `/opt/venv`).

### 2. Frontend Service (`frontend/`)
* **Technology**: React 18, Vite.
* **Dependencies**: Defined in `frontend/package.json`.
* **Port**: Mapped to host port `3000` (serving on container port `80`).
* **Environment Variables**:
  * `VITE_API_URL`: Browser-facing backend API URL (default: `http://localhost:8000`).
* **Tip**: Multi-stage build: Stage 1 builds with `node:20-alpine`, Stage 2 copies `/app/dist` to `/usr/share/nginx/html` in `nginx:alpine`.

### 3. Database (`postgres`)
* **Image**: `postgres:16-alpine`
* **Environment Variables**:
  * `POSTGRES_USER=postgres`
  * `POSTGRES_PASSWORD=postgrespassword`
  * `POSTGRES_DB=media_db`
* **Port**: `5432:5432`
* **Persistent Volume**: Mount named volume to `/var/lib/postgresql/data`
* **Healthcheck**: `pg_isready -U postgres -d media_db`

### 4. Message Broker (`redis`)
* **Image**: `redis:7-alpine`
* **Port**: `6379:6379`
* **Healthcheck**: `redis-cli ping`

### 5. Multi-Container Shared Volume
* **Crucial Concept**: The `api` container and the `worker` container must share the same volume for `/app/uploads` (e.g. named volume `media_uploads:/app/uploads`). When the API saves an image, the worker container needs immediate access to that file to generate the thumbnail!

---

## 🚀 Running Locally Without Docker (For Testing)

```bash
# 1. Backend (ensure Postgres and Redis are running locally or via Docker)
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 2. Worker (in a separate terminal)
cd backend
source venv/bin/activate
python -m app.worker

# 3. Frontend
cd frontend
npm install
npm run dev
```
# MediaProcessor
