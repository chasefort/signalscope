import type { MonitorRequest, Report, Signal } from "./types";

/**
 * A bundled example report so visitors can see the product's output shape
 * without running a live pipeline (and so the UI has a useful empty state).
 * It is clearly labeled as a sample in the UI — the real experience is the
 * live pipeline.
 */
export const SAMPLE_REQUEST: MonitorRequest = {
  brand: "Anthropic",
  competitors: ["OpenAI", "Mistral"],
  category: "AI foundation models",
  objective: "Track competitive positioning and find messaging angles we can use this quarter",
};

export const SAMPLE_SIGNALS: Signal[] = [
  {
    id: 1,
    source: "news",
    outlet: "TechCrunch",
    title: "Anthropic expands enterprise push with new compliance certifications",
    url: "https://techcrunch.com/",
    snippet: "The company announced SOC 2 Type II and new data-residency options aimed at regulated industries…",
    publishedAt: "2026-06-09T14:00:00Z",
    subject: "Anthropic",
    engagement: null,
    relevance: 9,
  },
  {
    id: 2,
    source: "hackernews",
    outlet: "Hacker News",
    title: "Show HN: We replaced our RAG stack with Claude's 1M context window",
    url: "https://news.ycombinator.com/",
    snippet: "412 points, 287 comments on HN",
    publishedAt: "2026-06-07T09:30:00Z",
    subject: "Anthropic",
    engagement: 412,
    relevance: 8,
  },
  {
    id: 3,
    source: "news",
    outlet: "The Information",
    title: "OpenAI cuts API prices across the board as model competition intensifies",
    url: "https://www.theinformation.com/",
    snippet: "The 30% price cut puts pressure on rivals' enterprise margins…",
    publishedAt: "2026-06-10T11:00:00Z",
    subject: "OpenAI",
    engagement: null,
    relevance: 9,
  },
  {
    id: 4,
    source: "gdelt",
    outlet: "reuters.com",
    title: "Mistral signs European government deals amid sovereignty push",
    url: "https://www.reuters.com/",
    snippet: "Covered by reuters.com (France)",
    publishedAt: "2026-06-08T16:00:00Z",
    subject: "Mistral",
    engagement: null,
    relevance: 8,
  },
  {
    id: 5,
    source: "hackernews",
    outlet: "Hacker News",
    title: "Ask HN: Anyone else seeing Claude outperform on agentic coding tasks?",
    url: "https://news.ycombinator.com/",
    snippet: "188 points, 240 comments on HN",
    publishedAt: "2026-06-05T20:00:00Z",
    subject: "Anthropic",
    engagement: 188,
    relevance: 7,
  },
  {
    id: 6,
    source: "news",
    outlet: "VentureBeat",
    title: "Enterprise AI buyers say model choice now driven by reliability, not benchmarks",
    url: "https://venturebeat.com/",
    snippet: "A survey of 300 CIOs found uptime and predictable behavior outrank leaderboard scores…",
    publishedAt: "2026-06-06T08:00:00Z",
    subject: "AI foundation models",
    engagement: null,
    relevance: 7,
  },
];

export const SAMPLE_REPORT: Report = {
  executiveSummary:
    "The most decision-relevant development this window is OpenAI's 30% API price cut, which resets enterprise pricing conversations across the category. Anthropic's counter-narrative is strong but under-amplified: developer sentiment around agentic coding performance and the 1M context window is organically positive on Hacker News, and the new compliance certifications open regulated-industry doors. Mistral is consolidating a 'European sovereignty' position that is worth monitoring but is not yet a direct threat in US enterprise deals.",
  sentiment: {
    overall: "positive",
    summary:
      "Coverage of Anthropic skews positive and product-led: developers are publicly endorsing real workloads (long-context replacing RAG, agentic coding), while press coverage focuses on enterprise readiness rather than controversy.",
  },
  themes: [
    {
      title: "Price war reframes the enterprise conversation",
      summary:
        "OpenAI's across-the-board price cut shifts buyer attention to cost-per-outcome. Expect procurement teams to reopen pricing discussions this quarter; sellers need a value framing ready that moves the conversation from per-token price to total cost of reliable completion.",
      signalIds: [3, 6],
    },
    {
      title: "Developers are doing the marketing on long-context and agents",
      summary:
        "Two high-engagement HN threads show developers organically validating Claude for long-context retrieval and agentic coding. This is authentic third-party proof that the brand's own channels are not yet amplifying.",
      signalIds: [2, 5],
    },
    {
      title: "Reliability is overtaking benchmarks as the buying criterion",
      summary:
        "Buyer-survey coverage suggests CIOs now weight predictability and uptime over leaderboard wins — a favorable shift for a safety-and-reliability brand position if it is claimed explicitly.",
      signalIds: [6],
    },
  ],
  competitorMoves: [
    {
      competitor: "OpenAI",
      insight: "Cut API prices ~30% across the board, explicitly framed by press as a competitive squeeze.",
      soWhat:
        "Sales will face 'match the price' pressure in renewals. Arm the team with a cost-per-completed-task calculator rather than competing on per-token price.",
      signalIds: [3],
    },
    {
      competitor: "Mistral",
      insight: "Signed multiple European government deals positioned around data sovereignty.",
      soWhat:
        "EU public-sector deals will increasingly require sovereignty answers. Worth a one-pager on data residency now, before it blocks a deal.",
      signalIds: [4],
    },
  ],
  opportunities: [
    {
      title: "Amplify organic developer proof",
      rationale:
        "The HN threads on long-context and agentic coding are exactly the third-party validation enterprise champions forward internally — currently unamplified.",
      recommendedAction:
        "Package the two HN threads into a 'what developers are saying' section in the next customer newsletter and a sales-deck slide with direct quotes.",
      priority: "high",
      signalIds: [2, 5],
    },
    {
      title: "Claim the reliability position while it's open",
      rationale:
        "Buyer criteria are shifting toward reliability, which matches the brand's existing safety narrative, but no vendor has claimed it in plain enterprise language yet.",
      recommendedAction:
        "Ship a 'reliability in production' content piece with uptime data and failure-mode handling, targeted at CIO audiences.",
      priority: "medium",
      signalIds: [6, 1],
    },
  ],
  risks: [
    {
      title: "Price-led commoditization narrative",
      rationale:
        "If the price war dominates category coverage, differentiated positioning gets drowned out and renewals compress. Watch for follow-on cuts from other vendors.",
      signalIds: [3],
    },
  ],
  actions: [
    {
      action: "Build a cost-per-completed-task comparison asset for sales to counter price-cut objections",
      owner: "marketing",
      timeframe: "this week",
      rationale: "OpenAI's price cut will surface in active deals immediately.",
      signalIds: [3],
    },
    {
      action: "Turn the two high-engagement HN threads into quotable social proof for deck + newsletter",
      owner: "marketing",
      timeframe: "this week",
      rationale: "Organic validation is fresh now; it goes stale within weeks.",
      signalIds: [2, 5],
    },
    {
      action: "Draft a data-residency/sovereignty one-pager for EU deals",
      owner: "product",
      timeframe: "this month",
      rationale: "Mistral is making sovereignty a procurement requirement in Europe.",
      signalIds: [4],
    },
  ],
  coverageNotes:
    "This is a bundled sample report illustrating the output format — run a live monitoring pass to get current data. Coverage in a real run is strongest for brands with active news and developer-community presence.",
};
