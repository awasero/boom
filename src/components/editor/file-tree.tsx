"use client";

import { useMemo } from "react";
import { GeneratedFile } from "@/types/project";
import { FileCode, Paintbrush, FileJson, File, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileTreeProps {
  files: GeneratedFile[];
  currentPage: string;
  onPageSelect: (page: string) => void;
}

function getFileIcon(path: string) {
  if (path.endsWith(".html") || path.endsWith(".htm")) {
    return FileCode;
  }
  if (path.endsWith(".css")) {
    return Paintbrush;
  }
  if (path.endsWith(".js") || path.endsWith(".json")) {
    return FileJson;
  }
  return File;
}

function getFileExtension(path: string): string {
  const parts = path.split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

interface GroupedFiles {
  [directory: string]: GeneratedFile[];
}

export function FileTree({ files, currentPage, onPageSelect }: FileTreeProps) {
  // Group files by directory
  const grouped = useMemo<GroupedFiles>(() => {
    const groups: GroupedFiles = {};

    for (const file of files) {
      const parts = file.path.split("/");
      const directory = parts.length > 1 ? parts.slice(0, -1).join("/") : "/";

      if (!groups[directory]) {
        groups[directory] = [];
      }
      groups[directory].push(file);
    }

    // Sort files within each group
    for (const dir of Object.keys(groups)) {
      groups[dir].sort((a, b) => a.path.localeCompare(b.path));
    }

    return groups;
  }, [files]);

  const directories = Object.keys(grouped).sort();

  const isClickable = (path: string) => {
    return path.endsWith(".html") || path.endsWith(".htm");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center px-4">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Files
        </span>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto py-2">
        {directories.map((dir) => (
          <div key={dir}>
            {/* Directory label (only show if not root) */}
            {dir !== "/" && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground">
                <FolderOpen className="h-3 w-3" />
                <span className="truncate">{dir}</span>
              </div>
            )}

            {/* Files in directory */}
            {grouped[dir].map((file) => {
              const fileName = file.path.split("/").pop() || file.path;
              const ext = getFileExtension(file.path);
              const Icon = getFileIcon(file.path);
              const clickable = isClickable(file.path);
              const isActive = file.path === currentPage;

              return (
                <button
                  key={file.path}
                  onClick={() => clickable && onPageSelect(file.path)}
                  disabled={!clickable}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-1.5 text-xs transition-colors",
                    dir !== "/" && "pl-7",
                    isActive
                      ? "bg-violet-500/10 text-violet-300"
                      : clickable
                        ? "text-foreground hover:bg-secondary/50"
                        : "text-muted-foreground cursor-default"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5 flex-shrink-0",
                      isActive
                        ? "text-violet-400"
                        : ext === "html"
                          ? "text-orange-400"
                          : ext === "css"
                            ? "text-blue-400"
                            : ext === "js"
                              ? "text-yellow-400"
                              : "text-muted-foreground"
                    )}
                  />
                  <span className="truncate">{fileName}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
