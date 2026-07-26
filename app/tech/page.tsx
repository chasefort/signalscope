import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "SignalScope — tech",
  description:
    "One streaming route, four keyless sources that fail independently, two models with different jobs, and citations checked on the server.",
};

const sources = [
  ["Google News", "RSS", "Brand name only. Adding category terms to the query zeroed recall, so triage does the disambiguating instead."],
  ["Hacker News", "Algolia API", "Carries an engagement number, which is the only real popularity signal in the set."],
  ["GDELT", "REST", "Global media coverage. Queries run one at a time, because it rejects parallel requests."],
  ["Tavily", "optional", "General web search. Runs only when a key is set. Everything else works without one."],
];

const bugs = [
  {
    title: "Adding category terms to the news query returned nothing",
    body: "The Google News query started as brand plus category, which read like the more precise version. It matched almost nothing, because the RSS endpoint treats the extra terms as hard filters. Recall went to roughly zero for most brands.",
    fix: "Query the brand name alone and let the triage model throw out the homonyms. Recall came back, and precision is now handled by the step that is good at it.",
  },
  {
    title: "GDELT dropped every request when queried in parallel",
    body: "Sources fan out at the same time for speed, and GDELT quietly failed most of the time under that pattern. It rejects concurrent queries from the same client rather than queueing them.",
    fix: "Its queries run sequentially with a retry, inside the parallel fan-out of the other sources. The stage stays fast and GDELT stopped being flaky.",
  },
];

const calls = [
  {
    title: "Two models, not one",
    body: "Triage reads every raw signal, so it runs on the cheapest fast model. Synthesis reads about 40 survivors once, so it gets the expensive analyst-grade one. Using the strong model for both would cost several times more for a worse ratio of thinking to reading.",
    cost: "Two model configs to keep straight, and a triage step that can be wrong about what to drop.",
  },
  {
    title: "Keyless public sources",
    body: "No paid scraping tier and no OAuth dance. Anyone can open the deployment and get a real run. That constraint is why X, Reddit, and LinkedIn are absent rather than half-working.",
    cost: "The social layer is missing, and it is the layer where a lot of brand sentiment actually lives.",
  },
  {
    title: "Schema first, prompt second",
    body: "The report shape is a Zod schema passed to the model, not a list of headings in a prompt. Every field comes back typed, which is what makes rendering and Markdown export straightforward rather than defensive.",
    cost: "A stricter schema means a failed generation fails loudly instead of degrading into prose.",
  },
  {
    title: "Streaming NDJSON, not a spinner",
    body: "A live run takes 60 to 90 seconds. A spinner for that long reads as broken. The route streams one JSON object per line as each stage and source resolves, so the UI shows the pipeline working.",
    cost: "The client has to tolerate partial lines and a stream that ends without a terminal event.",
  },
];

const stack = [
  "Next.js 16 App Router",
  "React 19",
  "TypeScript",
  "Tailwind v4",
  "Vercel AI SDK v6",
  "Anthropic or OpenAI",
  "Zod schemas",
  "NDJSON streaming",
  "Vercel",
];

