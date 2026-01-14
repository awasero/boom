import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";

const PERFORMANCE_MODE_PROMPT = `
## Performance Mode Guidelines

You are in PERFORMANCE MODE. Generate **plain HTML/CSS/JS files** optimized for speed while still looking good.

### Technical Stack
- **HTML5**: Semantic, accessible markup
- **Tailwind CSS**: Via CDN (\`<script src="https://cdn.tailwindcss.com"></script>\`)
- **Minimal JavaScript**: Only essential JS for core interactions

### Performance First Approach
Focus on:
- **Fast Load Times**: Minimal HTTP requests, small bundle sizes
- **CSS-Only Animations**: Subtle transitions that don't cause layout shifts
- **System Fonts**: Use optimized system font stack for speed
- **Optimized Images**: Proper sizing, lazy loading attributes
- **Mobile First**: Design for mobile, enhance for desktop
- **Lighthouse 95+**: Target excellent performance scores

### Still Look Good
Even in performance mode, avoid generic designs:
- Use Tailwind's color palette creatively (not just blue-500)
- Add subtle shadows and borders for depth
- Use interesting layouts (not just centered stacking)
- Include hover states for interactivity
- Apply proper spacing and visual hierarchy

Avoid:
- Heavy JavaScript animations or libraries
- Multiple custom web fonts (one font max if needed)
- Complex interactive components
- Multiple CSS/JS files when one will do
`;

const DESIGN_MODE_PROMPT = `
## Design Mode Guidelines

You are in DESIGN MODE. Generate **visually stunning HTML/CSS/JS** following the Design Reference Guide.

### Key Requirements
1. **Choose ONE accent color** from the palette (Blue, Purple, Green, Orange, or Cyan)
2. **Follow the type hierarchy**: H1 40-48px, H2 32-36px, H3 24-28px, Body 14-16px
3. **Use 8px spacing increments** consistently (p-2, p-3, p-4, p-6, p-8)
4. **Import Google Fonts**: Use Inter, Geist, DM Sans, or Playfair Display

### Design Aesthetic Options
Reference one of these styles:
- **Clerk-style**: Modern, spacious, purple accent (#6C5CE7), geometric patterns
- **Resend-style**: Dark-first, sophisticated typography, blue accent (#00A3FF)
- **SavvyCal-style**: Vibrant green (#00AA55), friendly, conversational
- **Tiptap-style**: Vibrant gradient, cyan-purple-coral, bold serif
- **Wander-style**: Luxury, premium, photography-driven

### Animation Requirements
- Duration: 150-300ms for micro-interactions
- Hover effects: Scale (1.02-1.05), shadow increase, color shift
- Page load: Staggered fade-in with animation-delay
- Use CSS @keyframes for custom animations

### Component Standards
- **Buttons**: Solid accent color, rounded (8-12px), hover scale + shadow
- **Cards**: Subtle border (#E5E7EB), 8-12px radius, 20-24px padding
- **Navbar**: 56-64px height, sticky, backdrop-blur

### Required Patterns
Every design MUST include:
1. Hero section with bold headline + CTA
2. Feature grid (3-4 columns)
3. Testimonials or social proof
4. CTA footer section
5. Responsive mobile layout

Be bold, be distinctive, but follow the design system consistently.
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
    const { prompt, existingFiles, projectContext, projectName, buildMode, designContext } =
      await request.json();

    const client = new Anthropic({ apiKey });

    let systemPrompt = SYSTEM_PROMPT;

    // Add build mode specific instructions
    if (buildMode === "performance") {
      systemPrompt += "\n" + PERFORMANCE_MODE_PROMPT;
    } else {
      systemPrompt += "\n" + DESIGN_MODE_PROMPT;
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

    // Add design references if provided
    if (designContext) {
      systemPrompt += designContext;
      systemPrompt += "\n\nApply these design references to create a cohesive, distinctive design that reflects the selected styles.\n";
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
