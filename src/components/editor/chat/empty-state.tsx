"use client";

import { Sparkles } from "lucide-react";

interface EmptyStateProps {
  onSuggestionClick: (prompt: string) => void;
}

const SUGGESTIONS = [
  "Build a landing page",
  "Create a portfolio site",
  "Design a blog layout",
  "Make a pricing section",
];

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      {/* Logo and title */}
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          Boom
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        What would you like to build?
      </p>

      {/* Suggestion chips */}
      <div className="flex flex-wrap justify-center gap-2 max-w-xs">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
