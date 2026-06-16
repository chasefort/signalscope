import type { Signal } from "../types";

interface AlgoliaHit {
  objectID: string;
  title: string | null;
  url: string | null;
  points: number | null;
  num_comments: number | null;
  created_at: string;
  story_text: string | null;
}

/**
 * Hacker News via the Algolia search API — keyless.
 * Strong signal for developer-facing and tech-market sentiment.
 * Searches the last 30 days (HN volume is lower than news, so a wider window helps).
 */
export async function fetchHackerNews(subject: string): Promise<Omit<Signal, "id">[]> {
  const since = Math.floor(Date.now() / 1000) - 30 * 24 * 3600;
  const url =
    `https://hn.algolia.com/api/v1/search?` +
    `query=${encodeURIComponent(`"${subject}"`)}&tags=story&numericFilters=created_at_i>${since}&hitsPerPage=15`;

  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`HN Algolia responded ${res.status}`);
  const data = (await res.json()) as { hits: AlgoliaHit[] };

  return data.hits
    .filter((h) => h.title)
    .map((h) => ({
      source: "hackernews" as const,
      outlet: "Hacker News",
      title: h.title!,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      snippet:
        (h.story_text ?? "").replace(/<[^>]+>/g, "").slice(0, 280) ||
        `${h.points ?? 0} points, ${h.num_comments ?? 0} comments on HN`,
      publishedAt: h.created_at,
      subject,
      engagement: h.points ?? 0,
    }));
}
