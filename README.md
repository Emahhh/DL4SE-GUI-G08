# DL4SE Demo (FastAPI + React + PyTorch)

A minimal, single-container web app that serves a ConvNeXt-Tiny PyTorch image classifier via FastAPI and a Vite/React frontend styled with Pico.css.

## Project Layout

- backend/: FastAPI app, lightweight demo model, requirements.
- frontend/: Vite/React source.
- Dockerfile: Multi-stage build that bundles both tiers.

## Prerequisites

- Docker 24+ with buildx enabled.

## Quickstart (Docker)

0. Run Docker Desktop or Docker daemon.

1. Build the image (native architecture):
   ```bash
   docker build -t dl4se-demo .
   ```

2. Run the container (data saved inside container only):
   ```bash
   docker run -p 8000:8000 dl4se-demo
   ```
   
   **OR** Run with persistent data (recommended - saves database to your local machine):
   
   **Mac/Linux:**
   ```bash
   docker run -p 8000:8000 -v "$(pwd)/backend:/app/backend" dl4se-demo
   ```
   
   **Windows (PowerShell):**
   ```powershell
   docker run -p 8000:8000 -v "${PWD}/backend:/app/backend" dl4se-demo
   ```
   
   **Windows (CMD):**
   ```cmd
   docker run -p 8000:8000 -v "%cd%/backend:/app/backend" dl4se-demo
   ```

3. Open http://localhost:8000 to view the app; API lives at /api/predict.

## Cross-Architecture Builds

- Build AMD64 image on ARM (e.g., Apple Silicon):
  - `docker build --platform=linux/amd64 -t dl4se-demo:amd64 .`
- Build ARM64 image on AMD64:
  - `docker build --platform=linux/arm64/v8 -t dl4se-demo:arm64 .`
- Run either image on matching host or use Docker Desktop emulation.

## Local Development (optional)

- Frontend: `cd frontend && npm install && npm run dev`
- Backend: `cd backend && python main.py`

## API Usage

- POST /api/predict with JSON `{ "image_base64": "<base64 of image bytes>" }`
- Response: `{ "score": 0.52, "label": 1 }` where `label` 1 means "has defect"
- GET /api/inventory returns persisted inventory items
- POST /api/inventory/upload with JSON `{ "items": [{ "image_base64": "...", "name": "optional" }] }` to batch upload and persist items
- POST /api/inventory/classify runs the model over all persisted items and updates status/score/label

## SQLite Database

The project uses a SQLite database (`backend/app_database.db`) for data persistence.

### Initialize the Database
```bash
cd backend && python database.py
```

### View Database (Command Line)
```bash
# List all tables
sqlite3 app_database.db ".tables"

# View table schema
sqlite3 app_database.db ".schema users"

# Query data
sqlite3 app_database.db "SELECT * FROM users;"
sqlite3 app_database.db "SELECT * FROM predictions_log;"
sqlite3 app_database.db "SELECT * FROM inventory_items;"
```

### GUI Tools (Optional)
- **VS Code**: Install the "SQLite Viewer" extension and click on `app_database.db`
- **DB Browser for SQLite**: Download from https://sqlitebrowser.org/

## Notes

- Provide a valid `backend/model.pt` convnext_tiny state_dict before running; the server will error if the file is missing or incompatible.
- Inventory items and images persist under `backend/inventory/` on disk.
- Static React assets are served by FastAPI with an index.html fallback to keep React Router routes working on refresh.
