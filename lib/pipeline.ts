import { collectSignals } from "./sources";
import { triageSignals } from "./ai/triage";
import { synthesizeReport } from "./ai/synthesize";
import type { MonitorRequest, PipelineEvent } from "./types";

/**
 * The full monitoring pipeline:
 *   1. fetch    — fan out to live sources in parallel (each fails independently)
 *   2. triage   — Haiku scores relevance, noise is dropped
 *   3. synthesize — Sonnet writes the cited GTM report
 *
 * Emits progress events so the UI can show the run live.
 */
export async function runPipeline(
  req: MonitorRequest,
  emit: (event: PipelineEvent) => void
): Promise<void> {
  // 1. Fetch
  emit({ type: "stage", stage: "fetch", status: "start" });
  const { signals } = await collectSignals(req, (sourceStatus) =>
    emit({ type: "source", sourceStatus })
  );
  emit({
    type: "stage",
    stage: "fetch",
    status: "done",
    detail: `${signals.length} unique signals`,
  });

  if (signals.length === 0) {
    emit({
      type: "error",
      message:
        "No external signals found for this brand in the monitoring window. " +
        "Try a better-known brand name, add a market/category, or check back when there is fresh coverage.",
    });
    return;
  }

  // 2. Triage
  emit({ type: "stage", stage: "triage", status: "start" });
  const { kept, dropped, triaged } = await triageSignals(req, signals);
  emit({
    type: "stage",
    stage: "triage",
    status: "done",
    detail: triaged
      ? `kept ${kept.length}, dropped ${dropped} as noise`
      : `triage unavailable — using ${kept.length} untriaged signals`,
  });
  emit({ type: "signals", signals: kept, totalFetched: signals.length });

  if (kept.length === 0) {
    emit({
      type: "error",
      message:
        "Signals were found but none survived relevance triage — they all looked unrelated to this brand. " +
        "If the brand name is a common word, add a market/category to disambiguate.",
    });
    return;
  }

  // 3. Synthesize
  emit({ type: "stage", stage: "synthesize", status: "start" });
  const report = await synthesizeReport(req, kept);
  emit({ type: "stage", stage: "synthesize", status: "done" });

  // Citation integrity: the model may only cite ids of signals it was shown.
  // Strip any hallucinated ids so every chip in the UI resolves to evidence.
  const validIds = new Set(kept.map((s) => s.id));
  const clean = (ids: number[]) => ids.filter((id) => validIds.has(id));
  report.themes.forEach((t) => (t.signalIds = clean(t.signalIds)));
  report.competitorMoves.forEach((m) => (m.signalIds = clean(m.signalIds)));
  report.opportunities.forEach((o) => (o.signalIds = clean(o.signalIds)));
  report.risks.forEach((r) => (r.signalIds = clean(r.signalIds)));
  report.actions.forEach((a) => (a.signalIds = clean(a.signalIds)));

  emit({ type: "report", report });
}
