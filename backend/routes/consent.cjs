const { files, read, write } = require("../lib/store.cjs");
const { logEvent } = require("../lib/events.cjs");

module.exports = (app) => {
  app.post("/consent", (req, res) => {
    const { suggestionId, actorNodeId, action } = req.body || {};
    const sugg = read(files.sugg);
    const s = sugg.find((x) => x.id === suggestionId);
    if (!s) return res.status(404).json({ error: "not found" });

    let cons = read(files.cons);
    let c = cons.find((x) => x.suggestionId === suggestionId);
    if (!c) { c = { suggestionId, a: "none", b: "none", state: s.state }; cons.push(c); }

    const who = actorNodeId === s.nodeId ? "a" : "b";
    c[who] = action === "accept" ? "accept" : action === "snooze" ? "snooze" : "dismiss";

    if (c.a === "accept" && c.b === "accept") { s.state = "solid"; c.state = "solid"; }
    else if (c.a === "dismiss" || c.b === "dismiss") { s.state = "dismissed"; c.state = "dismissed"; }
    else if (c.a === "snooze" || c.b === "snooze") { s.state = "snoozed"; c.state = "snoozed"; }

    write(files.sugg, sugg);
    write(files.cons, cons);
    logEvent("CONSENT", { suggestionId, actorNodeId, action, newState: s.state });
    res.json({ state: s.state });
  });
};
