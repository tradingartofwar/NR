const { v4: uuid } = require("uuid");
const { files, read, write } = require("../lib/store.cjs");
const { logEvent } = require("../lib/events.cjs");

module.exports = (app) => {
  app.post("/feedback", (req, res) => {
    const { suggestionId, nodeId, rating = 0, comment = "" } = req.body || {};
    const rows = read(files.feedback);
    const row = {
      id: uuid(),
      suggestionId,
      nodeId,
      rating: Math.max(1, Math.min(5, Number(rating) || 0)),
      comment: String(comment).slice(0, 400),
      created_at: new Date().toISOString(),
    };
    rows.push(row);
    write(files.feedback, rows);
    logEvent("FEEDBACK", row);
    res.json({ ok: true });
  });
};
