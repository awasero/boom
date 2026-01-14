"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { ChatMessage, ModelType, ChatCommand, DesignPreset, GeneratedFile } from "@/types/project";
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
  ChevronDown,
  ChevronRight,
  Check,
  Copy,
  Code2,
  Search,
  Smartphone,
  Palette,
  Bot,
  Wand2,
  Type,
  Layout,
  Zap,
  Paintbrush,
  Pencil,
  SlidersHorizontal,
  MousePointer2,
  X,
} from "lucide-react";

// Available commands
const COMMANDS: ChatCommand[] = [
  { name: "text", description: "Quick text and copy changes", model: "haiku", icon: "Pencil" },
  { name: "tweak", description: "Simple design adjustments (colors, spacing, fonts)", model: "haiku", icon: "SlidersHorizontal" },
  { name: "seo", description: "Optimize for SEO with meta tags, schemas, and structured data", model: "sonnet", icon: "Search" },
  { name: "mobile", description: "Redesign with mobile-first approach", model: "opus", icon: "Smartphone" },
  { name: "design", description: "Creative frontend design mode", model: "opus", icon: "Palette" },
];

// Model display configuration
const MODEL_CONFIG: Record<ModelType, { label: string; color: string; bgColor: string; borderColor: string }> = {
  opus: { label: "Opus", color: "text-violet-400", bgColor: "bg-violet-500/20", borderColor: "border-violet-500/30" },
  sonnet: { label: "Sonnet", color: "text-blue-400", bgColor: "bg-blue-500/20", borderColor: "border-blue-500/30" },
  haiku: { label: "Haiku", color: "text-emerald-400", bgColor: "bg-emerald-500/20", borderColor: "border-emerald-500/30" },
};

// AI suggestion type from Haiku
interface AISuggestion {
  label: string;
  prompt: string;
  category: "design" | "content" | "layout" | "animation" | "accessibility";
}

// Category icons for AI suggestions
const CATEGORY_ICONS: Record<string, typeof Type> = {
  design: Paintbrush,
  content: Type,
  layout: Layout,
  animation: Zap,
  accessibility: Sparkles,
};

// Design presets - exported for use in API and project settings
export const DESIGN_PRESETS: DesignPreset[] = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean, whitespace-focused with subtle typography",
    style: "Maximum whitespace (lots of padding/margin), restrained color palette (off-white #FAFAFA, charcoal #1a1a1a, one accent), DM Sans or Satoshi font, subtle hover opacity changes, no decorative elements, asymmetric layouts with intentional imbalance",
    icon: "Minimize2",
  },
  {
    id: "brutalist",
    name: "Brutalist",
    description: "Raw, bold, unconventional with exposed structure",
    style: "Harsh black/white contrast, thick visible borders (4px+), JetBrains Mono or Space Mono font, raw unstyled HTML elements, Times New Roman for ironic headlines, no border-radius, intentionally jarring color combos (yellow/black, red/white)",
    icon: "Square",
  },
  {
    id: "glassmorphism",
    name: "Glass",
    description: "Frosted glass effects with blur and transparency",
    style: "backdrop-blur-xl, rgba backgrounds with 10-20% opacity, subtle box-shadows, soft gradients (purple to blue to pink), floating card elements, Plus Jakarta Sans font, light base with vibrant gradient accents, border: 1px solid rgba(255,255,255,0.2)",
    icon: "Hexagon",
  },
  {
    id: "neubrutalism",
    name: "Neubrutalism",
    description: "Bold colors, thick borders, playful shadows",
    style: "Bright saturated colors (#FF6B6B coral, #4ECDC4 teal, #FFE66D yellow), thick black borders (3-4px), offset box-shadows (4px 4px 0 black), Bricolage Grotesque or Syne font, chunky rounded buttons, playful but grid-structured layouts",
    icon: "Grid3X3",
  },
  {
    id: "organic",
    name: "Organic",
    description: "Natural shapes, earthy tones, flowing curves",
    style: "Blob shapes with border-radius: 30% 70% 70% 30%, earthy palette (forest #2D5A3D, terracotta #C4703C, cream #FDF6E3, sage #A8B5A0), Fraunces or Lora serif font, subtle grain texture overlay, flowing asymmetric layouts, soft shadows",
    icon: "Leaf",
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Elegant, refined with premium feel",
    style: "Deep dark backgrounds (#0A0A0A, #1A1A2E), gold (#D4AF37) or rose gold (#B76E79) accents, Playfair Display for headlines + light weight body text, generous letter-spacing (0.1em+), subtle fade-in animations, high contrast imagery placeholders",
    icon: "Gem",
  },
  {
    id: "retro",
    name: "Retro",
    description: "90s/Y2K aesthetic with nostalgic elements",
    style: "Neon colors (#FF00FF magenta, #00FFFF cyan, #FFFF00 yellow), visible grid lines, geometric shapes, VT323 or Press Start 2P pixel fonts, gradient backgrounds, scanline effects, chunky borders, playful cursor effects, star/sparkle decorations",
    icon: "Circle",
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Magazine-style layout with strong typography",
    style: "Newsreader or Crimson Pro serif for headlines (96px+), multi-column CSS grid layouts, dramatic size contrast (16px body vs 120px headlines), pull quotes with large quotation marks, sophisticated muted palette (warm gray, burgundy accents), generous line-height (1.8)",
    icon: "Brush",
  },
];

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string, command?: string) => void;
  isGenerating: boolean;
  streamingContent: string;
  files?: GeneratedFile[];
  selectedElement?: string | null;
  onClearSelectedElement?: () => void;
}

