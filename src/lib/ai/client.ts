import Anthropic from "@anthropic-ai/sdk";

export function createClaudeClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}

export type ClaudeModel =
  | "claude-opus-4-20250514"
  | "claude-sonnet-4-20250514"
  | "claude-3-5-haiku-20241022";

export const MODEL_MAP: Record<string, ClaudeModel> = {
  opus: "claude-opus-4-20250514",
  sonnet: "claude-sonnet-4-20250514",
  haiku: "claude-3-5-haiku-20241022",
};

export function getModel(model: string): ClaudeModel {
  return MODEL_MAP[model] || MODEL_MAP.sonnet;
}