export default function TechPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <SiteNav current="tech" />

      <div className="rise-in">
        <section className="py-10 sm:py-14">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-signal/70">tech</div>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-fg sm:text-[2.4rem] sm:leading-[1.15]">
            One streaming route, four sources that fail on their own, and citations the server{" "}
            <span className="text-signal">checks</span>.
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-mut">
            The interesting parts of this build are not the model calls. They are what happens around them: keeping a
            90 second run legible, surviving a dead source mid-run, and making it impossible for the report to cite
            something that does not exist.
          </p>
        </section>

        {/* ---------------------------------------------- run shape */}
        <section className="border-t border-line py-12">
          <h2 className="text-xl font-semibold tracking-tight text-fg">Shape of a run</h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-mut">
            One POST to <span className="font-mono text-fg">/api/monitor</span> with a five minute ceiling. The
            response is a stream of newline-delimited JSON events, and the client renders each one as it lands.
          </p>

          <pre className="mt-6 overflow-x-auto rounded-xl border border-line bg-panel-2/60 p-5 font-mono text-[12px] leading-[1.9] text-mut">
{`{"type":"stage","stage":"fetch","status":"start"}
{"type":"source","sourceStatus":{"source":"news","status":"ok","count":31}}
{"type":"source","sourceStatus":{"source":"gdelt","status":"error","detail":"timeout"}}
{"type":"stage","stage":"fetch","status":"done","detail":"68 unique signals"}
{"type":"stage","stage":"triage","status":"start"}
{"type":"stage","stage":"triage","status":"done","detail":"kept 41, dropped 27 as noise"}
{"type":"signals","signals":[...]}
{"type":"stage","stage":"synthesize","status":"start"}
{"type":"report","report":{...}}`}
          </pre>

          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-mut">
            Note the third line. GDELT timed out and the run kept going, because every source resolves independently
            and reports its own status. A dead source costs you its signals, not your report.
          </p>
        </section>

        {/* ---------------------------------------------- sources */}
        <section className="border-t border-line py-12">
          <h2 className="text-xl font-semibold tracking-tight text-fg">Where the signals come from</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line font-mono text-[10px] uppercase tracking-[0.12em] text-dim">
                  <th className="pb-3 pr-4 font-normal">Source</th>
                  <th className="pb-3 pr-4 font-normal">Via</th>
                  <th className="pb-3 font-normal">Note</th>
                </tr>
              </thead>
              <tbody>
                {sources.map(([name, via, note]) => (
                  <tr key={name} className="border-b border-line align-top">
                    <td className="py-3 pr-4 text-[14px] font-medium text-fg">{name}</td>
                    <td className="py-3 pr-4 font-mono text-[11px] text-dim">{via}</td>
                    <td className="py-3 text-[13px] leading-relaxed text-mut">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ---------------------------------------------- citations */}
        <section className="border-t border-line py-12">
          <h2 className="text-xl font-semibold tracking-tight text-fg">Citations that cannot be invented</h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-mut">
            The model is shown a numbered list of signals and asked to cite by id. Models sometimes cite an id that was
            never in the list. Rather than trusting the prompt, the server intersects every cited id with the ids it
            actually sent, and drops the rest before the report reaches the browser.
          </p>

          <pre className="mt-6 overflow-x-auto rounded-xl border border-line bg-panel-2/60 p-5 font-mono text-[12px] leading-[1.9] text-mut">
{`// Citation integrity: the model may only cite ids of signals it was shown.
// Strip any hallucinated ids so every chip in the UI resolves to evidence.
const validIds = new Set(kept.map((s) => s.id));
const clean = (ids: number[]) => ids.filter((id) => validIds.has(id));

report.themes.forEach((t) => (t.signalIds = clean(t.signalIds)));
report.competitorMoves.forEach((m) => (m.signalIds = clean(m.signalIds)));
report.opportunities.forEach((o) => (o.signalIds = clean(o.signalIds)));
report.risks.forEach((r) => (r.signalIds = clean(r.signalIds)));
report.actions.forEach((a) => (a.signalIds = clean(a.signalIds)));`}
          </pre>

          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-mut">
            Six lines, and they are the reason every chip in the report opens a real source card. It is a guarantee the
            code makes, not one the prompt asks for.
          </p>
        </section>

        {/* ---------------------------------------------- models */}
        <section className="border-t border-line py-12">
          <h2 className="text-xl font-semibold tracking-tight text-fg">Two models with different jobs</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-signal-dim bg-signal/5 p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-signal">triage · fast</div>
              <p className="mt-3 text-[14px] leading-relaxed text-mut">
                Reads every raw signal, scores relevance 0 to 10, drops the noise. Claude Haiku by default, a GPT mini
                model on the OpenAI path.
              </p>
              <p className="mt-3 font-mono text-[11px] text-dim">~70 in, ~40 out</p>
            </div>
            <div className="rounded-xl border border-line bg-panel/60 p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-mut">synthesis · analyst</div>
              <p className="mt-3 text-[14px] leading-relaxed text-mut">
                Reads the survivors once and writes the whole report against the schema. Claude Sonnet by default, GPT
                on the OpenAI path.
              </p>
              <p className="mt-3 font-mono text-[11px] text-dim">~40 in, 1 report out</p>
            </div>
          </div>
          <p className="mt-6 max-w-2xl text-[14px] leading-relaxed text-mut">
            Provider selection lives in one file. Set <span className="font-mono text-fg">ANTHROPIC_API_KEY</span> and
            it uses Anthropic; set only <span className="font-mono text-fg">OPENAI_API_KEY</span> and it falls back to
            OpenAI. Both model ids are overridable by environment variable, so swapping models is config rather than a
            code change.
          </p>
        </section>

        {/* ---------------------------------------------- bugs */}
        <section className="border-t border-line py-12">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-fg">Two bugs that only testing found</h2>
            <span className="font-mono text-[11px] text-dim">both shipped broken, both looked fine in review</span>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {bugs.map((bug) => (
              <div key={bug.title} className="rounded-xl border border-line bg-panel/60 p-5">
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-amber">symptom</div>
                <h3 className="mt-2 font-semibold leading-snug text-fg">{bug.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-mut">{bug.body}</p>
                <div className="mt-4 border-t border-line pt-3">
                  <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-signal/70">fix</div>
                  <p className="mt-2 text-[13px] leading-relaxed text-mut">{bug.fix}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 max-w-2xl text-[14px] leading-relaxed text-mut">
            Neither was visible in the code. Both needed a real run against live endpoints, which is what the smoke
            test in <span className="font-mono text-fg">scripts/smoke-test.mjs</span> exists for.
          </p>
        </section>

        {/* ---------------------------------------------- calls */}
        <section className="border-t border-line py-12">
          <h2 className="text-xl font-semibold tracking-tight text-fg">Decisions, and what each one costs</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {calls.map((call) => (
              <div key={call.title} className="rounded-xl border border-line bg-panel/60 p-5">
                <h3 className="font-semibold leading-snug text-fg">{call.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-mut">{call.body}</p>
                <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-dim">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em]">cost</span>
                  <br />
                  {call.cost}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------- stack */}
        <section className="border-t border-line py-12">
          <h2 className="text-xl font-semibold tracking-tight text-fg">Stack</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {stack.map((item) => (
              <span
                key={item}
                className="rounded-full border border-line px-3 py-1.5 font-mono text-[11px] text-mut"
              >
                {item}
              </span>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-[14px] leading-relaxed text-mut">
            Not built yet: stored runs and week-over-week diffing, alerting on a threshold, the authenticated social
            sources, and full article text instead of snippets.
          </p>
        </section>

        <div className="flex flex-wrap gap-3 border-t border-line pt-8">
          <Link
            href="/"
            className="rounded-md border border-signal-dim bg-signal/10 px-4 py-2 font-mono text-xs text-signal transition-colors hover:bg-signal/20"
          >
            run a report →
          </Link>
          <Link
            href="/how-it-works"
            className="rounded-md border border-line px-4 py-2 font-mono text-xs text-mut transition-colors hover:border-signal-dim hover:text-signal"
          >
            what it does
          </Link>
        </div>
      </div>
    </div>
  );
}
