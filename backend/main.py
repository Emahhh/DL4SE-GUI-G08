"""
A fully commented FastAPI application that loads a PyTorch model
and exposes a prediction endpoint while serving a Vite-built React SPA.
Every line is commented for instructional clarity.
"""

# Import the pathlib module to work with file system paths in an OS-agnostic way.
from pathlib import Path

# Import FastAPI to create the web application and define API routes.
from fastapi import FastAPI, HTTPException

# Import CORSMiddleware to optionally allow local dev frontends to call the API.
from fastapi.middleware.cors import CORSMiddleware

# Import StaticFiles to serve the compiled React assets directly from FastAPI.
from fastapi.staticfiles import StaticFiles

# Import BaseModel from Pydantic to validate and document request payloads.
from pydantic import BaseModel, Field

# Import helpers for decoding base64-encoded image strings from the client.
import base64
import io
import json
import time
import uuid

# Import the Pillow image module to decode and manipulate images.
from PIL import Image, UnidentifiedImageError

# Import torchvision model and transforms to prepare images and run inference.
import torchvision.transforms as T
from torchvision.models import convnext_tiny

# Import torch, the deep learning framework used to define and load the model.
import torch
from torch.nn import functional as F

# Define the path to the folder that contains this file so we can locate assets relative to it.
BACKEND_DIR = Path(__file__).resolve().parent

# Define the path where the serialized PyTorch model is expected to live.
MODEL_PATH = BACKEND_DIR / "model.pt"
INVENTORY_DIR = BACKEND_DIR / "inventory"
INVENTORY_IMAGES_DIR = INVENTORY_DIR / "images"
INVENTORY_DB_PATH = INVENTORY_DIR / "inventory.json"

# Define the path to the built frontend directory (created by Vite during `npm run build`).
STATIC_DIR = BACKEND_DIR.parent / "frontend" / "dist"

# Create the FastAPI application instance that will manage routes and middleware.
app = FastAPI(title="DL4SE Demo API", version="1.0.0")

# Add a permissive CORS policy to simplify local development across ports; adjust in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    # Expect a base64-encoded image string supplied by the client.
    image_base64: str


class InventoryItem(BaseModel):
    # Unique identifier for the stored item.
    id: str
    # Human-friendly name provided by the user or generated from the file name.
    name: str
    # Simplified lifecycle status for the lot.
    status: str = "awaiting_review"
    # Optional ownership/assignee to reflect who is responsible for the part.
    owner: str = ""
    # When the item was created (seconds since epoch).
    created_at: float
    # Relative path (within inventory images directory) where the image is stored for frontend retrieval.
    image_path: str
    # Optional notes field for additional context.
    notes: str = ""
    # Optional probability score for the "has defect" class.
    score: float | None = None
    # Optional predicted label: 1 means has defect, 0 means no defect.
    label: int | None = None


class InventoryUploadRequest(BaseModel):
    # List of objects carrying base64-encoded images and optional names.
    items: list[dict] = Field(..., description="List of items with base64 image data and optional name")


class InventoryUpdateRequest(BaseModel):
    """Schema for partial updates to a single inventory item."""

    name: str | None = Field(default=None, max_length=200)
    status: str | None = Field(default=None, max_length=60)
    notes: str | None = None
    owner: str | None = Field(default=None, max_length=120)
    append_notes: bool = False


class InventoryBatchUpdateRequest(InventoryUpdateRequest):
    """Schema for updating multiple items in one request."""

    item_ids: list[str] = Field(..., min_length=1, description="IDs to update")


class InventoryAIInsightsRequest(BaseModel):
    """Schema for requesting AI-driven recommendations for selected items."""

    item_ids: list[str] = Field(..., min_length=1)

ALLOWED_STATUSES = {"awaiting_review", "in_review", "needs_attention", "cleared"}


def ensure_valid_status(value: str | None) -> str:
    candidate = (value or "").strip() or "awaiting_review"
    if candidate not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status '{value}' is not allowed.")
    return candidate

