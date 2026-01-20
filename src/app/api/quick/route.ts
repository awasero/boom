import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";

const QUICK_ASSISTANT_PROMPT = `You are a helpful assistant for an AI website builder. You help with quick questions and simple changes.

## Your Capabilities
- Answer questions about the existing code
- Make simple text, color, or styling changes
- Explain what code does
- Suggest improvements

## Output Format
When making changes, output files in this format:

FILE: filename.ext
\`\`\`html
(updated content)
\`\`\`

When answering questions, just respond naturally.

## CRITICAL: Element Targeting
When the user message starts with "[Element: selector]", this indicates they have selected a SPECIFIC element in the preview.
- You MUST ONLY modify that exact element and nothing else
- Do NOT change any other elements, sections, or parts of the page
- Find the element matching the selector (tag, id, classes) and make changes ONLY to it
- If you cannot find the element, explain why and ask for clarification
- NEVER modify surrounding elements, siblings, parents, or unrelated sections
- Keep the scope of changes as minimal as possible

## Rules
- Be concise and helpful
- For simple changes, show the updated code
- For questions, give brief answers
- If the request is too complex, say "This requires a more detailed approach - please ask for a redesign"
- When an element is targeted, STRICTLY limit changes to that element only
`;

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  try {
    const { prompt, existingFiles, projectName, apiKey: userApiKey } = await request.json();

    const effectiveApiKey = userApiKey || apiKey;
    if (!effectiveApiKey) {
      return NextResponse.json(
        { error: "API key required. Please add your Anthropic API key in Settings." },
        { status: 400 }
      );
    }

    const client = new Anthropic({ apiKey: effectiveApiKey });

    let systemPrompt = QUICK_ASSISTANT_PROMPT;

    // Add project context
    if (projectName) {
      systemPrompt += `\n\n## Project: ${projectName}\n`;
    }

    // Add existing files for context
    if (existingFiles && existingFiles.length > 0) {
      systemPrompt += "\n\n## Current Project Files\n";
      for (const file of existingFiles) {
        systemPrompt += `\nFILE: ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n`;
      }
    }

    const stream = await client.messages.stream({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 4096,
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
