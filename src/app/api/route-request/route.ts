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
    if (command) {
      const commandRoutes: Record<
        string,
        { classification: string; model: string; endpoint: string }
      > = {
        text: {
          classification: "text_change",
          model: "haiku",
          endpoint: "/api/quick",
        },
        tweak: {
          classification: "tweak",
          model: "haiku",
          endpoint: "/api/quick",
        },
        seo: {
          classification: "seo",
          model: "sonnet",
          endpoint: "/api/seo",
        },
        mobile: {
          classification: "mobile",
          model: "sonnet",
          endpoint: "/api/mobile",
        },
        design: {
          classification: "design",
          model: "sonnet",
          endpoint: "/api/design",
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
      // Default to haiku for edits if no API key for routing
      return NextResponse.json({
        classification: hasElement ? "edit_element" : "edit_general",
        model: "haiku",
        endpoint: "/api/quick",
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
        const routeMap: Record<
          string,
          { model: string; endpoint: string }
        > = {
          initial_build_design: { model: "opus", endpoint: "/api/generate" },
          initial_build_performance: { model: "opus", endpoint: "/api/generate" },
          edit_general: { model: "haiku", endpoint: "/api/quick" },
          edit_element: { model: "haiku", endpoint: "/api/quick" },
          text_change: { model: "haiku", endpoint: "/api/quick" },
          tweak: { model: "haiku", endpoint: "/api/quick" },
          seo: { model: "sonnet", endpoint: "/api/seo" },
          mobile: { model: "sonnet", endpoint: "/api/mobile" },
          design: { model: "sonnet", endpoint: "/api/design" },
          question: { model: "haiku", endpoint: "/api/quick" },
          prohibited: { model: "haiku", endpoint: "/api/quick" },
          unclear: { model: "haiku", endpoint: "/api/quick" },
        };

        const route = routeMap[parsed.classification] || {
          model: "haiku",
          endpoint: "/api/quick",
        };

        return NextResponse.json({
          classification: parsed.classification,
          model: route.model,
          endpoint: route.endpoint,
          confidence: parsed.confidence,
          reasoning: parsed.reasoning,
          needsClarification: parsed.needs_clarification,
          clarificationQuestion: parsed.clarification_question,
          targetElements: parsed.target_elements,
          scope: parsed.scope,
        });
      } catch {
        // If parsing fails, default based on element selection
        return NextResponse.json({
          classification: hasElement ? "edit_element" : "edit_general",
          model: "haiku",
          endpoint: "/api/quick",
          confidence: 0.5,
          reasoning: "Router parsing fallback",
        });
      }
    }

    return NextResponse.json({
      classification: hasElement ? "edit_element" : "edit_general",
      model: "haiku",
      endpoint: "/api/quick",
      confidence: 0.5,
      reasoning: "Router fallback",
    });
  } catch (error) {
    console.error("Router error:", error);
    // On error, default to haiku for edits
    return NextResponse.json({
      classification: "edit_general",
      model: "haiku",
      endpoint: "/api/quick",
      confidence: 0.3,
      reasoning: "Router error fallback",
    });
  }
}
