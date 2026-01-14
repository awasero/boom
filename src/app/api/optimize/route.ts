import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";

const SEO_OPTIMIZATION_PROMPT = `
You are an SEO optimization expert. Your job is to enhance HTML files with technical optimizations for search engines and AI answer engines while preserving the original design.

## Your Optimization Goals
1. **Discoverability:** Help search engines understand and rank the content
2. **Accessibility:** Ensure the site works for all users
3. **AI-Readiness:** Structure content for AI extraction

## What You Must Do
1. Add or improve meta tags (title, description, Open Graph, Twitter Card)
2. Add JSON-LD structured data (appropriate schemas for the content type)
3. Ensure proper heading hierarchy (h1 > h2 > h3)
4. Add alt text to images that lack it
5. Add semantic HTML elements where missing
6. Add accessibility attributes (ARIA labels where needed)

## Output Format
Return the optimized files in this exact format:

FILE: filename.ext
\`\`\`html
(optimized content)
\`\`\`

## Rules
1. NEVER change visual styling or layout
2. NEVER remove existing content
3. ALWAYS preserve class names and IDs
4. ADD enhancements without breaking functionality
5. Include a brief summary of changes made at the start of your response

## JSON-LD Templates to Use

For businesses:
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "...",
  "description": "..."
}

For websites:
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "...",
  "url": "..."
}

For FAQs:
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [...]
}
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

    let systemPrompt = SEO_OPTIMIZATION_PROMPT;

    // Add project context
    if (projectName) {
      systemPrompt += `\n\n## Project: ${projectName}\n`;
    }

    // Add existing files for context
    if (existingFiles && existingFiles.length > 0) {
      systemPrompt += "\n\n## Current Files to Optimize\n";
      for (const file of existingFiles) {
        // Only include HTML files for SEO optimization
        if (file.path.endsWith('.html')) {
          systemPrompt += `\nFILE: ${file.path}\n\`\`\`html\n${file.content}\n\`\`\`\n`;
        }
      }
    }

    let stream;
    try {
      // Use Sonnet for SEO optimization
      stream = await client.messages.stream({
        model: "claude-sonnet-4-20250514",
        max_tokens: 16384,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt || "Optimize these files for SEO and accessibility" }],
      });
    } catch (apiError: unknown) {
      console.error("Claude API error:", apiError);
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
          let errorMessage = "Optimization failed";
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
    console.error("Optimization error:", error);
    return NextResponse.json(
      { error: "Failed to optimize" },
      { status: 500 }
    );
  }
}
