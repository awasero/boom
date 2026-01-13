"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Sparkles, User, FileCode, Zap } from "lucide-react";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isGenerating: boolean;
  streamingContent: string;
}

export function ChatPanel({
  messages,
  onSendMessage,
  isGenerating,
  streamingContent,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim() && !isGenerating) {
      onSendMessage(input.trim());
      setInput("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg blur opacity-40" />
          <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Claude Opus</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Frontend Design Mode</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl blur-xl opacity-30 animate-pulse" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
                <Zap className="h-9 w-9 text-violet-400" />
              </div>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">
              What do you want to build?
            </h2>
            <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
              Describe your website and I&apos;ll generate production-ready Astro code with perfect SEO.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {[
                "Landing page for a coffee shop",
                "Portfolio for a photographer",
                "SaaS product page",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-xs px-3 py-1.5 rounded-full bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50 border border-zinc-700/50 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isGenerating && streamingContent && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0 ring-2 ring-violet-500/20">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                    <Sparkles className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm text-white">Claude</span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-violet-500/20 text-violet-400 border-violet-500/30 animate-pulse"
                    >
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Generating
                    </Badge>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl rounded-tl-sm p-3.5 text-sm text-zinc-300 whitespace-pre-wrap border border-zinc-700/30">
                    {streamingContent.slice(0, 500)}
                    {streamingContent.length > 500 && (
                      <span className="text-zinc-500">...</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-zinc-800/50 bg-[#0d0d0f]"
      >
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            className="
              min-h-[80px] max-h-[200px] resize-none pr-14
              bg-zinc-800/50 border-zinc-700/50
              text-white placeholder:text-zinc-500
              focus:border-violet-500/50 focus:ring-violet-500/20
              rounded-xl
            "
            disabled={isGenerating}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isGenerating}
            className="
              absolute right-2 bottom-2
              h-10 w-10 rounded-lg
              bg-gradient-to-r from-violet-500 to-fuchsia-500
              hover:from-violet-400 hover:to-fuchsia-400
              disabled:opacity-30 disabled:cursor-not-allowed
              shadow-lg shadow-violet-500/20
              transition-all
            "
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-zinc-600 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className="flex gap-3">
      <Avatar className={`h-8 w-8 shrink-0 ${!isUser ? 'ring-2 ring-violet-500/20' : ''}`}>
        <AvatarFallback
          className={
            isUser
              ? "bg-zinc-700 text-zinc-300"
              : "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
          }
        >
          {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-medium text-sm text-white">
            {isUser ? "You" : "Claude"}
          </span>
          <span className="text-[10px] text-zinc-600">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {isUser ? (
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl rounded-tl-sm p-3.5 text-sm text-zinc-200">
            {message.content}
          </div>
        ) : (
          <div className="space-y-2">
            {message.files && message.files.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {message.files.map((file) => (
                  <Badge
                    key={file.path}
                    variant="outline"
                    className="text-[10px] gap-1.5 bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
                  >
                    <FileCode className="h-3 w-3" />
                    {file.path.split("/").pop()}
                  </Badge>
                ))}
              </div>
            )}
            <div className="bg-zinc-800/50 rounded-xl rounded-tl-sm p-3.5 text-sm text-zinc-300 border border-zinc-700/30">
              <FormattedContent content={message.content} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FormattedContent({ content }: { content: string }) {
  const cleanContent = content
    .replace(/FILE:\s*[^\n]+\n```[\s\S]*?```/g, "")
    .trim();

  if (!cleanContent) {
    return (
      <span className="text-zinc-500 italic flex items-center gap-2">
        <FileCode className="h-4 w-4" />
        Generated code files — check the preview
      </span>
    );
  }

  return <span className="whitespace-pre-wrap leading-relaxed">{cleanContent}</span>;
}