# Define a response schema to make returned data explicit and documented.
class PredictResponse(BaseModel):
    # The raw score output by the network (after sigmoid), represented as a float.
    score: float
    # A simple binary label derived from the score using a 0.5 threshold.
    label: int

def inspect_checkpoint() -> None:
    """Inspect and print diagnostic information about the model checkpoint."""
    if not MODEL_PATH.exists():
        print(f"❌ Model file not found at {MODEL_PATH}")
        return
    
    print(f"\n{'='*60}")
    print(f"🔍 INSPECTING MODEL CHECKPOINT: {MODEL_PATH.name}")
    print(f"{'='*60}")
    
    try:
        # Load checkpoint
        checkpoint = torch.load(MODEL_PATH, map_location=torch.device("cpu"), weights_only=False)
        
        # Check checkpoint format
        if isinstance(checkpoint, dict):
            print(f"✓ Checkpoint is a dictionary with keys: {list(checkpoint.keys())}")
            
            # Extract state_dict
            if "model_state_dict" in checkpoint:
                state_dict = checkpoint["model_state_dict"]
                print(f"✓ Found 'model_state_dict' key")
            elif "state_dict" in checkpoint:
                state_dict = checkpoint["state_dict"]
                print(f"✓ Found 'state_dict' key")
            else:
                state_dict = checkpoint
                print(f"✓ Using checkpoint dict directly as state_dict")
        else:
            state_dict = checkpoint
            print(f"✓ Checkpoint is a raw state_dict")
        
        # Check for backbone prefix
        has_backbone_prefix = any(key.startswith("backbone.") for key in state_dict.keys())
        print(f"✓ Has 'backbone.' prefix: {has_backbone_prefix}")
        
        # Print all keys and shapes
        print(f"\n📋 State dict contains {len(state_dict)} keys:")
        for key, value in state_dict.items():
            if hasattr(value, 'shape'):
                print(f"   {key}: {list(value.shape)}")
        
        # Check classifier head specifically
        print(f"\n🎯 Classifier head inspection:")
        classifier_keys = [k for k in state_dict.keys() if 'classifier' in k]
        if classifier_keys:
            for key in classifier_keys:
                value = state_dict[key]
                print(f"   {key}: {list(value.shape)}")
                if 'classifier.2.weight' in key or 'classifier.weight' in key:
                    num_classes = value.shape[0]
                    print(f"   → Detected {num_classes} output classes")
        else:
            print(f"   ⚠️  No classifier keys found in checkpoint!")
        
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"❌ Error inspecting checkpoint: {e}")
        print(f"{'='*60}\n")

def load_model() -> torch.nn.Module:
    # Immediately fail with a clear message if the expected model file is absent.
    if not MODEL_PATH.exists():
        raise RuntimeError(
            f"Required model file not found at {MODEL_PATH}. Provide a convnext_tiny state_dict before starting the server."
        )

    # Instantiate with 2 classes to match the trained checkpoint head.
    model = convnext_tiny(num_classes=2)

    # Load checkpoint from disk, forcing CPU placement for portability.
    checkpoint = torch.load(
        MODEL_PATH,
        map_location=torch.device("cpu"),
        weights_only=False,  # Allow loading full checkpoint dicts with metadata.
    )

    # Handle different checkpoint formats (dict wrapper vs raw state_dict).
    if isinstance(checkpoint, dict):
        if "model_state_dict" in checkpoint:
            state_dict = checkpoint["model_state_dict"]
        elif "state_dict" in checkpoint:
            state_dict = checkpoint["state_dict"]
        else:
            state_dict = checkpoint
    else:
        state_dict = checkpoint

    # If weights were saved with a "backbone." prefix, strip it for compatibility.
    if any(key.startswith("backbone.") for key in state_dict.keys()):
        trimmed = {}
        for key, value in state_dict.items():
            new_key = key.replace("backbone.", "", 1)
            trimmed[new_key] = value
        state_dict = trimmed

    # The training added a separate classifier.1 (2-class head); map it to classifier.2 (Linear layer).
    if "classifier.1.weight" in state_dict and "classifier.1.bias" in state_dict:
        print("✓ Found trained 2-class head at classifier.1, mapping to classifier.2")
        state_dict["classifier.2.weight"] = state_dict.pop("classifier.1.weight")
        state_dict["classifier.2.bias"] = state_dict.pop("classifier.1.bias")

    # Load the trained weights non-strictly; ignore the old 1000-class head.
    missing, unexpected = model.load_state_dict(state_dict, strict=False)
    
    # Print what was loaded and what was skipped.
    if missing:
        print(f"⚠️  Keys not loaded (expected for LayerNorm/Flatten): {missing}")
    if unexpected:
        print(f"⚠️  Unexpected keys (ignored): {[k for k in unexpected if 'classifier.2' not in k][:5]}")

    # Put the model into inference mode for deterministic behavior.
    model.eval()
    return model

