"use client";

import type { Report } from "@/lib/types";

const SENTIMENT_STYLE: Record<Report["sentiment"]["overall"], string> = {
  positive: "text-signal border-signal/40 bg-signal/10",
  mixed: "text-amber border-amber/40 bg-amber/10",
  neutral: "text-mut border-line bg-panel-2",
  negative: "text-red border-red/40 bg-red/10",
};

const PRIORITY_STYLE: Record<string, string> = {
  high: "text-red border-red/40",
  medium: "text-amber border-amber/40",
  low: "text-mut border-line",
};

function Cites({ ids, onCite }: { ids: number[]; onCite: (id: number) => void }) {
  if (!ids?.length) return null;
  return (
    <span className="ml-1 inline-flex flex-wrap gap-1 align-baseline">
      {ids.map((id) => (
        <button
          key={id}
          onClick={() => onCite(id)}
          title={`Jump to signal ${id} in the evidence panel`}
          aria-label={`View source signal ${id}`}
          className="rounded border border-signal/30 bg-signal/5 px-1 font-mono text-[10.5px] leading-4 text-signal/90
                     hover:bg-signal/15 hover:border-signal/60 transition-colors"
        >
          {id}
        </button>
      ))}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rise-in">
      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-signal/80">{title}</h2>
      {children}
    </section>
  );
}

interface Props {
  report: Report;
  onCite: (id: number) => void;
}

export function ReportView({ report, onCite }: Props) {
  return (
    <div className="space-y-8">
      <Section title="Executive summary">
        <p className="text-[15px] leading-relaxed text-fg">{report.executiveSummary}</p>
        <div className="mt-3 flex items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide ${SENTIMENT_STYLE[report.sentiment.overall]}`}
          >
            sentiment: {report.sentiment.overall}
          </span>
        </div>
        <p className="mt-2 text-sm text-mut">{report.sentiment.summary}</p>
      </Section>

      <Section title="Key themes">
        <div className="space-y-3">
          {report.themes.map((t, i) => (
            <div key={i} className="rounded-lg border border-line bg-panel p-4">
              <h3 className="text-sm font-semibold text-fg">{t.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-mut">
                {t.summary}
                <Cites ids={t.signalIds} onCite={onCite} />
              </p>
            </div>
          ))}
        </div>
      </Section>

      {report.competitorMoves.length > 0 && (
        <Section title="Competitor moves">
          <div className="space-y-3">
            {report.competitorMoves.map((m, i) => (
              <div key={i} className="rounded-lg border border-line bg-panel p-4">
                <div className="font-mono text-xs text-amber">{m.competitor}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-fg">
                  {m.insight}
                  <Cites ids={m.signalIds} onCite={onCite} />
                </p>
                <p className="mt-1.5 text-sm text-mut">
                  <span className="font-mono text-[11px] uppercase tracking-wide text-dim">so what → </span>
                  {m.soWhat}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Opportunities">
        <div className="space-y-3">
          {report.opportunities.map((o, i) => (
            <div key={i} className="rounded-lg border border-line bg-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-fg">{o.title}</h3>
                <span
                  className={`shrink-0 rounded border px-1.5 py-px font-mono text-[10.5px] uppercase ${PRIORITY_STYLE[o.priority]}`}
                >
                  {o.priority}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-mut">
                {o.rationale}
                <Cites ids={o.signalIds} onCite={onCite} />
              </p>
              <p className="mt-1.5 text-sm text-fg">
                <span className="font-mono text-[11px] uppercase tracking-wide text-signal/70">do → </span>
                {o.recommendedAction}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {report.risks.length > 0 && (
        <Section title="Risks & watch items">
          <div className="space-y-3">
            {report.risks.map((r, i) => (
              <div key={i} className="rounded-lg border border-line bg-panel p-4">
                <h3 className="text-sm font-semibold text-fg">{r.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-mut">
                  {r.rationale}
                  <Cites ids={r.signalIds} onCite={onCite} />
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Recommended actions">
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-panel font-mono text-[10.5px] uppercase tracking-wide text-dim">
                <th className="px-3 py-2.5 font-medium">Action</th>
                <th className="px-3 py-2.5 font-medium">Owner</th>
                <th className="px-3 py-2.5 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {report.actions.map((a, i) => (
                <tr key={i} className="bg-panel/50">
                  <td className="px-3 py-3 align-top">
                    <div className="text-fg">{a.action}</div>
                    <div className="mt-1 text-xs text-dim">
                      {a.rationale}
                      <Cites ids={a.signalIds} onCite={onCite} />
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top font-mono text-xs text-mut">{a.owner}</td>
                  <td className="whitespace-nowrap px-3 py-3 align-top font-mono text-xs text-mut">{a.timeframe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Coverage notes">
        <p className="text-sm italic leading-relaxed text-dim">{report.coverageNotes}</p>
      </Section>
    </div>
  );
}
