(() => {
  const API = location.origin.replace(/\/$/, "");
  const $ = (id) => document.getElementById(id);

  const elCohort = $("cohort");
  const elState  = $("state");
  const elRefresh = $("refresh");
  const elQueue  = $("queue").querySelector("tbody");
  const elMsg    = $("msg");
  const elSummary= $("summary");

  elRefresh.addEventListener("click", loadAll);
  window.addEventListener("DOMContentLoaded", loadAll);

  async function loadAll() {
    clearMsg();
    await Promise.all([loadSummary(), loadQueue()]);
  }

  async function loadSummary() {
    try {
      const params = new URLSearchParams();
      if (elCohort.value.trim()) params.set("cohortId", elCohort.value.trim());
      const res = await fetch(`${API}/admin/summary?${params.toString()}`, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const s = await res.json();
      elSummary.innerHTML = `<p>Nodes: <b>${s.nodes}</b> | Pending: <b>${s.pending}</b> | Approved: <b>${s.approved}</b> | Solid: <b>${s.solid}</b> | Total: <b>${s.total}</b></p>`;
    } catch (e) {
      elSummary.textContent = "";
      console.warn("summary error:", e);
    }
  }

  async function loadQueue() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (elCohort.value.trim()) params.set("cohortId", elCohort.value.trim());
      params.set("state", elState.value);

      const res = await fetch(`${API}/admin/queue?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { items } = await res.json();
      renderTable(items || []);
    } catch (e) {
      showMsg(`Failed to load queue: ${e.message || e}`, true);
    } finally {
      setLoading(false);
    }
  }

  function renderTable(items) {
    elQueue.innerHTML = "";
    if (!items.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.textContent = "No items.";
      tr.appendChild(td);
      elQueue.appendChild(tr);
      return;
    }

    for (const s of items) {
      const tr = document.createElement("tr");

      const tdId = document.createElement("td");
      tdId.textContent = s.id;

      const tdPair = document.createElement("td");
      tdPair.textContent = `${s.nodeName || s.nodeId} ⇄ ${s.otherName || s.otherId}`;

      const tdCohort = document.createElement("td");
      tdCohort.textContent = s.cohortId || "";

      const tdState = document.createElement("td");
      tdState.textContent = s.state || "ghost";

      const tdAction = document.createElement("td");
      const approveBtn = button("Approve", async () => {
        await postJSON("/admin/approve", { suggestionId: s.id });
        tr.remove(); // optimistic
        showMsg(`Approved ${s.id}`);
        await loadSummary();
      });
      const rejectBtn = button("Reject", async () => {
        const reason = prompt("Optional reason?");
        await postJSON("/admin/reject", { suggestionId: s.id, reason: reason || undefined });
        tr.remove();
        showMsg(`Rejected ${s.id}`);
        await loadSummary();
      });
      tdAction.append(approveBtn, space(), rejectBtn);

      tr.append(tdId, tdPair, tdCohort, tdState, tdAction);
      elQueue.appendChild(tr);
    }
  }

  function button(label, onClick) {
    const b = document.createElement("button");
    b.textContent = label;
    b.addEventListener("click", async () => {
      try {
        b.disabled = true;
        await onClick();
      } catch (e) {
        showMsg(`${label} failed: ${e.message || e}`, true);
      } finally {
        b.disabled = false;
      }
    });
    return b;
  }

  function space(){ return document.createTextNode(" "); }

  async function postJSON(path, body) {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body || {}),
      cache: "no-store",
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const j = await res.json(); if (j?.error) msg += `: ${j.error}`; } catch {}
      throw new Error(msg);
    }
    return res.json().catch(() => ({}));
  }

  function setLoading(v){ elRefresh.disabled = !!v; }
  function showMsg(txt, isErr=false){ elMsg.textContent = txt; elMsg.className = isErr ? "err" : "ok"; }
  function clearMsg(){ elMsg.textContent = ""; elMsg.className = ""; }
})();
