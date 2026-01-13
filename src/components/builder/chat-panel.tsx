"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Send,
  Sparkles,
  User,
  FileCode,
  Zap,
  ChevronDown,
  ChevronRight,
  Check,
  Copy,
  Code2,
} from "lucide-react";

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
          <EmptyState onSuggestionClick={setInput} />
        ) : (
          <div className="space-y-5">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isGenerating && streamingContent && (
              <StreamingMessage content={streamingContent} />
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

function EmptyState({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
  return (
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
            onClick={() => onSuggestionClick(suggestion)}
            className="text-xs px-3 py-1.5 rounded-full bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50 border border-zinc-700/50 transition-all"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function StreamingMessage({ content }: { content: string }) {
  const { textContent, codeBlocks, hasPartialFile } = parseStreamingContent(content);

  return (
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
        <div className="space-y-3">
          {textContent && (
            <div className="text-sm text-zinc-300 leading-relaxed">
              {textContent}
            </div>
          )}
          {(codeBlocks.length > 0 || hasPartialFile) && (
            <div className="flex flex-wrap gap-1.5">
              {codeBlocks.map((block, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-[10px] gap-1.5 bg-zinc-800/50 border-zinc-700/50 text-zinc-400"
                >
                  <FileCode className="h-3 w-3" />
                  {block.filename || `file-${i + 1}`}
                  <Loader2 className="h-2.5 w-2.5 animate-spin ml-1" />
                </Badge>
              ))}
              {hasPartialFile && (
                <Badge
                  variant="outline"
                  className="text-[10px] gap-1.5 bg-violet-500/10 border-violet-500/30 text-violet-400"
                >
                  <FileCode className="h-3 w-3" />
                  Writing file...
                  <Loader2 className="h-2.5 w-2.5 animate-spin ml-1" />
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-zinc-700 text-zinc-300">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-medium text-sm text-white">You</span>
            <span className="text-[10px] text-zinc-600">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl rounded-tl-sm p-3.5 text-sm text-zinc-200">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  return <AssistantMessage message={message} />;
}

function AssistantMessage({ message }: { message: ChatMessage }) {
  const { textContent, codeBlocks } = parseMessageContent(message.content);

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0 ring-2 ring-violet-500/20">
        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
          <Sparkles className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-sm text-white">Claude</span>
          <span className="text-[10px] text-zinc-600">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {message.files && message.files.length > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30"
            >
              <Check className="h-3 w-3 mr-1" />
              {message.files.length} file{message.files.length > 1 ? 's' : ''} generated
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          {/* Text content */}
          {textContent && (
            <div className="text-sm text-zinc-300 leading-relaxed">
              {textContent}
            </div>
          )}

          {/* Code blocks as collapsible accordions */}
          {codeBlocks.length > 0 && (
            <div className="space-y-2">
              {codeBlocks.map((block, i) => (
                <CodeAccordion key={i} block={block} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CodeBlock {
  filename: string;
  language: string;
  content: string;
}

function CodeAccordion({ block }: { block: CodeBlock }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(block.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = block.content.split('\n').length;

  return (
    <div className="rounded-lg border border-zinc-800/50 overflow-hidden bg-zinc-900/30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-zinc-800/30 transition-colors text-left"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0" />
        )}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Code2 className="h-4 w-4 text-violet-400 shrink-0" />
          <span className="text-sm font-medium text-zinc-200 truncate">
            {block.filename}
          </span>
          <span className="text-[10px] text-zinc-500 shrink-0">
            {lineCount} lines
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
          title="Copy code"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </button>

      {isOpen && (
        <div className="border-t border-zinc-800/50 bg-[#0a0a0b]">
          <pre className="p-3 overflow-x-auto text-xs text-zinc-300 font-mono leading-relaxed max-h-[300px] overflow-y-auto">
            <code>{block.content}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

function parseMessageContent(content: string): { textContent: string; codeBlocks: CodeBlock[] } {
  const codeBlocks: CodeBlock[] = [];

  // Match FILE: filename followed by code block
  const filePattern = /FILE:\s*([^\n]+)\n```(\w+)?\n([\s\S]*?)```/g;

  let match;
  while ((match = filePattern.exec(content)) !== null) {
    const filename = match[1].trim();
    const language = match[2] || 'text';
    const code = match[3].trim();

    if (filename && code) {
      codeBlocks.push({ filename, language, content: code });
    }
  }

  // Remove code blocks from text content
  let textContent = content
    .replace(/FILE:\s*[^\n]+\n```[\s\S]*?```/g, '')
    .trim();

  // Clean up multiple newlines
  textContent = textContent.replace(/\n{3,}/g, '\n\n');

  return { textContent, codeBlocks };
}

// Special parser for streaming content - hides partial FILE: blocks
function parseStreamingContent(content: string): { textContent: string; codeBlocks: CodeBlock[]; hasPartialFile: boolean } {
  const codeBlocks: CodeBlock[] = [];
  let hasPartialFile = false;

  // Match complete FILE: blocks
  const filePattern = /FILE:\s*([^\n]+)\n```(\w+)?\n([\s\S]*?)```/g;

  let match;
  while ((match = filePattern.exec(content)) !== null) {
    const filename = match[1].trim();
    const language = match[2] || 'text';
    const code = match[3].trim();

    if (filename && code) {
      codeBlocks.push({ filename, language, content: code });
    }
  }

  // Remove complete code blocks from content
  let textContent = content.replace(/FILE:\s*[^\n]+\n```[\s\S]*?```/g, '');

  // Check for partial FILE: block (started but not closed)
  // Pattern: FILE: followed by anything that doesn't end with ```
  const partialFilePattern = /FILE:\s*[^\n]+\n```[\s\S]*$/;
  if (partialFilePattern.test(textContent)) {
    hasPartialFile = true;
    // Remove the partial file block from display
    textContent = textContent.replace(/FILE:\s*[^\n]+\n```[\s\S]*$/, '');
  }

  // Also check if we're in the middle of typing "FILE:"
  const typingFilePattern = /\n?F(I(L(E(:)?)?)?)?$/i;
  if (typingFilePattern.test(textContent)) {
    textContent = textContent.replace(/\n?F(I(L(E(:)?)?)?)?$/i, '');
  }

  // Clean up multiple newlines and trim
  textContent = textContent.replace(/\n{3,}/g, '\n\n').trim();

  return { textContent, codeBlocks, hasPartialFile };
}
