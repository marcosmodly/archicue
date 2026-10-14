// Token Factory settings and every model ID used by ArchiCue.
// Hard rule: this is the only file allowed to contain model IDs.

export const TOKEN_FACTORY_BASE_URL = "https://api.tokenfactory.nebius.com/v1/";

export function getNebiusApiKey(): string {
  const key = process.env.NEBIUS_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "NEBIUS_API_KEY is not set. Copy .env.example to .env and add your Nebius Token Factory API key. " +
        "Scripts load .env via `tsx --env-file=.env`; on Vercel, add it under Project Settings > Environment Variables.",
    );
  }
  return key;
}

// Confirm against `npm run models` before relying on these: casing matters and Nebius retires models.
export const MODELS = {
  nano: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
  super: "nvidia/nemotron-3-super-120b-a12b",
  ultra: "nvidia/nemotron-3-ultra-550b-a55b",
  embeddings: "BAAI/bge-en-icl",
} as const;

export type ModelKey = keyof typeof MODELS;

export const CHAT_TIERS = ["nano", "super", "ultra"] as const satisfies readonly ModelKey[];
export type ChatTier = (typeof CHAT_TIERS)[number];

// TODO: rerank model ID not confirmed yet. Find it in the Token Factory docs
// (api-reference/inference/rerank-documents) and `npm run models`, then set it here.
export const RERANK_MODEL: string | null = null;
