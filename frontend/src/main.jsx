/**
 * Entry point for the React application with dark mode support.
 */

import React, { createContext, useState, useMemo, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import App from "./App.jsx";

// Create a context for theme mode toggling
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: "light",
});

// Define light and dark palettes
const lightPalette = {
  mode: "light",
  primary: { main: "#1f4f8a" },
  secondary: { main: "#ffb020" },
  background: { default: "#f4f6fb", paper: "#ffffff" },
};

const darkPalette = {
  mode: "dark",
  primary: { main: "#5c9ce6" },
  secondary: { main: "#ffb020" },
  background: { default: "#0d1117", paper: "#161b22" },
};

// Get stored theme preference or system preference
const getInitialMode = () => {
  const stored = localStorage.getItem("themeMode");
  if (stored === "light" || stored === "dark") return stored;
  // Check system preference
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};

const AppWrapper = () => {
  const [mode, setMode] = useState(getInitialMode);

  // Persist mode changes to localStorage
  useEffect(() => {
    localStorage.setItem("themeMode", mode);
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prev) => (prev === "light" ? "dark" : "light"));
      },
      mode,
    }),
    [mode]
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: mode === "light" ? lightPalette : darkPalette,
        shape: { borderRadius: 12 },
        typography: {
          fontFamily: "'DM Sans', 'Inter', 'Roboto', sans-serif",
          h1: { fontWeight: 600 },
          h2: { fontWeight: 600 },
          button: { textTransform: "none", fontWeight: 600 },
        },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  </React.StrictMode>
);