export function ChatPanel({
  messages,
  onSendMessage,
  isGenerating,
  streamingContent,
  files = [],
  selectedElement,
  onClearSelectedElement,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [showCommands, setShowCommands] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check if input starts with / for command suggestions
  const commandMatch = input.match(/^\/(\w*)$/);
  const filteredCommands = commandMatch
    ? COMMANDS.filter(cmd => cmd.name.startsWith(commandMatch[1]))
    : [];

  const hasFiles = files.length > 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  useEffect(() => {
    setShowCommands(commandMatch !== null && filteredCommands.length > 0);
  }, [input]);

  // When an element is selected from the preview, focus the input
  useEffect(() => {
    if (selectedElement && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [selectedElement]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim() && !isGenerating) {
      // Check if it's a command
      const cmdMatch = input.match(/^\/(\w+)\s*(.*)?$/);
      if (cmdMatch) {
        const cmdName = cmdMatch[1];
        const cmdArgs = cmdMatch[2] || "";
        const command = COMMANDS.find(c => c.name === cmdName);
        if (command) {
          const messageWithElement = selectedElement
            ? `[Element: ${selectedElement}] ${cmdArgs || `Run ${command.name} optimization`}`
            : (cmdArgs || `Run ${command.name} optimization`);
          onSendMessage(messageWithElement, cmdName);
          setInput("");
          onClearSelectedElement?.();
          return;
        }
      }
      // Include selected element context if present
      const messageWithElement = selectedElement
        ? `[Element: ${selectedElement}] ${input.trim()}`
        : input.trim();
      onSendMessage(messageWithElement);
      setInput("");
      onClearSelectedElement?.();
    }
  }

  function handleSuggestionClick(prompt: string) {
    setInput(prompt);
    textareaRef.current?.focus();
  }

  function handleCommandSelect(cmd: ChatCommand) {
    setInput(`/${cmd.name} `);
    textareaRef.current?.focus();
    setShowCommands(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === "Escape") {
      setShowCommands(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <EmptyState
            hasFiles={hasFiles}
            files={files}
            onSuggestionClick={handleSuggestionClick}
          />
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
          {/* Command suggestions dropdown */}
          {showCommands && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-900 border border-zinc-700/50 rounded-xl overflow-hidden shadow-xl z-10">
              <div className="px-3 py-2 border-b border-zinc-800/50">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Commands</p>
              </div>
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.name}
                  type="button"
                  onClick={() => handleCommandSelect(cmd)}
                  className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-zinc-800/50 transition-colors text-left"
                >
                  <div className={`p-1.5 rounded-lg ${MODEL_CONFIG[cmd.model].bgColor}`}>
                    {cmd.icon === "Pencil" && <Pencil className={`h-4 w-4 ${MODEL_CONFIG[cmd.model].color}`} />}
                    {cmd.icon === "SlidersHorizontal" && <SlidersHorizontal className={`h-4 w-4 ${MODEL_CONFIG[cmd.model].color}`} />}
                    {cmd.icon === "Search" && <Search className={`h-4 w-4 ${MODEL_CONFIG[cmd.model].color}`} />}
                    {cmd.icon === "Smartphone" && <Smartphone className={`h-4 w-4 ${MODEL_CONFIG[cmd.model].color}`} />}
                    {cmd.icon === "Palette" && <Palette className={`h-4 w-4 ${MODEL_CONFIG[cmd.model].color}`} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">/{cmd.name}</span>
                      <Badge variant="outline" className={`text-[9px] ${MODEL_CONFIG[cmd.model].bgColor} ${MODEL_CONFIG[cmd.model].color} ${MODEL_CONFIG[cmd.model].borderColor}`}>
                        {MODEL_CONFIG[cmd.model].label}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500">{cmd.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected Element Badge */}
          {selectedElement && (
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 gap-1.5 pr-1"
              >
                <MousePointer2 className="h-3 w-3" />
                <code className="font-mono text-[10px]">{selectedElement}</code>
                <button
                  type="button"
                  onClick={onClearSelectedElement}
                  className="p-0.5 rounded hover:bg-emerald-500/30 ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
              <span className="text-[10px] text-zinc-500">Target element</span>
            </div>
          )}

          {/* Textarea Container */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedElement ? `What do you want to change on ${selectedElement}?` : (hasFiles ? "What would you like to change?" : "Describe what you want to build...")}
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
        </div>
        <p className="text-[10px] text-zinc-600 mt-2 text-center">
          Press Enter to send • Type <span className="text-zinc-500">/</span> for commands
        </p>
      </form>
    </div>
  );
}

function EmptyState({
  hasFiles,
  files,
  onSuggestionClick
}: {
  hasFiles: boolean;
  files: GeneratedFile[];
  onSuggestionClick: (prompt: string) => void;
}) {
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const suggestionsLoaded = useRef(false);

  // Fetch AI suggestions when files exist
  useEffect(() => {
    // Only fetch if we have files and haven't loaded yet
    const htmlFiles = files.filter(f => f.path.match(/\.(html|astro|css)$/));
    if (hasFiles && htmlFiles.length > 0 && !suggestionsLoaded.current) {
      suggestionsLoaded.current = true;
      setLoadingSuggestions(true);

      fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ existingFiles: files }),
      })
        .then(res => {
          if (!res.ok) throw new Error("API error");
          return res.json();
        })
        .then(data => {
          if (data.suggestions && Array.isArray(data.suggestions)) {
            setAiSuggestions(data.suggestions);
          }
        })
        .catch(err => {
          console.error("Failed to fetch suggestions:", err);
        })
        .finally(() => setLoadingSuggestions(false));
    }
  }, [hasFiles, files]);

  if (!hasFiles) {
    // No files yet - building mode
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl blur-xl opacity-30 animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-violet-400" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">
          Let&apos;s build something
        </h2>
        <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
          Describe the website you want to create and I&apos;ll generate it for you.
        </p>
      </div>
    );
  }

  // Has files - modification mode
  return (
    <div className="h-full flex flex-col px-4 py-6 overflow-y-auto">
      <div className="text-center mb-6">
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl blur-xl opacity-20" />
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
            <Wand2 className="h-7 w-7 text-violet-400" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-white mb-1">
          What would you like to change?
        </h2>
        <p className="text-zinc-500 text-sm">
          Tell me what to modify, add, or improve
        </p>
      </div>

      {/* AI Suggestions from Haiku */}
      {(loadingSuggestions || aiSuggestions.length > 0) && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            <p className="text-[10px] text-emerald-400 uppercase tracking-wider">AI Suggestions</p>
          </div>
          {loadingSuggestions ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />
              <span className="ml-2 text-sm text-zinc-500">Analyzing your site...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {aiSuggestions.map((suggestion, index) => {
                const IconComponent = CATEGORY_ICONS[suggestion.category] || Wand2;
                return (
                  <button
                    key={index}
                    onClick={() => onSuggestionClick(suggestion.prompt)}
                    className="
                      w-full flex items-center gap-3 p-3 rounded-xl text-left
                      bg-emerald-500/10 border border-emerald-500/20
                      hover:bg-emerald-500/20 hover:border-emerald-500/30
                      transition-all group
                    "
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors shrink-0">
                      <IconComponent className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-300 group-hover:text-emerald-200 transition-colors">
                        {suggestion.label}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {suggestion.prompt}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="mt-auto p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          <span className="text-violet-400">Tip:</span> Be specific about what you want.
          Instead of &quot;make it better&quot;, try &quot;increase font size and add more padding around sections&quot;.
        </p>
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
            <div className="prose prose-sm prose-invert max-w-none">
              <MarkdownContent content={textContent} />
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

// Markdown content renderer with styling
function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="text-zinc-300 leading-relaxed mb-3 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
        em: ({ children }) => <em className="text-zinc-200 italic">{children}</em>,
        ul: ({ children }) => <ul className="list-disc list-inside space-y-1.5 mb-3 text-zinc-300">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1.5 mb-3 text-zinc-300">{children}</ol>,
        li: ({ children }) => <li className="text-zinc-300">{children}</li>,
        h1: ({ children }) => <h1 className="text-xl font-bold text-white mb-3 mt-4 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-bold text-white mb-2 mt-4 first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-semibold text-white mb-2 mt-3 first:mt-0">{children}</h3>,
        code: ({ children, className }) => {
          const isInline = !className;
          if (isInline) {
            return <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-violet-300 text-xs font-mono">{children}</code>;
          }
          return <code className="block p-3 rounded-lg bg-zinc-900 text-zinc-300 text-xs font-mono overflow-x-auto">{children}</code>;
        },
        pre: ({ children }) => <pre className="mb-3">{children}</pre>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-violet-500/50 pl-3 py-1 my-3 text-zinc-400 italic">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a href={href} className="text-violet-400 hover:text-violet-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        hr: () => <hr className="border-zinc-700/50 my-4" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function AssistantMessage({ message }: { message: ChatMessage }) {
  const { textContent, codeBlocks } = parseMessageContent(message.content);
  const model = message.model || "opus";
  const modelConfig = MODEL_CONFIG[model];

  return (
    <div className="flex gap-3">
      <Avatar className={`h-8 w-8 shrink-0 ring-2 ${model === "sonnet" ? "ring-blue-500/20" : model === "haiku" ? "ring-emerald-500/20" : "ring-violet-500/20"}`}>
        <AvatarFallback className={`text-white ${
          model === "sonnet" ? "bg-gradient-to-br from-blue-500 to-cyan-500" :
          model === "haiku" ? "bg-gradient-to-br from-emerald-500 to-teal-500" :
          "bg-gradient-to-br from-violet-500 to-fuchsia-500"
        }`}>
          <Sparkles className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2 mb-2">
          <span className="font-medium text-sm text-white">Claude</span>
          <div className="flex items-center gap-1.5 group relative">
            <Badge
              variant="outline"
              className={`text-[9px] ${modelConfig.bgColor} ${modelConfig.color} ${modelConfig.borderColor}`}
            >
              <Bot className="h-3 w-3 mr-1" />
              {modelConfig.label}
            </Badge>
          </div>
          {message.routingReason && (
            <span className="text-[9px] text-zinc-600 italic">
              • {message.routingReason}
            </span>
          )}
          {message.command && (
            <Badge
              variant="outline"
              className="text-[9px] bg-zinc-800/50 text-zinc-400 border-zinc-700/50"
            >
              /{message.command}
            </Badge>
          )}
          <span className="text-[10px] text-zinc-600">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {message.files && message.files.length > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30"
            >
              <Check className="h-3 w-3 mr-1" />
              {message.files.length} file{message.files.length > 1 ? 's' : ''} updated
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          {/* Text content with markdown */}
          {textContent && (
            <div className="prose prose-sm prose-invert max-w-none">
              <MarkdownContent content={textContent} />
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
  const partialFilePattern = /FILE:\s*[^\n]+\n```[\s\S]*$/;
  if (partialFilePattern.test(textContent)) {
    hasPartialFile = true;
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
