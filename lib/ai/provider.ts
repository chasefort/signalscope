import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

/**
 * Provider selection — Anthropic preferred, OpenAI as fallback.
 * Triage wants a fast cost-efficient model; synthesis wants an analyst-grade one.
 * Both are overridable via TRIAGE_MODEL / SYNTHESIS_MODEL.
 */
export interface AiModels {
  provider: "anthropic" | "openai";
  triage: LanguageModel;
  synthesis: LanguageModel;
}

export function getModels(): AiModels | null {
  if (process.env.ANTHROPIC_API_KEY) {
    return {
      provider: "anthropic",
      triage: anthropic(process.env.TRIAGE_MODEL || "claude-haiku-4-5"),
      synthesis: anthropic(process.env.SYNTHESIS_MODEL || "claude-sonnet-4-6"),
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: "openai",
      triage: openai(process.env.TRIAGE_MODEL || "gpt-5-mini"),
      synthesis: openai(process.env.SYNTHESIS_MODEL || "gpt-5-mini"),
    };
  }
  return null;
}
