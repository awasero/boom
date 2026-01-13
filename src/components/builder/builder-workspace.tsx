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
        // Merge new files with existing
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

        // Auto-commit
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
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="h-14 border-b bg-white flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">{repo}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CommitStatus
            isCommitting={isCommitting}
            lastCommit={lastCommit}
            owner={owner}
            repo={repo}
          />

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Files className="h-4 w-4 mr-1" />
                Files
              </Button>
            </SheetTrigger>
            <SheetContent>
              <FileTree files={files} />
            </SheetContent>
          </Sheet>

          <Button variant="outline" size="sm" asChild>
            <Link href={`/project/${owner}/${repo}/deploy`}>
              <Cloud className="h-4 w-4 mr-1" />
              Deploy
            </Link>
          </Button>

          <Button variant="ghost" size="sm" asChild>
            <Link href="/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="w-1/2 border-r bg-white flex flex-col">
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
            streamingContent={streamingContent}
          />
        </div>

        {/* Preview Panel */}
        <div className="w-1/2 flex flex-col">
          <PreviewPanel files={files} />
        </div>
      </div>
    </div>
  );
}
