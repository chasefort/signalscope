import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SAMPLE_REPORT, SAMPLE_REQUEST, SAMPLE_SIGNALS } from "@/lib/sample";

export const metadata: Metadata = {
  title: "SignalScope — how it works",
  description:
    "You give it a brand. It pulls live signals, drops the noise with a fast model, and writes a cited GTM report you can check line by line.",
};

const stages = [
  {
    tag: "01 / collect",
    title: "Pull what is actually being said",
    body: "Four public sources, fetched at the same time: Google News, Hacker News, GDELT global media, and Tavily web search when a key is set. No paid scrapers and no login, so the run works the first time you press the button.",
    facts: [
      ["Sources", "Google News RSS, Hacker News, GDELT, optional Tavily"],
      ["Failure", "Each source fails on its own. Three up, one down, the run continues"],
      ["You see", "A live status line per source with its count"],
    ],
  },
  {
    tag: "02 / triage",
    title: "Throw most of it away",
    body: "A fast model reads every raw signal and scores it 0 to 10 for relevance. Brand-name homonyms, spam, and off-topic posts get dropped here. This is the step that turns a firehose into something a person would read.",
    facts: [
      ["Model", "A cheap fast one. Claude Haiku, or a GPT mini model"],
      ["Scores", "0 to 10 per signal, kept on the card so you can see the call"],
      ["Typical", "About 70 fetched, about 40 kept"],
    ],
  },
  {
    tag: "03 / synthesize",
    title: "Write the report, cite every claim",
    body: "An analyst-grade model writes to a fixed schema, so the output has the same shape every time: summary, sentiment, themes, competitor moves, opportunities, risks, and an action table with an owner and a timeframe on each row.",
    facts: [
      ["Model", "The stronger one. Claude Sonnet, or GPT"],
      ["Shape", "Enforced by a schema, not by asking nicely in a prompt"],
      ["Citations", "Checked on the server. A made-up source id is removed"],
    ],
  },
];

const limits = [
  "No X, Reddit, LinkedIn, or Instagram. All four block unauthenticated access or charge for it, so leaving them out was the honest call.",
  "GDELT gives headlines only, and snippets everywhere are short. The report reasons over titles and descriptions, not full article text.",
  "Nothing is stored. You get one report and a Markdown export, with no week-over-week comparison yet.",
  "Recency windows differ by source, so \"this week\" is not exactly the same week everywhere.",
  "A brand with no recent coverage returns little. The run tells you that instead of inventing findings.",
];

