"use client";

import { useState, useCallback } from "react";
import {
  GeneratedFile,
  ChatMessage,
  ElementContext,
  EditorTab,
  DeckData,
} from "@/types/project";

interface WorkspaceState {
  websiteFiles: GeneratedFile[];
  messages: ChatMessage[];
  selectedElement: ElementContext | null;
  activeCommand: string | null;
  currentPage: string;
  activeTab: EditorTab;
  decks: DeckData[];
  activeDeckId: string | null;
}

export function useEditorWorkspace() {
  const [state, setState] = useState<WorkspaceState>({
    websiteFiles: [],
    messages: [],
    selectedElement: null,
    activeCommand: null,
    currentPage: "index.html",
    activeTab: "website",
    decks: [],
    activeDeckId: null,
  });

  const setFiles = useCallback((files: GeneratedFile[]) => {
    setState((prev) => ({ ...prev, websiteFiles: files }));
  }, []);

  const updateFiles = useCallback((newFiles: GeneratedFile[]) => {
    setState((prev) => {
      const fileMap = new Map(prev.websiteFiles.map((f) => [f.path, f]));
      for (const file of newFiles) {
        fileMap.set(file.path, file);
      }
      return { ...prev, websiteFiles: Array.from(fileMap.values()) };
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

  const setActiveTab = useCallback((tab: EditorTab) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  const addDeck = useCallback((deck: DeckData) => {
    setState((prev) => ({
      ...prev,
      decks: [...prev.decks, deck],
      activeDeckId: deck.id,
      activeTab: "decks",
    }));
  }, []);

  const updateDeck = useCallback((deck: DeckData) => {
    setState((prev) => ({
      ...prev,
      decks: prev.decks.map((d) => (d.id === deck.id ? deck : d)),
    }));
  }, []);

  const deleteDeck = useCallback((deckId: string) => {
    setState((prev) => ({
      ...prev,
      decks: prev.decks.filter((d) => d.id !== deckId),
      activeDeckId: prev.activeDeckId === deckId ? null : prev.activeDeckId,
    }));
  }, []);

  const setActiveDeck = useCallback((deckId: string | null) => {
    setState((prev) => ({ ...prev, activeDeckId: deckId }));
  }, []);

  // Build the files string for prompts (website files only for now)
  const getFilesString = useCallback(() => {
    let str = "";
    for (const file of state.websiteFiles) {
      str += `\nFILE: ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n`;
    }
    return str;
  }, [state.websiteFiles]);

  // Get all files for deployment (website + rendered deck HTML)
  const getAllFilesForDeploy = useCallback(() => {
    return [...state.websiteFiles];
  }, [state.websiteFiles]);

  // Route a message to the correct API endpoint
  const routeMessage = useCallback(
    async (prompt: string) => {
      const response = await fetch("/api/route-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          hasExistingFiles: state.websiteFiles.length > 0,
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
    [state.websiteFiles, state.selectedElement, state.activeCommand]
  );

  // Expose files as alias for backward compat in components
  const files = state.websiteFiles;

  return {
    ...state,
    files,
    setFiles,
    updateFiles,
    addMessage,
    clearMessages,
    setSelectedElement,
    setActiveCommand,
    setCurrentPage,
    setActiveTab,
    addDeck,
    updateDeck,
    deleteDeck,
    setActiveDeck,
    getFilesString,
    getAllFilesForDeploy,
    routeMessage,
  };
}
