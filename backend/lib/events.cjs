const fs = require("fs");
const path = require("path");

const eventsPath = path.join(__dirname, "..", "events.log.jsonl");
const logEvent = (type, payload) => {
  const line = JSON.stringify({ ts: new Date().toISOString(), type, payload }) + "\n";
  fs.appendFileSync(eventsPath, line, "utf8");
};

module.exports = { logEvent, eventsPath };
