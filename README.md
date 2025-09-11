\# Neural Resonance (NR)



\*\*Neural Resonance\*\* is a consent-first cockpit for human + AI collaboration at scale.  

It maps \*\*nodes\*\* (people, strengths, challenges, passions) into a multidimensional space, where overlaps surface as \*resonance edges\*. Connections only form with dual consent.  



This repo contains the modular backend, simple frontend, and demo playbook used to show how \*\*human neurons and AI neurons can form one network\*\*.



---



\## ✨ Features

\- \*\*Node Capture\*\* — submit strengths, challenges, projects, interests, values, fears, pride (all optional).

\- \*\*Clustering \& Suggestions\*\* — ghost overlaps auto-seeded, become solid only with approval.

\- \*\*Consent Flow\*\* — dual accept turns ghost edges → solid glowing edges.

\- \*\*Admin Panel\*\* — approve/reject queue, rationale chips, demo controls.

\- \*\*Append-Only Logs\*\* — auditable `events.log.jsonl` for full history.

\- \*\*Frontend Cockpit\*\* — 3 clean panels (Nodes, Heatmap, Overlaps).

\- \*\*Demo Ready\*\* — supports 10–50 volunteers, highlighting “wow” overlaps.



---



\## 📂 Project Structure


C:\\nr

│ README.md

│ .gitignore

│

├─backend

│ ├─index.cjs # bootstrap, mounts routes

│ ├─lib/ # helpers: store, events, email, util

│ ├─routes/ # nodes, suggestions, admin, consent, review, feedback, reset

│ ├─state/ # JSON “DB” files (auto-created)

│ └─tools/ # seed.cjs, rebuild\_state.cjs

│

├─frontend

│ ├─index.html # volunteer cockpit

│ ├─admin.html # Neural Resonance — Admin

│ ├─app.js, admin.js, style.css

│

├─data/ # sample\_nodes.json

└─docs/ # team, architecture, node capture, demo playbook, storyteller arc







---



\## 🚀 Quickstart (Local Dev)



\*\*Backend\*\*

```powershell

cd backend

npm install

node index.cjs   # API on :5000


# open directly in browser:

file:///C:/nr/frontend/index.html

\# or serve with http-server:

npx http-server frontend -p 3000



cd backend

node ..\\tools\\seed.cjs --cohort alpha --n 30





🧭 Demo Playbook



Gather 10 volunteers.



Each submits strengths/challenges (+optional passions, fears).



Cockpit shows Nodes / Heatmap / Overlaps.



Admin approves ghost → review token → dual consent.



Storyteller highlights unexpected overlaps.



Reset \& replay.



Success = one “wow” resonance moment surfaced live.



🔒 Principles



Consent-first: no connection without dual opt-in.



Anonymity by default: fears/challenges anonymized.



Auditability: append-only logs.



Minimal scope: cockpit with 3 panels.



Scalability path: JSON → Postgres, vanilla → React/Tailwind, 10 nodes → 10,000+.





