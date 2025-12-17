/**
 * Entry point for the React application with per-line comments for learning.
 */

// Import React to enable JSX and component creation.
import React from "react";

// Import createRoot to mount the React component tree onto the DOM.
import { createRoot } from "react-dom/client";

// Import BrowserRouter to enable client-side routing using the History API.
import { BrowserRouter } from "react-router-dom";

// Import the global Pico.css stylesheet for minimalist styling.
import "@picocss/pico";

// Import the top-level App component that defines the UI structure and routes.
import App from "./App.jsx";

// Locate the root DOM node defined in index.html where React will attach.
const rootElement = document.getElementById("root");

// Create a React root using the located DOM node to control rendering.
const root = createRoot(rootElement);

// Render the application wrapped in BrowserRouter to enable routing context.
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