# Inspect the checkpoint before loading
inspect_checkpoint()

# Load the model once at startup so it can be reused for all incoming requests.
MODEL = load_model()

# Ensure inventory directories exist at startup for persistence across runs.
INVENTORY_IMAGES_DIR.mkdir(parents=True, exist_ok=True)

# Simple helpers to persist inventory metadata on disk.
def load_inventory() -> list[InventoryItem]:
    if not INVENTORY_DB_PATH.exists():
        return []
    with INVENTORY_DB_PATH.open("r", encoding="utf-8") as fh:
        data = json.load(fh)
    return [InventoryItem(**item) for item in data]


def save_inventory(items: list[InventoryItem]) -> None:
    with INVENTORY_DB_PATH.open("w", encoding="utf-8") as fh:
        json.dump([item.model_dump() for item in items], fh, indent=2)


def apply_updates(item: InventoryItem, payload: InventoryUpdateRequest) -> InventoryItem:
    """Return a new InventoryItem with the requested updates applied."""

    data = item.model_dump()
    if payload.name is not None:
        candidate = payload.name.strip()
        if candidate:
            data["name"] = candidate
    if payload.status is not None:
        trimmed_status = payload.status.strip()
        if trimmed_status:
            data["status"] = ensure_valid_status(trimmed_status)
    if payload.owner is not None:
        data["owner"] = payload.owner.strip()
    if payload.notes is not None:
        existing = data.get("notes", "") or ""
        incoming = payload.notes.strip()
        if payload.append_notes and existing:
            data["notes"] = f"{existing}\n{incoming}" if incoming else existing
        else:
            data["notes"] = incoming
    return InventoryItem(**data)


def build_ai_insight(item: InventoryItem) -> dict:
    """Derive heuristic guidance for an inventory item based on model outputs."""

    score = item.score if item.score is not None else 0.0
    has_prediction = item.score is not None
    recommended_status = "awaiting_review" if not has_prediction else "in_review"
    priority = "low" if not has_prediction else "medium"
    owner_hint = item.owner or ("Maintenance" if score >= 0.6 else "Quality")
    suggested_note = "Item has not been classified yet. Schedule inspection."

    if not has_prediction:
        summary = "No prediction data available; prompt the lab to classify this image."
    elif score >= 0.85:
        recommended_status = "needs_attention"
        priority = "critical"
        owner_hint = "Reliability"
        summary = "Model flags this component as highly likely defective. Quarantine the lot immediately."
        suggested_note = "Hold shipment, escalate to reliability engineering, and initiate tear-down analysis."
    elif score >= 0.65:
        recommended_status = "needs_attention"
        priority = "high"
        owner_hint = "Maintenance"
        summary = "Elevated defect probability; prioritize rework and secondary inspection."
        suggested_note = "Route to maintenance for rework and request ultrasonic verification."
    elif score >= 0.45:
        recommended_status = "in_review"
        priority = "elevated"
        summary = "Borderline reading; keep under observation and sample additional units."
        suggested_note = "Add to the monitoring queue and capture more samples from the same batch."
    else:
        recommended_status = "cleared"
        priority = "low"
        owner_hint = item.owner or "Quality"
        summary = "Low likelihood of defect; release after visual confirmation."
        suggested_note = "Log QA spot check and release to assembly if no manual defects are found."

    return {
        "item_id": item.id,
        "name": item.name,
        "current_status": item.status,
        "recommended_status": recommended_status,
        "priority": priority,
        "owner_hint": owner_hint,
        "confidence": round(score, 3) if item.score is not None else None,
        "summary": summary,
        "suggested_note": suggested_note,
    }


