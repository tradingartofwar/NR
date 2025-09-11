const fs = require("fs");
const path = require("path");

const STATE_DIR = path.join(__dirname, "..", "state");
if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });

const F = (name) => path.join(STATE_DIR, name);

const files = {
  nodes: F("state.nodes.json"),
  sugg: F("state.suggestions.json"),
  cons: F("state.consents.json"),
  tokens: F("state.review_tokens.json"),
  notes: F("state.notifications.json"),
  feedback: F("state.feedback.json"),
};

for (const f of Object.values(files)) if (!fs.existsSync(f)) fs.writeFileSync(f, "[]", "utf8");

const read = (f, fallback = "[]") =>
  JSON.parse(fs.existsSync(f) ? fs.readFileSync(f, "utf8") : fallback);

const write = (f, data) => fs.writeFileSync(f, JSON.stringify(data, null, 2), "utf8");

module.exports = { files, read, write, STATE_DIR };
