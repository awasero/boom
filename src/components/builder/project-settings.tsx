"use client";

import { useState, useEffect } from "react";
import { VibesitesConfig } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Loader2,
  Settings2,
  Sparkles,
  Save,
  Info,
} from "lucide-react";

interface ProjectSettingsProps {
  config: VibesitesConfig | null;
  onSave: (context: string) => Promise<void>;
  projectName: string;
}

export function ProjectSettings({
  config,
  onSave,
  projectName,
}: ProjectSettingsProps) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState(config?.projectContext || "");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (config?.projectContext !== undefined) {
      setContext(config.projectContext);
    }
  }, [config?.projectContext]);

  useEffect(() => {
    setHasChanges(context !== (config?.projectContext || ""));
  }, [context, config?.projectContext]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(context);
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 gap-1.5"
        >
          <Settings2 className="h-4 w-4" />
          Context
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-[#111113] border-zinc-800/50 w-[400px] sm:w-[540px]">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <SheetTitle className="text-white">Project Context</SheetTitle>
              <SheetDescription className="text-zinc-400">
                Help Claude understand your project
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Project Info */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-violet-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-zinc-300 font-medium mb-1">
                  What is project context?
                </p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Project context helps Claude understand what you are building.
                  Include details about your brand, target audience, preferred style,
                  colors, or any specific requirements. Claude uses this information
                  in every response to maintain consistency.
                </p>
              </div>
            </div>
          </div>

          {/* Project Name */}
          <div className="space-y-2">
            <Label className="text-zinc-300 text-sm">Project Name</Label>
            <div className="px-3 py-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50 text-zinc-400 text-sm">
              {projectName}
            </div>
          </div>

          {/* Context Input */}
          <div className="space-y-2">
            <Label htmlFor="context" className="text-zinc-300 text-sm">
              Project Description & Context
            </Label>
            <Textarea
              id="context"
              placeholder="Example: This is a website for 'Bean & Brew', a modern coffee shop in San Francisco. Target audience is young professionals aged 25-40. Brand colors are warm brown (#8B4513) and cream. Style should be minimalist and inviting with photography-focused design. Key features: menu, location/hours, and online ordering..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="
                min-h-[200px] resize-none
                bg-zinc-900/50 border-zinc-700/50
                text-white placeholder:text-zinc-600
                focus:border-violet-500/50 focus:ring-violet-500/20
                rounded-xl text-sm leading-relaxed
              "
            />
            <p className="text-[11px] text-zinc-500">
              Be as detailed as possible. This context is sent with every message to Claude.
            </p>
          </div>

          {/* Example Prompts */}
          <div className="space-y-2">
            <Label className="text-zinc-300 text-sm">Quick prompts</Label>
            <div className="flex flex-wrap gap-2">
              {[
                "Modern SaaS",
                "E-commerce store",
                "Portfolio site",
                "Restaurant/cafe",
                "Agency website",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() =>
                    setContext(
                      context
                        ? `${context}\n\nStyle: ${prompt}`
                        : `Style: ${prompt}`
                    )
                  }
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50 border border-zinc-700/50 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {hasChanges ? "Save Context" : "Saved"}
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
