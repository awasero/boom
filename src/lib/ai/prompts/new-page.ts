import { GLOBAL_RULES } from "./global-rules";

export const NEW_PAGE_PROMPT = `You are adding a new page to an existing website. Match the design system, layout patterns, and code style of the existing pages exactly.

PROJECT: {{project_name}}

## Existing Site Files
{{files}}

## User Request
{{user_message}}

## Rules
1. MATCH the existing design system exactly — same colors, fonts, spacing, shadows
2. REUSE the same header/nav/footer from existing pages
3. Create a complete HTML file for the new page
4. Update navigation links in ALL existing pages to include the new page
5. Use the same CSS approach (inline styles, linked stylesheet, etc.)
6. Page should feel like a natural part of the existing site

## Output
Output ALL modified files (existing pages with updated nav + new page) using the FILE: format.

${GLOBAL_RULES}`;

export function buildNewPagePrompt(
  projectName: string,
  files: string,
  userMessage: string
): string {
  return NEW_PAGE_PROMPT
    .replace("{{project_name}}", projectName)
    .replace("{{files}}", files)
    .replace("{{user_message}}", userMessage);
}
