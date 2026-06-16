import type { Signal } from "../types";

const FEED_URL = "https://news.google.com/rss/search";

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>(.*?)</${name}>`, "s"));
  return m ? decodeEntities(m[1]) : "";
}

/**
 * Google News RSS — keyless news search.
 * Searches the last 7 days of news coverage for a subject.
 * Deliberately queries the brand name alone (adding category terms slashes
 * recall to near zero); the AI triage stage handles disambiguation instead.
 */
export async function fetchGoogleNews(subject: string): Promise<Omit<Signal, "id">[]> {
  const query = `"${subject}" when:7d`;
  const url = `${FEED_URL}?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SignalScope/1.0)" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Google News responded ${res.status}`);
  const xml = await res.text();

  const items = xml.match(/<item>.*?<\/item>/gs) ?? [];
  return items.slice(0, 12).map((block) => {
    const title = tag(block, "title");
    const pubDate = tag(block, "pubDate");
    // Google News titles end with " - Outlet"; description is usually a link soup, so derive snippet from title.
    const outlet = tag(block, "source") || title.split(" - ").pop() || "Google News";
    return {
      source: "news" as const,
      outlet,
      title: title.replace(new RegExp(`\\s+-\\s+${outlet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), ""),
      url: tag(block, "link"),
      snippet: decodeEntities(tag(block, "description")).replace(/<[^>]+>/g, "").slice(0, 280),
      publishedAt: pubDate ? new Date(pubDate).toISOString() : null,
      subject,
      engagement: null,
    };
  });
}
