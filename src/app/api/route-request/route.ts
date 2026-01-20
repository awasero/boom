import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";

const ROUTER_PROMPT = `You are a request router for an AI website builder. Your job is to analyze user requests and determine which AI model should handle them.

## Available Models and Their Purposes

1. **opus** - Use for:
   - Creating new websites or pages
   - Major design changes or redesigns
   - Adding new features or sections
   - Complex layouts or creative work
   - Initial website generation
   - Anything requiring high creativity

2. **sonnet** - Use for:
   - SEO optimization (meta tags, structured data)
   - Performance improvements
   - Accessibility fixes
   - Code refactoring or cleanup
   - Documentation or content updates
   - Technical optimizations

3. **haiku** - Use for:
   - Quick questions about the project
   - Simple text changes or typo fixes
   - Color or font adjustments
   - Minor styling tweaks
   - Explaining existing code

## Response Format
Respond with ONLY a JSON object (no markdown, no explanation):
{"model": "opus" | "sonnet" | "haiku", "reason": "brief 5-10 word reason"}

## Examples

User: "Build me a landing page for my startup"
{"model": "opus", "reason": "New page creation requires full design"}

User: "Add SEO meta tags and structured data"
{"model": "sonnet", "reason": "SEO optimization task"}

User: "Change the button color to blue"
{"model": "haiku", "reason": "Simple styling change"}

User: "Redesign the hero section with animations"
{"model": "opus", "reason": "Creative redesign with animations"}

User: "Improve the page load performance"
{"model": "sonnet", "reason": "Performance optimization task"}

User: "What font is being used?"
{"model": "haiku", "reason": "Quick question about code"}

Now analyze this request:`;

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  try {
    const { prompt, hasExistingFiles, apiKey: userApiKey } = await request.json();

    // If no existing files and it's a creation request, default to opus
    if (!hasExistingFiles) {
      return NextResponse.json({
        model: "opus",
        reason: "Initial website creation",
      });
    }

    const effectiveApiKey = userApiKey || apiKey;
    if (!effectiveApiKey) {
      // Default to opus if no API key
      return NextResponse.json({
        model: "opus",
        reason: "Default routing",
      });
    }

    const client = new Anthropic({ apiKey: effectiveApiKey });

    const response = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: `${ROUTER_PROMPT}\n\nUser request: "${prompt}"`,
        },
      ],
    });

    // Parse the response
    const content = response.content[0];
    if (content.type === "text") {
      try {
        // Clean the response - remove any markdown formatting if present
        let jsonText = content.text.trim();
        if (jsonText.startsWith("```")) {
          jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
        }

        const parsed = JSON.parse(jsonText);

        // Validate the model choice
        if (!["opus", "sonnet", "haiku"].includes(parsed.model)) {
          return NextResponse.json({
            model: "opus",
            reason: "Default to opus for safety",
          });
        }

        return NextResponse.json({
          model: parsed.model,
          reason: parsed.reason || "Routed by Haiku",
        });
      } catch {
        // If parsing fails, default to opus
        return NextResponse.json({
          model: "opus",
          reason: "Default to opus",
        });
      }
    }

    return NextResponse.json({
      model: "opus",
      reason: "Default to opus",
    });
  } catch (error) {
    console.error("Router error:", error);
    // On error, default to opus
    return NextResponse.json({
      model: "opus",
      reason: "Router fallback",
    });
  }
}
