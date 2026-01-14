export type BuildMode = "design" | "performance";

export interface VibesitesConfig {
  version: string;
  createdAt: string;
  name: string;
  description?: string;
  template: "landing" | "portfolio" | "blog" | "custom";
  buildMode?: BuildMode;
  projectContext?: string;
  deployment?: {
    cloudflareProjectName?: string;
    customDomain?: string;
    lastDeployedAt?: string;
  };
  cms?: {
    enabled: boolean;
    collections?: string[];
  };
}

export interface Project {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  defaultBranch: string;
  updatedAt: string;
  isVibesitesProject: boolean;
  config?: VibesitesConfig;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export type ModelType = "opus" | "sonnet" | "haiku";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: GeneratedFile[];
  timestamp: Date;
  model?: ModelType;
  command?: string; // e.g., "/seo", "/mobile"
  routingReason?: string; // Why this model was selected
}

// Design reference presets
export interface DesignPreset {
  id: string;
  name: string;
  description: string;
  style: string; // CSS-like description for the AI
  icon: string;
}

// Design reference (URL to analyze)
export interface DesignReference {
  type: "url" | "preset";
  value: string; // URL or preset ID
  presetData?: DesignPreset;
}

// Design references for a message
export interface DesignReferences {
  urls: string[];
  presets: string[]; // Preset IDs
}

// Plugin/Command definition
export interface ChatCommand {
  name: string; // e.g., "seo", "mobile"
  description: string;
  model: ModelType; // Which model to use
  icon: string; // Icon name
}
