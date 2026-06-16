import { generateObject } from "ai";
import { getModels } from "./provider";
import type { MonitorRequest, Report, Signal } from "../types";
import { ReportSchema } from "../types";

const SYSTEM = `You are a senior market-intelligence analyst embedded in a GTM (go-to-market) team.
You turn raw external signals — news coverage, Hacker News threads, Reddit discussion, web results —
into a monitoring report a marketing or growth leader can act on.

Rules:
- Ground every claim in the provided signals. Cite signals by id in signalIds. Never invent a citation,
  never cite an id that is not in the provided list.
- Be specific. "Competitor X launched a self-serve tier priced at $29" beats "competitors are active".
- Think like an operator, not a journalist: every theme should end in an implication, every implication
  in something a team could do.
- Calibrate to the evidence. If coverage is thin or one-sided, say so in coverageNotes instead of
  padding the report. An honest "only 4 relevant signals this week" is more useful than fluff.
- If competitor signals are absent, return an empty competitorMoves array — do not speculate.
- Tailor emphasis to the stated monitoring objective.`;

export async function synthesizeReport(req: MonitorRequest, signals: Signal[]): Promise<Report> {
  const evidence = signals.map((s) => ({
    id: s.id,
    source: s.outlet,
    type: s.source,
    matchedQuery: s.subject,
    date: s.publishedAt?.slice(0, 10) ?? "unknown",
    engagement: s.engagement,
    title: s.title,
    snippet: s.snippet,
  }));

  const models = getModels();
  if (!models) throw new Error("No AI provider configured (set ANTHROPIC_API_KEY or OPENAI_API_KEY)");

  const { object } = await generateObject({
    model: models.synthesis,
    abortSignal: AbortSignal.timeout(180_000),
    schema: ReportSchema,
    system: SYSTEM,
    prompt:
      `Today's date: ${new Date().toISOString().slice(0, 10)}\n\n` +
      `Monitoring brief:\n` +
      `- Brand: ${req.brand}\n` +
      `- Competitors: ${req.competitors.join(", ") || "(none specified)"}\n` +
      `- Market/category: ${req.category || "(none specified)"}\n` +
      `- Monitoring objective: ${req.objective || "general brand and market monitoring"}\n\n` +
      `Signals (${evidence.length} total, collected in the last 7-30 days):\n` +
      JSON.stringify(evidence, null, 1),
    maxOutputTokens: 8000,
  });

  return object;
}
