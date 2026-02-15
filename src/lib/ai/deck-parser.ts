import { DeckData, DeckSlide } from "@/types/project";

/**
 * Parse HTML deck output into DeckData JSON structure.
 * Extracts .slide elements from the generated HTML.
 */
export function htmlToDeckData(html: string, name: string): DeckData {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const slides = extractSlides(html);

  return {
    id: crypto.randomUUID(),
    name,
    slug,
    slides,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function extractSlides(html: string): DeckSlide[] {
  const slides: DeckSlide[] = [];

  // Match <div class="slide...">...</div> patterns
  // Using a simple regex approach since we're server-side without DOM
  const slideRegex =
    /<div\s+class="slide[^"]*"[^>]*>([\s\S]*?)(?=<div\s+class="slide|<\/div>\s*<\/div>\s*(?:<div\s+class="progress|<button|<script|$))/gi;

  let match;
  let order = 0;

  while ((match = slideRegex.exec(html)) !== null) {
    const content = match[1].trim();
    // Remove trailing </div> if present
    const cleanContent = content.replace(/\s*<\/div>\s*$/, "").trim();

    // Try to extract a title from h1/h2 elements
    const titleMatch = cleanContent.match(/<h[12][^>]*>(.*?)<\/h[12]>/i);
    const title = titleMatch
      ? titleMatch[1].replace(/<[^>]+>/g, "").trim()
      : `Slide ${order + 1}`;

    // Infer layout from content
    const layout = inferLayout(cleanContent, order);

    slides.push({
      id: crypto.randomUUID(),
      order,
      title,
      content: cleanContent,
      layout,
    });

    order++;
  }

  // Fallback: if regex didn't find slides, try a simpler split
  if (slides.length === 0) {
    const simpleSplits = html.split(/<div\s+class="slide/i);
    for (let i = 1; i < simpleSplits.length; i++) {
      const part = simpleSplits[i];
      // Find the content between > and the closing structure
      const contentStart = part.indexOf(">");
      if (contentStart === -1) continue;

      let content = part.slice(contentStart + 1);
      // Try to find a reasonable end point
      const endIdx = content.lastIndexOf("</div>");
      if (endIdx !== -1) {
        content = content.slice(0, endIdx).trim();
      }

      const titleMatch = content.match(/<h[12][^>]*>(.*?)<\/h[12]>/i);
      const title = titleMatch
        ? titleMatch[1].replace(/<[^>]+>/g, "").trim()
        : `Slide ${i}`;

      slides.push({
        id: crypto.randomUUID(),
        order: i - 1,
        title,
        content: content.trim(),
        layout: inferLayout(content, i - 1),
      });
    }
  }

  return slides;
}

function inferLayout(
  content: string,
  order: number
): DeckSlide["layout"] {
  if (order === 0) return "title";
  if (content.includes("<img")) return "image";
  if (
    content.includes("grid") ||
    content.includes("flex") ||
    content.includes("columns")
  )
    return "split";
  if (content.trim().length < 50) return "blank";
  return "content";
}
