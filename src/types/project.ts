export type BuildMode = "design" | "performance";
export type ModelType = "opus" | "sonnet" | "haiku";
export type EditorTab = "website" | "decks";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  github_repo: string;
  github_owner: string;
  brand_nucleus: BrandNucleus | null;
  cloudflare_project_id: string | null;
  deploy_url: string | null;
  deploy_status: "idle" | "building" | "deployed" | "failed";
  created_at: string;
  updated_at: string;
}

export interface DeckSlide {
  id: string;
  order: number;
  title: string;
  content: string;
  notes?: string;
  layout: "title" | "content" | "split" | "image" | "blank";
}

export interface DeckData {
  id: string;
  name: string;
  slug: string;
  slides: DeckSlide[];
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: GeneratedFile[];
  timestamp: Date;
  model?: ModelType;
  command?: string;
  routingReason?: string;
}

export interface BrandNucleus {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: { primary: string; secondary: string; inverse: string };
  };
  typography: {
    heading: { family: string; weights: string[] };
    body: { family: string; weights: string[] };
  };
  spacing: { unit: number; scale: number[] };
  borderRadius: { sm: string; md: string; lg: string };
  voice: { tone: string; personality: string[] };
}

export interface ElementContext {
  selector: string;
  parent: string;
  section: string;
  text: string;
  html: string;
}

export interface DesignPreset {
  id: string;
  name: string;
  description: string;
  style: string;
  icon: string;
}

export interface ChatCommand {
  name: string;
  description: string;
  model: ModelType;
  icon: string;
}

export interface DesignSystem {
  colors: string;
  fonts: string;
  spacing: string;
  borderRadius: string;
  aesthetic: string;
  texturesShadowsEffects: string;
}
