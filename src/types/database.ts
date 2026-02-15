export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          github_username: string | null;
          github_access_token: string | null;
          anthropic_api_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          github_username?: string | null;
          github_access_token?: string | null;
          anthropic_api_key?: string | null;
        };
        Update: {
          email?: string;
          github_username?: string | null;
          github_access_token?: string | null;
          anthropic_api_key?: string | null;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          github_repo: string;
          github_owner: string;
          brand_nucleus: Record<string, unknown> | null;
          cloudflare_project_id: string | null;
          deploy_url: string | null;
          deploy_status: "idle" | "building" | "deployed" | "failed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          github_repo: string;
          github_owner: string;
          brand_nucleus?: Record<string, unknown> | null;
          cloudflare_project_id?: string | null;
          deploy_url?: string | null;
          deploy_status?: "idle" | "building" | "deployed" | "failed";
        };
        Update: {
          name?: string;
          description?: string | null;
          brand_nucleus?: Record<string, unknown> | null;
          cloudflare_project_id?: string | null;
          deploy_url?: string | null;
          deploy_status?: "idle" | "building" | "deployed" | "failed";
        };
      };
      conversations: {
        Row: {
          id: string;
          project_id: string;
          messages: Record<string, unknown>[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          messages?: Record<string, unknown>[];
        };
        Update: {
          messages?: Record<string, unknown>[];
        };
      };
    };
  };
}
