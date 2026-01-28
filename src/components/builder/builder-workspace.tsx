"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ChatPanel } from "./chat-panel";
import { PreviewPanel } from "./preview-panel";
import { FileTree } from "./file-tree";
import { CommitStatus } from "./commit-status";
import { ProjectSettings } from "./project-settings";
import { DeployPanel } from "./deploy-panel";
import { HistoryPanel } from "./history-panel";
import { GeneratedFile, ChatMessage, VibesitesConfig, ModelType, DesignReferences, ElementContext } from "@/types/project";
import { DESIGN_PRESETS } from "./chat-panel";
import { getProjectFiles, commitFiles, getProjectConfig, saveProjectConfig } from "@/lib/github-files";
import { getAnthropicApiKey } from "@/lib/storage";
import { parseGeneratedFiles } from "@/lib/claude";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  ArrowLeft,
  Rocket,
  Files,
  Loader2,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  Terminal,
  History,
} from "lucide-react";
import Link from "next/link";

// Code generation loading overlay component
function GeneratingOverlay({
  streamingContent,
  error,
  onDismiss
}: {
  streamingContent: string;
  error: string | null;
  onDismiss: () => void;
}) {
  const codeLines = streamingContent.split('\n').slice(-30);

  return (
    <div className="fixed inset-0 z-50 bg-[#030306]/95 backdrop-blur-xl flex items-center justify-center">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-[100px]"
          style={{ background: error
            ? "radial-gradient(circle, rgba(239,68,68,0.8) 0%, rgba(236,72,153,0.4) 50%, transparent 70%)"
            : "radial-gradient(circle, rgba(6,182,212,0.6) 0%, rgba(139,92,246,0.4) 50%, transparent 70%)"
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto px-8">
        {/* Header */}
        <div className="text-center mb-8">
          {error ? (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 mb-4">
                <Terminal className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Generation Failed</h2>
              <p className="text-red-400">{error}</p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 mb-4">
                <Terminal className="h-8 w-8 text-white animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 font-mono">Building your website</h2>
              <p className="text-zinc-400">Claude is writing code for you...</p>
            </>
          )}
        </div>

        {/* Code preview window */}
        <div className="relative bg-[#0a0a0f] rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-cyan-500/10">
          {/* Window header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
            <div className="flex gap-1.5">
              <div className={`w-3 h-3 rounded-full ${error ? 'bg-red-500' : 'bg-red-500/80'}`} />
              <div className={`w-3 h-3 rounded-full ${error ? 'bg-red-500/50' : 'bg-yellow-500/80'}`} />
              <div className={`w-3 h-3 rounded-full ${error ? 'bg-red-500/30' : 'bg-green-500/80'}`} />
            </div>
            <span className="text-xs text-zinc-500 ml-2 font-mono">
              {error ? 'error' : 'generating...'}
            </span>
          </div>

          {/* Code content */}
          <div className="p-4 h-[400px] overflow-hidden relative">
            {error ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-zinc-500 mb-4">Unable to generate website</p>
                <p className="text-sm text-zinc-600 max-w-md">
                  {error.includes('credit')
                    ? 'The API key needs more credits. Please add credits to continue generating websites.'
                    : 'There was an error connecting to the AI service. Please try again.'}
                </p>
              </div>
            ) : (
              <>
                <pre className="font-mono text-sm leading-relaxed">
                  {codeLines.length > 0 ? codeLines.map((line, i) => (
                    <div
                      key={i}
                      className="text-zinc-400"
                      style={{
                        opacity: Math.min(1, (i + 1) / codeLines.length),
                        animation: 'fadeIn 0.3s ease-out',
                      }}
                    >
                      <span className="text-zinc-600 select-none mr-4">{String(i + 1).padStart(3, ' ')}</span>
                      <span className="text-emerald-400">{line.includes('FILE:') ? line : ''}</span>
                      <span className="text-violet-300">{line.includes('<') && !line.includes('FILE:') ? line : ''}</span>
                      <span className="text-zinc-300">{!line.includes('<') && !line.includes('FILE:') ? line : ''}</span>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                      <Loader2 className="h-8 w-8 animate-spin mb-4" />
                      <p>Initializing Claude...</p>
                    </div>
                  )}
                </pre>

                {codeLines.length > 0 && (
                  <>
                    {/* Fade gradient at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />

                    {/* Blinking cursor */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      <div className="w-2 h-5 bg-violet-400 animate-pulse" />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Progress indicator or dismiss button */}
        <div className="mt-6 flex justify-center">
          {error ? (
            <button
              onClick={onDismiss}
              className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 transition-all"
            >
              Continue to Project
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2 text-sm text-zinc-500">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                <span>This might take a minute or two</span>
              </div>
              <span className="text-zinc-600 text-xs">Feel free to leave this tab — we&apos;ll notify you when ready</span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

interface BuilderWorkspaceProps {
  owner: string;
  repo: string;
  accessToken: string;
}

export function BuilderWorkspace({
  owner,
  repo,
  accessToken,
}: BuilderWorkspaceProps) {
  const searchParams = useSearchParams();
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [lastCommit, setLastCommit] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatVisible, setChatVisible] = useState(true);
  const [showDeployPanel, setShowDeployPanel] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [projectConfig, setProjectConfig] = useState<VibesitesConfig | null>(null);
  const [showGeneratingOverlay, setShowGeneratingOverlay] = useState(false);
  const [overlayError, setOverlayError] = useState<string | null>(null);
  const [designUrls, setDesignUrls] = useState<string[]>([]);
  const [designPresets, setDesignPresets] = useState<string[]>([]);
  const [selectedElement, setSelectedElement] = useState<ElementContext | null>(null);
  const autoGenerateTriggered = useRef(false);
  const pendingPrompt = useRef<string | null>(null);
  const pendingReferences = useRef<DesignReferences | null>(null);
  const loadingStarted = useRef(false);

  useEffect(() => {
    // Prevent double loading in React strict mode
    if (loadingStarted.current) return;
    loadingStarted.current = true;

    async function loadProject() {
      try {
        console.log("Loading project:", owner, repo);

        // Check for initial prompt and references BEFORE loading
        if (searchParams.get("autoGenerate") === "true" && !autoGenerateTriggered.current) {
          const initialPrompt = sessionStorage.getItem("vibesites_initial_prompt");
          const initialReferences = sessionStorage.getItem("vibesites_initial_references");

          if (initialPrompt) {
            pendingPrompt.current = initialPrompt;
            sessionStorage.removeItem("vibesites_initial_prompt");
          }

          if (initialReferences) {
            try {
              pendingReferences.current = JSON.parse(initialReferences);
              sessionStorage.removeItem("vibesites_initial_references");
            } catch {
              // Invalid JSON, ignore
            }
          }
        }

        // Load files and config in parallel with timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Loading timed out after 30s")), 30000)
        );

        const loadPromise = Promise.all([
          getProjectFiles(accessToken, owner, repo),
          getProjectConfig(accessToken, owner, repo),
        ]);

        const result = await Promise.race([loadPromise, timeoutPromise]) as [GeneratedFile[], VibesitesConfig | null];
        const [projectFiles, config] = result;

        console.log("Loaded files:", projectFiles.length, "Config:", config ? "yes" : "no");
        setFiles(projectFiles);
        setProjectConfig(config);
      } catch (err) {
        console.error("Failed to load project:", err);
        setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [accessToken, owner, repo, searchParams]);

  // Auto-generate on initial prompt - runs after loading completes
  useEffect(() => {
    if (!loading && pendingPrompt.current && !autoGenerateTriggered.current) {
      autoGenerateTriggered.current = true;
      const prompt = pendingPrompt.current;
      const references = pendingReferences.current;
      pendingPrompt.current = null;
      pendingReferences.current = null;

      // Small delay to ensure component is fully mounted
      setTimeout(() => {
        triggerGeneration(prompt, references);
      }, 100);
    }
  }, [loading]);

  async function triggerGeneration(prompt: string, references?: DesignReferences | null) {
    setShowGeneratingOverlay(true);
    setOverlayError(null);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
      timestamp: new Date(),
    };

    setMessages([userMessage]);
    setIsGenerating(true);
    setStreamingContent("");
    setError(null);

    // Build design reference context for prompt
    let designContext = "";
    if (references) {
      if (references.presets.length > 0) {
        const presetDetails = references.presets
          .map(id => DESIGN_PRESETS.find(p => p.id === id))
          .filter(Boolean)
          .map(p => `- ${p!.name}: ${p!.style}`)
          .join("\n");
        designContext += `\n\n## Design Style References:\n${presetDetails}`;
      }
      if (references.urls.length > 0) {
        designContext += `\n\n## Reference URLs to draw inspiration from:\n${references.urls.map(u => `- ${u}`).join("\n")}`;
      }
    }

    try {
      const apiKey = getAnthropicApiKey();
      if (!apiKey) {
        throw new Error("API key required. Please add your Anthropic API key in Settings.");
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          existingFiles: files,
          projectContext: projectConfig?.projectContext,
          projectName: projectConfig?.name || repo,
          buildMode: projectConfig?.buildMode || "design",
          designContext,
          apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let streamError: string | null = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                  streamError = parsed.error;
                } else if (parsed.text) {
                  fullContent += parsed.text;
                  setStreamingContent(fullContent);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      // If there was a stream error, throw it
      if (streamError) {
        throw new Error(streamError);
      }

      const generatedFiles = parseGeneratedFiles(fullContent);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: fullContent,
        files: generatedFiles,
        timestamp: new Date(),
        model: "opus",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (generatedFiles.length > 0) {
        const updatedFiles = [...files];
        for (const newFile of generatedFiles) {
          const existingIndex = updatedFiles.findIndex((f) => f.path === newFile.path);
          if (existingIndex >= 0) {
            updatedFiles[existingIndex] = newFile;
          } else {
            updatedFiles.push(newFile);
          }
        }
        setFiles(updatedFiles);
        await autoCommit(generatedFiles, prompt);
      }

      // Success - hide overlay
      setShowGeneratingOverlay(false);
    } catch (err) {
      console.error("Generation failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to generate website";
      setError(errorMessage);
      setOverlayError(errorMessage);
      // Keep overlay visible with error state
    } finally {
      setIsGenerating(false);
      setStreamingContent("");
    }
  }

  function dismissOverlay() {
    setShowGeneratingOverlay(false);
    setOverlayError(null);
  }

  async function handleSaveContext(context: string) {
    const updatedConfig: VibesitesConfig = projectConfig || {
      version: "1.0",
      createdAt: new Date().toISOString(),
      name: repo,
      template: "custom",
    };

    updatedConfig.projectContext = context;

    await saveProjectConfig(accessToken, owner, repo, updatedConfig);
    setProjectConfig(updatedConfig);
  }

  async function handleSendMessage(content: string, command?: string) {
    // Build design reference context from workspace state
    let designContext = "";
    const hasReferences = designUrls.length > 0 || designPresets.length > 0;
    if (hasReferences) {
      if (designPresets.length > 0) {
        const presetDetails = designPresets
          .map(id => DESIGN_PRESETS.find(p => p.id === id))
          .filter(Boolean)
          .map(p => `- ${p!.name}: ${p!.style}`)
          .join("\n");
        designContext += `\n\n## Design Style References:\n${presetDetails}`;
      }
      if (designUrls.length > 0) {
        designContext += `\n\n## Reference URLs to draw inspiration from:\n${designUrls.map(u => `- ${u}`).join("\n")}`;
      }
    }

    // Add message to chat - show clean user input with optional element indicator
    // The technical context (HTML, selectors) is passed separately to the API
    let displayContent = command ? `/${command} ${content}` : content;

    // Add a subtle element indicator if an element is targeted (not the full HTML dump)
    if (selectedElement) {
      displayContent = `[→ ${selectedElement.selector}] ${displayContent}`;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: displayContent,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Then trigger generation (without overlay for follow-up messages)
    setIsGenerating(true);
    setStreamingContent("");
    setError(null);

    // Determine model and endpoint
    // Default to Sonnet for quality - Haiku only for explicit /text and /tweak commands
    let model: ModelType = "sonnet";
    let endpoint = "/api/edit";
    let routingReason = "";
    let maxTokens = 8192;

    // Get API key from localStorage
    const apiKey = getAnthropicApiKey();
    if (!apiKey) {
      setError("API key required. Please add your Anthropic API key in Settings.");
      setIsGenerating(false);
      return;
    }

    try {
      // If command is specified, use predetermined routing
      // ONLY /text and /tweak use Haiku with limited tokens
      if (command === "text") {
        model = "haiku";
        endpoint = "/api/quick";
        maxTokens = 2048; // Limited for text-only changes
        content = `Update the text/copy: ${content}`;
        routingReason = "Text changes (Haiku - limited)";
      } else if (command === "tweak") {
        model = "haiku";
        endpoint = "/api/quick";
        maxTokens = 2048; // Limited for style tweaks
        content = `Make this design adjustment: ${content}`;
        routingReason = "Quick tweak (Haiku - limited)";
      } else if (command === "seo") {
        model = "sonnet";
        endpoint = "/api/seo";
        maxTokens = 8192;
        routingReason = "SEO optimization";
      } else if (command === "mobile") {
        model = "sonnet";
        endpoint = "/api/mobile";
        maxTokens = 8192;
        routingReason = "Mobile optimization";
      } else if (command === "design") {
        model = "sonnet";
        endpoint = "/api/design";
        maxTokens = 8192;
        routingReason = "Design enhancement";
      } else {
        // Use router to classify the request
        // Router will use Sonnet for classification and route appropriately
        try {
          const routeResponse = await fetch("/api/route-request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: content,
              hasExistingFiles: files.length > 0,
              hasElement: !!selectedElement,
              elementInfo: selectedElement ? {
                selector: selectedElement.selector,
                section: selectedElement.section,
                text: selectedElement.text,
              } : null,
              apiKey,
            }),
          });

          if (routeResponse.ok) {
            const routeData = await routeResponse.json();
            model = routeData.model as ModelType;
            endpoint = routeData.endpoint || "/api/edit";
            maxTokens = routeData.maxTokens || 8192;
            routingReason = routeData.reasoning || "";
          }
        } catch (routeError) {
          console.log("Router error, using Sonnet fallback:", routeError);
          // Default to Sonnet on routing error - never downgrade to Haiku
          model = "sonnet";
          endpoint = "/api/edit";
          maxTokens = 8192;
          routingReason = "Fallback to Sonnet";
        }
      }

      console.log(`Routed to ${model} (${endpoint}, ${maxTokens} tokens): ${routingReason}`);

      // Build conversation history for context (last 10 messages max to avoid token limits)
      const recentMessages = messages.slice(-10).map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: content,
          existingFiles: files,
          projectContext: projectConfig?.projectContext,
          projectName: projectConfig?.name || repo,
          buildMode: projectConfig?.buildMode || "design",
          command,
          designContext,
          maxTokens,
          conversationHistory: recentMessages,
          elementContext: selectedElement ? {
            selector: selectedElement.selector,
            section: selectedElement.section,
            parent: selectedElement.parent,
            text: selectedElement.text,
            html: selectedElement.html,
          } : null,
          apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let streamError: string | null = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                  streamError = parsed.error;
                } else if (parsed.text) {
                  fullContent += parsed.text;
                  setStreamingContent(fullContent);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      // If there was a stream error, throw it
      if (streamError) {
        throw new Error(streamError);
      }

      const generatedFiles = parseGeneratedFiles(fullContent);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: fullContent,
        files: generatedFiles,
        timestamp: new Date(),
        model,
        command,
        routingReason,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (generatedFiles.length > 0) {
        const updatedFiles = [...files];
        for (const newFile of generatedFiles) {
          const existingIndex = updatedFiles.findIndex((f) => f.path === newFile.path);
          if (existingIndex >= 0) {
            updatedFiles[existingIndex] = newFile;
          } else {
            updatedFiles.push(newFile);
          }
        }
        setFiles(updatedFiles);
        await autoCommit(generatedFiles, content);
      }

    } catch (err) {
      console.error("Generation failed:", err);
      setError(err instanceof Error ? err.message : "Failed to generate website");
    } finally {
      setIsGenerating(false);
      setStreamingContent("");
    }
  }

  async function autoCommit(newFiles: GeneratedFile[], userPrompt: string) {
    setIsCommitting(true);
    try {
      const commitMessage = `Update from boom.git: ${userPrompt.slice(0, 50)}${
        userPrompt.length > 50 ? "..." : ""
      }`;
      const sha = await commitFiles(
        accessToken,
        owner,
        repo,
        newFiles,
        commitMessage
      );
      setLastCommit(sha);
    } catch (err) {
      console.error("Commit failed:", err);
      setError("Failed to commit changes to GitHub");
    } finally {
      setIsCommitting(false);
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full blur-xl opacity-50 animate-pulse" />
            <Loader2 className="h-10 w-10 animate-spin text-white relative" />
          </div>
          <p className="text-zinc-500 text-sm font-medium tracking-wide">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0b] overflow-hidden">
      {/* Generating Overlay */}
      {showGeneratingOverlay && (
        <GeneratingOverlay
          streamingContent={streamingContent}
          error={overlayError}
          onDismiss={dismissOverlay}
        />
      )}

      {/* Header */}
      <header className="h-14 border-b border-zinc-800/50 bg-[#0a0a0b]/80 backdrop-blur-xl flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Link>
          </Button>

          <div className="h-5 w-px bg-zinc-800" />

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className={`absolute inset-0 rounded-lg blur opacity-50 ${
                projectConfig?.buildMode === "performance"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                  : "bg-gradient-to-r from-cyan-500 to-violet-500"
              }`} />
              <div className={`relative h-7 w-7 rounded-lg flex items-center justify-center ${
                projectConfig?.buildMode === "performance"
                  ? "bg-gradient-to-br from-emerald-500 to-teal-500"
                  : "bg-gradient-to-br from-cyan-500 to-violet-600"
              }`}>
                <Terminal className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <span className="font-semibold text-white tracking-tight font-mono">{repo}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider ${
              projectConfig?.buildMode === "performance"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-cyan-500/20 text-cyan-400"
            }`}>
              {projectConfig?.buildMode === "performance" ? "Performance" : "Design"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CommitStatus
            isCommitting={isCommitting}
            lastCommit={lastCommit}
            owner={owner}
            repo={repo}
          />

          <div className="h-5 w-px bg-zinc-800 mx-1" />

          {/* Project Context Settings */}
          <ProjectSettings
            config={projectConfig}
            onSave={handleSaveContext}
            projectName={repo}
            designUrls={designUrls}
            designPresets={designPresets}
            onDesignUrlsChange={setDesignUrls}
            onDesignPresetsChange={setDesignPresets}
          />

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              >
                <Files className="h-4 w-4 mr-1.5" />
                Files
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-[#111113] border-zinc-800">
              <FileTree files={files} />
            </SheetContent>
          </Sheet>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistoryPanel(true)}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          >
            <History className="h-4 w-4 mr-1.5" />
            History
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeployPanel(true)}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          >
            <Rocket className="h-4 w-4 mr-1.5" />
            Deploy
          </Button>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 px-4 py-2.5 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400/70 hover:text-red-400 underline underline-offset-2 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main content */}
      <div id="builder-main-content" className="flex-1 flex overflow-hidden relative">
        {/* Chat Panel - Collapsible (always mounted to preserve state) */}
        <div
          id="chat-panel-container"
          className={`
            ${chatVisible ? 'w-[420px]' : 'w-0'}
            transition-all duration-300 ease-out
            border-r border-zinc-800/50 bg-[#111113] flex flex-col overflow-hidden shrink-0
          `}
        >
          <div className={`w-[420px] h-full ${chatVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-200`}>
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
              streamingContent={streamingContent}
              files={files}
              selectedElement={selectedElement}
              onClearSelectedElement={() => setSelectedElement(null)}
            />
          </div>
        </div>

        {/* Chat Toggle Button */}
        <button
          onClick={() => setChatVisible(!chatVisible)}
          className={`
            absolute left-0 top-1/2 -translate-y-1/2 z-40
            ${chatVisible ? 'translate-x-[408px]' : 'translate-x-0'}
            transition-all duration-300 ease-out
            h-20 w-6
            bg-zinc-800/80 hover:bg-zinc-700/80
            border border-zinc-700/50 border-l-0
            rounded-r-lg
            flex items-center justify-center
            text-zinc-400 hover:text-white
            backdrop-blur-sm
            group
          `}
          title={chatVisible ? "Hide chat" : "Show chat"}
        >
          {chatVisible ? (
            <PanelLeftClose className="h-4 w-4 group-hover:scale-110 transition-transform" />
          ) : (
            <PanelLeft className="h-4 w-4 group-hover:scale-110 transition-transform" />
          )}
        </button>

        {/* Floating Chat Button when collapsed */}
        {!chatVisible && (
          <button
            onClick={() => setChatVisible(true)}
            className="
              absolute left-4 bottom-4 z-40
              h-12 w-12
              bg-gradient-to-br from-violet-500 to-fuchsia-500
              hover:from-violet-400 hover:to-fuchsia-400
              rounded-full
              flex items-center justify-center
              text-white
              shadow-lg shadow-violet-500/25
              transition-all duration-200
              hover:scale-105 hover:shadow-xl hover:shadow-violet-500/30
            "
            title="Open chat"
          >
            <MessageSquare className="h-5 w-5" />
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-white text-violet-600 text-xs font-bold rounded-full flex items-center justify-center">
                {messages.length}
              </span>
            )}
          </button>
        )}

        {/* Preview Panel */}
        <div id="preview-panel-container" className="flex-1 flex flex-col min-w-0 h-full bg-[#0a0a0b]">
          <PreviewPanel
            files={files}
            onElementSelect={(elementInfo) => {
              setSelectedElement(elementInfo);
              setChatVisible(true);
            }}
          />
        </div>
      </div>

      {/* Deploy Panel */}
      <DeployPanel
        owner={owner}
        repo={repo}
        accessToken={accessToken}
        isOpen={showDeployPanel}
        onClose={() => setShowDeployPanel(false)}
      />

      {/* History Panel */}
      <HistoryPanel
        owner={owner}
        repo={repo}
        accessToken={accessToken}
        isOpen={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
        onRevert={async () => {
          // Reload project files after revert
          const updatedFiles = await getProjectFiles(accessToken, owner, repo);
          setFiles(updatedFiles);
        }}
      />
    </div>
  );
}
