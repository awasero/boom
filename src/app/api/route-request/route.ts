import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildRouterPrompt, RouterResponse } from "@/lib/ai/prompts/router";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prompt, hasExistingFiles, hasElement, elementInfo, command } = await request.json();

    // Direct routing for new projects
    if (!hasExistingFiles && !command) {
      const lowerPrompt = prompt.toLowerCase();
      const isPerf = ["fast", "performance", "seo", "speed", "lightweight", "simple"].some(w => lowerPrompt.includes(w));
      return NextResponse.json({
        classification: isPerf ? "initial_build_performance" : "initial_build_design",
        model: "opus",
        endpoint: "/api/generate",
        confidence: 0.9,
      });
    }

    // Direct routing for explicit commands
    if (command) {
      const routes: Record<string, { classification: string; model: string; endpoint: string; maxTokens: number }> = {
        text: { classification: "text_change", model: "haiku", endpoint: "/api/quick", maxTokens: 2048 },
        tweak: { classification: "tweak", model: "haiku", endpoint: "/api/quick", maxTokens: 2048 },
        seo: { classification: "seo", model: "sonnet", endpoint: "/api/seo", maxTokens: 8192 },
        mobile: { classification: "mobile", model: "sonnet", endpoint: "/api/mobile", maxTokens: 8192 },
        design: { classification: "design", model: "sonnet", endpoint: "/api/design", maxTokens: 8192 },
      };
      const route = routes[command];
      if (route) {
        return NextResponse.json({ ...route, confidence: 1.0 });
      }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        classification: hasElement ? "edit_element" : "edit_general",
        model: "sonnet", endpoint: "/api/edit", maxTokens: 8192, confidence: 0.7,
      });
    }

    // Use Sonnet for intelligent routing
    const client = new Anthropic({ apiKey });
    const routerPrompt = buildRouterPrompt(prompt, hasElement, elementInfo || null, command || null, hasExistingFiles);

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      messages: [{ role: "user", content: routerPrompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      try {
        let jsonText = content.text.trim();
        if (jsonText.startsWith("```")) {
          jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
        }
        const parsed: RouterResponse = JSON.parse(jsonText);

        const routeMap: Record<string, { model: string; endpoint: string; maxTokens: number }> = {
          initial_build_design: { model: "opus", endpoint: "/api/generate", maxTokens: 16384 },
          initial_build_performance: { model: "opus", endpoint: "/api/generate", maxTokens: 16384 },
          edit_general: { model: "sonnet", endpoint: "/api/edit", maxTokens: 8192 },
          edit_element: { model: "sonnet", endpoint: "/api/edit", maxTokens: 8192 },
          text_change: { model: "haiku", endpoint: "/api/quick", maxTokens: 2048 },
          tweak: { model: "haiku", endpoint: "/api/quick", maxTokens: 2048 },
          seo: { model: "sonnet", endpoint: "/api/seo", maxTokens: 8192 },
          mobile: { model: "sonnet", endpoint: "/api/mobile", maxTokens: 8192 },
          design: { model: "sonnet", endpoint: "/api/design", maxTokens: 8192 },
          question: { model: "sonnet", endpoint: "/api/edit", maxTokens: 4096 },
          prohibited: { model: "sonnet", endpoint: "/api/edit", maxTokens: 1024 },
          unclear: { model: "sonnet", endpoint: "/api/edit", maxTokens: 4096 },
        };

        const route = routeMap[parsed.classification] || { model: "sonnet", endpoint: "/api/edit", maxTokens: 8192 };
        return NextResponse.json({
          classification: parsed.classification,
          ...route,
          confidence: parsed.confidence,
          reasoning: parsed.reasoning,
          needsClarification: parsed.needs_clarification,
          clarificationQuestion: parsed.clarification_question,
        });
      } catch {
        return NextResponse.json({
          classification: hasElement ? "edit_element" : "edit_general",
          model: "sonnet", endpoint: "/api/edit", maxTokens: 8192, confidence: 0.5,
        });
      }
    }

    return NextResponse.json({
      classification: "edit_general",
      model: "sonnet", endpoint: "/api/edit", maxTokens: 8192, confidence: 0.5,
    });
  } catch (error) {
    console.error("Router error:", error);
    return NextResponse.json({
      classification: "edit_general",
      model: "sonnet", endpoint: "/api/edit", maxTokens: 8192, confidence: 0.3,
    });
  }
}
