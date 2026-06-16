import { generateObject } from "ai";
import { z } from "zod";
import { getModels } from "./provider";
import type { MonitorRequest, Signal } from "../types";

const TriageSchema = z.object({
  verdicts: z.array(
    z.object({
      id: z.number().int().describe("The signal id being scored"),
      relevance: z
        .number()
        .min(0)
        .max(10)
        .describe(
          "0-3: not about this brand/market (homonym, spam, unrelated). 4-6: tangentially relevant. 7-10: directly relevant to the brand, a competitor, or the category."
        ),
    })
  ),
});

/**
 * Stage 1 — fast relevance triage with Haiku.
 * Raw keyword search is noisy (brand-name homonyms, spam, off-topic posts).
 * A fast triage model scores every signal once; we keep score >= 4 and rank by score.
 * If the triage call itself fails, we fall back to the untriaged list rather
 * than failing the run.
 */
export async function triageSignals(
  req: MonitorRequest,
  signals: Signal[]
): Promise<{ kept: Signal[]; dropped: number; triaged: boolean }> {
  if (signals.length === 0) return { kept: [], dropped: 0, triaged: false };

  const compact = signals.map((s) => ({
    id: s.id,
    source: s.outlet,
    matchedQuery: s.subject,
    title: s.title,
    snippet: s.snippet.slice(0, 160),
  }));

  const models = getModels();
  if (!models) return { kept: signals.slice(0, 40), dropped: 0, triaged: false };

  try {
    const { object } = await generateObject({
      model: models.triage,
      abortSignal: AbortSignal.timeout(90_000),
      schema: TriageSchema,
      system:
        "You are a relevance filter for a brand/market monitoring tool. " +
        "Score every signal for relevance to the monitoring brief. Be strict about homonyms: " +
        "a signal mentioning the brand name in an unrelated sense (a common word, a different company, a person's name) scores 0-3.",
      prompt:
        `Monitoring brief:\n` +
        `- Brand: ${req.brand}\n` +
        `- Competitors: ${req.competitors.join(", ") || "(none specified)"}\n` +
        `- Market/category: ${req.category || "(none specified)"}\n` +
        `- Objective: ${req.objective || "general brand monitoring"}\n\n` +
        `Score ALL ${compact.length} signals:\n${JSON.stringify(compact)}`,
    });

    const scores = new Map(object.verdicts.map((v) => [v.id, v.relevance]));
    const kept = signals
      .map((s) => ({ ...s, relevance: scores.get(s.id) ?? 5 }))
      .filter((s) => (s.relevance ?? 0) >= 4)
      .sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0))
      .slice(0, 40)
      .sort((a, b) => a.id - b.id);

    return { kept, dropped: signals.length - kept.length, triaged: true };
  } catch (err) {
    console.error("Triage failed, continuing untriaged:", err);
    return { kept: signals.slice(0, 40), dropped: 0, triaged: false };
  }
}
