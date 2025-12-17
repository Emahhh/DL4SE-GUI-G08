# Stage 1: build the React frontend into static assets.
FROM node:20-alpine AS frontend-builder
# Set the working directory for frontend operations.
WORKDIR /app/frontend
# Copy only package manifests to leverage cached dependency layers.
COPY frontend/package*.json ./
# Install frontend dependencies.
RUN npm install
# Copy the remaining frontend source code.
COPY frontend/ .
# Produce the optimized production build.
RUN npm run build

# Stage 2: build a slim Python image that serves FastAPI and the built frontend.
FROM python:3.11-slim AS backend
# Set the working directory for the final application.
WORKDIR /app
# Install system libraries needed by Pillow/torchvision for image handling.
# Install system libraries needed by Pillow/torchvision for image handling.
RUN apt-get update \
	&& apt-get install -y --no-install-recommends libjpeg62-turbo libpng16-16 libgl1 \
	&& rm -rf /var/lib/apt/lists/*
# Copy backend dependency specification first to maximize Docker layer caching.
COPY backend/requirements.txt backend/requirements.txt
# Install Python dependencies without caching to keep the image small.
RUN pip install --no-cache-dir -r backend/requirements.txt
# Copy backend application code, including the model file.
COPY backend/ backend/
# Copy the compiled frontend assets from the builder stage into the image.
COPY --from=frontend-builder /app/frontend/dist frontend/dist
# Expose the FastAPI port.
EXPOSE 8000
# Set a sensible default port environment variable for uvicorn.
ENV PORT=8000
# Start the FastAPI app with uvicorn, binding to all network interfaces.
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "debug"]
