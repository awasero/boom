"use client";

import { useState, useCallback, useRef } from "react";
import { GeneratedFile, ChatMessage, ModelType } from "@/types/project";
import { parseGeneratedFiles } from "@/lib/ai/parser";

interface UseAiGenerationOptions {
  onFilesGenerated?: (files: GeneratedFile[]) => void;
  onError?: (error: string) => void;
}

export function useAiGeneration(options: UseAiGenerationOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (
      endpoint: string,
      body: Record<string, unknown>
    ): Promise<ChatMessage | null> => {
      setIsGenerating(true);
      setStreamingContent("");

      abortRef.current = new AbortController();

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Request failed");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.text) {
                  fullContent += parsed.text;
                  setStreamingContent(fullContent);
                }
              } catch (e) {
                if (e instanceof SyntaxError) continue;
                throw e;
              }
            }
          }
        }

        const files = parseGeneratedFiles(fullContent);
        if (files.length > 0) {
          options.onFilesGenerated?.(files);
        }

        const message: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: fullContent,
          files,
          timestamp: new Date(),
          model: (body.model as ModelType) || "sonnet",
        };

        return message;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return null;
        }
        const errorMsg =
          error instanceof Error ? error.message : "Generation failed";
        options.onError?.(errorMsg);
        return null;
      } finally {
        setIsGenerating(false);
        setStreamingContent("");
        abortRef.current = null;
      }
    },
    [options]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    generate,
    abort,
    isGenerating,
    streamingContent,
  };
}
