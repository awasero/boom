"use client";

import { useEffect, useRef } from "react";
import {
  Type,
  Paintbrush,
  Search,
  Smartphone,
  Palette,
} from "lucide-react";
import type { ChatCommand, ModelType } from "@/types/project";

interface CommandPaletteProps {
  onCommandSelect: (command: string) => void;
  onClose: () => void;
  filter: string;
}

const COMMANDS: ChatCommand[] = [
  { name: "text", description: "Quick text changes", model: "haiku", icon: "Type" },
  { name: "tweak", description: "Small visual tweaks", model: "haiku", icon: "Paintbrush" },
  { name: "seo", description: "SEO optimization", model: "sonnet", icon: "Search" },
  { name: "mobile", description: "Mobile responsive", model: "sonnet", icon: "Smartphone" },
  { name: "design", description: "Design system update", model: "sonnet", icon: "Palette" },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Type,
  Paintbrush,
  Search,
  Smartphone,
  Palette,
};

const MODEL_COLORS: Record<ModelType, string> = {
  opus: "bg-violet-500/20 text-violet-300",
  sonnet: "bg-blue-500/20 text-blue-300",
  haiku: "bg-emerald-500/20 text-emerald-300",
};

export function CommandPalette({
  onCommandSelect,
  onClose,
  filter,
}: CommandPaletteProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const filteredCommands = COMMANDS.filter((cmd) =>
    cmd.name.startsWith(filter.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (filteredCommands.length === 0) return null;

  return (
    <div
      ref={panelRef}
      className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50"
    >
      <div className="px-3 py-2 border-b border-border">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Commands
        </span>
      </div>
      <div className="py-1">
        {filteredCommands.map((cmd) => {
          const Icon = ICON_MAP[cmd.icon];
          return (
            <button
              key={cmd.name}
              onClick={() => onCommandSelect(cmd.name)}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
            >
              {Icon && (
                <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    /{cmd.name}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${MODEL_COLORS[cmd.model]}`}
                  >
                    {cmd.model}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {cmd.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
