import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 10000;
const DIST_DIR = path.join(__dirname, "dist");

// Serve Vite's static files
app.use(express.static(DIST_DIR));

// React SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Chowza server running on port ${PORT}`);
});