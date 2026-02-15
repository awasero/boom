"use client";

import { useState, useCallback } from "react";
import { BrandNucleus } from "@/types/project";
import { DEFAULT_BRAND } from "@/lib/brand/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  Palette,
  Type,
  Space,
  Square,
  MessageCircle,
  Sparkles,
  Save,
  Loader2,
} from "lucide-react";

interface BrandNucleusEditorProps {
  brand: BrandNucleus | null;
  onSave: (brand: BrandNucleus) => void;
  onExtract: () => void;
  isExtracting?: boolean;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, icon, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-foreground hover:bg-card/80 transition-colors"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        {icon}
        {title}
      </button>
      {open && <div className="px-3 pb-3 space-y-3">{children}</div>}
    </div>
  );
}

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-7 rounded border border-border cursor-pointer bg-transparent p-0.5"
      />
      <div className="flex-1 min-w-0">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 text-xs bg-card border-border font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

export function BrandNucleusEditor({
  brand,
  onSave,
  onExtract,
  isExtracting = false,
}: BrandNucleusEditorProps) {
  const [draft, setDraft] = useState<BrandNucleus>(brand ?? DEFAULT_BRAND);

  const updateColor = useCallback(
    (key: keyof BrandNucleus["colors"], value: string) => {
      if (key === "text") return;
      setDraft((prev) => ({
        ...prev,
        colors: { ...prev.colors, [key]: value },
      }));
    },
    []
  );

  const updateTextColor = useCallback(
    (key: keyof BrandNucleus["colors"]["text"], value: string) => {
      setDraft((prev) => ({
        ...prev,
        colors: {
          ...prev.colors,
          text: { ...prev.colors.text, [key]: value },
        },
      }));
    },
    []
  );

  const updateTypography = useCallback(
    (
      group: "heading" | "body",
      field: "family" | "weights",
      value: string
    ) => {
      setDraft((prev) => ({
        ...prev,
        typography: {
          ...prev.typography,
          [group]: {
            ...prev.typography[group],
            [field]:
              field === "weights"
                ? value.split(",").map((w) => w.trim())
                : value,
          },
        },
      }));
    },
    []
  );

  const updateSpacingUnit = useCallback((value: number) => {
    setDraft((prev) => ({
      ...prev,
      spacing: { ...prev.spacing, unit: value },
    }));
  }, []);

  const updateBorderRadius = useCallback(
    (key: keyof BrandNucleus["borderRadius"], value: string) => {
      setDraft((prev) => ({
        ...prev,
        borderRadius: { ...prev.borderRadius, [key]: value },
      }));
    },
    []
  );

  const updateVoice = useCallback(
    (field: "tone" | "personality", value: string) => {
      setDraft((prev) => ({
        ...prev,
        voice: {
          ...prev.voice,
          [field]:
            field === "personality"
              ? value.split(",").map((p) => p.trim())
              : value,
        },
      }));
    },
    []
  );

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Header actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onExtract}
          disabled={isExtracting}
          className="flex-1 text-xs gap-1.5 border-border"
        >
          {isExtracting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {isExtracting ? "Extracting..." : "Extract from code"}
        </Button>
        <Button
          size="sm"
          onClick={() => onSave(draft)}
          className="flex-1 text-xs gap-1.5 bg-violet-600 hover:bg-violet-700"
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </Button>
      </div>

      {/* Colors section */}
      <Section
        title="Colors"
        icon={<Palette className="h-3.5 w-3.5 text-violet-400" />}
        defaultOpen
      >
        <div className="space-y-2">
          <ColorField
            label="Primary"
            value={draft.colors.primary}
            onChange={(v) => updateColor("primary", v)}
          />
          <ColorField
            label="Secondary"
            value={draft.colors.secondary}
            onChange={(v) => updateColor("secondary", v)}
          />
          <ColorField
            label="Accent"
            value={draft.colors.accent}
            onChange={(v) => updateColor("accent", v)}
          />
          <ColorField
            label="Background"
            value={draft.colors.background}
            onChange={(v) => updateColor("background", v)}
          />
          <ColorField
            label="Surface"
            value={draft.colors.surface}
            onChange={(v) => updateColor("surface", v)}
          />
          <div className="pt-1 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Text Colors</p>
            <div className="space-y-2">
              <ColorField
                label="Primary"
                value={draft.colors.text.primary}
                onChange={(v) => updateTextColor("primary", v)}
              />
              <ColorField
                label="Secondary"
                value={draft.colors.text.secondary}
                onChange={(v) => updateTextColor("secondary", v)}
              />
              <ColorField
                label="Inverse"
                value={draft.colors.text.inverse}
                onChange={(v) => updateTextColor("inverse", v)}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Typography section */}
      <Section
        title="Typography"
        icon={<Type className="h-3.5 w-3.5 text-cyan-400" />}
      >
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">
              Heading Font
            </Label>
            <Input
              value={draft.typography.heading.family}
              onChange={(e) =>
                updateTypography("heading", "family", e.target.value)
              }
              className="h-7 text-xs bg-card border-border"
              placeholder="Inter"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Heading Weights
            </Label>
            <Input
              value={draft.typography.heading.weights.join(", ")}
              onChange={(e) =>
                updateTypography("heading", "weights", e.target.value)
              }
              className="h-7 text-xs bg-card border-border"
              placeholder="600, 700"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Body Font</Label>
            <Input
              value={draft.typography.body.family}
              onChange={(e) =>
                updateTypography("body", "family", e.target.value)
              }
              className="h-7 text-xs bg-card border-border"
              placeholder="Inter"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Body Weights
            </Label>
            <Input
              value={draft.typography.body.weights.join(", ")}
              onChange={(e) =>
                updateTypography("body", "weights", e.target.value)
              }
              className="h-7 text-xs bg-card border-border"
              placeholder="400, 500"
            />
          </div>
        </div>
      </Section>

      {/* Spacing section */}
      <Section
        title="Spacing"
        icon={<Space className="h-3.5 w-3.5 text-emerald-400" />}
      >
        <div>
          <Label className="text-xs text-muted-foreground">
            Base Unit (px)
          </Label>
          <Input
            type="number"
            value={draft.spacing.unit}
            onChange={(e) => updateSpacingUnit(Number(e.target.value))}
            className="h-7 text-xs bg-card border-border"
            min={1}
            max={16}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Scale</Label>
          <Input
            value={draft.spacing.scale.join(", ")}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                spacing: {
                  ...prev.spacing,
                  scale: e.target.value
                    .split(",")
                    .map((s) => Number(s.trim()))
                    .filter((n) => !isNaN(n)),
                },
              }))
            }
            className="h-7 text-xs bg-card border-border font-mono"
            placeholder="0, 4, 8, 12, 16, 24, 32, 48, 64"
          />
        </div>
      </Section>

      {/* Border Radius section */}
      <Section
        title="Borders"
        icon={<Square className="h-3.5 w-3.5 text-amber-400" />}
      >
        <div className="space-y-2">
          <div>
            <Label className="text-xs text-muted-foreground">Small</Label>
            <Input
              value={draft.borderRadius.sm}
              onChange={(e) => updateBorderRadius("sm", e.target.value)}
              className="h-7 text-xs bg-card border-border"
              placeholder="0.375rem"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Medium</Label>
            <Input
              value={draft.borderRadius.md}
              onChange={(e) => updateBorderRadius("md", e.target.value)}
              className="h-7 text-xs bg-card border-border"
              placeholder="0.75rem"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Large</Label>
            <Input
              value={draft.borderRadius.lg}
              onChange={(e) => updateBorderRadius("lg", e.target.value)}
              className="h-7 text-xs bg-card border-border"
              placeholder="1rem"
            />
          </div>
        </div>
      </Section>

      {/* Voice section */}
      <Section
        title="Voice"
        icon={<MessageCircle className="h-3.5 w-3.5 text-pink-400" />}
      >
        <div className="space-y-2">
          <div>
            <Label className="text-xs text-muted-foreground">Tone</Label>
            <Input
              value={draft.voice.tone}
              onChange={(e) => updateVoice("tone", e.target.value)}
              className="h-7 text-xs bg-card border-border"
              placeholder="Professional yet approachable"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Personality Traits
            </Label>
            <Input
              value={draft.voice.personality.join(", ")}
              onChange={(e) => updateVoice("personality", e.target.value)}
              className="h-7 text-xs bg-card border-border"
              placeholder="Confident, Clear, Helpful"
            />
          </div>
        </div>
      </Section>
    </div>
  );
}
