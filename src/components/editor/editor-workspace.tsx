"use client";

import { useEditorWorkspace } from "@/hooks/use-editor-workspace";
import { useAiGeneration } from "@/hooks/use-ai-generation";
import { ChatPanel } from "./chat-panel";
import { PreviewPanel } from "./preview-panel";
import { DeckPreview } from "./deck-preview";
import { FileTree } from "./file-tree";
import { EditorTabs } from "./editor-tabs";
import { DeckList } from "./deck-list";
import { ChatMessage, BrandNucleus } from "@/types/project";
import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface EditorWorkspaceProps {
  projectId: string;
  projectName: string;
  brandNucleus: BrandNucleus | null;
}

export function EditorWorkspace({
  projectId,
  projectName,
  brandNucleus,
}: EditorWorkspaceProps) {
  const workspace = useEditorWorkspace();
  const [showFileTree, setShowFileTree] = useState(false);

  const ai = useAiGeneration({
    onFilesGenerated: (files) => {
      workspace.updateFiles(files);
    },
  });

  const handleSendMessage = async (prompt: string) => {
    // Handle action commands client-side
    if (workspace.activeCommand === "publish") {
      await handlePublish(prompt);
      workspace.setActiveCommand(null);
      return;
    }
    if (workspace.activeCommand === "export") {
      await handleExport();
      workspace.setActiveCommand(null);
      return;
    }
    if (workspace.activeCommand === "deploy-preview") {
      await handleDeployPreview(prompt);
      workspace.setActiveCommand(null);
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
      timestamp: new Date(),
      command: workspace.activeCommand || undefined,
    };
    workspace.addMessage(userMessage);

    // Route to the correct endpoint
    const route = await workspace.routeMessage(prompt);

    // Build request body
    const body: Record<string, unknown> = {
      prompt,
      projectId,
      existingFiles: workspace.files,
      projectName,
      conversationHistory: workspace.messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };

    if (brandNucleus) {
      body.brandNucleus = brandNucleus;
    }
    if (workspace.selectedElement) {
      body.elementContext = workspace.selectedElement;
    }
    if (workspace.activeCommand) {
      body.command = workspace.activeCommand;
    }
    if (route.maxTokens) {
      body.maxTokens = route.maxTokens;
    }

    // Generate
    const response = await ai.generate(route.endpoint, body);
    if (response) {
      response.model = route.model;
      workspace.addMessage(response);
    }

    // Clear command and element after use
    workspace.setActiveCommand(null);
    workspace.setSelectedElement(null);
  };

  const handlePublish = async (prompt: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt || "Deploy to Cloudflare",
      timestamp: new Date(),
      command: "publish",
    };
    workspace.addMessage(userMessage);

    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await response.json();
      const resultMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.ok
          ? `Deployed successfully!\n\nYour site is live at: ${data.url}`
          : `Deploy failed: ${data.error}`,
        timestamp: new Date(),
      };
      workspace.addMessage(resultMessage);
    } catch {
      workspace.addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Deploy failed. Please try again.",
        timestamp: new Date(),
      });
    }
  };

  const handleDeployPreview = async (prompt: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt || "Preview deploy",
      timestamp: new Date(),
      command: "deploy-preview",
    };
    workspace.addMessage(userMessage);

    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, preview: true }),
      });
      const data = await response.json();
      const resultMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.ok
          ? `Preview deployed!\n\nPreview URL: ${data.url}`
          : `Preview deploy failed: ${data.error}`,
        timestamp: new Date(),
      };
      workspace.addMessage(resultMessage);
    } catch {
      workspace.addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Preview deploy failed. Please try again.",
        timestamp: new Date(),
      });
    }
  };

  const handleExport = async () => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: "Export project files",
      timestamp: new Date(),
      command: "export",
    };
    workspace.addMessage(userMessage);

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.files, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${projectName.toLowerCase().replace(/\s+/g, "-")}-export.json`;
        a.click();
        URL.revokeObjectURL(url);

        workspace.addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Exported ${data.files.length} files successfully. Download started.`,
          timestamp: new Date(),
        });
      } else {
        const data = await response.json();
        workspace.addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Export failed: ${data.error}`,
          timestamp: new Date(),
        });
      }
    } catch {
      workspace.addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Export failed. Please try again.",
        timestamp: new Date(),
      });
    }
  };

  const handleNewDeck = () => {
    workspace.setActiveTab("decks");
    workspace.setActiveCommand("new-deck");
  };

  const activeDeck = workspace.decks.find(
    (d) => d.id === workspace.activeDeckId
  );

  // Convert active deck to GeneratedFile[] for DeckPreview
  const deckPreviewFiles = activeDeck
    ? [
        {
          path: "index.html",
          content: activeDeck.slides
            .map(
              (s) =>
                `<div class="slide${s.order === 0 ? " active" : ""}">${s.content}</div>`
            )
            .join("\n"),
        },
      ]
    : [];

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Editor Tabs */}
      <EditorTabs
        activeTab={workspace.activeTab}
        onTabChange={workspace.setActiveTab}
        deckCount={workspace.decks.length}
      />

      <div className="flex-1 flex min-h-0">
        {/* Sidebar: FileTree or DeckList */}
        {workspace.activeTab === "website" &&
          showFileTree &&
          workspace.files.length > 0 && (
            <div className="w-56 border-r border-border bg-card flex-shrink-0">
              <FileTree
                files={workspace.files}
                currentPage={workspace.currentPage}
                onPageSelect={workspace.setCurrentPage}
              />
            </div>
          )}

        {workspace.activeTab === "decks" && (
          <div className="w-56 border-r border-border bg-card flex-shrink-0">
            <DeckList
              decks={workspace.decks}
              activeDeckId={workspace.activeDeckId}
              onDeckSelect={workspace.setActiveDeck}
              onDeckDelete={workspace.deleteDeck}
              onNewDeck={handleNewDeck}
            />
          </div>
        )}

        {/* Chat Panel */}
        <div className="w-[420px] flex-shrink-0 border-r border-border flex flex-col">
          <div className="h-12 border-b border-border flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              {workspace.activeTab === "website" &&
                workspace.files.length > 0 && (
                  <button
                    onClick={() => setShowFileTree(!showFileTree)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {showFileTree ? (
                      <PanelLeftClose className="h-4 w-4" />
                    ) : (
                      <PanelLeftOpen className="h-4 w-4" />
                    )}
                  </button>
                )}
              <h1 className="text-sm font-medium truncate">{projectName}</h1>
            </div>
          </div>
          <ChatPanel
            messages={workspace.messages}
            isGenerating={ai.isGenerating}
            streamingContent={ai.streamingContent}
            selectedElement={workspace.selectedElement}
            onSendMessage={handleSendMessage}
            onClearMessages={workspace.clearMessages}
            onAbort={ai.abort}
            onCommandSelect={workspace.setActiveCommand}
            activeCommand={workspace.activeCommand}
          />
        </div>

        {/* Preview Panel */}
        <div className="flex-1 min-w-0">
          {workspace.activeTab === "decks" ? (
            activeDeck ? (
              <DeckPreview
                files={deckPreviewFiles}
                currentPage="index.html"
                onPageSelect={workspace.setCurrentPage}
                onElementSelect={workspace.setSelectedElement}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-background">
                <p className="text-sm">Select a deck or create a new one</p>
                <p className="text-xs mt-1 opacity-60">
                  Use /new-deck in the chat to get started
                </p>
              </div>
            )
          ) : (
            <PreviewPanel
              files={workspace.files}
              currentPage={workspace.currentPage}
              onPageSelect={workspace.setCurrentPage}
              onElementSelect={workspace.setSelectedElement}
            />
          )}
        </div>
      </div>
    </div>
  );
}
