"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Sparkles,
  Zap,
  Palette,
  Check,
  ArrowRight,
  Layers,
  X,
  Link,
  Minimize2,
  Square,
  Hexagon,
  Grid3X3,
  Leaf,
  Gem,
  Circle,
  Brush,
} from "lucide-react";
import { BuildMode, DesignPreset, DesignReferences } from "@/types/project";

// Design presets matching chat-panel.tsx
const DESIGN_PRESETS: DesignPreset[] = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean, whitespace-focused",
    style: "Maximum whitespace, DM Sans or Satoshi font, off-white #FAFAFA, charcoal #1a1a1a",
    icon: "Minimize2",
  },
  {
    id: "brutalist",
    name: "Brutalist",
    description: "Raw, bold, unconventional",
    style: "JetBrains Mono, thick borders (4px+), no border-radius, jarring color combos",
    icon: "Square",
  },
  {
    id: "glassmorphism",
    name: "Glass",
    description: "Frosted glass effects",
    style: "backdrop-blur-xl, rgba backgrounds, Plus Jakarta Sans, gradient accents",
    icon: "Hexagon",
  },
  {
    id: "neubrutalism",
    name: "Neubrutalism",
    description: "Bold colors, thick borders",
    style: "Bright saturated colors, thick black borders, offset box-shadows, Syne font",
    icon: "Grid3X3",
  },
  {
    id: "organic",
    name: "Organic",
    description: "Natural shapes, earthy tones",
    style: "Blob shapes, earthy palette (forest, terracotta, cream), Fraunces serif",
    icon: "Leaf",
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Elegant, refined, premium",
    style: "Deep dark backgrounds, gold accents, Playfair Display, subtle animations",
    icon: "Gem",
  },
  {
    id: "retro",
    name: "Retro",
    description: "90s/Y2K aesthetic",
    style: "Neon colors, geometric shapes, VT323 pixel fonts, gradient backgrounds",
    icon: "Circle",
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Magazine-style layout",
    style: "Newsreader serif, 96px+ headlines, multi-column layouts, muted palette",
    icon: "Brush",
  },
];

const SAMPLE_PROMPTS = [
  { label: "Portfolio", prompt: "A minimal portfolio for a photographer with a dark theme" },
  { label: "Landing", prompt: "A modern SaaS landing page with hero, features, and pricing" },
  { label: "Restaurant", prompt: "An elegant restaurant website with menu and reservations" },
  { label: "Agency", prompt: "A creative agency site with case studies and bold typography" },
];

// Helper to get preset icon
function PresetIcon({ icon, className }: { icon: string; className?: string }) {
  switch (icon) {
    case "Minimize2": return <Minimize2 className={className} />;
    case "Square": return <Square className={className} />;
    case "Hexagon": return <Hexagon className={className} />;
    case "Grid3X3": return <Grid3X3 className={className} />;
    case "Leaf": return <Leaf className={className} />;
    case "Gem": return <Gem className={className} />;
    case "Circle": return <Circle className={className} />;
    case "Brush": return <Brush className={className} />;
    default: return <Layers className={className} />;
  }
}

