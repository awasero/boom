"use client";

import { useEditorWorkspace } from "@/hooks/use-editor-workspace";
import { useAiGeneration } from "@/hooks/use-ai-generation";
import { ChatPanel } from "./chat-panel";
import { PreviewPanel } from "./preview-panel";
import { DeckPreview } from "./deck-preview";
import { FileTree } from "./file-tree";
import { ProjectType, ChatMessage } from "@/types/project";
import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface EditorWorkspaceProps {
  projectId: string;
  projectName: string;
  projectType: ProjectType;
}

export function EditorWorkspace({
  projectId,
  projectName,
  projectType,
}: EditorWorkspaceProps) {
  const workspace = useEditorWorkspace(projectType);
  const [showFileTree, setShowFileTree] = useState(false);

  const ai = useAiGeneration({
    onFilesGenerated: (files) => {
      workspace.updateFiles(files);
    },
  });

  const handleSendMessage = async (prompt: string) => {
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

  return (
    <div className="h-screen flex bg-background">
      {/* File Tree (collapsible) */}
      {showFileTree && workspace.files.length > 0 && (
        <div className="w-56 border-r border-border bg-card flex-shrink-0">
          <FileTree
            files={workspace.files}
            currentPage={workspace.currentPage}
            onPageSelect={workspace.setCurrentPage}
          />
        </div>
      )}

      {/* Chat Panel */}
      <div className="w-[420px] flex-shrink-0 border-r border-border flex flex-col">
        <div className="h-12 border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {workspace.files.length > 0 && (
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
        {projectType === "deck" ? (
          <DeckPreview
            files={workspace.files}
            currentPage={workspace.currentPage}
            onPageSelect={workspace.setCurrentPage}
            onElementSelect={workspace.setSelectedElement}
          />
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
  );
}
