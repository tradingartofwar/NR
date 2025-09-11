const { v4: uuid } = require("uuid");
const { files, read, write } = require("../lib/store.cjs");
const { logEvent } = require("../lib/events.cjs");

module.exports = (app) => {
  app.post("/node", (req, res) => {
    const nodes = read(files.nodes);
    const id = uuid();
    const {
      displayName = "Anonymous",
      email = "",
      cohortId = "demo",
      strengths = [],
      challenges = [],
      projects = [],
      interests = [],
      values = [],
      fears = [],
      pride = [],
    } = req.body || {};

    const node = { id, displayName, email, cohortId, strengths, challenges, projects, interests, values, fears, pride };
    nodes.push(node);
    write(files.nodes, nodes);
    logEvent("NODE_CREATE", { id, displayName, cohortId });

    // seed ghost suggestions within cohort
    const sugg = read(files.sugg);
    for (const other of nodes) {
      if (other.id === id || other.cohortId !== cohortId) continue;
      sugg.push(
        { id: uuid(), nodeId: id,    otherId: other.id, cohortId, state: "ghost", rationale_public: {}, rationale_private: {} },
        { id: uuid(), nodeId: other.id, otherId: id,    cohortId, state: "ghost", rationale_public: {}, rationale_private: {} },
      );
    }
    write(files.sugg, sugg);

    res.json({ id, node });
  });
};
