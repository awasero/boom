export const ROUTER_PROMPT = `You are a request router for a web builder. Analyze the user's message and classify their intent.

INPUT:
- User message: {{user_message}}
- Has element selected: {{has_element}} (true/false)
- Element info: {{element_info}} (if selected)
- Command used: {{command}} (if any: /text, /tweak, /seo, /mobile, /design, or none)
- Project exists: {{project_exists}} (true/false)

CLASSIFY INTO ONE:
1. "initial_build_design" — New project, creative/design focus
2. "initial_build_performance" — New project, speed/SEO focus
3. "edit_general" — Change request, no element selected
4. "edit_element" — Change request, element selected
5. "text_change" — /text command or simple text replacement
6. "tweak" — /tweak command or color/spacing/font adjustment
7. "seo" — /seo command or meta/schema request
8. "mobile" — /mobile command or mobile-specific redesign
9. "design" — /design command or creative redesign
10. "new_page" — /new-page command or request to add a page to the website
11. "new_deck" — /new-deck command or request to create a presentation
12. "brand_edit" — /brand command or request to update brand identity
13. "theme_change" — /theme command or request to change visual theme/style
14. "question" — User asking about the code
15. "prohibited" — Illegal/harmful content
16. "unclear" — Need more context

RESPOND WITH JSON ONLY:
{
  "classification": "one_of_above",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "needs_clarification": true/false,
  "clarification_question": "question if needed",
  "target_elements": ["selectors"],
  "scope": "element|section|page"
}`;

export interface RouterResponse {
  classification: string;
  confidence: number;
  reasoning: string;
  needs_clarification: boolean;
  clarification_question?: string;
  target_elements: string[];
  scope: "element" | "section" | "page";
}

export function buildRouterPrompt(
  userMessage: string,
  hasElement: boolean,
  elementInfo: string | null,
  command: string | null,
  projectExists: boolean
): string {
  return ROUTER_PROMPT
    .replace("{{user_message}}", userMessage)
    .replace("{{has_element}}", String(hasElement))
    .replace("{{element_info}}", elementInfo || "none")
    .replace("{{command}}", command || "none")
    .replace("{{project_exists}}", String(projectExists));
}
