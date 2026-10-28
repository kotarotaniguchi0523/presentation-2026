import { defineConfig } from "vite";

// There is no JSX configuration here. Vite reads jsxImportSource from tsconfig.json.
export default defineConfig({
  // The deck is served from a subdirectory on GitHub Pages (./deck/), so asset
  // paths have to be relative. dev still runs at "/".
  base: "./",
  server: { port: Number(process.env.PORT) || 5173 },
});
