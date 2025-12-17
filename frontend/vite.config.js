/**
 * Vite configuration file with per-line comments for clarity.
 */

// Import the defineConfig helper to get type hints and better DX.
import { defineConfig } from "vite";

// Import the React plugin so Vite can transform JSX and related syntax.
import react from "@vitejs/plugin-react";

// Export the configuration object using defineConfig for IntelliSense support.
export default defineConfig({
  // Register the React plugin to enable JSX/TSX compilation.
  plugins: [react()],
  // Set the base path to "/" to match deployment at the site root.
  base: "/",
});
