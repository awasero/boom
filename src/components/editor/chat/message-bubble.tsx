"use client";

import ReactMarkdown from "react-markdown";
import { CodeAccordion } from "./code-accordion";
import type { ChatMessage } from "@/types/project";

interface MessageBubbleProps {
  message: ChatMessage;
}

function stripFileBlocks(content: string): string {
  return content
    .replace(/FILE:\s*\S+\n[\s\S]*?(?=(?:FILE:\s*\S+\n)|$)/g, "")
    .trim();
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

const MODEL_COLORS: Record<string, string> = {
  opus: "bg-violet-500/20 text-violet-300",
  sonnet: "bg-blue-500/20 text-blue-300",
  haiku: "bg-emerald-500/20 text-emerald-300",
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const displayContent = stripFileBlocks(message.content);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card border border-border"
        }`}
      >
        {/* Header: model badge + command badge */}
        {!isUser && (message.model || message.command) && (
          <div className="flex items-center gap-1.5 mb-1.5">
            {message.model && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${MODEL_COLORS[message.model] || "bg-muted text-muted-foreground"}`}
              >
                {message.model}
              </span>
            )}
            {message.command && (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                /{message.command}
              </span>
            )}
          </div>
        )}

        {/* Content */}
        {displayContent && (
          <div
            className={`text-sm leading-relaxed prose-sm ${
              isUser
                ? "text-primary-foreground"
                : "text-foreground prose-invert"
            } [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ol]:mb-2 [&_code]:bg-muted/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-muted/50 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{displayContent}</p>
            ) : (
              <ReactMarkdown>{displayContent}</ReactMarkdown>
            )}
          </div>
        )}

        {/* Code accordion for assistant messages with files */}
        {!isUser && message.files && message.files.length > 0 && (
          <CodeAccordion files={message.files} />
        )}

        {/* Timestamp */}
        <div
          className={`mt-1.5 text-[10px] ${
            isUser ? "text-primary-foreground/60" : "text-muted-foreground"
          }`}
        >
          {formatRelativeTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
