// Lists every model on Nebius Token Factory and checks the IDs in lib/config.ts against it.
// Usage: npm run models

import OpenAI from "openai";
import { MODELS, RERANK_MODEL, TOKEN_FACTORY_BASE_URL, getNebiusApiKey } from "../lib/config";
import { describeError } from "./describe-error";

const KEYWORDS = ["nemotron", "nvidia", "embed", "bge", "rerank"];

function levenshtein(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = curr;
  }
  return prev[b.length];
}

function closestIds(target: string, ids: string[], count = 3): string[] {
  const t = target.toLowerCase();
  return ids
    .map((id) => ({ id, distance: levenshtein(t, id.toLowerCase()) }))
    .sort((x, y) => x.distance - y.distance)
    .slice(0, count)
    .map((x) => x.id);
}

async function main() {
  const client = new OpenAI({
    baseURL: TOKEN_FACTORY_BASE_URL,
    apiKey: getNebiusApiKey(),
    timeout: 30_000,
  });

  const ids: string[] = [];
  for await (const model of client.models.list()) ids.push(model.id);
  ids.sort((a, b) => a.localeCompare(b));

  console.log(`\nAll models on Token Factory (${ids.length}):`);
  for (const id of ids) console.log(`  ${id}`);

  const filtered = ids.filter((id) => KEYWORDS.some((k) => id.toLowerCase().includes(k)));
  console.log(`\nMatching ${KEYWORDS.join(" / ")} (${filtered.length}):`);
  for (const id of filtered) console.log(`  ${id}`);

  console.log("\nlib/config.ts check:");
  const available = new Set(ids);
  let missing = 0;
  for (const [key, id] of Object.entries(MODELS)) {
    if (available.has(id)) {
      console.log(`  OK       ${key.padEnd(10)} ${id}`);
      continue;
    }
    missing++;
    console.log(`  MISSING  ${key.padEnd(10)} ${id}`);
    const caseOnly = ids.find((candidate) => candidate.toLowerCase() === id.toLowerCase());
    if (caseOnly) {
      console.log(`           casing differs, the listed ID is: ${caseOnly}`);
    } else {
      console.log(`           closest: ${closestIds(id, ids).join(", ") || "(no models listed)"}`);
    }
  }
  if (RERANK_MODEL === null) {
    console.log(`  TODO     ${"rerank".padEnd(10)} not set yet in lib/config.ts`);
  } else if (available.has(RERANK_MODEL)) {
    console.log(`  OK       ${"rerank".padEnd(10)} ${RERANK_MODEL}`);
  } else {
    missing++;
    console.log(`  MISSING  ${"rerank".padEnd(10)} ${RERANK_MODEL}`);
    console.log(`           closest: ${closestIds(RERANK_MODEL, ids).join(", ") || "(no models listed)"}`);
  }

  console.log(missing === 0 ? "\nAll configured model IDs exist.\n" : `\n${missing} configured model ID(s) MISSING. Fix lib/config.ts.\n`);
  if (missing > 0) process.exitCode = 1;
}

main().catch((err: unknown) => {
  console.error(describeError(err));
  process.exitCode = 1;
});
