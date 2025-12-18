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

// Define a simple mock inventory page that supports batch upload and viewing.
const InventoryPage = () => {
  // Store selected files for batch upload.
  const [files, setFiles] = useState([]);
  // Keep the server-side inventory list.
  const [items, setItems] = useState([]);
  // Loading state for uploads and fetches.
  const [loading, setLoading] = useState(false);
  // Error messaging.
  const [error, setError] = useState("");
  // Track the currently selected item for the popup.
  const [activeItem, setActiveItem] = useState(null);
  // Track classification in progress.
  const [classifying, setClassifying] = useState(false);

  // Load inventory from the backend when the page mounts.
  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/inventory");
        if (!res.ok) throw new Error("Failed to load inventory");
        const data = await res.json();
        setItems(data);
      } catch (err) {
        setError(err.message || "Failed to load inventory");
      }
    };
    load();
  }, []);

  // Handle file input changes for batch upload.
  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    setFiles(selected);
  };

  // Convert files to base64 payloads and send to backend.
  const handleUpload = async () => {
    if (!files.length) {
      setError("Please select one or more images to upload.");
      return;
    }
    setError("");
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
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  // Trigger classification for all stored items.
  const handleClassify = async () => {
    setError("");
    setClassifying(true);
    try {
      const res = await fetch("/api/inventory/classify", { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.detail || "Classification failed");
      }
      const data = await res.json();
      setItems(data);
    } catch (err) {
      setError(err.message || "Classification failed");
    } finally {
      setClassifying(false);
    }
  };

  return (
    <main>
      <section>
        <h1>Inventory</h1>
        <p>Batch upload images and manage stored items. Items persist across restarts.</p>
      </section>

      <section>
        <label htmlFor="inventory-files">Select images (multiple allowed)</label>
        <input
          id="inventory-files"
          type="file"
          accept="image/png, image/jpeg"
          multiple
          onChange={handleFileChange}
        />
        <button type="button" onClick={handleUpload} aria-busy={loading} disabled={loading}>
          {loading ? "Uploading..." : "Upload to Inventory"}
        </button>
        <button type="button" onClick={handleClassify} aria-busy={classifying} disabled={classifying}>
          {classifying ? "Classifying..." : "Classify All"}
        </button>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </section>

      <section>
        <h2>Items</h2>
        {items.length === 0 && <p>No items yet. Upload to populate inventory.</p>}
        {items.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Preview</th>
                <th>Name</th>
                <th>Status</th>
                <th>Prob (defect)</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <img
                      src={item.image_path}
                      alt={item.name}
                      style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "6px" }}
                    />
                  </td>
                  <td>{item.name}</td>
                  <td>{item.status}</td>
                  <td>{typeof item.score === "number" ? item.score.toFixed(3) : "--"}</td>
                  <td>{new Date(item.created_at * 1000).toLocaleString()}</td>
                  <td>
                    <button type="button" onClick={() => setActiveItem(item)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {activeItem && (
        <dialog open>
          <article>
            <header>
              <h3>{activeItem.name}</h3>
              <button
                aria-label="Close"
                onClick={() => setActiveItem(null)}
                style={{ float: "right" }}
              >
                ✕
              </button>
            </header>
            <p>Status: {activeItem.status}</p>
            {typeof activeItem.score === "number" && (
              <p>Probability (has defect): {activeItem.score.toFixed(4)}</p>
            )}
            {typeof activeItem.label === "number" && (
              <p>Label: {activeItem.label === 1 ? "Has defect" : "No defect"}</p>
            )}
            <p>Created: {new Date(activeItem.created_at * 1000).toLocaleString()}</p>
            {activeItem.notes && <p>Notes: {activeItem.notes}</p>}
            <img
              src={activeItem.image_path}
              alt={activeItem.name}
              style={{ maxWidth: "100%" }}
            />
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
