import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import {
  buildEditGeneralPrompt,
  buildEditElementPrompt,
  ElementContext,
} from "@/lib/ai/prompts/edit";
import { injectBrandContext } from "@/lib/brand/inject";
import { BrandNucleus } from "@/types/project";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      prompt,
      existingFiles,
      projectName,
      elementContext,
      maxTokens: requestedMaxTokens,
      conversationHistory,
      brandNucleus,
    } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    let filesString = "";
    if (existingFiles && existingFiles.length > 0) {
      for (const file of existingFiles) {
        filesString += `\nFILE: ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n`;
      }
    }

    let systemPrompt: string;
    if (elementContext && elementContext.selector) {
      const element: ElementContext = {
        selector: elementContext.selector || "",
        section: elementContext.section || "unknown",
        parent: elementContext.parent || "unknown",
        textContent: elementContext.text || "",
        elementHtml: elementContext.html || "",
      };
      systemPrompt = buildEditElementPrompt(projectName || "Untitled", element, filesString, prompt);
    } else {
      systemPrompt = buildEditGeneralPrompt(projectName || "Untitled", filesString, prompt);
    }

    if (brandNucleus) {
      systemPrompt = injectBrandContext(brandNucleus as BrandNucleus) + "\n\n" + systemPrompt;
    }

    const maxTokens = Math.min(requestedMaxTokens || 8192, 16384);

    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }
    messages.push({ role: "user", content: prompt });

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
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
          const msg = error instanceof Error ? error.message : "Edit failed";
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
    console.error("Edit error:", error);
    return NextResponse.json({ error: "Failed to edit" }, { status: 500 });
  }
}
