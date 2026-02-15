import { z } from "zod";

export const brandNucleusSchema = z.object({
  colors: z.object({
    primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    surface: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    text: z.object({
      primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      inverse: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    }),
  }),
  typography: z.object({
    heading: z.object({ family: z.string(), weights: z.array(z.string()) }),
    body: z.object({ family: z.string(), weights: z.array(z.string()) }),
  }),
  spacing: z.object({ unit: z.number(), scale: z.array(z.number()) }),
  borderRadius: z.object({ sm: z.string(), md: z.string(), lg: z.string() }),
  voice: z.object({ tone: z.string(), personality: z.array(z.string()) }),
});

export type BrandNucleusInput = z.infer<typeof brandNucleusSchema>;

export const DEFAULT_BRAND: BrandNucleusInput = {
  colors: {
    primary: "#7c3aed",
    secondary: "#1e1b4b",
    accent: "#06b6d4",
    background: "#0a0a0b",
    surface: "#0f0f11",
    text: { primary: "#fafafa", secondary: "#a1a1aa", inverse: "#0a0a0b" },
  },
  typography: {
    heading: { family: "Inter", weights: ["600", "700"] },
    body: { family: "Inter", weights: ["400", "500"] },
  },
  spacing: { unit: 4, scale: [0, 4, 8, 12, 16, 24, 32, 48, 64] },
  borderRadius: { sm: "0.375rem", md: "0.75rem", lg: "1rem" },
  voice: { tone: "Professional yet approachable", personality: ["Confident", "Clear", "Helpful"] },
};