export function CreateProjectDialog() {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [buildMode, setBuildMode] = useState<BuildMode>("design");
  const [showReferences, setShowReferences] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const hasReferences = selectedUrls.length > 0 || selectedPresets.length > 0;

  function handleAddUrl() {
    if (urlInput.trim() && !selectedUrls.includes(urlInput.trim())) {
      try {
        new URL(urlInput.trim());
        setSelectedUrls([...selectedUrls, urlInput.trim()]);
        setUrlInput("");
      } catch {
        // Invalid URL
      }
    }
  }

  function handleRemoveUrl(url: string) {
    setSelectedUrls(selectedUrls.filter(u => u !== url));
  }

  function handleTogglePreset(presetId: string) {
    if (selectedPresets.includes(presetId)) {
      setSelectedPresets(selectedPresets.filter(p => p !== presetId));
    } else {
      setSelectedPresets([...selectedPresets, presetId]);
    }
  }

  async function handleCreate() {
    if (!session?.accessToken || !prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Generate a random project name
      const randomId = Math.random().toString(36).substring(2, 8);
      const projectName = `site-${randomId}`;

      // Store prompt and references in sessionStorage
      sessionStorage.setItem("vibesites_initial_prompt", prompt);

      // Store references if any
      if (hasReferences) {
        const references: DesignReferences = {
          urls: selectedUrls,
          presets: selectedPresets,
        };
        sessionStorage.setItem("vibesites_initial_references", JSON.stringify(references));
      }

      // Store build mode
      sessionStorage.setItem("vibesites_build_mode", buildMode);

      setOpen(false);
      setPrompt("");
      setSelectedUrls([]);
      setSelectedPresets([]);
      setBuildMode("design");

      // Redirect to create page which handles project creation
      router.push(`/create?name=${encodeURIComponent(projectName)}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create project");
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
      <DialogContent className="bg-[#111113] border-zinc-800/50 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <DialogTitle className="text-white">Create new website</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Describe what you want and we&apos;ll build it.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your dream website..."
                rows={4}
                disabled={loading}
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700/50 rounded-xl text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:ring-violet-500/20 focus:outline-none resize-none"
              />
            </div>

            {/* Sample Prompts */}
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((sample) => (
                <button
                  key={sample.label}
                  onClick={() => setPrompt(sample.prompt)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-xs text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-all"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* Design References Section */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowReferences(!showReferences)}
              disabled={loading}
              className={`
                w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all
                ${hasReferences || showReferences
                  ? "bg-violet-500/10 border border-violet-500/30"
                  : "bg-zinc-900/50 border border-zinc-700/50 hover:border-zinc-600/50"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <Layers className={`h-5 w-5 ${hasReferences ? "text-violet-400" : "text-zinc-500"}`} />
                <div className="text-left">
                  <p className={`text-sm font-medium ${hasReferences ? "text-violet-300" : "text-zinc-300"}`}>
                    Design References
                  </p>
                  <p className="text-xs text-zinc-500">
                    {hasReferences
                      ? `${selectedUrls.length + selectedPresets.length} reference${selectedUrls.length + selectedPresets.length > 1 ? 's' : ''} selected`
                      : "Add URLs or style presets for inspiration"
                    }
                  </p>
                </div>
              </div>
              {hasReferences && (
                <Badge variant="secondary" className="bg-violet-500/20 text-violet-400 text-[10px]">
                  {selectedUrls.length + selectedPresets.length}
                </Badge>
              )}
            </button>

            {showReferences && (
              <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl overflow-hidden">
                {/* URL Input */}
                <div className="p-4 border-b border-zinc-800/50">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Reference URLs</p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddUrl())}
                      placeholder="https://example.com"
                      disabled={loading}
                      className="flex-1 px-3 py-2 text-sm bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddUrl}
                      disabled={loading}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {selectedUrls.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedUrls.map((url) => (
                        <Badge
                          key={url}
                          variant="secondary"
                          className="text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700/50 gap-1.5 pr-1"
                        >
                          <Link className="h-3 w-3" />
                          <span className="max-w-[120px] truncate">{new URL(url).hostname}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveUrl(url)}
                            className="p-0.5 rounded hover:bg-zinc-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Style Presets */}
                <div className="p-4">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Style Presets</p>
                  <div className="grid grid-cols-2 gap-2">
                    {DESIGN_PRESETS.map((preset) => {
                      const isSelected = selectedPresets.includes(preset.id);
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleTogglePreset(preset.id)}
                          disabled={loading}
                          className={`
                            p-2.5 rounded-lg text-left transition-all
                            ${isSelected
                              ? "bg-violet-500/20 border border-violet-500/40 ring-1 ring-violet-500/20"
                              : "bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600/50"
                            }
                          `}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-md ${isSelected ? "bg-violet-500/30" : "bg-zinc-700/50"}`}>
                              <PresetIcon icon={preset.icon} className={`h-3.5 w-3.5 ${isSelected ? "text-violet-400" : "text-zinc-400"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium ${isSelected ? "text-violet-300" : "text-zinc-300"}`}>
                                {preset.name}
                              </p>
                              <p className="text-[10px] text-zinc-500 truncate">{preset.description}</p>
                            </div>
                            {isSelected && (
                              <Check className="h-4 w-4 text-violet-400 shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Build Mode Selection */}
          <div className="space-y-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Build mode</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Design Mode */}
              <button
                type="button"
                onClick={() => setBuildMode("design")}
                disabled={loading}
                className={`
                  relative p-4 rounded-xl border-2 text-left transition-all
                  ${buildMode === "design"
                    ? "border-violet-500 bg-violet-500/10"
                    : "border-zinc-700/50 bg-zinc-900/30 hover:border-zinc-600"
                  }
                `}
              >
                {buildMode === "design" && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-violet-400" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${buildMode === "design" ? "bg-violet-500/20" : "bg-zinc-800"}`}>
                    <Palette className={`h-4 w-4 ${buildMode === "design" ? "text-violet-400" : "text-zinc-400"}`} />
                  </div>
                  <span className={`font-semibold ${buildMode === "design" ? "text-violet-300" : "text-zinc-300"}`}>
                    Good Design
                  </span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Rich designs with animations, custom fonts, and creative layouts.
                </p>
              </button>

              {/* Performance Mode */}
              <button
                type="button"
                onClick={() => setBuildMode("performance")}
                disabled={loading}
                className={`
                  relative p-4 rounded-xl border-2 text-left transition-all
                  ${buildMode === "performance"
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-zinc-700/50 bg-zinc-900/30 hover:border-zinc-600"
                  }
                `}
              >
                {buildMode === "performance" && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-emerald-400" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${buildMode === "performance" ? "bg-emerald-500/20" : "bg-zinc-800"}`}>
                    <Zap className={`h-4 w-4 ${buildMode === "performance" ? "text-emerald-400" : "text-zinc-400"}`} />
                  </div>
                  <span className={`font-semibold ${buildMode === "performance" ? "text-emerald-300" : "text-zinc-300"}`}>
                    Good Performance
                  </span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Optimized for speed. Minimal JS, system fonts, fast load times.
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

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
          <p className="text-[10px] text-zinc-600">
            Press Enter or click Create
          </p>
          <Button
            onClick={handleCreate}
            disabled={loading || !prompt.trim()}
            className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create Website
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
