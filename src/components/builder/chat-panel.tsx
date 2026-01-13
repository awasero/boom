"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Sparkles, User, FileCode } from "lucide-react";

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
    <>
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              Describe your website
            </h2>
            <p className="text-muted-foreground max-w-md">
              Tell me what kind of website you want to build. For example:
              &quot;Create a landing page for a coffee shop with a menu, about
              section, and contact form.&quot;
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isGenerating && streamingContent && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">Claude</span>
                    <Badge variant="secondary" className="text-xs">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Generating
                    </Badge>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-sm whitespace-pre-wrap">
                    {streamingContent.slice(0, 500)}
                    {streamingContent.length > 500 && "..."}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <form
        onSubmit={handleSubmit}
        className="p-4 border-t bg-white flex gap-2"
      >
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you want to build..."
          className="min-h-[60px] max-h-[200px] resize-none"
          disabled={isGenerating}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isGenerating}
          className="shrink-0 h-[60px] w-[60px]"
        >
          {isGenerating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
    </>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={
            isUser ? "bg-slate-200" : "bg-primary text-primary-foreground"
          }
        >
          {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">
            {isUser ? "You" : "Claude"}
          </span>
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>

        {isUser ? (
          <div className="bg-primary text-primary-foreground rounded-lg p-3 text-sm">
            {message.content}
          </div>
        ) : (
          <div className="space-y-2">
            {message.files && message.files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {message.files.map((file) => (
                  <Badge
                    key={file.path}
                    variant="outline"
                    className="text-xs gap-1"
                  >
                    <FileCode className="h-3 w-3" />
                    {file.path}
                  </Badge>
                ))}
              </div>
            )}
            <div className="bg-muted rounded-lg p-3 text-sm">
              <FormattedContent content={message.content} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FormattedContent({ content }: { content: string }) {
  // Remove the file blocks for display, show summary instead
  const cleanContent = content
    .replace(/FILE:\s*[^\n]+\n```[\s\S]*?```/g, "")
    .trim();

  if (!cleanContent) {
    return (
      <span className="text-muted-foreground italic">
        Generated code files (see preview)
      </span>
    );
  }

  return <span className="whitespace-pre-wrap">{cleanContent}</span>;
}
