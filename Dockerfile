# Stage 1: build the React frontend into static assets.
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --no-audit --no-fund
COPY frontend/ .
RUN npm run build

# Stage 2: assemble a portable CPU-only FastAPI runtime.
FROM python:3.11-slim AS backend

ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1 \
	PIP_NO_CACHE_DIR=1 \
	PIP_DISABLE_PIP_VERSION_CHECK=1 \
	PIP_EXTRA_INDEX_URL=https://download.pytorch.org/whl/cpu \
	PORT=8000

WORKDIR /app

# Install system libraries needed by Pillow/torchvision for image handling.
RUN apt-get update \
	&& apt-get install -y --no-install-recommends libjpeg62-turbo libpng16-16 libgl1 \
	&& rm -rf /var/lib/apt/lists/*

# Install Python dependencies first to leverage Docker layer caching.
COPY backend/requirements.txt backend/requirements.txt
RUN pip install -r backend/requirements.txt

# Copy backend application code (model + API) and baked frontend.
COPY backend/ backend/
# Copy the compiled frontend assets from the builder stage into the image.
COPY --from=frontend-builder /app/frontend/dist frontend/dist

EXPOSE 8000

# Start the FastAPI app with uvicorn, binding to all network interfaces.
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "debug"]
