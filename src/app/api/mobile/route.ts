import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildMobileCommandPrompt, DesignSystem } from "@/lib/ai/prompts/commands";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { prompt, existingFiles, projectName, designSystem, conversationHistory } = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

    const client = new Anthropic({ apiKey });
    let filesString = "";
    if (existingFiles?.length > 0) {
      for (const file of existingFiles) {
        filesString += `\nFILE: ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n`;
      }
    }

    const ds: DesignSystem = designSystem || {
      colors: "Not extracted", fonts: "Not extracted", spacing: "Not extracted",
      borderRadius: "Not extracted", aesthetic: "Not extracted", texturesShadowsEffects: "Not extracted",
    };
    const systemPrompt = buildMobileCommandPrompt(projectName || "Untitled", "entire page", ds, filesString, prompt);
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];
    if (conversationHistory?.length) {
      for (const msg of conversationHistory) {
        if (msg.role === "user" || msg.role === "assistant") messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({ role: "user", content: prompt });

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-20250514", max_tokens: 8192, system: systemPrompt, messages,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : "Mobile optimization failed";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  } catch (error) {
    console.error("Mobile error:", error);
    return NextResponse.json({ error: "Failed to process mobile request" }, { status: 500 });
  }
}
