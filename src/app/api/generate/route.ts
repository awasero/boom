import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import {
  buildInitialDesignPrompt,
  buildInitialPerformancePrompt,
} from "@/lib/prompts/initial-build";

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
      projectContext,
      projectName,
      buildMode,
      designContext,
      apiKey: userApiKey,
    } = await request.json();

    const effectiveApiKey = userApiKey || apiKey;
    if (!effectiveApiKey) {
      return NextResponse.json(
        { error: "API key required. Please add your Anthropic API key in Settings." },
        { status: 400 }
      );
    }

    const client = new Anthropic({ apiKey: effectiveApiKey });

    // Build the appropriate prompt based on build mode
    let systemPrompt: string;
    if (buildMode === "performance") {
      systemPrompt = buildInitialPerformancePrompt(
        projectName || "Untitled Project",
        projectContext || "No description provided",
        prompt
      );
    } else {
      systemPrompt = buildInitialDesignPrompt(
        projectName || "Untitled Project",
        projectContext || "No description provided",
        designContext || "None specified",
        prompt
      );
    }

    // Add existing files for reference if making edits (shouldn't happen in generate, but just in case)
    if (existingFiles && existingFiles.length > 0) {
      systemPrompt += "\n\n## Current Project Files\n";
      systemPrompt +=
        "These are the existing files in the project. Reference them when making changes.\n";
      for (const file of existingFiles) {
        systemPrompt += `\nFILE: ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n`;
      }
    }

    let stream;
    try {
      stream = await client.messages.stream({
        model: "claude-opus-4-20250514",
        max_tokens: 16384,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      });
    } catch (apiError: unknown) {
      console.error("Claude API error:", apiError);

      // Handle specific API errors
      if (apiError && typeof apiError === 'object' && 'status' in apiError) {
        const status = (apiError as { status: number }).status;
        const message = (apiError as { message?: string }).message || '';

        if (status === 400 && message.includes('credit balance')) {
          return NextResponse.json(
            { error: "API credits exhausted. Please add credits to continue." },
            { status: 402 }
          );
        }
        if (status === 401) {
          return NextResponse.json(
            { error: "Invalid API key." },
            { status: 401 }
          );
        }
      }

      return NextResponse.json(
        { error: "Failed to connect to AI service." },
        { status: 500 }
      );
    }

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

          // Send error message through the stream
          let errorMessage = "Generation failed";
          if (error && typeof error === 'object' && 'message' in error) {
            const msg = String((error as { message: string }).message);
            if (msg.includes('credit balance')) {
              errorMessage = "API credits exhausted. Please add credits to continue.";
            } else {
              errorMessage = msg;
            }
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
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate" },
      { status: 500 }
    );
  }
}
