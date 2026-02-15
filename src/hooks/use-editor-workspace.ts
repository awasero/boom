"use client";

import { useState, useCallback } from "react";
import {
  GeneratedFile,
  ChatMessage,
  ElementContext,
  ProjectType,
} from "@/types/project";

interface WorkspaceState {
  files: GeneratedFile[];
  messages: ChatMessage[];
  selectedElement: ElementContext | null;
  activeCommand: string | null;
  currentPage: string;
  projectType: ProjectType;
}

export function useEditorWorkspace(projectType: ProjectType = "website") {
  const [state, setState] = useState<WorkspaceState>({
    files: [],
    messages: [],
    selectedElement: null,
    activeCommand: null,
    currentPage: "index.html",
    projectType,
  });

  const setFiles = useCallback((files: GeneratedFile[]) => {
    setState((prev) => ({ ...prev, files }));
  }, []);

  const updateFiles = useCallback((newFiles: GeneratedFile[]) => {
    setState((prev) => {
      const fileMap = new Map(prev.files.map((f) => [f.path, f]));
      for (const file of newFiles) {
        fileMap.set(file.path, file);
      }
      return { ...prev, files: Array.from(fileMap.values()) };
    });
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }, []);

  const clearMessages = useCallback(() => {
    setState((prev) => ({ ...prev, messages: [] }));
  }, []);

  const setSelectedElement = useCallback(
    (element: ElementContext | null) => {
      setState((prev) => ({ ...prev, selectedElement: element }));
    },
    []
  );

  const setActiveCommand = useCallback((command: string | null) => {
    setState((prev) => ({ ...prev, activeCommand: command }));
  }, []);

  const setCurrentPage = useCallback((page: string) => {
    setState((prev) => ({ ...prev, currentPage: page }));
  }, []);

  // Build the files string for prompts
  const getFilesString = useCallback(() => {
    let str = "";
    for (const file of state.files) {
      str += `\nFILE: ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n`;
    }
    return str;
  }, [state.files]);

  // Route a message to the correct API endpoint
  const routeMessage = useCallback(
    async (prompt: string) => {
      const response = await fetch("/api/route-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          hasExistingFiles: state.files.length > 0,
          hasElement: !!state.selectedElement,
          elementInfo: state.selectedElement
            ? JSON.stringify(state.selectedElement)
            : null,
          command: state.activeCommand,
        }),
      });

      if (!response.ok) {
        return {
          endpoint: "/api/edit",
          model: "sonnet",
          maxTokens: 8192,
        };
      }

      return response.json();
    },
    [state.files, state.selectedElement, state.activeCommand]
  );

  return {
    ...state,
    setFiles,
    updateFiles,
    addMessage,
    clearMessages,
    setSelectedElement,
    setActiveCommand,
    setCurrentPage,
    getFilesString,
    routeMessage,
  };
}
