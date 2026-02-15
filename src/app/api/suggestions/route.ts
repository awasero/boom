import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const SUGGESTIONS_PROMPT = `You are an expert web designer. Based on the current code, suggest 3-4 specific improvements.

Return a JSON array:
[
  {"label": "Short action (2-4 words)", "prompt": "Detailed instruction (1-2 sentences)", "category": "design|content|layout|animation|accessibility"}
]

Return ONLY the JSON array, no explanation.`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { existingFiles, projectName } = await request.json();
    if (!existingFiles?.length) return NextResponse.json({ suggestions: [] });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ suggestions: [] });

    const client = new Anthropic({ apiKey });
    let userPrompt = SUGGESTIONS_PROMPT;
    if (projectName) userPrompt += `\n\n## Project: ${projectName}\n`;
    userPrompt += "\n\n## Current Code\n";
    for (const file of existingFiles) {
      if (file.path.match(/\.(html|css|tsx|jsx)$/)) {
        userPrompt += `\nFILE: ${file.path}\n\`\`\`\n${file.content.slice(0, 3000)}\n\`\`\`\n`;
      }
    }

    const response = await client.messages.create({
      model: "claude-3-5-haiku-20241022", max_tokens: 1024,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textContent = response.content.find(c => c.type === "text");
    if (!textContent || textContent.type !== "text") return NextResponse.json({ suggestions: [] });

    try {
      const suggestions = JSON.parse(textContent.text);
      return NextResponse.json({ suggestions: suggestions.slice(0, 4) });
    } catch {
      return NextResponse.json({ suggestions: [] });
    }
  } catch (error) {
    console.error("Suggestions error:", error);
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}