export default function HowItWorksPage() {
  const theme = SAMPLE_REPORT.themes[0];
  const citedSignals = SAMPLE_SIGNALS.filter((signal) => theme.signalIds.includes(signal.id));
  const action = SAMPLE_REPORT.actions[0];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <SiteNav current="how" />

      <div className="rise-in">
        <section className="py-10 sm:py-14">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-signal/70">how it works</div>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-fg sm:text-[2.4rem] sm:leading-[1.15]">
            You give it a brand. It gives you back a report you can <span className="text-signal">check</span>.
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-mut">
            Monitoring tools hand you a feed of mentions and leave the reading to you. Nobody reads 200 headlines on a
            Tuesday, so the feed goes unread and the useful bit never surfaces. SignalScope does the reading, drops what
            does not matter, and writes up what is left with every claim tied to the source it came from.
          </p>
        </section>

        {/* ---------------------------------------------- stages */}
        <section className="border-t border-line py-12">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-fg">Three stages, about a minute</h2>
            <span className="font-mono text-[11px] text-dim">brief → collect → triage → synthesize → report</span>
          </div>

          <div className="mt-8 grid gap-4">
            {stages.map((stage) => (
              <div key={stage.tag} className="grid gap-5 rounded-xl border border-line bg-panel/60 p-5 lg:grid-cols-[1fr_340px] lg:p-6">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-signal/70">{stage.tag}</div>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-fg">{stage.title}</h3>
                  <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-mut">{stage.body}</p>
                </div>

                <dl className="grid content-start gap-2 border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                  {stage.facts.map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[72px_1fr] gap-3">
                      <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-dim">{label}</dt>
                      <dd className="text-[13px] leading-relaxed text-mut">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------- worked example */}
        <section className="border-t border-line py-12">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-fg">One run, start to finish</h2>
            <span className="font-mono text-[11px] text-dim">pulled from the bundled sample report</span>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="grid content-start gap-4">
              <div className="rounded-xl border border-line bg-panel/60 p-5">
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">the brief</div>
                <dl className="mt-3 grid gap-2">
                  {[
                    ["brand", SAMPLE_REQUEST.brand],
                    ["competitors", SAMPLE_REQUEST.competitors.join(", ")],
                    ["category", SAMPLE_REQUEST.category],
                    ["objective", SAMPLE_REQUEST.objective],
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[90px_1fr] gap-3">
                      <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-dim">{label}</dt>
                      <dd className="text-[13px] leading-relaxed text-fg">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-xl border border-line bg-panel/60 p-5">
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-signal/70">
                  what it wrote back
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-mut">{SAMPLE_REPORT.executiveSummary}</p>

                <div className="mt-5 border-t border-line pt-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-dim">theme 1 of {SAMPLE_REPORT.themes.length}</div>
                  <h3 className="mt-2 font-semibold text-fg">{theme.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-mut">
                    {theme.summary}{" "}
                    {theme.signalIds.map((id) => (
                      <span
                        key={id}
                        className="ml-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-signal-dim px-1 font-mono text-[10px] text-signal"
                      >
                        {id}
                      </span>
                    ))}
                  </p>
                </div>

                <div className="mt-5 border-t border-line pt-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-dim">first action</div>
                  <p className="mt-2 text-[13px] leading-relaxed text-fg">{action.action}</p>
                  <p className="mt-1 font-mono text-[11px] text-dim">
                    {action.owner} · {action.timeframe} · {action.rationale}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid content-start gap-3">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                what those chips open
              </div>
              {citedSignals.map((signal) => (
                <div key={signal.id} className="rounded-xl border border-line bg-panel-2/60 p-4">
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-dim">
                    <span>
                      <span className="text-signal">[{signal.id}]</span> {signal.outlet}
                    </span>
                    <span>relevance {signal.relevance}/10</span>
                  </div>
                  <p className="mt-2 text-[13px] font-medium leading-snug text-fg">{signal.title}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-mut">{signal.snippet}</p>
                  <div className="mt-2 font-mono text-[10px] text-dim">
                    {signal.source} · {signal.publishedAt?.slice(0, 10)}
                    {signal.engagement ? ` · ${signal.engagement} points` : ""}
                  </div>
                </div>
              ))}
              <p className="text-[12px] leading-relaxed text-dim">
                In the app these are one click away. The chip scrolls the evidence panel to the card and flashes it, so
                checking a claim takes a second rather than a search.
              </p>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------- report anatomy */}
        <section className="border-t border-line py-12">
          <h2 className="text-xl font-semibold tracking-tight text-fg">What is in every report</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["executive summary", "Three to five sentences, leading with the most decision-relevant finding."],
              ["sentiment", "How the brand is being talked about, and where."],
              ["themes", "The dominant narratives in the window, up to five, each cited."],
              ["competitor moves", "What a rival did, plus a \"so what\" for your GTM."],
              ["opportunities and risks", "Ranked, with the evidence attached to each."],
              ["actions", "A table with an owner and a timeframe on every row."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-xl border border-line bg-panel/60 p-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-signal/70">{title}</div>
                <p className="mt-2 text-[13px] leading-relaxed text-mut">{body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-[14px] leading-relaxed text-mut">
            The whole thing exports to Markdown, citations included, so it can go straight into a doc or a Slack
            message without being retyped.
          </p>
        </section>

        {/* ---------------------------------------------- limits */}
        <section className="border-t border-line py-12">
          <h2 className="text-xl font-semibold tracking-tight text-fg">What it will not do</h2>
          <ul className="mt-6 grid max-w-3xl gap-3">
            {limits.map((line) => (
              <li key={line} className="flex gap-3 border-b border-line pb-3 text-[14px] leading-relaxed text-mut">
                <span aria-hidden className="mt-[10px] h-px w-3 shrink-0 bg-signal-dim" />
                {line}
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-3 border-t border-line pt-8">
          <Link
            href="/"
            className="rounded-md border border-signal-dim bg-signal/10 px-4 py-2 font-mono text-xs text-signal transition-colors hover:bg-signal/20"
          >
            run a report →
          </Link>
          <Link
            href="/tech"
            className="rounded-md border border-line px-4 py-2 font-mono text-xs text-mut transition-colors hover:border-signal-dim hover:text-signal"
          >
            how it is built
          </Link>
        </div>
      </div>
    </div>
  );
}
