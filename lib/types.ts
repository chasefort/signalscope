import { z } from "zod";

// ---------- Request ----------

export const MonitorRequestSchema = z.object({
  brand: z.string().min(1).max(80),
  competitors: z.array(z.string().min(1).max(80)).max(5).default([]),
  category: z.string().max(120).default(""),
  objective: z.string().max(500).default(""),
});

export type MonitorRequest = z.infer<typeof MonitorRequestSchema>;

// ---------- Signals ----------

export type SignalSource = "news" | "hackernews" | "gdelt" | "web";

export interface Signal {
  id: number;
  source: SignalSource;
  /** Human-readable outlet, e.g. "TechCrunch", "Hacker News" */
  outlet: string;
  title: string;
  url: string;
  snippet: string;
  publishedAt: string | null; // ISO date string
  /** Which query surfaced this signal (brand name, competitor name, or category) */
  subject: string;
  /** Engagement metric where available (HN points, Reddit score) */
  engagement: number | null;
  /** Relevance score 0-10 assigned during AI triage */
  relevance?: number;
}

export interface SourceStatus {
  source: SignalSource;
  label: string;
  status: "ok" | "error" | "empty" | "skipped";
  count: number;
  detail?: string;
}

// ---------- Report ----------

const signalIds = z
  .array(z.number().int())
  .describe("IDs of the signals (from the provided list) that support this item");

export const ReportSchema = z.object({
  executiveSummary: z
    .string()
    .describe(
      "3-5 sentence summary of the most important findings, written for a GTM leader. Lead with the single most decision-relevant finding."
    ),
  sentiment: z.object({
    overall: z.enum(["positive", "mixed", "neutral", "negative"]),
    summary: z
      .string()
      .describe("2-3 sentences on how the brand is being talked about and where"),
  }),
  themes: z
    .array(
      z.object({
        title: z.string().describe("Short, specific theme name"),
        summary: z.string().describe("2-4 sentences explaining the theme and the evidence"),
        signalIds,
      })
    )
    .min(1)
    .max(5)
    .describe("The dominant narratives in the monitoring window"),
  competitorMoves: z
    .array(
      z.object({
        competitor: z.string(),
        insight: z.string().describe("What the competitor did or what's being said about them"),
        soWhat: z.string().describe("Why this matters for the monitored brand's GTM"),
        signalIds,
      })
    )
    .max(6)
    .describe("Notable competitor activity. Empty array if no competitor signals were found."),
  opportunities: z
    .array(
      z.object({
        title: z.string(),
        rationale: z.string(),
        recommendedAction: z.string().describe("A concrete, specific next step"),
        priority: z.enum(["high", "medium", "low"]),
        signalIds,
      })
    )
    .min(1)
    .max(5),
  risks: z
    .array(
      z.object({
        title: z.string(),
        rationale: z.string(),
        signalIds,
      })
    )
    .max(4)
    .describe("Threats or negative narratives worth watching. Empty array if none."),
  actions: z
    .array(
      z.object({
        action: z.string().describe("Specific, concrete action a GTM team could start this week"),
        owner: z.enum(["marketing", "sales", "product", "founder"]),
        timeframe: z.enum(["this week", "this month", "this quarter"]),
        rationale: z.string(),
        signalIds,
      })
    )
    .min(2)
    .max(6),
  coverageNotes: z
    .string()
    .describe(
      "Honest 1-3 sentence note on coverage quality: which sources were thin, what this report can and cannot tell the reader"
    ),
});

export type Report = z.infer<typeof ReportSchema>;

// ---------- Pipeline events (NDJSON stream) ----------

export type PipelineEvent =
  | { type: "stage"; stage: "fetch" | "triage" | "synthesize"; status: "start" | "done"; detail?: string }
  | { type: "source"; sourceStatus: SourceStatus }
  | { type: "signals"; signals: Signal[]; totalFetched: number }
  | { type: "report"; report: Report }
  | { type: "error"; message: string };
