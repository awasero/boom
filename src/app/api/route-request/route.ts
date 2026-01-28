import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { buildRouterPrompt, RouterResponse } from "@/lib/prompts/router";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  try {
    const {
      prompt,
      hasExistingFiles,
      hasElement,
      elementInfo,
      command,
      apiKey: userApiKey,
    } = await request.json();

    // If no existing files and no command, it's an initial build
    if (!hasExistingFiles && !command) {
      // Determine if user wants design or performance focus
      const lowerPrompt = prompt.toLowerCase();
      const isPerformanceFocused =
        lowerPrompt.includes("fast") ||
        lowerPrompt.includes("performance") ||
        lowerPrompt.includes("seo") ||
        lowerPrompt.includes("speed") ||
        lowerPrompt.includes("lightweight") ||
        lowerPrompt.includes("simple");

      return NextResponse.json({
        classification: isPerformanceFocused
          ? "initial_build_performance"
          : "initial_build_design",
        model: "opus",
        endpoint: "/api/generate",
        confidence: 0.9,
        reasoning: isPerformanceFocused
          ? "New project with performance/speed focus"
          : "New project with design focus",
      });
    }

    // If a command is explicitly used, route directly
    // ONLY /text and /tweak use Haiku (simple, token-limited tasks)
    // All other commands use Sonnet for better quality
    if (command) {
      const commandRoutes: Record<
        string,
        { classification: string; model: string; endpoint: string; maxTokens: number }
      > = {
        text: {
          classification: "text_change",
          model: "haiku",
          endpoint: "/api/quick",
          maxTokens: 2048, // Limited - text changes only
        },
        tweak: {
          classification: "tweak",
          model: "haiku",
          endpoint: "/api/quick",
          maxTokens: 2048, // Limited - style tweaks only
        },
        seo: {
          classification: "seo",
          model: "sonnet",
          endpoint: "/api/seo",
          maxTokens: 8192,
        },
        mobile: {
          classification: "mobile",
          model: "sonnet",
          endpoint: "/api/mobile",
          maxTokens: 8192,
        },
        design: {
          classification: "design",
          model: "sonnet",
          endpoint: "/api/design",
          maxTokens: 8192,
        },
      };

      const route = commandRoutes[command];
      if (route) {
        return NextResponse.json({
          ...route,
          confidence: 1.0,
          reasoning: `Explicit /${command} command used`,
        });
      }
    }

    const effectiveApiKey = userApiKey || apiKey;
    if (!effectiveApiKey) {
      // Default to Sonnet for edits if no API key for routing
      // Sonnet provides better quality for structural changes
      return NextResponse.json({
        classification: hasElement ? "edit_element" : "edit_general",
        model: "sonnet",
        endpoint: "/api/edit",
        maxTokens: 8192,
        confidence: 0.7,
        reasoning: "Default routing without API key",
      });
    }

    // Use Sonnet for intelligent routing
    const client = new Anthropic({ apiKey: effectiveApiKey });
    const routerPrompt = buildRouterPrompt(
      prompt,
      hasElement,
      elementInfo || null,
      command || null,
      hasExistingFiles
    );

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: routerPrompt,
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
          jsonText = jsonText
            .replace(/```json?\n?/g, "")
            .replace(/```/g, "")
            .trim();
        }

        const parsed: RouterResponse = JSON.parse(jsonText);

        // Map classification to model and endpoint
        // Strategy: Haiku ONLY for explicit simple commands (text_change, tweak)
        // Sonnet for all structural edits to preserve code quality
        // Opus for initial builds (no token limit)
        const routeMap: Record<
          string,
          { model: string; endpoint: string; maxTokens: number }
        > = {
          // Initial builds - Opus with high token limit
          initial_build_design: { model: "opus", endpoint: "/api/generate", maxTokens: 16384 },
          initial_build_performance: { model: "opus", endpoint: "/api/generate", maxTokens: 16384 },
          // General edits - Sonnet for quality (structural changes need intelligence)
          edit_general: { model: "sonnet", endpoint: "/api/edit", maxTokens: 8192 },
          edit_element: { model: "sonnet", endpoint: "/api/edit", maxTokens: 8192 },
          // Simple changes - Haiku with LIMITED tokens (only via explicit commands)
          text_change: { model: "haiku", endpoint: "/api/quick", maxTokens: 2048 },
          tweak: { model: "haiku", endpoint: "/api/quick", maxTokens: 2048 },
          // Specialized commands - Sonnet
          seo: { model: "sonnet", endpoint: "/api/seo", maxTokens: 8192 },
          mobile: { model: "sonnet", endpoint: "/api/mobile", maxTokens: 8192 },
          design: { model: "sonnet", endpoint: "/api/design", maxTokens: 8192 },
          // Questions and edge cases - Sonnet for better understanding
          question: { model: "sonnet", endpoint: "/api/edit", maxTokens: 4096 },
          prohibited: { model: "sonnet", endpoint: "/api/edit", maxTokens: 1024 },
          unclear: { model: "sonnet", endpoint: "/api/edit", maxTokens: 4096 },
        };

        // Default to Sonnet for unknown classifications
        const route = routeMap[parsed.classification] || {
          model: "sonnet",
          endpoint: "/api/edit",
          maxTokens: 8192,
        };

        return NextResponse.json({
          classification: parsed.classification,
          model: route.model,
          endpoint: route.endpoint,
          maxTokens: route.maxTokens,
          confidence: parsed.confidence,
          reasoning: parsed.reasoning,
          needsClarification: parsed.needs_clarification,
          clarificationQuestion: parsed.clarification_question,
          targetElements: parsed.target_elements,
          scope: parsed.scope,
        });
      } catch {
        // If parsing fails, use Sonnet for quality - don't downgrade to Haiku
        return NextResponse.json({
          classification: hasElement ? "edit_element" : "edit_general",
          model: "sonnet",
          endpoint: "/api/edit",
          maxTokens: 8192,
          confidence: 0.5,
          reasoning: "Router parsing fallback - using Sonnet for quality",
        });
      }
    }

    // Default fallback - use Sonnet for structural integrity
    return NextResponse.json({
      classification: hasElement ? "edit_element" : "edit_general",
      model: "sonnet",
      endpoint: "/api/edit",
      maxTokens: 8192,
      confidence: 0.5,
      reasoning: "Router fallback - using Sonnet",
    });
  } catch (error) {
    console.error("Router error:", error);
    // On error, use Sonnet - never downgrade to Haiku for unknown edits
    return NextResponse.json({
      classification: "edit_general",
      model: "sonnet",
      endpoint: "/api/edit",
      maxTokens: 8192,
      confidence: 0.3,
      reasoning: "Router error fallback - using Sonnet for safety",
    });
  }
}
