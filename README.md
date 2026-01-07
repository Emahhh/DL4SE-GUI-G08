# DL4SE Demo (FastAPI + React + PyTorch)

A single-container web app that serves a ConvNeXt-Tiny PyTorch image classifier via FastAPI and a Vite/React frontend UI. The app allows users to upload images of ball screw drives, classifies them for defects using a pre-trained model, and persists inventory data in a SQLite database, helping quality engineers manage manufacturing processes.

## Project Layout

- backend/: FastAPI app with PyTorch model inference and SQLite database.
- frontend/: Vite/React app for user interface.
- Dockerfile: Multi-stage build that bundles both tiers.

## Setup & Run

1. Run Docker Desktop or Docker daemon. (Prerequisite: Docker 24+ with buildx enabled)

2. Build the image (native architecture):
   ```bash
   docker build -t dl4se-demo .
   ```

3. Run the container (data is persisted on the file `backend/app_database.db` in the current directory):
   
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

4. Open [http://localhost:8000](http://localhost:8000) to view the app.


## API Usage

- POST /api/predict with JSON `{ "image_base64": "<base64 of image bytes>" }`
- Response: `{ "score": 0.52, "label": 1 }` where `label` 1 means "has defect"
- GET /api/inventory returns persisted inventory items
- POST /api/inventory/upload with JSON `{ "items": [{ "image_base64": "...", "name": "optional" }] }` to batch upload and persist items
- POST /api/inventory/classify runs the model over all persisted items and updates status/score/label


## Notes

- The project uses a SQLite database (`backend/app_database.db`) for data persistence. If you run the database.py script, it will initialize the database with the required tables and sample data.
- The PyTorch model is a ConvNeXt-Tiny architecture fine-tuned for binary classification of ball screw drive images. The model weights are loaded from `backend/model.pt`. The training code is contained in [a separate repo](https://github.com/Emahhh/DL4SE-project-UPM).

