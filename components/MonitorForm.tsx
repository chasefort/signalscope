"use client";

import { useState } from "react";
import type { MonitorRequest } from "@/lib/types";

const OBJECTIVE_PRESETS = [
  "Track competitive positioning and find messaging angles we can use this quarter",
  "Monitor brand sentiment and surface reputation risks early",
  "Find market trends and content/PR opportunities in our category",
  "Watch for competitor launches, pricing changes, and funding news",
];

const EXAMPLE = {
  brand: "Anthropic",
  competitors: ["OpenAI", "Mistral"],
  category: "AI foundation models",
  objective: OBJECTIVE_PRESETS[0],
};

interface Props {
  running: boolean;
  onRun: (req: MonitorRequest) => void;
}

export function MonitorForm({ running, onRun }: Props) {
  const [brand, setBrand] = useState("");
  const [competitorInput, setCompetitorInput] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [objective, setObjective] = useState("");

  function addCompetitor(raw: string) {
    const items = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length === 0) return;
    setCompetitors((prev) =>
      [...prev, ...items.filter((i) => !prev.some((p) => p.toLowerCase() === i.toLowerCase()))].slice(0, 5)
    );
    setCompetitorInput("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!brand.trim() || running) return;
    // capture anything still typed in the competitor box
    const pending = competitorInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const allCompetitors = [...competitors, ...pending].slice(0, 5);
    onRun({ brand: brand.trim(), competitors: allCompetitors, category: category.trim(), objective: objective.trim() });
  }

  function fillExample() {
    setBrand(EXAMPLE.brand);
    setCompetitors(EXAMPLE.competitors);
    setCategory(EXAMPLE.category);
    setObjective(EXAMPLE.objective);
    setCompetitorInput("");
  }

  const labelCls = "block font-mono text-[11px] uppercase tracking-[0.14em] text-dim mb-1.5";
  const inputCls =
    "w-full rounded-md border border-line bg-ink px-3 py-2.5 text-sm text-fg placeholder:text-dim " +
    "focus:border-signal-dim focus:outline-none focus:ring-1 focus:ring-signal-dim transition-colors";

  return (
    <form onSubmit={submit} className="rounded-xl border border-line bg-panel p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-mut">Monitoring brief</h2>
        <button
          type="button"
          onClick={fillExample}
          className="font-mono text-[11px] text-signal/80 hover:text-signal transition-colors"
        >
          fill with example →
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="brand" className={labelCls}>
            Brand / company <span className="text-signal">*</span>
          </label>
          <input
            id="brand"
            className={inputCls}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Anthropic"
            maxLength={80}
            required
          />
        </div>

        <div>
          <label htmlFor="category" className={labelCls}>
            Market / category
          </label>
          <input
            id="category"
            className={inputCls}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. AI foundation models"
            maxLength={120}
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="competitors" className={labelCls}>
          Competitors <span className="normal-case tracking-normal">(up to 5 — press Enter or comma to add)</span>
        </label>
        <div className={`${inputCls} flex flex-wrap items-center gap-1.5 py-2`}>
          {competitors.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 rounded bg-panel-2 border border-line px-2 py-0.5 font-mono text-xs text-mut"
            >
              {c}
              <button
                type="button"
                aria-label={`remove ${c}`}
                onClick={() => setCompetitors((prev) => prev.filter((p) => p !== c))}
                className="text-dim hover:text-red transition-colors"
              >
                ×
              </button>
            </span>
          ))}
          <input
            id="competitors"
            className="min-w-[140px] flex-1 bg-transparent text-sm text-fg placeholder:text-dim focus:outline-none"
            value={competitorInput}
            onChange={(e) => setCompetitorInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addCompetitor(competitorInput);
              } else if (e.key === "Backspace" && !competitorInput && competitors.length) {
                setCompetitors((prev) => prev.slice(0, -1));
              }
            }}
            onBlur={() => addCompetitor(competitorInput)}
            placeholder={competitors.length ? "" : "e.g. OpenAI, Mistral"}
            disabled={competitors.length >= 5}
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="objective" className={labelCls}>
          Monitoring objective
        </label>
        <textarea
          id="objective"
          className={`${inputCls} min-h-[68px] resize-y`}
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="What should this report help you decide?"
          maxLength={500}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {OBJECTIVE_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setObjective(p)}
              className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                objective === p
                  ? "border-signal-dim bg-signal/10 text-signal"
                  : "border-line text-dim hover:text-mut hover:border-mut/50"
              }`}
            >
              {p.length > 52 ? p.slice(0, 50) + "…" : p}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={running || !brand.trim()}
        className="mt-5 w-full rounded-md bg-signal px-4 py-3 text-sm font-semibold text-ink transition-all
                   hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-8"
      >
        {running ? "Monitoring…" : "Run monitoring"}
      </button>
      <p className="mt-3 font-mono text-[11px] text-dim">
        ~30–60s · live fetch from Google News, Hacker News &amp; GDELT · AI triage + synthesis with citations
      </p>
    </form>
  );
}
