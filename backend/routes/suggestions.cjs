const { files, read } = require("../lib/store.cjs");
const { safeRationale } = require("../lib/util.cjs");

module.exports = (app) => {
  app.get("/suggestions", (req, res) => {
    const nodeId = String(req.query.nodeId || "");
    const cohortId = String(req.query.cohortId || "");
    const list = read(files.sugg).filter(
      (s) =>
        s.nodeId === nodeId &&
        (!cohortId || s.cohortId === cohortId) &&
        ["admin_approved", "snoozed", "solid"].includes(s.state)
    );
    res.json(list.map((s) => ({ id: s.id, state: s.state, rationale_public: safeRationale(s.rationale_public) })));
  });
};
