/**
 * Main React application file with exhaustive comments for learning.
 */

// Import React and useState to build components and manage state.
import React, { useState } from "react";

// Import routing primitives to define SPA navigation without full page reloads.
import { Link, Routes, Route } from "react-router-dom";

// Define a small helper component to render the navigation bar.
const NavBar = () => {
  // Return semantic navigation markup styled by Pico.css defaults.
  return (
    <nav>
      {/* Wrap navigation items in a container for layout. */}
      <ul>
        {/* Brand or title link that routes to the landing page. */}
        <li>
          <strong>DL4SE Ball Screw Drive Classifier</strong>
        </li>
      </ul>
      {/* Secondary list holds the route links. */}
      <ul>
        {/* Link to the landing page explaining the model. */}
        <li>
          <Link to="/">Home</Link>
        </li>
        {/* Link to the prediction form page. */}
        <li>
          <Link to="/predict">Predict</Link>
        </li>
        {/* Link to the inventory page. */}
        <li>
          <Link to="/inventory">Inventory</Link>
        </li>
      </ul>
    </nav>
  );
};

// Define the landing page content that explains the application purpose.
const LandingPage = () => {
  // Return descriptive copy inside a responsive container.
  return (
    <main>
      {/* Section introduces the model and stack. */}
      <section>
        <h1>Image Defect Classifier</h1>
        <p>
          This demo serves a ConvNeXt-Tiny PyTorch image classifier through a FastAPI
          backend and a React frontend. The model loads with
          map_location=torch.device('cpu') so it runs on Intel or Apple Silicon
          without GPU drivers.
        </p>
        <p>
          Use the Predict page to upload an image and receive a probability for
          whether it contains a defect. Or use the Inventory page to batch upload
          multiple images and classify them all at once.
        </p>
      </section>
      {/* Call-to-action button that links to the prediction form. */}
      <section>
        <Link role="button" to="/predict">
          Try a prediction
        </Link>
      </section>
    </main>
  );
};

// Define the prediction page that gathers an image and calls the API.
const PredictPage = () => {
  // Store the selected file object so we can preview it and upload it.
  const [file, setFile] = useState(null);
  // Hold a data URL preview string for user feedback.
  const [preview, setPreview] = useState("");
  // Hold the parsed prediction response once available.
  const [result, setResult] = useState(null);
  // Track whether the form submission is in progress to disable UI appropriately.
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Capture any error messages to display them to the user.
  const [error, setError] = useState("");

  // Convert the selected file into a base64 string and store preview.
  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) {
      setFile(null);
      setPreview("");
      return;
    }
    setFile(nextFile);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result.toString());
    reader.readAsDataURL(nextFile);
  };

  // Handle form submission by packaging the image and calling the backend API.
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!file) {
      setError("Please select an image before predicting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsDataURL(file);
      });

      const [, payload] = base64.toString().split(",");

      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: payload }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.detail || "Request failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Unexpected error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      <section>
        <h1>Send an Image</h1>
        <p>Upload an image to classify whether it has a defect.</p>
      </section>

      <form onSubmit={handleSubmit}>
        <label htmlFor="image">Select an image (PNG/JPEG)</label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/png, image/jpeg"
          onChange={handleFileChange}
          required
        />

        {preview && (
          <figure>
            <img src={preview} alt="Selected for prediction" style={{ maxWidth: "320px" }} />
            <figcaption>Preview of the uploaded image.</figcaption>
          </figure>
        )}

        <button type="submit" aria-busy={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? "Classifying..." : "Predict"}
        </button>
      </form>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {result && (
        <article>
          <h2>Prediction</h2>
          <p>Probability (has defect): {result.score.toFixed(4)}</p>
          <p>Label: {result.label === 1 ? "Has defect" : "No defect"}</p>
        </article>
      )}
    </main>
  );
};

