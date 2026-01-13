"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProject } from "@/lib/github";
import { Loader2, Plus, Sparkles, Zap, Palette, Check } from "lucide-react";
import { BuildMode } from "@/types/project";

export function CreateProjectDialog() {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [buildMode, setBuildMode] = useState<BuildMode>("opus");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!session?.accessToken || !name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const project = await createProject(
        session.accessToken,
        name.trim().toLowerCase().replace(/\s+/g, "-"),
        description.trim(),
        buildMode
      );

      setOpen(false);
      setName("");
      setDescription("");
      setBuildMode("opus");
      router.push(`/project/${project.fullName}`);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create project. The repository name might already exist."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white shadow-lg shadow-violet-500/20">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#111113] border-zinc-800/50">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <DialogTitle className="text-white">Create new project</DialogTitle>
              <DialogDescription className="text-zinc-400">
                This will create a new GitHub repository with an Astro template.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-300">Project name</Label>
            <Input
              id="name"
              placeholder="my-awesome-website"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:ring-violet-500/20"
            />
            <p className="text-xs text-zinc-500">
              This will be your repository name (lowercase, no spaces)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-zinc-300">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="A beautiful website for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
              className="bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:ring-violet-500/20"
            />
          </div>

          {/* Build Mode Selection */}
          <div className="space-y-3">
            <Label className="text-zinc-300">Build mode</Label>
            <div className="grid grid-cols-2 gap-3">
              {/* Opus Mode */}
              <button
                type="button"
                onClick={() => setBuildMode("opus")}
                disabled={loading}
                className={`
                  relative p-4 rounded-xl border-2 text-left transition-all
                  ${buildMode === "opus"
                    ? "border-violet-500 bg-violet-500/10"
                    : "border-zinc-700/50 bg-zinc-900/30 hover:border-zinc-600"
                  }
                `}
              >
                {buildMode === "opus" && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-violet-400" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${buildMode === "opus" ? "bg-violet-500/20" : "bg-zinc-800"}`}>
                    <Palette className={`h-4 w-4 ${buildMode === "opus" ? "text-violet-400" : "text-zinc-400"}`} />
                  </div>
                  <span className={`font-semibold ${buildMode === "opus" ? "text-violet-300" : "text-zinc-300"}`}>
                    Opus Design
                  </span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Full creative control with Claude Opus. Rich designs, animations, and custom layouts.
                </p>
              </button>

              {/* Astro Mode */}
              <button
                type="button"
                onClick={() => setBuildMode("astro")}
                disabled={loading}
                className={`
                  relative p-4 rounded-xl border-2 text-left transition-all
                  ${buildMode === "astro"
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-zinc-700/50 bg-zinc-900/30 hover:border-zinc-600"
                  }
                `}
              >
                {buildMode === "astro" && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-emerald-400" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${buildMode === "astro" ? "bg-emerald-500/20" : "bg-zinc-800"}`}>
                    <Zap className={`h-4 w-4 ${buildMode === "astro" ? "text-emerald-400" : "text-zinc-400"}`} />
                  </div>
                  <span className={`font-semibold ${buildMode === "astro" ? "text-emerald-300" : "text-zinc-300"}`}>
                    Astro Speed
                  </span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Optimized for performance. Clean, minimal Astro templates with fast load times.
                </p>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Project"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
