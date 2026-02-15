import { GLOBAL_RULES } from "./global-rules";

export const TEXT_COMMAND_PROMPT = `You are doing a simple text replacement. Output a friendly message and PATCH.

TARGET ELEMENT:
- Selector: {{selector}}
- Current text: "{{current_text}}"
- HTML: {{element_html}}

REQUEST: {{user_message}}

## OUTPUT FORMAT

PATCH:
\`\`\`
FIND:
<the exact original HTML line>
REPLACE:
<the same HTML with only the text changed>
\`\`\`

## RULES
- Start with a friendly confirmation message
- The FIND must match the original EXACTLY
- NEVER change classes, attributes, or structure`;

export const TWEAK_COMMAND_PROMPT = `You are making a simple style adjustment. Output a friendly message and PATCH.

TARGET ELEMENT:
- Selector: {{selector}}
- HTML: {{element_html}}

DESIGN CONTEXT:
- Colors: {{colors}}
- Fonts: {{fonts}}
- Spacing: {{spacing}}

REQUEST: {{user_message}}

## OUTPUT FORMAT

PATCH:
\`\`\`
FIND:
<the exact original HTML element>
REPLACE:
<the element with style change applied>
\`\`\`

## RULES
- Start with a friendly confirmation message
- Keep ALL existing classes - only modify the relevant ones`;

export const SEO_COMMAND_PROMPT = `You are an SEO specialist optimizing a web page for search visibility.

PROJECT: {{project_name}}

CURRENT FILES:
{{files}}

USER REQUEST:
{{user_message}}

YOUR TASK:
1. Audit current SEO elements
2. Identify the page type for structured data
3. Implement missing elements

OUTPUT FORMAT:
**SEO Audit:**
- Status of title, meta description, JSON-LD, heading hierarchy

**Changes made:**
- List of changes

FILE: index.html
\`\`\`html
(complete file with SEO improvements)
\`\`\`

${GLOBAL_RULES}`;

export const MOBILE_COMMAND_PROMPT = `You are a mobile-first specialist optimizing a web page for mobile devices.

PROJECT: {{project_name}}
TARGET: {{target_section}}

CURRENT DESIGN SYSTEM:
- Colors: {{colors}}
- Fonts: {{fonts}}
- Aesthetic: {{aesthetic}}
- Spacing: {{spacing}}

CURRENT FILES:
{{files}}

USER REQUEST:
{{user_message}}

Apply mobile-first principles: 44px touch targets, 16px min font, responsive layout.
MAINTAIN DESIGN CONSISTENCY — same colors, fonts, aesthetic.

FILE: {{filename}}
\`\`\`html
(file with mobile optimizations)
\`\`\`

${GLOBAL_RULES}`;

export const DESIGN_COMMAND_PROMPT = `You are a creative frontend designer enhancing a web page with distinctive design.

PROJECT: {{project_name}}
TARGET: {{target_section}}

CURRENT DESIGN SYSTEM:
- Colors: {{colors}}
- Fonts: {{fonts}}
- Aesthetic: {{aesthetic}}
- Spacing: {{spacing}}
- Visual details: {{textures_shadows_effects}}

CURRENT FILES:
{{files}}

USER REQUEST:
{{user_message}}

Push the aesthetic FURTHER, don't fight it. DESIGN CONSISTENCY IS NON-NEGOTIABLE.

FILE: {{filename}}
\`\`\`html
(file with creative enhancements)
\`\`\`

${GLOBAL_RULES}`;

export const THEME_COMMAND_PROMPT = `You are a theme specialist modifying the visual style of a web page.

PROJECT: {{project_name}}

CURRENT FILES:
{{files}}

USER REQUEST:
{{user_message}}

YOUR TASK:
1. Analyze the current theme/style
2. Apply the requested theme changes across ALL files
3. Maintain structural consistency — only change visual properties

Focus on: colors, fonts, gradients, shadows, border-radius, spacing, and overall aesthetic.
Ensure changes are applied consistently across all pages.

FILE: {{filename}}
\`\`\`html
(file with theme changes)
\`\`\`

${GLOBAL_RULES}`;

export function buildThemeCommandPrompt(
  projectName: string,
  files: string,
  userMessage: string
): string {
  return THEME_COMMAND_PROMPT
    .replace("{{project_name}}", projectName)
    .replace("{{files}}", files)
    .replace("{{user_message}}", userMessage);
}

export interface DesignSystem {
  colors: string;
  fonts: string;
  spacing: string;
  borderRadius: string;
  aesthetic: string;
  texturesShadowsEffects: string;
}

export function buildTextCommandPrompt(
  selector: string,
  currentText: string,
  elementHtml: string,
  userMessage: string
): string {
  return TEXT_COMMAND_PROMPT
    .replace("{{selector}}", selector)
    .replace("{{current_text}}", currentText)
    .replace("{{element_html}}", elementHtml)
    .replace("{{user_message}}", userMessage);
}

export function buildTweakCommandPrompt(
  selector: string,
  elementHtml: string,
  designSystem: DesignSystem,
  userMessage: string
): string {
  return TWEAK_COMMAND_PROMPT
    .replace("{{selector}}", selector)
    .replace("{{element_html}}", elementHtml)
    .replace("{{colors}}", designSystem.colors || "Not extracted")
    .replace("{{fonts}}", designSystem.fonts || "Not extracted")
    .replace("{{spacing}}", designSystem.spacing || "Not extracted")
    .replace("{{user_message}}", userMessage);
}

export function buildSeoCommandPrompt(
  projectName: string,
  files: string,
  userMessage: string
): string {
  return SEO_COMMAND_PROMPT
    .replace("{{project_name}}", projectName)
    .replace("{{files}}", files)
    .replace("{{user_message}}", userMessage);
}

export function buildMobileCommandPrompt(
  projectName: string,
  targetSection: string,
  designSystem: DesignSystem,
  files: string,
  userMessage: string
): string {
  return MOBILE_COMMAND_PROMPT
    .replace("{{project_name}}", projectName)
    .replace("{{target_section}}", targetSection || "entire page")
    .replace("{{colors}}", designSystem.colors || "Not extracted")
    .replace("{{fonts}}", designSystem.fonts || "Not extracted")
    .replace("{{aesthetic}}", designSystem.aesthetic || "Not extracted")
    .replace("{{spacing}}", designSystem.spacing || "Not extracted")
    .replace("{{files}}", files)
    .replace("{{user_message}}", userMessage);
}

export function buildDesignCommandPrompt(
  projectName: string,
  targetSection: string,
  designSystem: DesignSystem,
  files: string,
  userMessage: string
): string {
  return DESIGN_COMMAND_PROMPT
    .replace("{{project_name}}", projectName)
    .replace("{{target_section}}", targetSection || "entire page")
    .replace("{{colors}}", designSystem.colors || "Not extracted")
    .replace("{{fonts}}", designSystem.fonts || "Not extracted")
    .replace("{{aesthetic}}", designSystem.aesthetic || "Not extracted")
    .replace("{{spacing}}", designSystem.spacing || "Not extracted")
    .replace("{{textures_shadows_effects}}", designSystem.texturesShadowsEffects || "Not extracted")
    .replace("{{files}}", files)
    .replace("{{user_message}}", userMessage);
}
