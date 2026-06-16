import type { MonitorRequest, Signal, SignalSource, SourceStatus } from "../types";
import { fetchGoogleNews } from "./googleNews";
import { fetchHackerNews } from "./hackerNews";
import { fetchGdeltSequential } from "./gdelt";
import { fetchTavily } from "./tavily";

const SOURCE_LABELS: Record<SignalSource, string> = {
  news: "Google News",
  hackernews: "Hacker News",
  gdelt: "GDELT global news",
  web: "Tavily web search",
};

/** Subjects to monitor: the brand plus each competitor. */
function subjects(req: MonitorRequest): string[] {
  const seen = new Set<string>();
  return [req.brand, ...req.competitors].filter((s) => {
    const key = s.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    u.search = "";
    return u.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export interface CollectResult {
  signals: Signal[];
  statuses: SourceStatus[];
}

/**
 * Fan out to all sources for all subjects in parallel.
 * Each source can fail independently — a failed source becomes a status entry,
 * never a thrown error.
 */
export async function collectSignals(
  req: MonitorRequest,
  onSourceStatus?: (s: SourceStatus) => void
): Promise<CollectResult> {
  const subs = subjects(req);
  const extraTerms = req.category.trim();

  const plans: { source: SignalSource; run: () => Promise<Omit<Signal, "id">[]> }[] = [
    { source: "news", run: () => poolAll(subs.map((s) => () => fetchGoogleNews(s))) },
    { source: "hackernews", run: () => poolAll(subs.map((s) => () => fetchHackerNews(s))) },
    { source: "gdelt", run: () => fetchGdeltSequential(subs) },
  ];
  if (process.env.TAVILY_API_KEY) {
    plans.push({ source: "web", run: () => poolAll(subs.map((s) => () => fetchTavily(s, extraTerms))) });
  }

  const statuses: SourceStatus[] = [];
  const collected: Omit<Signal, "id">[] = [];

  await Promise.all(
    plans.map(async ({ source, run }) => {
      let status: SourceStatus;
      try {
        const results = await run();
        status = {
          source,
          label: SOURCE_LABELS[source],
          status: results.length > 0 ? "ok" : "empty",
          count: results.length,
        };
        collected.push(...results);
      } catch (err) {
        status = {
          source,
          label: SOURCE_LABELS[source],
          status: "error",
          count: 0,
          detail: err instanceof Error ? err.message : "unknown error",
        };
      }
      statuses.push(status);
      onSourceStatus?.(status);
    })
  );

  if (!process.env.TAVILY_API_KEY) {
    const skipped: SourceStatus = {
      source: "web",
      label: SOURCE_LABELS.web,
      status: "skipped",
      count: 0,
      detail: "TAVILY_API_KEY not configured (optional)",
    };
    statuses.push(skipped);
    onSourceStatus?.(skipped);
  }

  // Dedupe by URL, newest first, cap to keep triage efficient.
  const byUrl = new Map<string, Omit<Signal, "id">>();
  for (const sig of collected) {
    const key = normalizeUrl(sig.url);
    if (!byUrl.has(key)) byUrl.set(key, sig);
  }
  const deduped = [...byUrl.values()]
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .slice(0, 70)
    .map((sig, i) => ({ ...sig, id: i + 1 }));

  return { signals: deduped, statuses };
}

/** Run query thunks for one source, tolerating per-query failures within it. */
async function poolAll<T>(thunks: (() => Promise<T[]>)[]): Promise<T[]> {
  const settled = await Promise.allSettled(thunks.map((t) => t()));
  const ok = settled.filter((r) => r.status === "fulfilled") as PromiseFulfilledResult<T[]>[];
  if (ok.length === 0 && settled.length > 0) {
    const first = settled[0] as PromiseRejectedResult;
    throw first.reason;
  }
  return ok.flatMap((r) => r.value);
}
