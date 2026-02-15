"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { GeneratedFile, ElementContext } from "@/types/project";
import { generatePreviewHtml } from "@/lib/preview";
import {
  Monitor,
  Tablet,
  Smartphone,
  Crosshair,
  RefreshCw,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewPanelProps {
  files: GeneratedFile[];
  currentPage: string;
  onPageSelect: (page: string) => void;
  onElementSelect: (element: ElementContext | null) => void;
}

type Viewport = "desktop" | "tablet" | "mobile";

const VIEWPORT_CONFIG: Record<Viewport, { width: string; icon: typeof Monitor; label: string }> = {
  desktop: { width: "100%", icon: Monitor, label: "Desktop" },
  tablet: { width: "768px", icon: Tablet, label: "Tablet" },
  mobile: { width: "375px", icon: Smartphone, label: "Mobile" },
};

export function PreviewPanel({
  files,
  currentPage,
  onPageSelect,
  onElementSelect,
}: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [inspectMode, setInspectMode] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const htmlFiles = files.filter((f) => f.path.endsWith(".html"));
  const hasFiles = files.length > 0;

  // Listen for postMessage from iframe
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;

      if (event.data.type === "navigate" && event.data.page) {
        onPageSelect(event.data.page);
      }

      if (event.data.type === "elementSelected" && event.data.info) {
        onElementSelect(event.data.info as ElementContext);
        setInspectMode(false);
      }
    },
    [onPageSelect, onElementSelect]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  const handleRefresh = () => {
    setIframeKey((k) => k + 1);
  };

  const toggleInspectMode = () => {
    setInspectMode((prev) => !prev);
  };

  const previewHtml = generatePreviewHtml(files, currentPage, inspectMode);

  // Empty state
  if (!hasFiles) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-background">
        <Globe className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-sm">Your preview will appear here</p>
        <p className="text-xs mt-1 opacity-60">
          Start by describing what you want to build
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 flex-shrink-0">
        {/* Page tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {htmlFiles.map((file) => (
            <button
              key={file.path}
              onClick={() => onPageSelect(file.path)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap",
                currentPage === file.path
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              {file.path}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 ml-4 flex-shrink-0">
          {/* Viewport switcher */}
          {(Object.keys(VIEWPORT_CONFIG) as Viewport[]).map((vp) => {
            const config = VIEWPORT_CONFIG[vp];
            const Icon = config.icon;
            return (
              <Button
                key={vp}
                variant="ghost"
                size="icon"
                onClick={() => setViewport(vp)}
                className={cn(
                  "h-8 w-8",
                  viewport === vp
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground"
                )}
                aria-label={config.label}
              >
                <Icon className="h-4 w-4" />
              </Button>
            );
          })}

          <div className="w-px h-5 bg-border mx-1" />

          {/* Inspect mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleInspectMode}
            className={cn(
              "h-8 w-8",
              inspectMode
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-muted-foreground"
            )}
            aria-label="Toggle element inspection"
          >
            <Crosshair className="h-4 w-4" />
          </Button>

          {/* Refresh */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="h-8 w-8 text-muted-foreground"
            aria-label="Refresh preview"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex items-start justify-center overflow-auto bg-zinc-950/50 p-0">
        <div
          className={cn(
            "h-full transition-all duration-300 bg-white",
            viewport === "desktop" && "w-full",
            viewport === "tablet" &&
              "w-[768px] max-w-full mx-auto rounded-lg border border-border shadow-xl mt-4 mb-4",
            viewport === "mobile" &&
              "w-[375px] max-w-full mx-auto rounded-2xl border-[3px] border-zinc-700 shadow-xl mt-4 mb-4"
          )}
          style={
            viewport !== "desktop"
              ? { height: viewport === "tablet" ? "calc(100% - 2rem)" : "calc(100% - 2rem)" }
              : undefined
          }
        >
          <iframe
            key={iframeKey}
            ref={iframeRef}
            srcDoc={previewHtml}
            className={cn(
              "w-full h-full border-0",
              viewport === "tablet" && "rounded-lg",
              viewport === "mobile" && "rounded-2xl"
            )}
            title="Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
