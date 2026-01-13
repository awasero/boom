import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";

const OPUS_DESIGN_PROMPT = `
## Opus Design Mode Guidelines

You are in OPUS DESIGN MODE. Generate **plain HTML/CSS/JS files** (NOT Astro).

### File Format
Output files in this exact format:

FILE: index.html
\`\`\`html
<!DOCTYPE html>
<html>...</html>
\`\`\`

FILE: styles.css
\`\`\`css
/* styles */
\`\`\`

FILE: script.js
\`\`\`javascript
// scripts
\`\`\`

### Technical Stack
- **HTML5**: Semantic, accessible markup
- **CSS**: Custom styles + Tailwind via CDN (<script src="https://cdn.tailwindcss.com"></script>)
- **JavaScript**: Vanilla JS for interactions and animations
- **NO Astro, NO .astro files, NO frontmatter**

### File Structure
Use flat structure for simplicity:
- \`index.html\` - Main page
- \`about.html\`, \`contact.html\` - Additional pages
- \`styles.css\` - Custom CSS (beyond Tailwind)
- \`script.js\` - JavaScript for interactions

### Design Philosophy
Focus on:
- **Visual Excellence**: Beautiful, memorable designs with attention to detail
- **Rich Interactions**: Smooth animations, hover effects, and micro-interactions
- **Custom Layouts**: Creative, unique layouts that stand out
- **Premium Feel**: High-end aesthetic with refined typography and spacing
- **Brand Expression**: Strong visual identity and cohesive design language

You have full creative freedom to:
- Use advanced CSS features (grid, animations, transforms, @keyframes)
- Create complex multi-section layouts
- Add sophisticated hover states and interactions
- Implement scroll-triggered animations with IntersectionObserver
- Design custom UI components
- Use CSS custom properties for theming
- Add smooth page transitions
`;

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { prompt, existingFiles, projectContext, projectName, buildMode } =
      await request.json();

    const client = new Anthropic({ apiKey });

    let systemPrompt = SYSTEM_PROMPT;

    // Add build mode specific instructions
    if (buildMode === "opus" || !buildMode) {
      systemPrompt += "\n" + OPUS_DESIGN_PROMPT;
    }

    // Add project context if provided
    if (projectContext || projectName) {
      systemPrompt += "\n\n## Project Context\n";
      if (projectName) {
        systemPrompt += `**Project Name:** ${projectName}\n`;
      }
      if (projectContext) {
        systemPrompt += `**Description:** ${projectContext}\n`;
      }
      systemPrompt +=
        "\nUse this context to inform your design decisions, content, and branding.\n";
    }

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
