/**
 * Entry point for the React application with per-line comments for learning.
 */

// Import React to enable JSX and component creation.
import React from "react";

// Import createRoot to mount the React component tree onto the DOM.
import { createRoot } from "react-dom/client";

// Import BrowserRouter to enable client-side routing using the History API.
import { BrowserRouter } from "react-router-dom";

// Import Material UI providers for consistent theming.
import { ThemeProvider, CssBaseline } from "@mui/material";
import { createTheme } from "@mui/material/styles";

// Import the top-level App component that defines the UI structure and routes.
import App from "./App.jsx";

// Define a custom Material UI theme to give the app a distinct industrial identity.
const theme = createTheme({
  palette: {
    primary: { main: "#1f4f8a" },
    secondary: { main: "#ffb020" },
    background: { default: "#f4f6fb", paper: "#ffffff" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'DM Sans', 'Inter', 'Roboto', sans-serif",
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
});

// Locate the root DOM node defined in index.html where React will attach.
const rootElement = document.getElementById("root");

// Create a React root using the located DOM node to control rendering.
const root = createRoot(rootElement);

// Render the application wrapped in BrowserRouter to enable routing context.
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
