"use client";

import { DeckData } from "@/types/project";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Presentation, MoreVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeckListProps {
  decks: DeckData[];
  activeDeckId: string | null;
  onDeckSelect: (deckId: string) => void;
  onDeckDelete: (deckId: string) => void;
  onNewDeck: () => void;
}

export function DeckList({
  decks,
  activeDeckId,
  onDeckSelect,
  onDeckDelete,
  onNewDeck,
}: DeckListProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Decks
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={onNewDeck}
          aria-label="New deck"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Deck list */}
      <div className="flex-1 overflow-y-auto py-2">
        {decks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Presentation className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-xs text-muted-foreground">No decks yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Use /new-deck or click + to create one
            </p>
          </div>
        ) : (
          decks.map((deck) => {
            const isActive = deck.id === activeDeckId;
            return (
              <div
                key={deck.id}
                className={cn(
                  "group flex items-center gap-2 px-4 py-2 cursor-pointer transition-colors",
                  isActive
                    ? "bg-violet-500/10 text-violet-300"
                    : "text-foreground hover:bg-secondary/50"
                )}
                onClick={() => onDeckSelect(deck.id)}
              >
                <Presentation
                  className={cn(
                    "h-3.5 w-3.5 flex-shrink-0",
                    isActive ? "text-violet-400" : "text-muted-foreground"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium truncate block">
                    {deck.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {deck.slides.length} slide{deck.slides.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="h-6 w-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-red-400 focus:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeckDelete(deck.id);
                      }}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
