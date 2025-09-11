const API = "http://localhost:5000";

const nodes = []; // client-side mirror just for display

async function submitNode() {
  const text = document.getElementById("jsonInput").value.trim();
  if (!text) return alert("Paste a JSON object first.");
  let obj;
  try { obj = JSON.parse(text); }
  catch (e) { return alert("Invalid JSON: " + e.message); }
  const res = await fetch(API + "/node", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify(obj) });
  const data = await res.json();
  nodes.push(data.node);
  renderNodes();
  await refreshSuggestions();
}

function renderNodes() {
  document.getElementById("nodesView").textContent = JSON.stringify(nodes, null, 2);
  // naive heatmap: count per domain/interest word
  const bag = {};
  for (const n of nodes) {
    const words = ([
      ...(n.strengths||[]), ...(n.challenges||[]),
      ...(n.projects||[]), ...(n.interests||[]),
      ...(n.values||[]), ...(n.fears||[]), ...(n.pride||[])
    ].join(" ").toLowerCase().match(/[a-z0-9]+/g)) || [];
    words.forEach(w => bag[w] = (bag[w]||0)+1);
  }
  const top = Object.entries(bag).sort((a,b)=>b[1]-a[1]).slice(0,20);
  document.getElementById("heatmapView").textContent = JSON.stringify(top, null, 2);
}

async function refreshSuggestions() {
  const res = await fetch(API + "/suggestions");
  const data = await res.json();
  document.getElementById("overlapsView").textContent = JSON.stringify(data, null, 2);
}

async function resetDemo() {
  await fetch(API + "/reset", { method: "POST" });
  nodes.length = 0;
  renderNodes();
  await refreshSuggestions();
}

document.getElementById("submitBtn").addEventListener("click", submitNode);
document.getElementById("resetBtn").addEventListener("click", resetDemo);

// initial
refreshSuggestions();
