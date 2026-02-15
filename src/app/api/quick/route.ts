import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildEditGeneralPrompt, buildEditElementPrompt, ElementContext } from "@/lib/ai/prompts/edit";
import { buildTextCommandPrompt, buildTweakCommandPrompt, DesignSystem } from "@/lib/ai/prompts/commands";
import { parsePatchAndApply } from "@/lib/ai/parser";
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
      prompt, existingFiles, projectName, command, elementContext,
      designSystem, maxTokens: requestedMaxTokens, conversationHistory,
      brandNucleus,
    } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const TOKEN_LIMITS: Record<string, number> = { text: 2048, tweak: 2048, default: 4096 };
    const maxTokens = Math.min(
      requestedMaxTokens || TOKEN_LIMITS.default,
      command ? (TOKEN_LIMITS[command] || TOKEN_LIMITS.default) : TOKEN_LIMITS.default
    );

    const client = new Anthropic({ apiKey });

    let filesString = "";
    if (existingFiles && existingFiles.length > 0) {
      for (const file of existingFiles) {
        filesString += `\nFILE: ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n`;
      }
    }

    let systemPrompt: string;
    if (command === "text" && elementContext) {
      systemPrompt = buildTextCommandPrompt(
        elementContext.selector || "", elementContext.text || "",
        elementContext.html || "", prompt
      );
    } else if (command === "tweak" && elementContext) {
      const ds: DesignSystem = designSystem || {
        colors: "Not extracted", fonts: "Not extracted", spacing: "Not extracted",
        borderRadius: "Not extracted", aesthetic: "Not extracted", texturesShadowsEffects: "Not extracted",
      };
      systemPrompt = buildTweakCommandPrompt(elementContext.selector || "", elementContext.html || "", ds, prompt);
    } else if (elementContext?.selector) {
      const element: ElementContext = {
        selector: elementContext.selector || "", section: elementContext.section || "unknown",
        parent: elementContext.parent || "unknown", textContent: elementContext.text || "",
        elementHtml: elementContext.html || "",
      };
      systemPrompt = buildEditElementPrompt(projectName || "Untitled", element, filesString, prompt);
    } else {
      systemPrompt = buildEditGeneralPrompt(projectName || "Untitled", filesString, prompt);
    }

    if (brandNucleus) {
      systemPrompt = injectBrandContext(brandNucleus as BrandNucleus) + "\n\n" + systemPrompt;
    }

    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        if (msg.role === "user" || msg.role === "assistant") messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({ role: "user", content: prompt });

    const isPatchCommand = command === "text" || command === "tweak";

    if (isPatchCommand && existingFiles?.length > 0) {
      const response = await client.messages.create({
        model: "claude-3-5-haiku-20241022", max_tokens: maxTokens, system: systemPrompt, messages,
      });
      const responseText = response.content[0].type === "text" ? response.content[0].text : "";
      const patchResult = parsePatchAndApply(responseText, existingFiles);
      const encoder = new TextEncoder();

      if (patchResult.success && patchResult.modifiedFile) {
        const fileOutput = `FILE: ${patchResult.modifiedFile.path}\n\`\`\`html\n${patchResult.modifiedFile.content}\n\`\`\`\n\nApplied change successfully.`;
        const readableStream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: fileOutput })}\n\n`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });
        return new Response(readableStream, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
        });
      } else {
        const errorOutput = `Failed to apply change: ${patchResult.error}\n\nModel response:\n${responseText}`;
        const readableStream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: errorOutput })}\n\n`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });
        return new Response(readableStream, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
        });
      }
    }

    // Standard streaming
    const stream = await client.messages.stream({
      model: "claude-3-5-haiku-20241022", max_tokens: maxTokens, system: systemPrompt, messages,
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
          const msg = error instanceof Error ? error.message : "Request failed";
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
    console.error("Quick request error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
