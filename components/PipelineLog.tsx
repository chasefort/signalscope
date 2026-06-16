"use client";

import type { SourceStatus } from "@/lib/types";

export interface StageState {
  stage: "fetch" | "triage" | "synthesize";
  status: "pending" | "running" | "done";
  detail?: string;
}

const STAGE_LABELS: Record<StageState["stage"], { title: string; desc: string }> = {
  fetch: { title: "Collecting live signals", desc: "parallel fetch across news, community & web sources" },
  triage: { title: "AI relevance triage", desc: "a fast model scores every signal, noise is dropped" },
  synthesize: { title: "Writing GTM report", desc: "an analyst-grade model synthesizes a cited intelligence report" },
};

const STATUS_GLYPH: Record<SourceStatus["status"], { glyph: string; cls: string }> = {
  ok: { glyph: "●", cls: "text-signal" },
  empty: { glyph: "○", cls: "text-dim" },
  error: { glyph: "✕", cls: "text-red" },
  skipped: { glyph: "−", cls: "text-dim" },
};

interface Props {
  stages: StageState[];
  sources: SourceStatus[];
}

export function PipelineLog({ stages, sources }: Props) {
  return (
    <div className="rise-in rounded-xl border border-line bg-panel p-5 font-mono text-sm">
      <div className="mb-4 text-[11px] uppercase tracking-[0.14em] text-dim">Pipeline</div>
      <ol className="space-y-4">
        {stages.map((s) => {
          const meta = STAGE_LABELS[s.stage];
          return (
            <li key={s.stage} className="flex items-start gap-3">
              <span className="mt-0.5 w-4 text-center">
                {s.status === "done" && <span className="text-signal">✓</span>}
                {s.status === "running" && <span className="pulse-dot text-amber">▸</span>}
                {s.status === "pending" && <span className="text-dim">·</span>}
              </span>
              <div className="min-w-0 flex-1">
                <div className={s.status === "pending" ? "text-dim" : "text-fg"}>
                  {meta.title}
                  {s.detail && <span className="text-mut"> — {s.detail}</span>}
                </div>
                {s.status === "running" && <div className="text-xs text-dim">{meta.desc}</div>}
                {s.stage === "fetch" && sources.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {sources.map((src) => {
                      const g = STATUS_GLYPH[src.status];
                      return (
                        <li key={src.source} className="flex items-baseline gap-2 text-xs">
                          <span className={g.cls}>{g.glyph}</span>
                          <span className="text-mut">{src.label}</span>
                          <span className="text-dim">
                            {src.status === "ok" && `${src.count} signals`}
                            {src.status === "empty" && "no results"}
                            {src.status === "error" && `unavailable (${src.detail ?? "error"})`}
                            {src.status === "skipped" && (src.detail ?? "skipped")}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
