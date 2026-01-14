import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";

const SUGGESTIONS_PROMPT = `You are an expert web designer analyzing a website. Based on the current code, suggest 3-4 specific improvements.

## Output Format
Return a JSON array of suggestions. Each suggestion has:
- "label": Short action label (2-4 words, e.g., "Add hero animation")
- "prompt": Detailed prompt for the AI to execute (1-2 sentences)
- "category": One of "design", "content", "layout", "animation", "accessibility"

## Rules
- Focus on high-impact, visual improvements
- Be specific about what to change (mention specific sections, colors, or elements)
- Suggestions should be actionable and achievable
- Don't suggest adding functionality that doesn't exist
- Look at the actual content and suggest relevant improvements

## Example Output
[
  {"label": "Animate hero section", "prompt": "Add a fade-in animation to the hero section with staggered text reveals", "category": "animation"},
  {"label": "Improve contrast", "prompt": "Increase the contrast between the background and text in the features section for better readability", "category": "accessibility"}
]

Return ONLY the JSON array, no explanation or markdown.`;

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  try {
    const { existingFiles, projectName, apiKey: userApiKey } = await request.json();

    if (!existingFiles || existingFiles.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    const effectiveApiKey = userApiKey || apiKey;
    if (!effectiveApiKey) {
      return NextResponse.json({ suggestions: [] }); // Silently return empty if no key
    }

    const client = new Anthropic({ apiKey: effectiveApiKey });

    let userPrompt = SUGGESTIONS_PROMPT;

    // Add project context
    if (projectName) {
      userPrompt += `\n\n## Project: ${projectName}\n`;
    }

    // Add existing files for analysis
    userPrompt += "\n\n## Current Website Code\n";
    for (const file of existingFiles) {
      // Only include HTML/Astro/CSS files for analysis
      if (file.path.match(/\.(html|astro|css|tsx|jsx)$/)) {
        userPrompt += `\nFILE: ${file.path}\n\`\`\`\n${file.content.slice(0, 3000)}\n\`\`\`\n`;
      }
    }

    const response = await client.messages.create({
      model: "claude-haiku-3-5-20241022",
      max_tokens: 1024,
      messages: [{ role: "user", content: userPrompt }],
    });

    // Extract text content
    const textContent = response.content.find(c => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ suggestions: [] });
    }

    // Parse JSON response
    try {
      const suggestions = JSON.parse(textContent.text);
      return NextResponse.json({ suggestions: suggestions.slice(0, 4) });
    } catch {
      console.error("Failed to parse suggestions JSON:", textContent.text);
      return NextResponse.json({ suggestions: [] });
    }
  } catch (error) {
    console.error("Suggestions error:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
