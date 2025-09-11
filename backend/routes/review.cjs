const { files, read, write } = require("../lib/store.cjs");
const { safeRationale } = require("../lib/util.cjs");

module.exports = (app) => {
  app.get("/review", (req, res) => {
    const token = String(req.query.token || "");
    const tokens = read(files.tokens);
    const t = tokens.find((x) => x.token === token);
    if (!t || t.used || Date.now() > t.exp) return res.status(410).json({ error: "expired" });
    t.used = true;
    write(files.tokens, tokens);
    const s = read(files.sugg).find((x) => x.id === t.suggestionId);
    if (!s) return res.status(404).json({ error: "not found" });
    res.json({
      suggestionId: s.id,
      nodeId: t.nodeId,
      cohortId: t.cohortId,
      rationale_public: safeRationale(s.rationale_public),
      state: s.state,
    });
  });
};
