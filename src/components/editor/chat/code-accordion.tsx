"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, FileCode } from "lucide-react";
import type { GeneratedFile } from "@/types/project";

interface CodeAccordionProps {
  files: GeneratedFile[];
}

function getLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    tsx: "TypeScript (JSX)",
    ts: "TypeScript",
    jsx: "JavaScript (JSX)",
    js: "JavaScript",
    css: "CSS",
    html: "HTML",
    json: "JSON",
    md: "Markdown",
    py: "Python",
    yaml: "YAML",
    yml: "YAML",
  };
  return map[ext] || ext.toUpperCase();
}

function getFilename(path: string): string {
  return path.split("/").pop() || path;
}

export function CodeAccordion({ files }: CodeAccordionProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set());

  const toggleFile = (index: number) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (files.length === 0) return null;

  return (
    <div className="mt-2 rounded-lg border border-border overflow-hidden">
      <div className="px-3 py-2 bg-muted/50 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground">
          {files.length} {files.length === 1 ? "file" : "files"} generated
        </span>
      </div>
      <div className="divide-y divide-border">
        {files.map((file, index) => {
          const isExpanded = expandedFiles.has(index);
          return (
            <div key={index}>
              <button
                onClick={() => toggleFile(index)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/30 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                )}
                <FileCode className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="text-xs font-mono text-foreground truncate">
                  {getFilename(file.path)}
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">
                  {getLanguage(file.path)}
                </span>
              </button>
              {isExpanded && (
                <div className="bg-background/50">
                  <pre className="p-3 text-xs font-mono text-foreground/80 overflow-x-auto leading-relaxed">
                    <code>{file.content}</code>
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
