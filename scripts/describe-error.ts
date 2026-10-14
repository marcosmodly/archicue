import OpenAI from "openai";

// Formats an error with its cause chain, e.g. "Connection error. <- fetch failed <- getaddrinfo ENOTFOUND ...".
export function describeError(err: unknown): string {
  const parts: string[] = [];
  let current: unknown = err;
  for (let depth = 0; current instanceof Error && depth < 4; depth++) {
    const status = current instanceof OpenAI.APIError && current.status ? `${current.status} ` : "";
    parts.push(`${status}${current.message}`);
    current = current.cause;
  }
  return parts.length > 0 ? parts.join(" <- ") : String(err);
}
