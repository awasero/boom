import Anthropic from "@anthropic-ai/sdk";
import { GeneratedFile, BuildMode } from "@/types/project";
import { SYSTEM_PROMPT } from "./prompts/system";

export function createClaudeClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

export interface GenerateOptions {
  apiKey: string;
  userMessage: string;
  existingFiles?: GeneratedFile[];
  projectContext?: string;
  projectName?: string;
  buildMode?: BuildMode;
  onStream?: (text: string) => void;
}

const PERFORMANCE_MODE_PROMPT = `
## Performance Mode Guidelines

You are in PERFORMANCE MODE. Generate **plain HTML/CSS/JS files** optimized for speed.

### File Format
Output files in this exact format:

FILE: index.html
\`\`\`html
<!DOCTYPE html>
<html>...</html>
\`\`\`

FILE: styles.css
\`\`\`css
/* styles */
\`\`\`

### Technical Stack
- **HTML5**: Semantic, accessible markup
- **CSS**: Custom styles + Tailwind via CDN (<script src="https://cdn.tailwindcss.com"></script>)
- **Minimal JavaScript**: Only essential JS, avoid client-side heavy logic

### Performance First Approach
Focus on:
- **Fast Load Times**: Minimal HTTP requests, small bundle sizes
- **No Heavy Animations**: Avoid CSS animations that cause layout shifts
- **System Fonts**: Use system font stacks (no custom font loading)
- **Optimized Images**: Proper sizing, lazy loading attributes
- **Mobile First**: Design for mobile, enhance for desktop
- **Lighthouse 95+**: Target excellent performance scores

Design Philosophy:
- Clean typography with system fonts
- Simple, high-contrast color schemes
- Straightforward navigation and layouts
- Content-focused, minimal visual distractions
- CSS-only interactions where possible (no JS for basic hover effects)
- Efficient CSS using Tailwind utilities

Avoid:
- Heavy JavaScript animations or libraries
- Custom web fonts (use system fonts)
- Complex interactive components
- Large unoptimized images
- Multiple CSS/JS files when one will do
- JavaScript for things CSS can handle

### File Structure
Keep it minimal:
- \`index.html\` - Main page (inline critical CSS if small)
- \`styles.css\` - Additional CSS (only if needed)
- \`script.js\` - Only if JavaScript is truly necessary

### Example Output

FILE: index.html
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site Name</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="styles.css">
</head>
<body class="font-sans antialiased">
  <header>...</header>
  <main>...</main>
  <footer>...</footer>
</body>
</html>
\`\`\`
`;

const DESIGN_MODE_PROMPT = `
## Design Mode Guidelines

You are in DESIGN MODE. Generate **plain HTML/CSS/JS files** with exceptional visual quality.

### File Format
Output files in this exact format:

FILE: index.html
\`\`\`html
<!DOCTYPE html>
<html>...</html>
\`\`\`

FILE: styles.css
\`\`\`css
/* styles */
\`\`\`

FILE: script.js
\`\`\`javascript
// scripts
\`\`\`

### Technical Stack
- **HTML5**: Semantic, accessible markup
- **CSS**: Custom styles + Tailwind via CDN (<script src="https://cdn.tailwindcss.com"></script>)
- **JavaScript**: Vanilla JS for rich interactions and animations
- **Google Fonts**: Use distinctive, memorable typography

### File Structure
Use flat structure for simplicity:
- \`index.html\` - Main page
- \`about.html\`, \`contact.html\` - Additional pages
- \`styles.css\` - Custom CSS (beyond Tailwind)
- \`script.js\` - JavaScript for interactions

### Design Philosophy
Focus on:
- **Visual Excellence**: Beautiful, memorable designs with attention to detail
- **Rich Interactions**: Smooth animations, hover effects, and micro-interactions
- **Custom Layouts**: Creative, unique layouts that stand out
- **Premium Feel**: High-end aesthetic with refined typography and spacing
- **Brand Expression**: Strong visual identity and cohesive design language
- **Distinctive Typography**: Use Google Fonts for unique character

You have full creative freedom to:
- Use advanced CSS features (grid, animations, transforms, @keyframes)
- Create complex multi-section layouts
- Add sophisticated hover states and interactions
- Implement scroll-triggered animations with IntersectionObserver
- Design custom UI components
- Use CSS custom properties for theming
- Add smooth page transitions
- Use gradient meshes, patterns, and textures

### Example Output

FILE: index.html
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site Name</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>...</header>
  <main>...</main>
  <footer>...</footer>
  <script src="script.js"></script>
</body>
</html>
\`\`\`
`;


export async function generateWebsite(
  options: GenerateOptions
): Promise<{ content: string; files: GeneratedFile[] }>;
export async function generateWebsite(
  apiKey: string,
  userMessage: string,
  existingFiles?: GeneratedFile[],
  onStream?: (text: string) => void
): Promise<{ content: string; files: GeneratedFile[] }>;
export async function generateWebsite(
  apiKeyOrOptions: string | GenerateOptions,
  userMessage?: string,
  existingFiles?: GeneratedFile[],
  onStream?: (text: string) => void
): Promise<{ content: string; files: GeneratedFile[] }> {
  // Handle both old and new signatures
  const options: GenerateOptions = typeof apiKeyOrOptions === 'string'
    ? { apiKey: apiKeyOrOptions, userMessage: userMessage!, existingFiles, onStream }
    : apiKeyOrOptions;

  const client = createClaudeClient(options.apiKey);

  let systemPrompt = SYSTEM_PROMPT;

  // Add build mode specific instructions
  if (options.buildMode === "performance") {
    systemPrompt += "\n" + PERFORMANCE_MODE_PROMPT;
  } else {
    systemPrompt += "\n" + DESIGN_MODE_PROMPT;
  }

  // Add project context if provided
  if (options.projectContext || options.projectName) {
    systemPrompt += "\n\n## Project Context\n";
    if (options.projectName) {
      systemPrompt += `**Project Name:** ${options.projectName}\n`;
    }
    if (options.projectContext) {
      systemPrompt += `**Description:** ${options.projectContext}\n`;
    }
    systemPrompt += "\nUse this context to inform your design decisions, content, and branding.\n";
  }

  if (options.existingFiles && options.existingFiles.length > 0) {
    systemPrompt += "\n\n## Current Project Files\n";
    systemPrompt += "These are the existing files in the project. Reference them when making changes.\n";
    for (const file of options.existingFiles) {
      systemPrompt += `\nFILE: ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n`;
    }
  }

  let fullContent = "";

  const stream = await client.messages.stream({
    model: "claude-opus-4-20250514",
    max_tokens: 16384,
    system: systemPrompt,
    messages: [{ role: "user", content: options.userMessage }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      fullContent += event.delta.text;
      options.onStream?.(fullContent);
    }
  }

  const files = parseGeneratedFiles(fullContent);

  return { content: fullContent, files };
}

export function parseGeneratedFiles(content: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const filePattern = /FILE:\s*([^\n]+)\n```(?:\w+)?\n([\s\S]*?)```/g;

  let match;
  while ((match = filePattern.exec(content)) !== null) {
    const path = match[1].trim();
    const fileContent = match[2].trim();

    if (path && fileContent) {
      files.push({ path, content: fileContent });
    }
  }

  return files;
}

export function validateApiKey(apiKey: string): boolean {
  return apiKey.startsWith("sk-ant-") && apiKey.length > 20;
}
