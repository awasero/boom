"use client";

import ReactMarkdown from "react-markdown";

interface StreamingMessageProps {
  content: string;
  isGenerating: boolean;
}

function stripFileBlocks(content: string): string {
  return content
    .replace(/FILE:\s*\S+\n[\s\S]*?(?=(?:FILE:\s*\S+\n)|$)/g, "")
    .trim();
}

export function StreamingMessage({
  content,
  isGenerating,
}: StreamingMessageProps) {
  const displayContent = stripFileBlocks(content);

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-xl px-4 py-2.5 bg-card border border-border">
        {/* Generating indicator */}
        {isGenerating && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:0.2s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:0.4s]" />
            </div>
            {!displayContent && (
              <span className="text-xs text-muted-foreground">
                Generating...
              </span>
            )}
          </div>
        )}

        {/* Streaming content */}
        {displayContent && (
          <div className="text-sm leading-relaxed text-foreground prose-sm prose-invert [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ol]:mb-2 [&_code]:bg-muted/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-muted/50 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto">
            <ReactMarkdown>{displayContent}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
