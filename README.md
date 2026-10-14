# ArchiCue

**Know the code before you sketch.**

ArchiCue turns your site notes and client brief into a pre-design brief for Philippine projects. Every requirement links to the exact NBCP or Fire Code section and page, so you can check it yourself.

Sources: the National Building Code of the Philippines (PD 1096), the Fire Code of the Philippines (RA 9514), and their IRRs.

> **Research aid only.** ArchiCue is not a compliance check. Verify every requirement with a licensed architect and your LGU.

Built for the Nebius x NVIDIA Global AI Hackathon 2026, Best Apps and Agents track.

## Setup

Requires Node.js 20.9 or later and a Nebius Token Factory API key.

```bash
git clone https://github.com/marcosmodly/archicue.git
cd archicue
npm install
cp .env.example .env   # then set NEBIUS_API_KEY in .env
npm run dev
```

Open http://localhost:3000.

`.env` is gitignored. Never commit it or paste your key anywhere in the repo.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run models` | Lists every model on Token Factory, highlights NVIDIA, Nemotron, embedding and rerank models, and flags any model ID in `lib/config.ts` that is missing. |
| `npm run smoke` | Sends "Reply with the single word: ok" to each Nemotron tier and embeds one short string. Prints latency, token usage and the answer. Always calls the real API, so it uses a little credit. |

Both scripts read `.env` with `tsx --env-file=.env`. Before committing, run `npm run typecheck`, `npm run lint` and `npm run build`.

## How ArchiCue uses NVIDIA Nemotron and Nebius Token Factory

Every LLM, embedding and rerank call goes through Nebius Token Factory with the OpenAI-compatible `openai` SDK. Text generation uses NVIDIA Nemotron models only. The exact model IDs live in [`lib/config.ts`](lib/config.ts); `npm run models` checks them against Token Factory.

| Tier | Model | Used for | Status |
| --- | --- | --- | --- |
| nano | NVIDIA Nemotron 3 Nano 30B-A3B | Extracting project facts from site and client notes | Planned |
| super | NVIDIA Nemotron 3 Super 120B-A12B | Planning which code sections to look up; fallback for analysis | Planned |
| ultra | NVIDIA Nemotron 3 Ultra 550B-A55B | Final analysis and the pre-design brief | Planned |
| embeddings | BAAI bge-en-icl | Embedding code chunks and lookup queries | Planned |
| rerank | To be confirmed | Reranking the top 30 retrieved chunks down to the top 8 | Planned |

Planned pipeline, none of it built yet:

1. **Extract** (nano): turn the project basics, site notes and client notes into structured facts.
2. **Plan** (super): decide which code topics to look up and why.
3. **Retrieve** (embeddings + rerank): find the matching NBCP and Fire Code sections in a prebuilt index.
4. **Analyze** (ultra): write the brief: requirements, design implications, conflicts and open questions, each citing a retrieved section.
5. **Guard**: check every citation against the retrieved sections. Unverified citations are flagged in the UI, never dropped.

Built so far: the app shell, Token Factory config, and the `models` and `smoke` checks.

## License

MIT. See [LICENSE](LICENSE).