const STATUS_OPTIONS = [
  { value: "unclassified", label: "Awaiting Intake" },
  { value: "awaiting_classification", label: "Awaiting Classification" },
  { value: "needs_review", label: "Needs Review" },
  { value: "needs_rework", label: "Needs Rework" },
  { value: "monitor", label: "Monitoring" },
  { value: "defect", label: "Confirmed Defect" },
  { value: "quarantine", label: "Quarantined" },
  { value: "cleared", label: "Cleared" },
  { value: "no_defect", label: "No Defect" },
  { value: "resolved", label: "Resolved" },
];

const SORT_OPTIONS = [
  { value: "created_desc", label: "Newest first" },
  { value: "created_asc", label: "Oldest first" },
  { value: "status", label: "Status" },
  { value: "score_desc", label: "Probability high-low" },
];

const OWNER_PRESETS = ["", "Quality", "Maintenance", "Reliability", "Production", "Supplier Quality"];

const STATUS_TOKENS = {
  unclassified: { bg: "#f4f4f5", fg: "#1f2937" },
  awaiting_classification: { bg: "#fef9c3", fg: "#854d0e" },
  needs_review: { bg: "#dbeafe", fg: "#1d4ed8" },
  needs_rework: { bg: "#fee2e2", fg: "#991b1b" },
  monitor: { bg: "#e0f2fe", fg: "#075985" },
  defect: { bg: "#fde68a", fg: "#92400e" },
  quarantine: { bg: "#fecaca", fg: "#7f1d1d" },
  cleared: { bg: "#dcfce7", fg: "#166534" },
  no_defect: { bg: "#d1fae5", fg: "#065f46" },
  resolved: { bg: "#e5e7eb", fg: "#111827" },
};

const getStatusLabel = (value) => STATUS_OPTIONS.find((option) => option.value === value)?.label || value;

