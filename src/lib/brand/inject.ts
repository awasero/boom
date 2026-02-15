import { BrandNucleus } from "@/types/project";

export function injectBrandContext(brand: BrandNucleus): string {
  return `
## Brand Design System (MUST follow these tokens)

### Colors
- Primary: ${brand.colors.primary}
- Secondary: ${brand.colors.secondary}
- Accent: ${brand.colors.accent}
- Background: ${brand.colors.background}
- Surface: ${brand.colors.surface}
- Text Primary: ${brand.colors.text.primary}
- Text Secondary: ${brand.colors.text.secondary}

### Typography
- Headings: ${brand.typography.heading.family} (weights: ${brand.typography.heading.weights.join(", ")})
- Body: ${brand.typography.body.family} (weights: ${brand.typography.body.weights.join(", ")})

### Spacing
- Base unit: ${brand.spacing.unit}px
- Scale: ${brand.spacing.scale.join(", ")}

### Border Radius
- Small: ${brand.borderRadius.sm}
- Medium: ${brand.borderRadius.md}
- Large: ${brand.borderRadius.lg}

### Voice & Tone
- Tone: ${brand.voice.tone}
- Personality: ${brand.voice.personality.join(", ")}

IMPORTANT: Use these exact design tokens in all generated code. Match the brand colors, fonts, and spacing precisely.
`.trim();
}
