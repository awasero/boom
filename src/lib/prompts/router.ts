export const ROUTER_PROMPT = `You are a request router for a web builder. Analyze the user's message and classify their intent.

INPUT:
- User message: {{user_message}}
- Has element selected: {{has_element}} (true/false)
- Element info: {{element_info}} (if selected)
- Command used: {{command}} (if any: /text, /tweak, /seo, /mobile, /design, or none)
- Project exists: {{project_exists}} (true/false)

CLASSIFY INTO ONE:

1. "initial_build_design" — New project request, user wants creative/design focus
2. "initial_build_performance" — New project request, user wants speed/SEO focus
3. "edit_general" — Change request, no element selected, no command
4. "edit_element" — Change request, element selected, no command
5. "text_change" — /text command OR simple text replacement request
6. "tweak" — /tweak command OR color/spacing/font adjustment request
7. "seo" — /seo command OR meta/schema/structured data request
8. "mobile" — /mobile command OR mobile-specific redesign request
9. "design" — /design command OR creative/section redesign request
10. "question" — User asking about the code, not requesting changes
11. "prohibited" — Illegal content, harmful activities, adult content
12. "unclear" — Need more context to proceed

RESPOND WITH JSON ONLY:
{
  "classification": "one_of_above",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "needs_clarification": true/false,
  "clarification_question": "question if needed",
  "target_elements": ["selectors or descriptions of elements to modify"],
  "scope": "element|section|page"
}`;

export interface RouterResponse {
  classification:
    | "initial_build_design"
    | "initial_build_performance"
    | "edit_general"
    | "edit_element"
    | "text_change"
    | "tweak"
    | "seo"
    | "mobile"
    | "design"
    | "question"
    | "prohibited"
    | "unclear";
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
