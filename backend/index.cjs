// backend/index.cjs
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { STATE_DIR } = require("./lib/store.cjs");

dotenv.config();

const PORT = process.env.PORT || 5000;
const APP_ORIGIN = process.env.APP_ORIGIN || `http://localhost:${PORT}`;
const app = express();

// ---------- core middleware ----------
app.use(cors());
app.use(express.json());

// ---------- health ----------
app.get("/status", (_req, res) =>
  res.json({ ok: true, port: PORT, stateDir: STATE_DIR })
);

// ---------- static (serve frontend both at / and /frontend) ----------
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

// Root static: /admin.html, /index.html, /app.js, etc.
app.use(express.static(FRONTEND_DIR, {
  fallthrough: true, // let API routes handle their paths
  extensions: ["html"],
  setHeaders: (res, filePath) => {
    // basic cache policy for static assets
    if (/\.(js|css|png|jpg|svg|ico)$/.test(filePath)) {
      res.setHeader("Cache-Control", "public, max-age=3600");
    } else {
      res.setHeader("Cache-Control", "no-cache");
    }
  },
}));

// Optional mirror path: /frontend/*
app.use("/frontend", express.static(FRONTEND_DIR, { fallthrough: true }));

// Convenience shortcut: /admin -> admin.html
app.get("/admin", (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "admin.html"));
});

// ---------- API routes ----------
require("./routes/nodes.cjs")(app);
require("./routes/suggestions.cjs")(app);
require("./routes/admin.cjs")(app, APP_ORIGIN);
require("./routes/consent.cjs")(app);
require("./routes/review.cjs")(app);
require("./routes/feedback.cjs")(app);
require("./routes/reset.cjs")(app);

// ---------- 404 for API (keep after routes & static) ----------
app.use((req, res, next) => {
  // If it's a file that wasn't found, let it 404 plainly
  if (req.path.includes(".") || req.path.startsWith("/frontend/")) {
    return res.status(404).json({ message: `Not found: ${req.path}` });
  }
  // Otherwise, generic 404 for unknown API paths
  return res.status(404).json({
    message: `Route ${req.method}:${req.path} not found`,
    error: "Not Found",
    statusCode: 404,
  });
});

// ---------- start ----------
app.listen(PORT, () => {
  console.log(`API + static on :${PORT}`);
  console.log(`Admin UI: ${APP_ORIGIN}/admin  (or ${APP_ORIGIN}/admin.html)`);
});
