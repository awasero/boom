export interface BooVibeConfig {
  version: string;
  createdAt: string;
  name: string;
  description?: string;
  template: "landing" | "portfolio" | "blog" | "custom";
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
  isBooVibeProject: boolean;
  config?: BooVibeConfig;
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
