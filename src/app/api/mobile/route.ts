import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { buildMobileCommandPrompt, DesignSystem } from "@/lib/prompts/commands";

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
      targetSection,
      designSystem,
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

    // Build files string for the prompt
    let filesString = "";
    if (existingFiles && existingFiles.length > 0) {
      for (const file of existingFiles) {
        filesString += `\nFILE: ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n`;
      }
    }

    // Default design system if not provided
    const ds: DesignSystem = designSystem || {
      colors: "Not extracted",
      fonts: "Not extracted",
      spacing: "Not extracted",
      borderRadius: "Not extracted",
      aesthetic: "Not extracted",
      texturesShadowsEffects: "Not extracted",
    };

    // Build the mobile optimization prompt
    const systemPrompt = buildMobileCommandPrompt(
      projectName || "Untitled Project",
      targetSection || "entire page",
      ds,
      filesString,
      prompt
    );

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
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
          let errorMessage = "Mobile optimization failed";
          if (error && typeof error === "object" && "message" in error) {
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
    console.error("Mobile request error:", error);
    return NextResponse.json(
      { error: "Failed to process mobile optimization request" },
      { status: 500 }
    );
  }
}
