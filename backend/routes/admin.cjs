const { files, read, write } = require("../lib/store.cjs");
const { logEvent } = require("../lib/events.cjs");
const { sendReviewEmail } = require("../lib/email.cjs");

// Helper: minimal name lookup
function nameOf(nodes, id) {
  return (nodes || []).find((n) => n.id === id)?.displayName || id || "—";
}

module.exports = (app, APP_ORIGIN) => {
  // ---------------- GET /admin/queue ----------------
  // /admin/queue?cohortId=alpha&state=ghost|admin_approved|snoozed|solid|all
  app.get("/admin/queue", (req, res) => {
    const cohortId = String(req.query.cohortId || "");
    const state = String(req.query.state || "ghost");

    let sugg = read(files.sugg) || [];
    if (cohortId) sugg = sugg.filter((s) => s.cohortId === cohortId);
    if (state !== "all") sugg = sugg.filter((s) => s.state === state);

    const nodes = read(files.nodes) || [];
    const rows = sugg.map((s) => ({
      id: s.id,
      nodeId: s.nodeId,
      otherId: s.otherId,
      nodeName: nameOf(nodes, s.nodeId),
      otherName: nameOf(nodes, s.otherId),
      cohortId: s.cohortId || "",
      state: s.state || "ghost",
    }));

    res.json({ items: rows });
  });

  // ---------------- GET /admin/summary ----------------
  // Small helper for a header summary (optional for UI)
  app.get("/admin/summary", (req, res) => {
    const cohortId = String(req.query.cohortId || "");
    const nodes = read(files.nodes) || [];
    let sugg = read(files.sugg) || [];
    if (cohortId) sugg = sugg.filter((s) => s.cohortId === cohortId);

    const countBy = (st) => sugg.filter((s) => s.state === st).length;
    res.json({
      nodes: nodes.length,
      pending: countBy("ghost"),
      approved: countBy("admin_approved"),
      solid: countBy("solid"),
      total: sugg.length,
    });
  });

  // ---------------- POST /admin/approve ----------------
  app.post("/admin/approve", async (req, res) => {
    const { suggestionId } = req.body || {};
    const sugg = read(files.sugg) || [];
    const s = sugg.find((x) => x.id === suggestionId);
    if (!s) return res.status(404).json({ error: "not found" });

    // demo rationale (safe default)
    s.rationale_public = s.rationale_public || {
      values: ["stewardship"],
      interests: ["cycling"],
      complementary: [],
    };
    s.state = "admin_approved";
    s.approved_at = Date.now();

    write(files.sugg, sugg);
    logEvent("ADMIN_APPROVE", { suggestionId });

    // notify node (dev mode logs a [DEV EMAIL] URL)
    const nodes = read(files.nodes) || [];
    const me = nodes.find((n) => n.id === s.nodeId);
    if (me?.email) {
      try {
        await sendReviewEmail({
          to: me.email,
          appOrigin: APP_ORIGIN,
          suggestionId,
          cohortId: s.cohortId,
          nodeId: me.id,
        });
      } catch (e) {
        console.error("Email error:", e.message);
      }
    }
    res.json({ ok: true });
  });

  // ---------------- POST /admin/reject ----------------
  app.post("/admin/reject", (req, res) => {
    const { suggestionId, reason } = req.body || {};
    const sugg = read(files.sugg) || [];
    const s = sugg.find((x) => x.id === suggestionId);
    if (!s) return res.status(404).json({ error: "not found" });

    s.state = "rejected";
    s.rejected_at = Date.now();
    s.rejected_reason = reason || null;

    write(files.sugg, sugg);
    logEvent("ADMIN_REJECT", { suggestionId, reason: reason || null });
    res.json({ ok: true });
  });
};
