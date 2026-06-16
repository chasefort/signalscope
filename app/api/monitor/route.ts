import { NextRequest } from "next/server";
import { runPipeline } from "@/lib/pipeline";
import { MonitorRequestSchema, type PipelineEvent } from "@/lib/types";

export const runtime = "nodejs";
// The pipeline does live fetching plus two model calls; give it room on Vercel.
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    return Response.json(
      {
        error:
          "No AI provider configured. Set ANTHROPIC_API_KEY (preferred) or OPENAI_API_KEY in .env.local (local) or the Vercel project environment variables.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = MonitorRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const req = parsed.data;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: PipelineEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };
      try {
        await runPipeline(req, emit);
      } catch (err) {
        console.error("Pipeline failed:", err);
        const message = err instanceof Error ? err.message : "Unexpected pipeline error";
        emit({
          type: "error",
          message: message.includes("api key") || message.includes("authentication")
            ? "Anthropic API authentication failed — check ANTHROPIC_API_KEY."
            : `Pipeline error: ${message}`,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