# Classify a single inventory item by loading its stored image.
def classify_inventory_item(item: InventoryItem) -> InventoryItem:
    # Locate the stored image file; resolve relative path against images dir.
    image_file = INVENTORY_IMAGES_DIR / Path(item.image_path).name
    if not image_file.exists():
        raise FileNotFoundError(f"Stored image missing for item {item.id}: {image_file}")

    # Load and preprocess the image.
    image = Image.open(image_file).convert("RGB")
    tensor = PREPROCESS(image).unsqueeze(0)

    # Run inference.
    with torch.no_grad():
        logits = MODEL(tensor)
        probs = F.softmax(logits, dim=1)

    score = float(probs[0, 1].item())
    label = int(probs.argmax(dim=1).item())

    # Update item fields.
    item.score = score
    item.label = label
    item.status = "needs_attention" if label == 1 else "cleared"
    return item

# Define a reusable image preprocessing pipeline to match ConvNeXt expectations.
PREPROCESS = T.Compose(
    [
        # Resize incoming images to the expected 150x150 spatial size.
        T.Resize((150, 150)),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]
)

# Define the prediction endpoint that receives an image and returns model outputs.
@app.post("/api/predict", response_model=PredictResponse)
async def predict(payload: PredictRequest) -> PredictResponse:
    # Extract the base64 string from the validated request body.
    encoded = payload.image_base64
    # Reject empty strings to avoid confusing errors downstream.
    if not encoded.strip():
        raise HTTPException(status_code=400, detail="image_base64 is empty.")

    try:
        # Decode the base64 string into raw bytes.
        image_bytes = base64.b64decode(encoded, validate=True)
    except Exception:
        # Return a 400 when decoding fails to guide the client to send valid base64.
        raise HTTPException(status_code=400, detail="image_base64 must be valid base64-encoded data.")

    try:
        # Open the image from bytes, forcing RGB to ensure 3 channels.
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except UnidentifiedImageError:
        # If PIL cannot parse the image, inform the client.
        raise HTTPException(status_code=400, detail="Could not parse image. Ensure it is a valid image file.")

    # Apply the preprocessing pipeline: resize, to tensor, and normalize for ConvNeXt.
    image_tensor = PREPROCESS(image)
    # Add a batch dimension for model input: shape becomes (1, 3, H, W).
    batch = image_tensor.unsqueeze(0)

    # Disable gradients to keep inference lightweight.
    with torch.no_grad():
        # Run the tensor through the model to obtain logits for two classes: [no_defect, has_defect].
        logits = MODEL(batch)
        # Convert logits to probabilities with softmax.
        probs = F.softmax(logits, dim=1)

    # Extract the probability for the "has defect" class (index 1 assumes binary ordering).
    score = float(probs[0, 1].item())
    # Derive the predicted class index.
    label = int(probs.argmax(dim=1).item())
    # Return the structured response object containing both the score and label.
    return PredictResponse(score=score, label=label)


# Return all inventory items persisted on disk.
@app.get("/api/inventory", response_model=list[InventoryItem])
async def list_inventory() -> list[InventoryItem]:
    return load_inventory()


