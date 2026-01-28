import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import {
  buildEditGeneralPrompt,
  buildEditElementPrompt,
  ElementContext,
} from "@/lib/prompts/edit";
import {
  buildTextCommandPrompt,
  buildTweakCommandPrompt,
  DesignSystem,
} from "@/lib/prompts/commands";

// Parse PATCH format and apply to file content
function parsePatchAndApply(
  patchResponse: string,
  existingFiles: Array<{ path: string; content: string }>
): { success: boolean; modifiedFile?: { path: string; content: string }; error?: string } {
  // Extract FIND and REPLACE from the PATCH format
  const patchMatch = patchResponse.match(/PATCH:\s*```[\s\S]*?FIND:\s*([\s\S]*?)\s*REPLACE:\s*([\s\S]*?)```/i);

  if (!patchMatch) {
    // Try alternative format without the outer PATCH label
    const altMatch = patchResponse.match(/FIND:\s*([\s\S]*?)\s*REPLACE:\s*([\s\S]*?)(?:```|$)/i);
    if (!altMatch) {
      return { success: false, error: "Could not parse PATCH format from response" };
    }
    const findText = altMatch[1].trim();
    const replaceText = altMatch[2].trim();
    return applyPatch(findText, replaceText, existingFiles);
  }

  const findText = patchMatch[1].trim();
  const replaceText = patchMatch[2].trim();
  return applyPatch(findText, replaceText, existingFiles);
}

function applyPatch(
  findText: string,
  replaceText: string,
  existingFiles: Array<{ path: string; content: string }>
): { success: boolean; modifiedFile?: { path: string; content: string }; error?: string } {
  // Find the file containing the text to replace
  for (const file of existingFiles) {
    if (file.content.includes(findText)) {
      const newContent = file.content.replace(findText, replaceText);
      return {
        success: true,
        modifiedFile: { path: file.path, content: newContent }
      };
    }
  }

  // Try with normalized whitespace if exact match fails
  const normalizedFind = findText.replace(/\s+/g, ' ').trim();
  for (const file of existingFiles) {
    const normalizedContent = file.content.replace(/\s+/g, ' ');
    if (normalizedContent.includes(normalizedFind)) {
      // Find the original text with preserved whitespace
      const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'), 'g');
      const newContent = file.content.replace(regex, replaceText);
      if (newContent !== file.content) {
        return {
          success: true,
          modifiedFile: { path: file.path, content: newContent }
        };
      }
    }
  }

  return { success: false, error: "Could not find the target text in any file" };
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  try {
    const {
      prompt,
      existingFiles,
      projectName,
      command,
      elementContext,
      designSystem,
      maxTokens: requestedMaxTokens,
      conversationHistory,
      apiKey: userApiKey,
    } = await request.json();

    // Token limits for Haiku - keep it constrained for simple tasks
    // /text and /tweak should be surgical, not full rewrites
    const TOKEN_LIMITS: Record<string, number> = {
      text: 2048,    // Text changes only - very limited
      tweak: 2048,   // Style tweaks - limited
      default: 4096, // General quick edits - moderate
    };

    const maxTokens = Math.min(
      requestedMaxTokens || TOKEN_LIMITS.default,
      command ? (TOKEN_LIMITS[command] || TOKEN_LIMITS.default) : TOKEN_LIMITS.default
    );

    const effectiveApiKey = userApiKey || apiKey;
    if (!effectiveApiKey) {
      return NextResponse.json(
        { error: "API key required. Please add your Anthropic API key in Settings." },
        { status: 400 }
      );
    }

    const client = new Anthropic({ apiKey: effectiveApiKey });

    // Build files string for prompts
    let filesString = "";
    if (existingFiles && existingFiles.length > 0) {
      for (const file of existingFiles) {
        filesString += `\nFILE: ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n`;
      }
    }

    // Build the appropriate prompt based on command and context
    let systemPrompt: string;

    if (command === "text" && elementContext) {
      // /text command - text changes only
      systemPrompt = buildTextCommandPrompt(
        projectName || "Untitled Project",
        elementContext.selector || "",
        elementContext.text || "",
        elementContext.html || "",
        filesString,
        prompt
      );
    } else if (command === "tweak" && elementContext) {
      // /tweak command - simple design adjustments
      const ds: DesignSystem = designSystem || {
        colors: "Not extracted",
        fonts: "Not extracted",
        spacing: "Not extracted",
        borderRadius: "Not extracted",
        aesthetic: "Not extracted",
        texturesShadowsEffects: "Not extracted",
      };
      systemPrompt = buildTweakCommandPrompt(
        projectName || "Untitled Project",
        elementContext.selector || "",
        elementContext.html || "",
        ds,
        filesString,
        prompt
      );
    } else if (elementContext && elementContext.selector) {
      // Element-targeted edit (no specific command)
      const element: ElementContext = {
        selector: elementContext.selector || "",
        section: elementContext.section || "unknown",
        parent: elementContext.parent || "unknown",
        textContent: elementContext.text || "",
        elementHtml: elementContext.html || "",
      };
      systemPrompt = buildEditElementPrompt(
        projectName || "Untitled Project",
        element,
        filesString,
        prompt
      );
    } else {
      // General edit (no element selected)
      systemPrompt = buildEditGeneralPrompt(
        projectName || "Untitled Project",
        filesString,
        prompt
      );
    }

    // Build messages array with conversation history for context
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: "user", content: prompt });

    // For /text and /tweak commands, use PATCH approach (non-streaming)
    // For other commands, use standard streaming
    const isPatchCommand = command === "text" || command === "tweak";

    if (isPatchCommand && existingFiles && existingFiles.length > 0) {
      // PATCH approach: Get full response, apply patch, return modified file
      const response = await client.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
      });

      const responseText = response.content[0].type === "text" ? response.content[0].text : "";

      // Parse and apply the patch
      const patchResult = parsePatchAndApply(responseText, existingFiles);

      const encoder = new TextEncoder();

      if (patchResult.success && patchResult.modifiedFile) {
        // Format the result as a standard FILE: response that the client can parse
        const fileOutput = `FILE: ${patchResult.modifiedFile.path}\n\`\`\`html\n${patchResult.modifiedFile.content}\n\`\`\`\n\nApplied change successfully.`;

        const readableStream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: fileOutput })}\n\n`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });

        return new Response(readableStream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      } else {
        // Patch failed - return error with original response for debugging
        const errorOutput = `Failed to apply change: ${patchResult.error}\n\nModel response:\n${responseText}`;

        const readableStream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: errorOutput })}\n\n`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });

        return new Response(readableStream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }
    }

    // Standard streaming for non-patch commands
    const stream = await client.messages.stream({
      model: "claude-3-5-haiku-20241022",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    });

    // Create a streaming response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error: unknown) {
          console.error("Stream error:", error);
          let errorMessage = "Request failed";
          if (error && typeof error === 'object' && 'message' in error) {
            errorMessage = String((error as { message: string }).message);
          }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Quick request error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
