"use client";

import { useRef, useState, useEffect, KeyboardEvent } from "react";
import { MessageBubble } from "./chat/message-bubble";
import { StreamingMessage } from "./chat/streaming-message";
import { EmptyState } from "./chat/empty-state";
import { CommandPalette } from "./chat/command-palette";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChatMessage, ElementContext } from "@/types/project";
import {
  Send,
  X,
  Trash2,
  Crosshair,
} from "lucide-react";

interface ChatPanelProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  streamingContent: string;
  selectedElement: ElementContext | null;
  onSendMessage: (prompt: string) => void;
  onClearMessages: () => void;
  onAbort: () => void;
  onCommandSelect: (command: string | null) => void;
  activeCommand: string | null;
}

export function ChatPanel({
  messages,
  isGenerating,
  streamingContent,
  selectedElement,
  onSendMessage,
  onClearMessages,
  onAbort,
  onCommandSelect,
  activeCommand,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Show command palette when user types "/"
  useEffect(() => {
    if (input === "/") {
      setShowCommandPalette(true);
    } else if (!input.startsWith("/") || input.includes(" ")) {
      setShowCommandPalette(false);
    }
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;
    onSendMessage(trimmed);
    setInput("");
    setShowCommandPalette(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      setShowCommandPalette(false);
      if (activeCommand) {
        onCommandSelect(null);
      }
    }
  };

  const handleCommandSelect = (command: string) => {
    onCommandSelect(command);
    setInput("");
    setShowCommandPalette(false);
    textareaRef.current?.focus();
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages area */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {!hasMessages && !isGenerating && (
            <EmptyState onSuggestionClick={(prompt) => onSendMessage(prompt)} />
          )}

          {hasMessages && (
            <>
              {/* Clear messages button */}
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearMessages}
                  className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear chat
                </Button>
              </div>

              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </>
          )}

          {isGenerating && (
            <StreamingMessage content={streamingContent} isGenerating={isGenerating} />
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-border p-3 space-y-2">
        {/* Selected element indicator */}
        {selectedElement && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <Crosshair className="h-3 w-3 text-emerald-400 flex-shrink-0" />
            <span className="text-emerald-300 truncate flex-1">
              {selectedElement.selector}
              {selectedElement.text && (
                <span className="text-muted-foreground ml-1">
                  &mdash; &ldquo;{selectedElement.text.slice(0, 40)}
                  {selectedElement.text.length > 40 ? "..." : ""}&rdquo;
                </span>
              )}
            </span>
            <button
              onClick={() => onCommandSelect(null)}
              className="text-muted-foreground hover:text-foreground flex-shrink-0"
              aria-label="Dismiss selected element"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Active command badge */}
        {activeCommand && (
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-xs bg-violet-500/15 text-violet-300 border-violet-500/20"
            >
              /{activeCommand}
            </Badge>
            <button
              onClick={() => onCommandSelect(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Clear command"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Command palette */}
        {showCommandPalette && (
          <CommandPalette
            onCommandSelect={handleCommandSelect}
            onClose={() => setShowCommandPalette(false)}
            filter={input.startsWith("/") ? input.slice(1) : ""}
          />
        )}

        {/* Textarea + send */}
        <div className="relative flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeCommand
                ? `Describe what to ${activeCommand}...`
                : "Describe what you want to build..."
            }
            className="min-h-[44px] max-h-[160px] resize-none bg-card border-border text-sm pr-2"
            rows={1}
            disabled={isGenerating}
          />

          {isGenerating ? (
            <Button
              size="icon"
              variant="destructive"
              onClick={onAbort}
              className="flex-shrink-0 h-[44px] w-[44px]"
              aria-label="Stop generation"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex-shrink-0 h-[44px] w-[44px] bg-violet-600 hover:bg-violet-700 disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
