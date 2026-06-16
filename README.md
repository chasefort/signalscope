<p align="center">
  <img src="docs/banner.svg" alt="SignalScope — live brand and market monitoring for GTM teams" width="100%" />
</p>

# SignalScope

**Live brand and market monitoring for GTM teams.** SignalScope takes a brand, competitors, market category, and monitoring objective, then pulls fresh public signals, triages the noise with AI, and writes a cited market-intelligence report with concrete GTM recommendations.

It is designed for the gap between raw alerts and useful strategy: collect the signals, filter what matters, connect them to action, and keep every claim traceable to evidence.

## What It Does

1. **Collects live signals** from Google News RSS, Hacker News, GDELT, and optional Tavily search.
2. **Scores relevance** with a fast AI triage pass so homonyms, spam, and off-topic results drop out.
3. **Synthesizes a report** with executive summary, sentiment, themes, competitor moves, opportunities, risks, and action items.
4. **Cites every claim** with evidence chips that jump back to the source signal.
5. **Exports Markdown** for sharing or follow-up analysis.

## Pipeline

```text
Brief
  brand + competitors + category + objective
        |
        v
Collect
  Google News · Hacker News · GDELT · Tavily
        |
        v
Triage
  fast model scores relevance and removes noise
        |
        v
Synthesize
  analyst model writes a schema-checked cited report
        |
        v
Review
  report + evidence panel + Markdown export
```

## Architecture

| Layer | Implementation |
| --- | --- |
| App | Next.js App Router, React, TypeScript |
| Pipeline | `lib/pipeline.ts` orchestrates collect → triage → synthesize |
| Sources | Source adapters in `lib/sources/` |
| AI providers | Anthropic preferred, OpenAI fallback through Vercel AI SDK |
| Structured output | Zod schemas for requests, signals, stream events, and reports |
| Streaming | NDJSON progress events from `app/api/monitor/route.ts` |
| Evidence | Server strips invented citation IDs before the UI renders claims |

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>, use the example brief, and run monitoring. A typical run takes 30-60 seconds.

## Smoke Test

With the dev server running:

```bash
npm run smoke
npm run smoke -- "Notion" "Coda,Airtable" "productivity software"
```

The smoke test streams pipeline events, validates that a report was produced, and checks that citations point to delivered signals.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | One AI provider key required | Preferred provider for triage and synthesis |
| `OPENAI_API_KEY` | One AI provider key required | Fallback provider when Anthropic is not set |
| `TAVILY_API_KEY` | No | Adds web search as a fourth source |
| `TRIAGE_MODEL` | No | Override the triage model |
| `SYNTHESIS_MODEL` | No | Override the synthesis model |

## Deploy

```bash
npm run build
npx vercel
```

Set `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` in Vercel. Add `TAVILY_API_KEY` if you want broader web search.

## Engineering Notes

- **Keyless-first collection.** The default sources work without paid scraping or authenticated social APIs.
- **Two-stage model use.** A cost-efficient triage model filters noise before the synthesis model writes the final report.
- **Citations are enforced in code.** The UI only renders citation IDs that exist in the delivered signal set.
- **Source failures are isolated.** One source can fail without breaking the whole run.
- **No fake data on empty runs.** Thin evidence returns coverage notes and guidance instead of invented findings.

## Known Limits

- No X, LinkedIn, Instagram, or Reddit ingestion without authenticated or paid APIs.
- News snippets are shallow; a production version would fetch and summarize full article bodies for the top signals.
- Reports are session-scoped and export-only; there is no saved history or week-over-week diffing.
- Recency windows vary by source and are tuned for useful signal volume.
