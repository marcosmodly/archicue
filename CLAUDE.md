# CLAUDE.md

## Project

**ArchiCue** (repo: `archicue`). Entry for the Nebius x NVIDIA Global AI Hackathon 2026, Best Apps and Agents track. Submit target: Oct 29, 2026.

Tagline (working): "Know the code before you sketch."

Product copy: ArchiCue turns your site notes and client brief into a pre-design brief for Philippine projects. Every requirement links to the exact NBCP or Fire Code section and page, so you can check it yourself.

What it does: the user enters a Philippine project's basics, site notes and client notes. The app returns a pre-design brief where every code requirement cites the exact section and page of the National Building Code (PD 1096) or the Fire Code (RA 9514), or their IRRs. It is a research aid, not a compliance check, and the UI says so. Use the name "ArchiCue" in the UI, page titles and README.

## Hard rules (breaking these disqualifies the entry)

1. Every LLM, embedding and rerank call goes through Nebius Token Factory.
   - Base URL: `https://api.tokenfactory.nebius.com/v1/`
   - API key: `process.env.NEBIUS_API_KEY`
   - It's OpenAI-compatible, so use the `openai` npm package with `baseURL` set to the URL above.
2. Text generation uses NVIDIA Nemotron models only. Never add Anthropic, OpenAI-hosted, Google or any other provider, not even as a fallback.
3. The repo is public. Never hardcode, log or commit the API key. `.env` is in `.gitignore`, `.env.example` holds placeholders only.
4. Every model ID lives in `lib/config.ts` and nowhere else.

## Hackathon submission rules (Devpost)

From the official rules at `nebiusglobalaihackathon.devpost.com/rules`. Recheck that page before submitting.

- Deadline: Oct 30, 2026, 10:00 am PDT (17:00 UTC). Our target stays Oct 29. A saved Devpost draft is not a submission.
- The app must make runtime calls to the Token Factory inference API and use at least one NVIDIA open-source model. Our hard rules above are stricter: Nemotron only for text generation.
- The deployed demo must use real model calls. `MOCK_MODELS` is for local UI work only and must be unset on Vercel.
- Working demo URL that judges can use. Judging runs Dec 1–15, 2026, so the Vercel deployment and Token Factory credits must stay live through then.
- Public repo with an open-source license file GitHub can detect (`LICENSE`, MIT). The repo must hold all source code, assets and instructions needed to run the app.
- README: setup steps, plus how we use Nemotron and how Token Factory helped.
- Demo video under 3 minutes, public on YouTube, showing the app running. No third-party trademarks or copyrighted music without permission.
- Submission form also needs: project description, track (Best Apps and Agents), and product feedback on Token Factory and the NVIDIA models. Note friction and wins as we hit them.
- Original work owned by us. Third-party SDKs, APIs, fonts and data only under their license terms. Source PDFs must be official government copies of PD 1096, RA 9514 and their IRRs, not commercial annotated editions or reviewers.
- Judging, four equal criteria: Technological Implementation (how well we use Token Factory and Nemotron), Design, Potential Impact, Quality of the Idea.

## Stack

- Next.js (App Router) + TypeScript, deployed on Vercel
- `openai` SDK pointed at Token Factory
- `zod` for all schemas
- No database. The vector index is a JSON file built by a script and committed.

## Models

Confirm exact IDs with `GET /v1/models` before using them. Casing matters, and Nebius retires models (several were removed Aug 31, 2026).

| Tier | Expected ID | Used for |
| --- | --- | --- |
| nano | `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B` | Fact extraction from notes |
| super | `nvidia/nemotron-3-super-120b-a12b` | Planning code lookups; fallback for analysis |
| ultra | `nvidia/nemotron-3-ultra-550b-a55b` | Final analysis and brief |
| embeddings | `BAAI/bge-en-icl` | Chunk and query embeddings |
| rerank | Look up in docs (`api-reference/inference/rerank-documents`) | Rerank top 30 down to top 8 |

All three Nemotron models are reasoning models. They can spend tokens on a reasoning trace before the answer. So:
- Set `max_tokens` generously, especially for ultra.
- Read the answer from `message.content`. Ignore any separate reasoning field.
- Strip any `<think>...</think>` block before `JSON.parse`.

## Pipeline (`lib/pipeline/`)

1. `extract.ts` (nano): raw inputs to `ProjectFacts`
2. `plan.ts` (super): `ProjectFacts` to `Lookup[]` (`{ topic, query, why }`)
3. `retrieve.ts`: for each lookup, embed the query, cosine top 30 over `data/index.json`, rerank to top 8, dedupe across lookups
4. `analyze.ts` (ultra): facts + retrieved chunks (each with its `chunkId`) to `Brief`
5. `guard.ts`: every citation's `chunkId` must be in the retrieved set. If not, mark it unverified and show a warning in the UI. Never drop it silently.

Schemas live in `lib/schemas.ts`. `Brief` contains:
- `requirements[]`: `{ title, detail, implication, citations: [{ chunkId, doc, section, page }] }`
- `conflicts[]`: client wants X, code says Y
- `openQuestions[]`: things to verify (LGU zoning, missing inputs, anything the sources don't cover)
- `disclaimer`

## Rules for the analyze step

- Only state requirements supported by the provided chunks. If something isn't covered, it goes in `openQuestions`.
- Cite by `chunkId` only. Never cite from memory.
- Keep mandatory code requirements separate from design suggestions.
- LGU zoning and local ordinances are out of scope. They become open questions.

## Data

- `public/sources/*.pdf`: the original PDFs, served so citation links can open `/sources/<file>.pdf#page=N`
- `scripts/ingest.ts`: PDF to per-page text to chunks split at section headings. Each chunk: `{ chunkId, doc, section, title, page, text }`. Writes `data/chunks.json`.
- `scripts/embed.ts`: embeds the chunks, writes `data/index.json`. Run once and commit the output.
- Take section numbers from the source text. Never invent them.

## Model calls (`lib/models.ts`)

One entry point: `callModel(tier, messages, { schema?, maxTokens?, temperature? })`
- When `schema` is given, send `response_format: { type: "json_schema", ... }` AND describe the schema in the system prompt (Token Factory docs recommend both).
- Retry once on network errors, 5xx or invalid JSON. Set a timeout per call.
- Log tier, model ID, latency and token usage. Never log prompt contents or the key.
- `MOCK_MODELS=1` returns fixtures from `lib/mocks/` so UI work costs no credits.

## UI

- Input page: form (city, lot area in m², frontage in m, road width in m, building type, floors, expected occupants), site notes, client notes, and a "Load demo project" button. KJ supplies the demo café data.
- Progress view: stream each step as it runs and show which model ran it. Use a streamed response and set `export const maxDuration` on the route, since ultra can be slow.
- Brief view: requirements, design implications, conflicts, open questions. Citation chips link to the PDF page.
- Always-visible banner: research aid only, verify with a licensed architect and the LGU.

## Out of scope (don't build unless KJ asks)

Other countries, CAD/BIM, 3D or form generation, sun/wind analysis, site photo analysis, LGU zoning lookups, user accounts, saved projects.

## Working style

- Small commits with clear messages.
- Run typecheck and lint before calling a task done.
- If a Token Factory detail is unclear, check `https://docs.tokenfactory.nebius.com/llms.txt` or ask KJ. Don't guess.
