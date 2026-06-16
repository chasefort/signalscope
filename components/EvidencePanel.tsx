"use client";

import type { Signal, SignalSource } from "@/lib/types";

const SOURCE_BADGE: Record<SignalSource, { label: string; cls: string }> = {
  news: { label: "NEWS", cls: "text-amber border-amber/40" },
  hackernews: { label: "HN", cls: "text-[#ff966b] border-[#ff966b]/40" },
  gdelt: { label: "GDELT", cls: "text-[#7fb4f5] border-[#7fb4f5]/40" },
  web: { label: "WEB", cls: "text-signal border-signal/40" },
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

interface Props {
  signals: Signal[];
  highlightedId: number | null;
}

export function EvidencePanel({ signals, highlightedId }: Props) {
  return (
    <aside aria-label="Evidence signals" className="rounded-xl border border-line bg-panel">
      <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          Evidence — {signals.length} signals
        </h3>
      </div>
      <ol className="max-h-[70vh] divide-y divide-line/60 overflow-y-auto">
        {signals.map((s) => {
          const badge = SOURCE_BADGE[s.source];
          return (
            <li
              key={s.id}
              id={`signal-${s.id}`}
              className={`border-l-2 border-transparent px-4 py-3 ${
                highlightedId === s.id ? "evidence-flash" : ""
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0 font-mono text-xs text-signal">[{s.id}]</span>
                <div className="min-w-0">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] leading-snug text-fg hover:text-signal transition-colors"
                  >
                    {s.title}
                  </a>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10.5px] text-dim">
                    <span className={`rounded border px-1 py-px ${badge.cls}`}>{badge.label}</span>
                    <span className="truncate max-w-[140px]">{s.outlet}</span>
                    <span>{fmtDate(s.publishedAt)}</span>
                    {s.engagement !== null && s.engagement > 0 && <span>▲ {s.engagement}</span>}
                    {typeof s.relevance === "number" && (
                      <span title="AI relevance score">rel {s.relevance}/10</span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
