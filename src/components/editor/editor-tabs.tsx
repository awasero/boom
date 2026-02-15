"use client";

import { EditorTab } from "@/types/project";
import { Globe, Presentation } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditorTabsProps {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  deckCount: number;
}

export function EditorTabs({
  activeTab,
  onTabChange,
  deckCount,
}: EditorTabsProps) {
  return (
    <div className="h-10 border-b border-border flex items-center px-2 gap-1 bg-card/50 flex-shrink-0">
      <button
        onClick={() => onTabChange("website")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
          activeTab === "website"
            ? "bg-violet-500/15 text-violet-300"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <Globe className="h-3.5 w-3.5" />
        Website
      </button>
      <button
        onClick={() => onTabChange("decks")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
          activeTab === "decks"
            ? "bg-violet-500/15 text-violet-300"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <Presentation className="h-3.5 w-3.5" />
        Decks
        {deckCount > 0 && (
          <span
            className={cn(
              "ml-1 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              activeTab === "decks"
                ? "bg-violet-500/20 text-violet-300"
                : "bg-muted text-muted-foreground"
            )}
          >
            {deckCount}
          </span>
        )}
      </button>
    </div>
  );
}
