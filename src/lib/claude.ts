import Anthropic from "@anthropic-ai/sdk";
import { GeneratedFile } from "@/types/project";
import { SYSTEM_PROMPT } from "./prompts/system";

export function createClaudeClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

export async function generateWebsite(
  apiKey: string,
  userMessage: string,
  existingFiles?: GeneratedFile[],
  onStream?: (text: string) => void
): Promise<{ content: string; files: GeneratedFile[] }> {
  const client = createClaudeClient(apiKey);

  let systemPrompt = SYSTEM_PROMPT;

  if (existingFiles && existingFiles.length > 0) {
    systemPrompt += "\n\n## Current Project Files\n";
    for (const file of existingFiles) {
      systemPrompt += `\nFILE: ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n`;
    }
  }

  let fullContent = "";

  const stream = await client.messages.stream({
    model: "claude-opus-4-20250514",
    max_tokens: 16384,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      fullContent += event.delta.text;
      onStream?.(fullContent);
    }
  }

  const files = parseGeneratedFiles(fullContent);

  return { content: fullContent, files };
}

export function parseGeneratedFiles(content: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const filePattern = /FILE:\s*([^\n]+)\n```(?:\w+)?\n([\s\S]*?)```/g;

  let match;
  while ((match = filePattern.exec(content)) !== null) {
    const path = match[1].trim();
    const fileContent = match[2].trim();

    if (path && fileContent) {
      files.push({ path, content: fileContent });
    }
  }

  return files;
}

export function validateApiKey(apiKey: string): boolean {
  return apiKey.startsWith("sk-ant-") && apiKey.length > 20;
}
