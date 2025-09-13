// Helpers
const $ = (q) => document.querySelector(q);
const jsonPre = (el, data) => el && (el.textContent = JSON.stringify(data, null, 2));

// Elements
const nodesView = $("#nodesView");
const heatmapView = $("#heatmapView");
const overlapsView = $("#overlapsView");
const jsonInput = $("#jsonInput");
const submitBtn = $("#submitBtn");
const resetBtn = $("#resetBtn");
const loadBtn = $("#loadBtn");

const canvas = $("#canvas");
const reviewModal = $("#reviewModal");
const reviewOpen = $("#reviewOpen");
const reviewTokenInput = $("#reviewTokenInput");
const reviewTokenSubmit = $("#reviewTokenSubmit");
const centerBtn = $("#centerBtn");

// Basic API wrappers
async function api(path, opts = {}) {
  const res = await fetch(path, opts);
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json().catch(() => ({}));
}

async function loadSuggestions() {
  try {
    const data = await api("/suggestions"); // expects { nodes:[], edges:[] } OR array
    const nodes = data.nodes || data.items || data || [];
    const edges = data.edges || [];

    jsonPre(nodesView, nodes);
    jsonPre(overlapsView, edges);

    drawMap(nodes, edges);
  } catch (e) {
    overlapsView.textContent = `Error loading suggestions: ${e.message}`;
  }
}

async function loadHeatmap() {
  try {
    const data = await api("/review"); // if your /review needs token, skip this; else add a dedicated /heatmap route later
    jsonPre(heatmapView, data);
  } catch {
    // optional: you may not have a heatmap route yet
    jsonPre(heatmapView, { info: "No heatmap endpoint wired yet." });
  }
}

// Submit a single node JSON from the textarea
submitBtn.onclick = async () => {
  let payload;
  try {
    payload = JSON.parse(jsonInput.value);
  } catch {
    alert("Invalid JSON. Paste one node object.");
    return;
  }
  try {
    await api("/node", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    jsonInput.value = "";
    await loadSuggestions();
  } catch (e) {
    alert("Submit failed: " + e.message);
  }
};

// Reset demo state
resetBtn.onclick = async () => {
  try {
    await api("/reset", { method: "POST" });
    jsonPre(nodesView, []);
    jsonPre(overlapsView, []);
    canvas.innerHTML = "";
  } catch (e) {
    alert("Reset failed: " + e.message);
  }
};

// Load suggestions explicitly
loadBtn && (loadBtn.onclick = loadSuggestions);

// Review token modal
reviewOpen && (reviewOpen.onclick = () => reviewModal.classList.add("open"));
reviewTokenSubmit && (reviewTokenSubmit.onclick = async () => {
  const token = (reviewTokenInput.value || "").trim();
  if (!token) return;
  reviewModal.classList.remove("open");
  try {
    const data = await api(`/review?token=${encodeURIComponent(token)}`);
    // Expecting your review.cjs to return a suggestion snapshot; adapt for nodes/edges if needed
    jsonPre(overlapsView, data);
  } catch (e) {
    overlapsView.textContent = `Review error: ${e.message}`;
  }
});

// Map rendering (flowers + edges)
function drawMap(nodes, edges) {
  canvas.innerHTML = "";
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  if (!nodes?.length) return;

  const cx = W / 2, cy = H / 2;
  const R = Math.min(W, H) / 2.6;

  // Place nodes around a circle
  nodes.forEach((n, i) => {
    const a = (i / nodes.length) * Math.PI * 2;
    const x = cx + R * Math.cos(a);
    const y = cy + R * Math.sin(a);
    placeNode(n, x, y);
  });

  // Draw edges
  edges.forEach((e) => drawEdge(e));
}

function placeNode(n, x, y) {
  const el = document.createElement("div");
  el.className = "node";
  el.style.left = x + "px";
  el.style.top = y + "px";
  el.dataset.id = n.id || n.nodeId || "";

  // Petals from subnodes (if present)
  const petals = (n.subnodes || n.petalDims || []).slice(0, 6);
  const radius = 14;
  petals.forEach((label, k) => {
    const ang = (k / petals.length) * Math.PI * 2;
    const p = document.createElement("div");
    p.className = "petal";
    p.title = label;
    p.style.left = (8 + Math.cos(ang) * radius) + "px";
    p.style.top  = (8 + Math.sin(ang) * radius) + "px";
    el.appendChild(p);
  });

  // Optional: click to send consent request to the top suggestion (if present)
  if (n.topSuggestion) {
    el.onclick = async () => {
      try {
        await api("/consent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            suggestionId: n.topSuggestion, // or adapt to your structure
            actorNodeId: n.id,
            action: "accept" // or "request" depending on your consent semantics
          }),
        });
        await loadSuggestions(); // refresh edges to reflect new state
      } catch (e) {
        console.warn("Consent request failed:", e.message);
      }
    };
  }

  canvas.appendChild(el);
}

function drawEdge(e) {
  // Normalize ids
  const aId = e.a || e.nodeId || e.from || e.source || e.left;
  const bId = e.b || e.otherId || e.to   || e.target || e.right;

  const a = aId && document.querySelector(`.node[data-id='${aId}']`);
  const b = bId && document.querySelector(`.node[data-id='${bId}']`);
  if (!a || !b) return;

  const ax = a.offsetLeft, ay = a.offsetTop;
  const bx = b.offsetLeft, by = b.offsetTop;
  const dx = bx - ax, dy = by - ay;
  const len = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx) * 180 / Math.PI;

  const line = document.createElement("div");
  line.className = "edge" + ((e.state === "solid" || e.consented) ? " solid" : "");
  line.style.width = len + "px";
  line.style.left = ax + "px";
  line.style.top  = ay + "px";
  line.style.transform = `rotate(${ang}deg)`;
  canvas.appendChild(line);
}

// Center button simply re-renders with the same data (if you cache it)
centerBtn && (centerBtn.onclick = () => {
  try {
    const nodes = JSON.parse(nodesView.textContent || "[]");
    const edges = JSON.parse(overlapsView.textContent || "[]");
    drawMap(nodes, edges);
  } catch { /* ignore */ }
});

// Boot
(async function init() {
  await loadSuggestions();
  await loadHeatmap(); // optional/no-op if missing
})();
