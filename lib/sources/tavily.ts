import type { Signal } from "../types";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  published_date?: string;
}

/**
 * Tavily web search — optional, requires TAVILY_API_KEY.
 * Broadens coverage beyond news/HN/Reddit to blogs, docs, reviews, and
 * comparison pages. Free tier: 1,000 searches/month.
 */
export async function fetchTavily(subject: string, extraTerms: string): Promise<Omit<Signal, "id">[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY not set");

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      api_key: apiKey, // Tavily accepts this body field alongside the Bearer header.
      query: `${subject} ${extraTerms}`.trim(),
      search_depth: "basic",
      max_results: 8,
      days: 30,
      topic: "general",
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Tavily responded ${res.status}`);
  const data = (await res.json()) as { results?: TavilyResult[] };

  return (data.results ?? []).map((r) => {
    let outlet = "Web";
    try {
      outlet = new URL(r.url).hostname.replace(/^www\./, "");
    } catch {
      /* keep default */
    }
    return {
      source: "web" as const,
      outlet,
      title: r.title,
      url: r.url,
      snippet: r.content.slice(0, 280),
      publishedAt: r.published_date ? new Date(r.published_date).toISOString() : null,
      subject,
      engagement: null,
    };
  });
}
