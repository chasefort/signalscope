"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { MonitorForm } from "@/components/MonitorForm";
import { PipelineLog, type StageState } from "@/components/PipelineLog";
import { ReportView } from "@/components/ReportView";
import { EvidencePanel } from "@/components/EvidencePanel";
import { reportToMarkdown } from "@/lib/markdown";
import { SAMPLE_REPORT, SAMPLE_REQUEST, SAMPLE_SIGNALS } from "@/lib/sample";
import type { MonitorRequest, PipelineEvent, Report, Signal, SourceStatus } from "@/lib/types";

const INITIAL_STAGES: StageState[] = [
  { stage: "fetch", status: "pending" },
  { stage: "triage", status: "pending" },
  { stage: "synthesize", status: "pending" },
];

type Phase = "idle" | "running" | "done" | "failed";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [stages, setStages] = useState<StageState[]>(INITIAL_STAGES);
  const [sources, setSources] = useState<SourceStatus[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [request, setRequest] = useState<MonitorRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSample, setIsSample] = useState(false);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function reset() {
    abortRef.current?.abort();
    setPhase("idle");
    setStages(INITIAL_STAGES);
    setSources([]);
    setSignals([]);
    setReport(null);
    setRequest(null);
    setError(null);
    setIsSample(false);
    setHighlightedId(null);
  }

  function showSample() {
    reset();
    setRequest(SAMPLE_REQUEST);
    setSignals(SAMPLE_SIGNALS);
    setReport(SAMPLE_REPORT);
    setIsSample(true);
    setPhase("done");
  }

  function handleEvent(event: PipelineEvent) {
    switch (event.type) {
      case "stage":
        setStages((prev) =>
          prev.map((s) =>
            s.stage === event.stage
              ? { ...s, status: event.status === "start" ? "running" : "done", detail: event.detail ?? s.detail }
              : s
          )
        );
        break;
      case "source":
        setSources((prev) => [...prev.filter((p) => p.source !== event.sourceStatus.source), event.sourceStatus]);
        break;
      case "signals":
        setSignals(event.signals);
        break;
      case "report":
        setReport(event.report);
        setPhase("done");
        break;
      case "error":
        setError(event.message);
        setPhase("failed");
        break;
    }
  }

  async function run(req: MonitorRequest) {
    if (phase === "running") return;
    reset();
    setRequest(req);
    setPhase("running");
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }
      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const parseLine = (line: string) => {
        if (!line.trim()) return;
        try {
          handleEvent(JSON.parse(line) as PipelineEvent);
        } catch {
          // tolerate a malformed line rather than killing the whole run
        }
      };
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        lines.forEach(parseLine);
      }
      buffer += decoder.decode(); // flush any partial multi-byte sequence
      parseLine(buffer);

      // Stream ended without a terminal event (e.g. server timeout mid-run)
      setPhase((p) => {
        if (p !== "running") return p;
        setError("The run ended before a report was produced — likely a server timeout. Try again.");
        return "failed";
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("failed");
    }
  }

  function jumpToSignal(id: number) {
    setHighlightedId(null);
    requestAnimationFrame(() => {
      setHighlightedId(id);
      document.getElementById(`signal-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function exportMarkdown() {
    if (!report || !request) return;
    const md = reportToMarkdown(request, report, signals);
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `signalscope-${request.brand.toLowerCase().replace(/\s+/g, "-")}-${new Date()
      .toISOString()
      .slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const showPipeline = phase === "running" || (phase === "failed" && sources.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      {/* Header */}
      <header className="flex items-center justify-between py-6">
        <button onClick={reset} className="flex items-baseline gap-2 text-left">
          <span className="font-mono text-lg font-semibold tracking-tight text-fg">
            signal<span className="text-signal">scope</span>
          </span>
          <span className="hidden font-mono text-[11px] text-dim sm:inline">/ market intelligence for GTM</span>
        </button>
        <div className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/how-it-works"
            className="hidden rounded-md px-3 py-1.5 font-mono text-xs text-mut transition-colors hover:text-signal sm:block"
          >
            how it works
          </Link>
          <Link
            href="/tech"
            className="hidden rounded-md px-3 py-1.5 font-mono text-xs text-mut transition-colors hover:text-signal sm:block"
          >
            tech
          </Link>
          {phase === "done" && (
            <>
              <button
                onClick={exportMarkdown}
                className="rounded-md border border-line px-3 py-1.5 font-mono text-xs text-mut transition-colors hover:border-signal-dim hover:text-signal"
              >
                ↓ export .md
              </button>
              <button
                onClick={reset}
                className="rounded-md border border-line px-3 py-1.5 font-mono text-xs text-mut transition-colors hover:border-signal-dim hover:text-signal"
              >
                new report
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero + form */}
      {phase === "idle" && (
        <div className="rise-in">
          <div className="py-10 sm:py-14">
            <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-fg sm:text-[2.6rem] sm:leading-[1.15]">
              Turn live market noise into a <span className="text-signal">GTM intelligence report</span> — in one
              minute.
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-mut">
              SignalScope pulls fresh signals about your brand, competitors, and category from news, Hacker News, and
              global media — then an AI analyst triages the noise and writes a cited report with concrete
              recommendations.
            </p>
            <button
              onClick={showSample}
              className="mt-4 font-mono text-xs text-dim underline-offset-4 transition-colors hover:text-signal hover:underline"
            >
              or view a sample report first →
            </button>
          </div>
          <MonitorForm running={false} onRun={run} />

          {/* How it works */}
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              [
                "01 / collect",
                "Parallel live fetch from Google News, Hacker News, GDELT — plus optional Tavily web search. Every source fails independently; the run survives outages.",
              ],
              [
                "02 / triage",
                "A fast triage model (Claude Haiku or GPT mini) scores every raw signal for relevance and filters out brand-name homonyms, spam, and off-topic posts.",
              ],
              [
                "03 / synthesize",
                "An analyst-grade model writes the report: themes, competitor moves, opportunities, risks, and owner-assigned actions — every claim cited back to a source.",
              ],
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl border border-line bg-panel/60 p-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-signal/70">{t}</div>
                <p className="mt-2 text-[13px] leading-relaxed text-mut">{d}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <Link
              href="/how-it-works"
              className="font-mono text-xs text-dim underline-offset-4 transition-colors hover:text-signal hover:underline"
            >
              see a full run, start to finish →
            </Link>
            <Link
              href="/tech"
              className="font-mono text-xs text-dim underline-offset-4 transition-colors hover:text-signal hover:underline"
            >
              how it is built →
            </Link>
          </div>
        </div>
      )}

      {/* Running / failed-with-context */}
      {showPipeline && (
        <div className="mx-auto max-w-2xl space-y-4 py-8">
          <div className="font-mono text-xs text-dim">
            monitoring <span className="text-fg">{request?.brand}</span>
            {request?.competitors.length ? (
              <>
                {" "}
                vs <span className="text-fg">{request.competitors.join(", ")}</span>
              </>
            ) : null}
          </div>
          <PipelineLog stages={stages} sources={sources} />
          {phase === "failed" && error && <ErrorBox message={error} onRetry={reset} />}
        </div>
      )}

      {phase === "failed" && sources.length === 0 && error && (
        <div className="mx-auto max-w-2xl py-8">
          <ErrorBox message={error} onRetry={reset} />
        </div>
      )}

      {/* Report */}
      {phase === "done" && report && request && (
        <div className="rise-in">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-fg">
                {request.brand}
                {request.competitors.length > 0 && <span className="text-mut"> vs {request.competitors.join(", ")}</span>}
              </h1>
              <div className="mt-1 font-mono text-[11px] text-dim">
                {request.category && <span>{request.category} · </span>}
                {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} ·{" "}
                {signals.length} cited signals
              </div>
            </div>
            {isSample && (
              <span className="rounded-full border border-amber/40 bg-amber/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-amber">
                sample report — run live for current data
              </span>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <ReportView report={report} onCite={jumpToSignal} />
            <div className="lg:sticky lg:top-6 lg:self-start">
              <EvidencePanel signals={signals} highlightedId={highlightedId} />
            </div>
          </div>
        </div>
      )}

      <footer className="mt-16 border-t border-line pt-5 font-mono text-[11px] leading-relaxed text-dim">
        SignalScope — live market-signal ingestion, two-stage AI analysis (fast-model
        triage → analyst-model synthesis), and evidence-grounded GTM reporting. Built with Next.js, the Vercel AI SDK
        (Anthropic or OpenAI), and keyless public data sources.
      </footer>
    </div>
  );
}

function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rise-in rounded-xl border border-red/30 bg-red/5 p-5">
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-red">run failed</div>
      <p className="mt-2 text-sm leading-relaxed text-mut">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 rounded-md border border-line px-4 py-2 font-mono text-xs text-mut transition-colors hover:border-signal-dim hover:text-signal"
      >
        ← back to brief
      </button>
    </div>
  );
}
