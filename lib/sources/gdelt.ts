import type { Signal } from "../types";

interface GdeltArticle {
  title: string;
  url: string;
  domain: string;
  seendate: string; // e.g. 20260612T040000Z
  language: string;
  sourcecountry: string;
}

function parseSeenDate(seendate: string): string | null {
  const m = seendate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
}

/**
 * GDELT 2.0 DOC API — keyless global news monitoring database.
 * Complements Google News with broader international/trade-press coverage.
 * GDELT rate-limits concurrent requests from one IP, so callers must run
 * these queries sequentially (see fetchGdeltSequential below).
 */
export async function fetchGdelt(subject: string): Promise<Omit<Signal, "id">[]> {
  const url =
    `https://api.gdeltproject.org/api/v2/doc/doc?` +
    `query=${encodeURIComponent(`"${subject}" sourcelang:english`)}` +
    `&mode=artlist&maxrecords=15&timespan=7d&format=json&sort=datedesc`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SignalScope/1.0)" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`GDELT responded ${res.status}`);

  // GDELT sometimes returns a plain-text error with a 200 status.
  const text = await res.text();
  let data: { articles?: GdeltArticle[] };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`GDELT returned a non-JSON response: ${text.slice(0, 100)}`);
  }

  return (data.articles ?? []).map(mapArticle(subject));
}

/**
 * Query GDELT for several subjects one at a time with a short gap, retrying
 * once on 429. Returns whatever succeeded.
 */
export async function fetchGdeltSequential(subjects: string[]): Promise<Omit<Signal, "id">[]> {
  const out: Omit<Signal, "id">[] = [];
  let lastError: unknown = null;
  for (let i = 0; i < subjects.length; i++) {
    if (i > 0) await sleep(1200);
    try {
      out.push(...(await fetchGdelt(subjects[i])));
    } catch (err) {
      if (err instanceof Error && err.message.includes("429")) {
        await sleep(2500);
        try {
          out.push(...(await fetchGdelt(subjects[i])));
          continue;
        } catch (retryErr) {
          lastError = retryErr;
          continue;
        }
      }
      lastError = err;
    }
  }
  if (out.length === 0 && lastError) throw lastError;
  return out;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function mapArticle(subject: string) {
  return (a: GdeltArticle): Omit<Signal, "id"> => ({
    source: "gdelt" as const,
    outlet: a.domain,
    title: a.title,
    url: a.url,
    snippet: `Covered by ${a.domain}${a.sourcecountry ? ` (${a.sourcecountry})` : ""}`,
    publishedAt: parseSeenDate(a.seendate),
    subject,
    engagement: null,
  });
}
