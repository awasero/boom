import Anthropic from "@anthropic-ai/sdk";
import { BrandNucleus } from "@/types/project";
import { brandNucleusSchema } from "./schema";

export async function extractBrandFromCode(filesContent: string): Promise<BrandNucleus | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Analyze this code and extract the brand design system tokens. Return ONLY a JSON object matching this exact structure (no other text):

{
  "colors": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "surface": "#hex", "text": { "primary": "#hex", "secondary": "#hex", "inverse": "#hex" } },
  "typography": { "heading": { "family": "FontName", "weights": ["600", "700"] }, "body": { "family": "FontName", "weights": ["400", "500"] } },
  "spacing": { "unit": 4, "scale": [0, 4, 8, 12, 16, 24, 32, 48, 64] },
  "borderRadius": { "sm": "0.375rem", "md": "0.75rem", "lg": "1rem" },
  "voice": { "tone": "describe the tone", "personality": ["trait1", "trait2", "trait3"] }
}

Code to analyze:
${filesContent.slice(0, 8000)}`
    }],
  });

  const textContent = response.content.find(c => c.type === "text");
  if (!textContent || textContent.type !== "text") return null;

  try {
    // Extract JSON from the response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    const validated = brandNucleusSchema.parse(parsed);
    return validated;
  } catch {
    return null;
  }
}