# Batch upload inventory images; images are stored on disk and metadata persisted.
@app.post("/api/inventory/upload", response_model=list[InventoryItem])
async def upload_inventory(payload: InventoryUploadRequest) -> list[InventoryItem]:
    items = load_inventory()
    for entry in payload.items:
        raw_base64 = entry.get("image_base64", "")
        name = entry.get("name") or "Item"
        if not raw_base64.strip():
            raise HTTPException(status_code=400, detail="Each item must include image_base64 data.")
        try:
            image_bytes = base64.b64decode(raw_base64, validate=True)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 in one of the items.")

        # Generate unique IDs and file names to avoid collisions.
        item_id = str(uuid.uuid4())
        filename = f"{item_id}.png"
        file_path = INVENTORY_IMAGES_DIR / filename
        # Persist the raw image bytes to disk.
        with file_path.open("wb") as fh:
            fh.write(image_bytes)

        # Build and append the inventory record.
        record = InventoryItem(
            id=item_id,
            name=name,
            status=ensure_valid_status(entry.get("status")),
            owner=entry.get("owner", ""),
            created_at=time.time(),
            image_path=f"/inventory/images/{filename}",
            notes=entry.get("notes", ""),
            score=None,
            label=None,
        )
        items.append(record)

    save_inventory(items)
    return items


# Classify all stored inventory items and persist results.
@app.post("/api/inventory/classify", response_model=list[InventoryItem])
async def classify_inventory() -> list[InventoryItem]:
    items = load_inventory()
    updated = []
    for item in items:
        try:
            updated_item = classify_inventory_item(item)
        except FileNotFoundError as exc:
            # If an image is missing, keep the item unchanged and continue.
            updated_item = item
            updated_item.notes = f"Missing image: {exc}"
        updated.append(updated_item)
    save_inventory(updated)
    return updated


@app.patch("/api/inventory/{item_id}", response_model=InventoryItem)
async def update_inventory_item(item_id: str, payload: InventoryUpdateRequest) -> InventoryItem:
    items = load_inventory()
    updated_item: InventoryItem | None = None
    next_items: list[InventoryItem] = []
    for item in items:
        if item.id == item_id:
            updated_item = apply_updates(item, payload)
            next_items.append(updated_item)
        else:
            next_items.append(item)

    if updated_item is None:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    save_inventory(next_items)
    return updated_item


@app.post("/api/inventory/batch-update", response_model=list[InventoryItem])
async def batch_update_inventory(payload: InventoryBatchUpdateRequest) -> list[InventoryItem]:
    targets = set(payload.item_ids)
    if not targets:
        raise HTTPException(status_code=400, detail="item_ids cannot be empty")

    items = load_inventory()
    touched = False
    next_items: list[InventoryItem] = []
    for item in items:
        if item.id in targets:
            touched = True
            next_items.append(apply_updates(item, payload))
        else:
            next_items.append(item)

    if not touched:
        raise HTTPException(status_code=404, detail="No matching items found")

    save_inventory(next_items)
    return next_items


@app.post("/api/inventory/ai-insights")
async def ai_insights(payload: InventoryAIInsightsRequest) -> dict:
    targets = set(payload.item_ids)
    items = load_inventory()
    lookup = {item.id: item for item in items}
    insights = []
    missing: list[str] = []
    for item_id in targets:
        item = lookup.get(item_id)
        if item is None:
            missing.append(item_id)
            continue
        insights.append(build_ai_insight(item))

    return {"insights": insights, "missing": missing}


# Serve inventory images statically from the inventory directory.
app.mount("/inventory/images", StaticFiles(directory=INVENTORY_IMAGES_DIR), name="inventory-images")

# Define a simple health endpoint that can be used by load balancers or monitors.
@app.get("/api/health")
async def health() -> dict:
    # Return a small JSON payload indicating the service is alive.
    return {"status": "ok"}

# Mount the static frontend after API routes so /api/* stays handled by FastAPI, not static files.
if STATIC_DIR.exists():
    # Mount the directory at the root path; html=True enables index.html fallback for client-side routing.
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

# Provide an optional entry point for running the app directly via `python main.py` in development.
if __name__ == "__main__":
    # Import uvicorn here to avoid adding it to runtime dependencies if not needed.
    import uvicorn
    # Start the ASGI server listening on all interfaces at port 8000 for convenience.
    uvicorn.run(app, host="0.0.0.0", port=8000)