const statusBadgeStyle = (status) => {
  const palette = STATUS_TOKENS[status] || { bg: "#e5e7eb", fg: "#111" };
  return {
    backgroundColor: palette.bg,
    color: palette.fg,
    padding: "0.15rem 0.6rem",
    borderRadius: "999px",
    fontSize: "0.85rem",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
};

const formatTimestamp = (seconds) => new Date(seconds * 1000).toLocaleString();

const InventoryPage = () => {
  const [files, setFiles] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [activeItemId, setActiveItemId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [filters, setFilters] = useState({ status: "all", search: "", sort: "created_desc" });
  const [batchForm, setBatchForm] = useState({ status: "", owner: "", notes: "", appendNotes: true });
  const [aiInsights, setAiInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [editDraft, setEditDraft] = useState(null);

  const fetchInventory = React.useCallback(async () => {
    try {
      const res = await fetch("/api/inventory");
      if (!res.ok) throw new Error("Failed to load inventory");
      const data = await res.json();
      setItems(data);
    } catch (err) {
      setError(err.message || "Failed to load inventory");
    }
  }, []);

  React.useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  React.useEffect(() => {
    setSelectedIds((prev) => {
      if (!prev.size) {
        return prev;
      }
      const next = new Set();
      items.forEach((item) => {
        if (prev.has(item.id)) {
          next.add(item.id);
        }
      });
      return next.size === prev.size ? prev : next;
    });
  }, [items]);

  React.useEffect(() => {
    if (selectedIds.size === 0 && aiInsights.length) {
      setAiInsights([]);
    }
  }, [selectedIds, aiInsights.length]);

  const activeItem = React.useMemo(
    () => items.find((item) => item.id === activeItemId) || null,
    [items, activeItemId]
  );

  React.useEffect(() => {
    if (activeItem) {
      setEditDraft({
        name: activeItem.name,
        status: activeItem.status,
        owner: activeItem.owner || "",
        notes: activeItem.notes || "",
      });
    } else {
      setEditDraft(null);
    }
  }, [activeItem]);

  const processedItems = React.useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const matchesStatus = filters.status === "all" || item.status === filters.status;
      const haystack = `${item.name} ${item.owner || ""} ${item.notes || ""}`.toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      return matchesStatus && matchesSearch;
    });
    const sorted = [...filtered];
    switch (filters.sort) {
      case "created_asc":
        sorted.sort((a, b) => a.created_at - b.created_at);
        break;
      case "status":
        sorted.sort((a, b) => (a.status || "").localeCompare(b.status || ""));
        break;
      case "score_desc":
        sorted.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
        break;
      default:
        sorted.sort((a, b) => b.created_at - a.created_at);
    }
    return sorted;
  }, [items, filters]);

  const summary = React.useMemo(() => {
    if (!items.length) {
      return { total: 0, flagged: 0, unclassified: 0, avgScore: 0 };
    }
    const flaggedStatuses = new Set(["defect", "needs_rework", "quarantine"]);
    const stats = items.reduce(
      (acc, item) => {
        if (flaggedStatuses.has(item.status)) {
          acc.flagged += 1;
        }
        if (item.status === "unclassified" || item.status === "awaiting_classification") {
          acc.unclassified += 1;
        }
        if (typeof item.score === "number") {
          acc.scored += 1;
          acc.sumScore += item.score;
        }
        return acc;
      },
      { flagged: 0, unclassified: 0, sumScore: 0, scored: 0 }
    );
    return {
      total: items.length,
      flagged: stats.flagged,
      unclassified: stats.unclassified,
      avgScore: stats.scored ? stats.sumScore / stats.scored : 0,
    };
  }, [items]);

  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    setFiles(selected);
  };

  const handleUpload = async () => {
    if (!files.length) {
      setError("Please select one or more images to upload.");
      return;
    }
    setError("");
    setStatusMessage("");
    setLoading(true);
    try {
      const payloadItems = await Promise.all(
        files.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const [, base64] = reader.result.toString().split(",");
                resolve({ image_base64: base64, name: file.name });
              };
              reader.onerror = () => reject(new Error("Failed to read file."));
              reader.readAsDataURL(file);
            })
        )
      );

      const res = await fetch("/api/inventory/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payloadItems }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.detail || "Upload failed");
      }

      const data = await res.json();
      setItems(data);
      setFiles([]);
      setSelectedIds(new Set());
      setStatusMessage(`Uploaded ${payloadItems.length} item(s).`);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClassify = async () => {
    setError("");
    setStatusMessage("");
    setClassifying(true);
    try {
      const res = await fetch("/api/inventory/classify", { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.detail || "Classification failed");
      }
      const data = await res.json();
      setItems(data);
      setStatusMessage("Classification completed across the current inventory.");
    } catch (err) {
      setError(err.message || "Classification failed");
    } finally {
      setClassifying(false);
    }
  };

  const patchItem = React.useCallback(async (itemId, changes, options = {}) => {
    const payload = { ...changes };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });
    if (!Object.keys(payload).length) {
      return null;
    }
    const res = await fetch(`/api/inventory/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.detail || "Update failed");
    }
    const updated = await res.json();
    setItems((prev) => prev.map((item) => (item.id === itemId ? updated : item)));
    if (options.successMessage) {
      setStatusMessage(options.successMessage);
    }
    return updated;
  }, []);

  const handleQuickStatusChange = async (item, nextStatus) => {
    if (nextStatus === item.status) {
      return;
    }
    try {
      setError("");
      await patchItem(item.id, { status: nextStatus }, { successMessage: `Updated status for ${item.name}.` });
    } catch (err) {
      setStatusMessage("");
      setError(err.message || "Failed to update status");
    }
  };

  const selectionCount = selectedIds.size;
  const hasSelection = selectionCount > 0;
  const allVisibleSelected = processedItems.length > 0 && processedItems.every((item) => selectedIds.has(item.id));

  const handleBatchApply = async () => {
    if (!hasSelection) {
      setError("Select at least one item to run a batch update.");
      return;
    }
    if (!batchForm.status && !batchForm.owner && !batchForm.notes.trim()) {
      setError("Provide at least one field to update in the batch form.");
      return;
    }
    setError("");
    setStatusMessage("");
    try {
      const payload = { item_ids: Array.from(selectedIds) };
      if (batchForm.status) {
        payload.status = batchForm.status;
      }
      if (batchForm.owner) {
        payload.owner = batchForm.owner;
      }
      const trimmedNotes = batchForm.notes.trim();
      if (trimmedNotes) {
        payload.notes = trimmedNotes;
        payload.append_notes = batchForm.appendNotes;
      }
      const res = await fetch("/api/inventory/batch-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.detail || "Batch update failed");
      }
      const data = await res.json();
      setItems(data);
      setSelectedIds(new Set());
      setBatchForm({ status: "", owner: "", notes: "", appendNotes: true });
      setStatusMessage("Batch update applied successfully.");
    } catch (err) {
      setError(err.message || "Batch update failed");
    }
  };

  const handleAIInsights = async () => {
    if (!hasSelection) {
      setError("Select at least one item to request AI recommendations.");
      return;
    }
    setError("");
    setStatusMessage("");
    setInsightsLoading(true);
    try {
      const res = await fetch("/api/inventory/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_ids: Array.from(selectedIds) }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.detail || "AI insights request failed");
      }
      const data = await res.json();
      setAiInsights(data.insights || []);
      if (data.missing && data.missing.length) {
        setError(`Some items were not found: ${data.missing.join(", ")}`);
      } else {
        setError("");
      }
      setStatusMessage("AI recommendations prepared for the current selection.");
    } catch (err) {
      setAiInsights([]);
      setError(err.message || "Unable to retrieve AI insights");
    } finally {
      setInsightsLoading(false);
    }
  };

  const applyInsight = async (insight) => {
    try {
      setError("");
      await patchItem(
        insight.item_id,
        {
          status: insight.recommended_status,
          owner: insight.owner_hint,
          notes: insight.suggested_note,
          append_notes: true,
        },
        { successMessage: `Applied AI plan to ${insight.name}.` }
      );
    } catch (err) {
      setError(err.message || "Failed to apply AI recommendation");
    }
  };

  const toggleSelection = (itemId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const toggleSelectAll = (checked) => {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(processedItems.map((item) => item.id)));
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditDraftChange = (field, value) => {
    setEditDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleActiveItemSave = async () => {
    if (!activeItem || !editDraft) {
      return;
    }
    const payload = {};
    const trimmedName = editDraft.name.trim();
    if (trimmedName && trimmedName !== activeItem.name) {
      payload.name = trimmedName;
    }
    if (editDraft.status && editDraft.status !== activeItem.status) {
      payload.status = editDraft.status;
    }
    if (editDraft.owner !== (activeItem.owner || "")) {
      payload.owner = editDraft.owner;
    }
    if ((editDraft.notes || "") !== (activeItem.notes || "")) {
      payload.notes = editDraft.notes;
    }
    if (!Object.keys(payload).length) {
      setStatusMessage("No changes detected for this item.");
      return;
    }
    try {
      setError("");
      const updated = await patchItem(activeItem.id, payload, { successMessage: `Updated ${activeItem.name}.` });
      if (updated) {
        setEditDraft({
          name: updated.name,
          status: updated.status,
          owner: updated.owner || "",
          notes: updated.notes || "",
        });
      }
    } catch (err) {
      setError(err.message || "Failed to update the item");
    }
  };

  const closeDialog = () => {
    setActiveItemId(null);
    setEditDraft(null);
  };

  return (
    <main>
      <section>
        <h1>Inventory Operations Console</h1>
        <p>
          Manage production lots, capture analyst notes, and let the ConvNeXt model highlight the parts that
          need urgent attention.
        </p>
      </section>

      {(error || statusMessage) && (
        <section>
          {error && <p style={{ color: "crimson" }}>{error}</p>}
          {statusMessage && !error && <p style={{ color: "#166534" }}>{statusMessage}</p>}
        </section>
      )}

      <section>
        <div
          className="grid"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}
        >
          <article>
            <header>Total Lots</header>
            <strong style={{ fontSize: "1.8rem" }}>{summary.total}</strong>
          </article>
          <article>
            <header>Flagged</header>
            <strong style={{ fontSize: "1.8rem" }}>{summary.flagged}</strong>
          </article>
          <article>
            <header>Awaiting Intake</header>
            <strong style={{ fontSize: "1.8rem" }}>{summary.unclassified}</strong>
          </article>
          <article>
            <header>Avg. Defect Prob.</header>
            <strong style={{ fontSize: "1.8rem" }}>{summary.avgScore.toFixed(3)}</strong>
          </article>
        </div>
      </section>

      <section>
        <h2>Intake & Classification</h2>
        <div className="grid" style={{ gap: "1rem" }}>
          <label htmlFor="inventory-files">
            Select images (multiple allowed)
            <input
              id="inventory-files"
              type="file"
              accept="image/png, image/jpeg"
              multiple
              onChange={handleFileChange}
            />
          </label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            <button type="button" onClick={handleUpload} aria-busy={loading} disabled={loading}>
              {loading ? "Uploading..." : "Upload to Inventory"}
            </button>
            <button type="button" onClick={handleClassify} aria-busy={classifying} disabled={classifying}>
              {classifying ? "Classifying..." : "Classify All"}
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2>Command Center</h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <label>
            Search by name, owner, or notes
            <input
              type="search"
              value={filters.search}
              onChange={(event) => handleFilterChange("search", event.target.value)}
              placeholder="e.g. Lot 42"
            />
          </label>
          <label>
            Status filter
            <select value={filters.status} onChange={(event) => handleFilterChange("status", event.target.value)}>
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sort by
            <select value={filters.sort} onChange={(event) => handleFilterChange("sort", event.target.value)}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section>
        <header>
          <h2>Batch Operations</h2>
          <p>{hasSelection ? `${selectionCount} item(s) selected` : "Select rows to unlock batch commands."}</p>
        </header>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          <label>
            Set new status
            <select value={batchForm.status} onChange={(event) => setBatchForm((prev) => ({ ...prev, status: event.target.value }))}>
              <option value="">Keep as-is</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Assign owner
            <select value={batchForm.owner} onChange={(event) => setBatchForm((prev) => ({ ...prev, owner: event.target.value }))}>
              {OWNER_PRESETS.map((owner) => (
                <option key={owner || "unassigned"} value={owner}>
                  {owner || "Unassigned"}
                </option>
              ))}
            </select>
          </label>
          <label>
            Notes
            <textarea
              rows={2}
              value={batchForm.notes}
              onChange={(event) => setBatchForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Inspection notes, containment plan, etc."
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <input
              type="checkbox"
              checked={batchForm.appendNotes}
              onChange={(event) => setBatchForm((prev) => ({ ...prev, appendNotes: event.target.checked }))}
              disabled={!batchForm.notes.trim()}
            />
            Append notes instead of replacing
          </label>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
          <button type="button" onClick={handleBatchApply} disabled={!hasSelection}>
            Apply batch update
          </button>
          <button type="button" onClick={handleAIInsights} aria-busy={insightsLoading} disabled={!hasSelection || insightsLoading}>
            {insightsLoading ? "Analyzing with AI..." : "Get AI recommendations"}
          </button>
        </div>
      </section>

      {aiInsights.length > 0 && (
        <section>
          <h2>AI Recommendations</h2>
          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}
          >
            {aiInsights.map((insight) => (
              <article key={insight.item_id}>
                <header>
                  <strong>{insight.name}</strong>
                  <p style={{ margin: 0 }}>Confidence: {insight.confidence ?? "--"}</p>
                </header>
                <p style={{ ...statusBadgeStyle(insight.recommended_status), width: "fit-content", margin: "0.25rem 0" }}>
                  {getStatusLabel(insight.recommended_status)}
                </p>
                <p>{insight.summary}</p>
                <p style={{ fontSize: "0.9rem", color: "#475569" }}>Route to: {insight.owner_hint || "Unassigned"}</p>
                <button type="button" onClick={() => applyInsight(insight)}>
                  Apply recommendation
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2>Items</h2>
        {processedItems.length === 0 && <p>No items match the current filters.</p>}
        {processedItems.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Select all visible items"
                    checked={allVisibleSelected}
                    onChange={(event) => toggleSelectAll(event.target.checked)}
                  />
                </th>
                <th>Preview</th>
                <th>Details</th>
                <th>Status</th>
                <th>Prob (defect)</th>
                <th>Created</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${item.name}`}
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelection(item.id)}
                    />
                  </td>
                  <td>
                    <img
                      src={item.image_path}
                      alt={item.name}
                      style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "6px" }}
                    />
                  </td>
                  <td>
                    <strong>{item.name}</strong>
                    <p style={{ margin: "0.2rem 0", fontSize: "0.9rem" }}>Owner: {item.owner || "Unassigned"}</p>
                    <p style={{ margin: "0", fontSize: "0.8rem", color: "#475569" }}>ID: {item.id}</p>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      <span style={statusBadgeStyle(item.status)}>{getStatusLabel(item.status)}</span>
                      <select value={item.status} onChange={(event) => handleQuickStatusChange(item, event.target.value)}>
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td>{typeof item.score === "number" ? item.score.toFixed(3) : "--"}</td>
                  <td>{formatTimestamp(item.created_at)}</td>
                  <td style={{ maxWidth: "240px" }}>
                    {item.notes ? (item.notes.length > 90 ? `${item.notes.slice(0, 90)}...` : item.notes) : "--"}
                  </td>
                  <td>
                    <button type="button" onClick={() => setActiveItemId(item.id)}>
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {activeItem && editDraft && (
        <dialog open>
          <article>
            <header>
              <h3>{activeItem.name}</h3>
              <button aria-label="Close" onClick={closeDialog} style={{ float: "right" }}>
                ✕
              </button>
            </header>
            <p>Status: {getStatusLabel(activeItem.status)}</p>
            <p>Owner: {activeItem.owner || "Unassigned"}</p>
            {typeof activeItem.score === "number" && (
              <p>Probability (has defect): {activeItem.score.toFixed(4)}</p>
            )}
            {typeof activeItem.label === "number" && (
              <p>Label: {activeItem.label === 1 ? "Has defect" : "No defect"}</p>
            )}
            <p>Created: {formatTimestamp(activeItem.created_at)}</p>
            {activeItem.notes && <p>Notes: {activeItem.notes}</p>}
            <img src={activeItem.image_path} alt={activeItem.name} style={{ maxWidth: "100%" }} />
            <hr />
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleActiveItemSave();
              }}
            >
              <label>
                Name
                <input
                  type="text"
                  value={editDraft.name}
                  onChange={(event) => handleEditDraftChange("name", event.target.value)}
                />
              </label>
              <label>
                Status
                <select value={editDraft.status} onChange={(event) => handleEditDraftChange("status", event.target.value)}>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Owner
                <select value={editDraft.owner} onChange={(event) => handleEditDraftChange("owner", event.target.value)}>
                  {OWNER_PRESETS.map((owner) => (
                    <option key={owner || "unassigned"} value={owner}>
                      {owner || "Unassigned"}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Notes
                <textarea
                  rows={4}
                  value={editDraft.notes}
                  onChange={(event) => handleEditDraftChange("notes", event.target.value)}
                />
              </label>
              <button type="submit">Save changes</button>
            </form>
          </article>
        </dialog>
      )}
    </main>
  );
};

// Define the top-level App component that wires together the layout and routes.
const App = () => {
  // Render the shared layout, navigation, and route switcher.
  return (
    <div className="container">
      <NavBar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/predict" element={<PredictPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
      </Routes>
    </div>
  );
};

// Export the App component as the default export so main.jsx can import it easily.
export default App;
