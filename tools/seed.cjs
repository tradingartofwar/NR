#!/usr/bin/env node
/* Seed N synthetic nodes into the running API on :5000
   Usage: node tools/seed.cjs --cohort alpha --n 30
*/
const httpOrigin = process.env.APP_ORIGIN || "http://localhost:5000";

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i+1] ? process.argv[i+1] : fallback;
}

const cohortId = arg("--cohort", null);
const N = parseInt(arg("--n", "30"), 10);

if (!cohortId) {
  console.error("Missing required --cohort <id>");
  process.exit(1);
}

const strengthsList = ["chef","engineer","writer","designer","teacher","gardener","musician","analyst","nurse","pilot"];
const challengesList = ["time scarcity","funding","focus","recruiting","latency","tools","confidence","health","childcare","burnout"];
const interestsList  = ["cycling","hiking","music","robotics","gardening","cooking","ai","space","photography","reading"];
const projectsList   = ["cookbook","open-source","community garden","podcast","workshop","prototype","dashboard","newsletter","simulator","app"];

function pick(arr, i, salt=0) { return arr[(i + salt) % arr.length]; }
function sample(i) {
  return {
    strengths: [pick(strengthsList, i), pick(strengthsList, i, 3)],
    challenges: [pick(challengesList, i), pick(challengesList, i, 4)],
    interests: [pick(interestsList, i), pick(interestsList, i, 5)],
    projects: [pick(projectsList, i), pick(projectsList, i, 6)],
    cohortId
  };
}

async function main() {
  let ok = 0, fail = 0;
  for (let i = 0; i < N; i++) {
    const body = sample(i);
    try {
      const res = await fetch(`${httpOrigin}/node`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        ok++;
        process.stdout.write(".");
      } else {
        fail++;
        const txt = await res.text();
        console.error(`\nSeed ${i} failed: ${res.status} ${txt}`);
      }
    } catch (e) {
      fail++;
      console.error(`\nSeed ${i} error:`, e.message);
    }
  }
  console.log(`\nDone. Inserted=${ok}, Failed=${fail}`);
}

main();
