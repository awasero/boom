"use client";

import { useState, useEffect } from "react";
import { ChatPanel } from "./chat-panel";
import { PreviewPanel } from "./preview-panel";
import { FileTree } from "./file-tree";
import { CommitStatus } from "./commit-status";
import { GeneratedFile, ChatMessage } from "@/types/project";
import { getProjectFiles, commitFiles } from "@/lib/github-files";
import { generateWebsite } from "@/lib/claude";
import { getAnthropicApiKey } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  ArrowLeft,
  Cloud,
  Files,
  Loader2,
  Settings,
  Sparkles,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import Link from "next/link";

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
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [lastCommit, setLastCommit] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatVisible, setChatVisible] = useState(true);

  useEffect(() => {
    async function loadFiles() {
      try {
        const projectFiles = await getProjectFiles(accessToken, owner, repo);
        setFiles(projectFiles);
      } catch (err) {
        console.error("Failed to load files:", err);
      } finally {
        setLoading(false);
      }
    }

    loadFiles();
  }, [accessToken, owner, repo]);

  async function handleSendMessage(content: string) {
    const apiKey = getAnthropicApiKey();

    if (!apiKey) {
      setError("Please set your Anthropic API key in Settings first.");
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);
    setStreamingContent("");
    setError(null);

    try {
      const { content: responseContent, files: generatedFiles } =
        await generateWebsite(apiKey, content, files, (text) => {
          setStreamingContent(text);
        });

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: responseContent,
        files: generatedFiles,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (generatedFiles.length > 0) {
        const updatedFiles = [...files];
        for (const newFile of generatedFiles) {
          const existingIndex = updatedFiles.findIndex(
            (f) => f.path === newFile.path
          );
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
      setError(
        err instanceof Error ? err.message : "Failed to generate website"
      );
    } finally {
      setIsGenerating(false);
      setStreamingContent("");
    }
  }

  async function autoCommit(newFiles: GeneratedFile[], userPrompt: string) {
    setIsCommitting(true);
    try {
      const commitMessage = `Update from BooVibe: ${userPrompt.slice(0, 50)}${
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
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg blur opacity-50" />
              <div className="relative h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
            <span className="font-semibold text-white tracking-tight">{repo}</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 uppercase tracking-wider">
              Opus
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
            asChild
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          >
            <Link href={`/project/${owner}/${repo}/deploy`}>
              <Cloud className="h-4 w-4 mr-1.5" />
              Deploy
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          >
            <Link href="/settings">
              <Settings className="h-4 w-4" />
            </Link>
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
      <div className="flex-1 flex overflow-hidden relative">
        {/* Chat Panel - Collapsible */}
        <div
          className={`
            ${chatVisible ? 'w-[420px]' : 'w-0'}
            transition-all duration-300 ease-out
            border-r border-zinc-800/50 bg-[#111113] flex flex-col overflow-hidden shrink-0
          `}
        >
          {chatVisible && (
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
              streamingContent={streamingContent}
            />
          )}
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
        <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0b]">
          <PreviewPanel files={files} />
        </div>
      </div>
    </div>
  );
}
