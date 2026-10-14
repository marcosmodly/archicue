// Sends one tiny request to each Nemotron tier and one embedding request, through Token Factory.
// Usage: npm run smoke

import OpenAI from "openai";
import { CHAT_TIERS, MODELS, TOKEN_FACTORY_BASE_URL, getNebiusApiKey } from "../lib/config";
import { describeError } from "./describe-error";

const PROMPT = "Reply with the single word: ok";
const MAX_TOKENS = 2000; // reasoning models spend tokens on a trace before answering
const REASONING_FIELDS = ["reasoning_content", "reasoning"];

// Drops <think> blocks, including a missing opening tag or an unclosed block cut off by max_tokens.
function stripThink(text: string): string {
  return text
    .replace(/^[\s\S]*<\/think>/i, "")
    .replace(/<think>[\s\S]*$/i, "")
    .trim();
}

async function main() {
  const client = new OpenAI({
    baseURL: TOKEN_FACTORY_BASE_URL,
    apiKey: getNebiusApiKey(),
    timeout: 180_000,
    maxRetries: 1,
  });

  let failures = 0;

  for (const tier of CHAT_TIERS) {
    const model = MODELS[tier];
    console.log(`\n[${tier}] ${model}`);
    try {
      const started = performance.now();
      const res = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: PROMPT }],
        max_tokens: MAX_TOKENS,
      });
      const latency = Math.round(performance.now() - started);

      const choice = res.choices[0];
      const message = (choice?.message ?? {}) as unknown as Record<string, unknown>;
      const content = typeof message.content === "string" ? message.content : "";
      const reasoningField = REASONING_FIELDS.find(
        (field) => typeof message[field] === "string" && (message[field] as string).length > 0,
      );

      console.log(`  latency:          ${latency} ms`);
      console.log(`  tokens:           prompt ${res.usage?.prompt_tokens ?? "?"}, completion ${res.usage?.completion_tokens ?? "?"}`);
      console.log(`  finish_reason:    ${choice?.finish_reason ?? "?"}`);
      console.log(`  content:          ${JSON.stringify(stripThink(content))}`);
      console.log(`  <think> tags:     ${/<\/?think>/i.test(content) ? "yes" : "no"}`);
      console.log(`  reasoning field:  ${reasoningField ? `yes (${reasoningField})` : "no"}`);
    } catch (err) {
      failures++;
      console.log(`  FAILED: ${describeError(err)}`);
    }
  }

  console.log(`\n[embeddings] ${MODELS.embeddings}`);
  try {
    const started = performance.now();
    const res = await client.embeddings.create({
      model: MODELS.embeddings,
      input: "Minimum width of an exit corridor in a two-storey cafe.",
      encoding_format: "float",
    });
    const latency = Math.round(performance.now() - started);
    console.log(`  latency:          ${latency} ms`);
    console.log(`  tokens:           prompt ${res.usage?.prompt_tokens ?? "?"}`);
    console.log(`  vector length:    ${res.data[0]?.embedding.length ?? "no embedding returned"}`);
  } catch (err) {
    failures++;
    console.log(`  FAILED: ${describeError(err)}`);
  }

  console.log(failures === 0 ? "\nAll smoke checks passed.\n" : `\n${failures} smoke check(s) failed.\n`);
  if (failures > 0) process.exitCode = 1;
}

main().catch((err: unknown) => {
  console.error(describeError(err));
  process.exitCode = 1;
});
