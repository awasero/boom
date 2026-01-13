export type BuildMode = "opus" | "astro";

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

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: GeneratedFile[];
  timestamp: Date;
}
