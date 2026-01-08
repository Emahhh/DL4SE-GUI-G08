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

// Define light and dark palettes with refined colors
const lightPalette = {
  mode: "light",
  primary: { main: "#1f4f8a", light: "#4a7bb8", dark: "#163a66" },
  secondary: { main: "#ffb020", light: "#ffc554", dark: "#e69a00" },
  background: { default: "#f5f7fa", paper: "#ffffff" },
  text: { primary: "#1a202c", secondary: "#64748b" },
};

const darkPalette = {
  mode: "dark",
  primary: { main: "#5c9ce6", light: "#8bb8f0", dark: "#3d7bc4" },
  secondary: { main: "#ffb020", light: "#ffc554", dark: "#e69a00" },
  background: { default: "#0a0e13", paper: "#161b22" },
  text: { primary: "#e2e8f0", secondary: "#94a3b8" },
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
          h1: { fontWeight: 700, letterSpacing: -0.5 },
          h2: { fontWeight: 700, letterSpacing: -0.3 },
          h3: { fontWeight: 700, letterSpacing: -0.3 },
          h4: { fontWeight: 600 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
          button: { textTransform: "none", fontWeight: 600 },
        },
        shadows: [
          "none",
          mode === "light" 
            ? "0px 1px 3px rgba(0, 0, 0, 0.05), 0px 1px 2px rgba(0, 0, 0, 0.06)"
            : "0px 1px 3px rgba(0, 0, 0, 0.3), 0px 1px 2px rgba(0, 0, 0, 0.4)",
          mode === "light"
            ? "0px 3px 6px rgba(0, 0, 0, 0.07), 0px 2px 4px rgba(0, 0, 0, 0.05)"
            : "0px 3px 6px rgba(0, 0, 0, 0.35), 0px 2px 4px rgba(0, 0, 0, 0.3)",
          mode === "light"
            ? "0px 6px 12px rgba(0, 0, 0, 0.08), 0px 4px 8px rgba(0, 0, 0, 0.05)"
            : "0px 6px 12px rgba(0, 0, 0, 0.4), 0px 4px 8px rgba(0, 0, 0, 0.35)",
          mode === "light"
            ? "0px 10px 20px rgba(0, 0, 0, 0.1), 0px 6px 12px rgba(0, 0, 0, 0.06)"
            : "0px 10px 20px rgba(0, 0, 0, 0.45), 0px 6px 12px rgba(0, 0, 0, 0.4)",
          ...Array(20).fill(mode === "light" 
            ? "0px 10px 20px rgba(0, 0, 0, 0.1), 0px 6px 12px rgba(0, 0, 0, 0.06)"
            : "0px 10px 20px rgba(0, 0, 0, 0.45), 0px 6px 12px rgba(0, 0, 0, 0.4)"),
        ],
        transitions: {
          duration: {
            shortest: 150,
            shorter: 200,
            short: 250,
            standard: 300,
            complex: 375,
            enteringScreen: 225,
            leavingScreen: 195,
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                padding: "10px 24px",
                boxShadow: "none",
                transition: "all 0.25s ease",
                '&:hover': {
                  boxShadow: mode === "light" 
                    ? "0px 4px 12px rgba(0, 0, 0, 0.08)"
                    : "0px 4px 12px rgba(0, 0, 0, 0.4)",
                  transform: "translateY(-1px)",
                },
              },
              sizeLarge: {
                padding: "12px 28px",
                fontSize: "1rem",
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: mode === "light"
                  ? "0px 2px 8px rgba(0, 0, 0, 0.04), 0px 1px 3px rgba(0, 0, 0, 0.06)"
                  : "0px 2px 8px rgba(0, 0, 0, 0.3), 0px 1px 3px rgba(0, 0, 0, 0.4)",
                transition: "all 0.3s ease",
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              elevation1: {
                boxShadow: mode === "light"
                  ? "0px 2px 8px rgba(0, 0, 0, 0.04), 0px 1px 3px rgba(0, 0, 0, 0.06)"
                  : "0px 2px 8px rgba(0, 0, 0, 0.3), 0px 1px 3px rgba(0, 0, 0, 0.4)",
              },
            },
          },
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
