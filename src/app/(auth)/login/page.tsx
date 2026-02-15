"use client";

import { createClient } from "@/lib/supabase/client";
import { Github } from "lucide-react";

export default function LoginPage() {
  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        scopes: "repo",
      },
    });
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight gradient-text">
          Boom
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          AI-powered website & deck builder
        </p>
      </div>

      <button
        onClick={handleLogin}
        className="flex items-center gap-3 w-full justify-center rounded-lg bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-all hover:bg-zinc-100 active:scale-[0.98]"
      >
        <Github className="h-5 w-5" />
        Continue with GitHub
      </button>

      <p className="text-xs text-muted-foreground text-center max-w-[280px]">
        We need repo access to create and manage your website projects.
      </p>
    </div>
  );
}
