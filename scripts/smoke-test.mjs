#!/usr/bin/env node
/**
 * End-to-end smoke test for the SignalScope pipeline.
 *
 * Runs the full live pipeline (fetch → triage → synthesize) against a running
 * dev server and prints every pipeline event. Requires ANTHROPIC_API_KEY in
 * the server's environment.
 *
 * Usage:
 *   npm run dev            # in one terminal
 *   npm run smoke          # in another
 *   npm run smoke -- "Notion" "Coda,Airtable" "productivity software"
 */

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const [brandArg, competitorsArg, categoryArg] = process.argv.slice(2);

const body = {
  brand: brandArg || "Vercel",
  competitors: competitorsArg ? competitorsArg.split(",").map((s) => s.trim()) : ["Netlify", "Cloudflare"],
  category: categoryArg || "frontend cloud platforms",
  objective: "Track competitive positioning and find messaging angles we can use this quarter",
};

console.log(`→ POST ${BASE}/api/monitor`);
console.log(`→ brief: ${JSON.stringify(body)}\n`);

const started = Date.now();
const res = await fetch(`${BASE}/api/monitor`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

if (!res.ok) {
  const text = await res.text();
  console.error(`✗ HTTP ${res.status}: ${text}`);
  process.exit(1);
}

let report = null;
let signalCount = 0;
let failed = false;
const receivedSignalIds = new Set();

const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = "";

function handle(line) {
  if (!line.trim()) return;
  const event = JSON.parse(line);
  const t = ((Date.now() - started) / 1000).toFixed(1).padStart(5);
  switch (event.type) {
    case "stage":
      console.log(`[${t}s] stage ${event.stage} ${event.status}${event.detail ? ` — ${event.detail}` : ""}`);
      break;
    case "source":
      console.log(
        `[${t}s]   source ${event.sourceStatus.label}: ${event.sourceStatus.status} (${event.sourceStatus.count})${event.sourceStatus.detail ? ` — ${event.sourceStatus.detail}` : ""}`
      );
      break;
    case "signals":
      signalCount = event.signals.length;
      event.signals.forEach((s) => receivedSignalIds.add(s.id));
      console.log(`[${t}s] signals: ${signalCount} kept of ${event.totalFetched} fetched`);
      break;
    case "report":
      report = event.report;
      console.log(`[${t}s] report received`);
      break;
    case "error":
      failed = true;
      console.error(`[${t}s] ✗ pipeline error: ${event.message}`);
      break;
  }
}

for (;;) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\n");
  buffer = lines.pop() ?? "";
  lines.forEach(handle);
}
if (buffer.trim()) handle(buffer);

if (failed || !report) {
  console.error("\n✗ SMOKE TEST FAILED — no report produced");
  process.exit(1);
}

// Validate report integrity: every citation must point at a kept signal.
const allIds = new Set();
const collectIds = (arr) => arr?.forEach((item) => item.signalIds?.forEach((id) => allIds.add(id)));
collectIds(report.themes);
collectIds(report.competitorMoves);
collectIds(report.opportunities);
collectIds(report.risks);
collectIds(report.actions);
// Every cited id must correspond to a signal actually shown in the evidence panel.
const badCitations = [...allIds].filter((id) => !receivedSignalIds.has(id));

console.log("\n──── REPORT ────");
console.log(`Executive summary: ${report.executiveSummary.slice(0, 300)}…`);
console.log(`Sentiment: ${report.sentiment.overall}`);
console.log(`Themes: ${report.themes.map((x) => x.title).join(" | ")}`);
console.log(`Competitor moves: ${report.competitorMoves.length}`);
console.log(`Opportunities: ${report.opportunities.map((o) => `${o.title} (${o.priority})`).join(" | ")}`);
console.log(`Actions: ${report.actions.length}, Risks: ${report.risks.length}`);
console.log(`Distinct citations used: ${allIds.size}`);
console.log(`Coverage notes: ${report.coverageNotes}`);

if (allIds.size === 0) {
  console.error("\n✗ SMOKE TEST FAILED — report contains no citations");
  process.exit(1);
}
if (badCitations.length) {
  console.error(`\n✗ SMOKE TEST FAILED — invalid citation ids: ${badCitations}`);
  process.exit(1);
}

console.log(`\n✓ SMOKE TEST PASSED in ${((Date.now() - started) / 1000).toFixed(1)}s (${signalCount} signals, cited report generated)`);
