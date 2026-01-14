"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { createProject } from "@/lib/github";
import { Sparkles, Loader2, CheckCircle, XCircle } from "lucide-react";
import { BuildMode } from "@/types/project";

type Step = "creating" | "success" | "error";

export default function CreatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("creating");
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const creationStarted = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    // Prevent double creation in React strict mode
    if (status === "authenticated" && session?.accessToken && !creationStarted.current) {
      creationStarted.current = true;
      createNewProject();
    }
  }, [status, session]);

  async function createNewProject() {
    const name = searchParams.get("name") || `site-${Math.random().toString(36).substring(2, 8)}`;
    const initialPrompt = sessionStorage.getItem("vibesites_initial_prompt");
    const buildMode = (sessionStorage.getItem("vibesites_build_mode") as BuildMode) || "design";

    if (!session?.accessToken) {
      setError("Not authenticated");
      setStep("error");
      return;
    }

    setProjectName(name);

    try {
      // Create the project on GitHub with selected build mode
      const project = await createProject(
        session.accessToken,
        name,
        initialPrompt?.slice(0, 100) || "Created with Vibesites",
        buildMode
      );

      setStep("success");

      // Clear build mode from storage (prompt and references will be handled by workspace)
      sessionStorage.removeItem("vibesites_build_mode");

      // Redirect to project with auto-generate flag
      setTimeout(() => {
        if (initialPrompt) {
          // Keep the prompt and references in session storage for the workspace to pick up
          router.push(`/project/${project.fullName}?autoGenerate=true`);
        } else {
          router.push(`/project/${project.fullName}`);
        }
      }, 1000);
    } catch (err) {
      console.error("Failed to create project:", err);
      setError(err instanceof Error ? err.message : "Failed to create project");
      setStep("error");
    }
  }

  return (
    <main className="min-h-screen bg-[#030306] text-white flex items-center justify-center">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-20 blur-[120px]"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.8) 0%, rgba(236,72,153,0.4) 50%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 text-center">
        {step === "creating" && (
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
              <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Creating your project</h1>
              <p className="text-zinc-400">Setting up {projectName || "your website"}...</p>
            </div>
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-2xl blur-xl opacity-30" />
              <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Project created!</h1>
              <p className="text-zinc-400">Redirecting to your workspace...</p>
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 rounded-2xl blur-xl opacity-30" />
              <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
              <p className="text-zinc-400 mb-4">{error}</p>
              <button
                onClick={() => router.push("/")}
                className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all"
              >
                Go back home
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
