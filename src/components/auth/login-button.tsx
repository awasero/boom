"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export function LoginButton() {
  return (
    <Button
      onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
      size="lg"
      className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white border-0 shadow-lg shadow-violet-500/20"
    >
      <Github className="h-5 w-5" />
      Sign in with GitHub
    </Button>
  );
}
