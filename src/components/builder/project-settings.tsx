"use client";

import { useState, useEffect } from "react";
import { VibesitesConfig } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Link,
  X,
  Plus,
  Check,
  Layers,
  Minimize2,
  Square,
  Hexagon,
  Grid3X3,
  Leaf,
  Gem,
  Circle,
  Brush,
} from "lucide-react";

// Design presets - same as in chat-panel for consistency
const DESIGN_PRESETS = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean, whitespace-focused with subtle typography",
    style: "Maximum whitespace (lots of padding/margin), restrained color palette (off-white #FAFAFA, charcoal #1a1a1a, one accent), DM Sans or Satoshi font, subtle hover opacity changes, no decorative elements, asymmetric layouts with intentional imbalance",
    icon: "Minimize2",
  },
  {
    id: "brutalist",
    name: "Brutalist",
    description: "Raw, bold, unconventional with exposed structure",
    style: "Harsh black/white contrast, thick visible borders (4px+), JetBrains Mono or Space Mono font, raw unstyled HTML elements, Times New Roman for ironic headlines, no border-radius, intentionally jarring color combos (yellow/black, red/white)",
    icon: "Square",
  },
  {
    id: "glassmorphism",
    name: "Glass",
    description: "Frosted glass effects with blur and transparency",
    style: "backdrop-blur-xl, rgba backgrounds with 10-20% opacity, subtle box-shadows, soft gradients (purple to blue to pink), floating card elements, Plus Jakarta Sans font, light base with vibrant gradient accents, border: 1px solid rgba(255,255,255,0.2)",
    icon: "Hexagon",
  },
  {
    id: "neubrutalism",
    name: "Neubrutalism",
    description: "Bold colors, thick borders, playful shadows",
    style: "Bright saturated colors (#FF6B6B coral, #4ECDC4 teal, #FFE66D yellow), thick black borders (3-4px), offset box-shadows (4px 4px 0 black), Bricolage Grotesque or Syne font, chunky rounded buttons, playful but grid-structured layouts",
    icon: "Grid3X3",
  },
  {
    id: "organic",
    name: "Organic",
    description: "Natural shapes, earthy tones, flowing curves",
    style: "Blob shapes with border-radius: 30% 70% 70% 30%, earthy palette (forest #2D5A3D, terracotta #C4703C, cream #FDF6E3, sage #A8B5A0), Fraunces or Lora serif font, subtle grain texture overlay, flowing asymmetric layouts, soft shadows",
    icon: "Leaf",
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Elegant, refined with premium feel",
    style: "Deep dark backgrounds (#0A0A0A, #1A1A2E), gold (#D4AF37) or rose gold (#B76E79) accents, Playfair Display for headlines + light weight body text, generous letter-spacing (0.1em+), subtle fade-in animations, high contrast imagery placeholders",
    icon: "Gem",
  },
  {
    id: "retro",
    name: "Retro",
    description: "90s/Y2K aesthetic with nostalgic elements",
    style: "Neon colors (#FF00FF magenta, #00FFFF cyan, #FFFF00 yellow), visible grid lines, geometric shapes, VT323 or Press Start 2P pixel fonts, gradient backgrounds, scanline effects, chunky borders, playful cursor effects, star/sparkle decorations",
    icon: "Circle",
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Magazine-style layout with strong typography",
    style: "Newsreader or Crimson Pro serif for headlines (96px+), multi-column CSS grid layouts, dramatic size contrast (16px body vs 120px headlines), pull quotes with large quotation marks, sophisticated muted palette (warm gray, burgundy accents), generous line-height (1.8)",
    icon: "Brush",
  },
];

// Helper to get preset icon component
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

interface ProjectSettingsProps {
  config: VibesitesConfig | null;
  onSave: (context: string) => Promise<void>;
  projectName: string;
  designUrls: string[];
  designPresets: string[];
  onDesignUrlsChange: (urls: string[]) => void;
  onDesignPresetsChange: (presets: string[]) => void;
}

export function ProjectSettings({
  config,
  onSave,
  projectName,
  designUrls,
  designPresets,
  onDesignUrlsChange,
  onDesignPresetsChange,
}: ProjectSettingsProps) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState(config?.projectContext || "");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [urlInput, setUrlInput] = useState("");

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

  function handleAddUrl() {
    if (urlInput.trim() && !designUrls.includes(urlInput.trim())) {
      try {
        new URL(urlInput.trim());
        onDesignUrlsChange([...designUrls, urlInput.trim()]);
        setUrlInput("");
      } catch {
        // Invalid URL
      }
    }
  }

  function handleRemoveUrl(url: string) {
    onDesignUrlsChange(designUrls.filter(u => u !== url));
  }

  function handleTogglePreset(presetId: string) {
    if (designPresets.includes(presetId)) {
      onDesignPresetsChange(designPresets.filter(p => p !== presetId));
    } else {
      onDesignPresetsChange([...designPresets, presetId]);
    }
  }

  const hasReferences = designUrls.length > 0 || designPresets.length > 0;

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
          {hasReferences && (
            <Badge variant="secondary" className="ml-1 text-[9px] bg-violet-500/20 text-violet-400 px-1.5">
              {designUrls.length + designPresets.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-[#111113] border-zinc-800/50 w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <SheetTitle className="text-white">Project Settings</SheetTitle>
              <SheetDescription className="text-zinc-400">
                Configure context and design references
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
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
              Project Context
            </Label>
            <Textarea
              id="context"
              placeholder="Describe your project: brand details, target audience, preferred style, colors, features..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="
                min-h-[120px] resize-none
                bg-zinc-900/50 border-zinc-700/50
                text-white placeholder:text-zinc-600
                focus:border-violet-500/50 focus:ring-violet-500/20
                rounded-xl text-sm leading-relaxed
              "
            />
            <p className="text-[11px] text-zinc-500">
              This context is sent with every message to Claude.
            </p>
          </div>

          {/* Design References Section */}
          <div className="space-y-4 pt-4 border-t border-zinc-800/50">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-violet-400" />
              <Label className="text-zinc-300 text-sm font-medium">Design References</Label>
            </div>

            {/* Reference URLs */}
            <div className="space-y-2">
              <Label className="text-zinc-500 text-xs uppercase tracking-wider">Reference URLs</Label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddUrl())}
                  placeholder="https://example.com"
                  className="flex-1 bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-600 h-9 text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddUrl}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 h-9 px-3"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {designUrls.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {designUrls.map((url) => (
                    <Badge
                      key={url}
                      variant="secondary"
                      className="text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700/50 gap-1.5 pr-1"
                    >
                      <Link className="h-3 w-3" />
                      <span className="max-w-[150px] truncate">{new URL(url).hostname}</span>
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
            <div className="space-y-2">
              <Label className="text-zinc-500 text-xs uppercase tracking-wider">Style Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                {DESIGN_PRESETS.map((preset) => {
                  const isSelected = designPresets.includes(preset.id);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleTogglePreset(preset.id)}
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

            {/* Info */}
            <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Design references are applied to all generations. Claude will use these
                  styles and inspirations when creating your website.
                </p>
              </div>
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
