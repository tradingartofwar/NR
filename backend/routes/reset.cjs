const { files, write } = require("../lib/store.cjs");
const { logEvent } = require("../lib/events.cjs");

module.exports = (app) => {
  app.post("/reset", (req, res) => {
    write(files.sugg, []);
    write(files.cons, []);
    write(files.tokens, []);
    write(files.notes, []);
    write(files.feedback, []);
    // To also clear nodes, uncomment:
    // write(files.nodes, []);
    logEvent("RESET", {});
    res.json({ ok: true });
  });
};
