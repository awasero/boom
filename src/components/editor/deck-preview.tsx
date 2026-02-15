"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { GeneratedFile, ElementContext } from "@/types/project";
import { generatePreviewHtml } from "@/lib/preview";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Crosshair,
  RefreshCw,
  Printer,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DeckPreviewProps {
  files: GeneratedFile[];
  currentPage: string;
  onPageSelect: (page: string) => void;
  onElementSelect: (element: ElementContext | null) => void;
}

export function DeckPreview({
  files,
  currentPage,
  onPageSelect,
  onElementSelect,
}: DeckPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [inspectMode, setInspectMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(0);

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

      if (event.data.type === "slideUpdate") {
        setCurrentSlide(event.data.current ?? 1);
        setTotalSlides(event.data.total ?? 0);
      }
    },
    [onPageSelect, onElementSelect]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Keyboard shortcuts - forward to iframe
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === " "
      ) {
        // Focus the iframe so it receives keyboard events
        iframeRef.current?.contentWindow?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleRefresh = () => {
    setIframeKey((k) => k + 1);
    setCurrentSlide(1);
  };

  const toggleInspectMode = () => {
    setInspectMode((prev) => !prev);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handlePrevSlide = () => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "navigateSlide", direction: "prev" },
      "*"
    );
  };

  const handleNextSlide = () => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "navigateSlide", direction: "next" },
      "*"
    );
  };

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  // Build preview HTML with deck-specific postMessage bridge
  const deckBridgeScript = `
    <script>
      // Report slide changes to parent
      (function() {
        const observer = new MutationObserver(function() {
          const slides = document.querySelectorAll('.slide');
          const active = document.querySelector('.slide.active');
          if (slides.length > 0) {
            const activeIndex = Array.from(slides).indexOf(active);
            window.parent.postMessage({
              type: 'slideUpdate',
              current: activeIndex + 1,
              total: slides.length
            }, '*');
          }
        });

        // Observe slide class changes
        setTimeout(function() {
          const container = document.querySelector('.deck-container');
          if (container) {
            observer.observe(container, { subtree: true, attributes: true, attributeFilter: ['class'] });
          }
          // Send initial slide count
          const slides = document.querySelectorAll('.slide');
          const active = document.querySelector('.slide.active');
          const activeIndex = active ? Array.from(slides).indexOf(active) : 0;
          window.parent.postMessage({
            type: 'slideUpdate',
            current: activeIndex + 1,
            total: slides.length
          }, '*');
        }, 100);

        // Listen for navigation commands from parent
        window.addEventListener('message', function(e) {
          if (!e.data || typeof e.data !== 'object') return;
          if (e.data.type === 'navigateSlide') {
            const event = new KeyboardEvent('keydown', {
              key: e.data.direction === 'next' ? 'ArrowRight' : 'ArrowLeft',
              bubbles: true
            });
            document.dispatchEvent(event);
          }
        });
      })();
    </script>
  `;

  let previewHtml = generatePreviewHtml(files, currentPage, inspectMode);

  // Inject the deck bridge script before </body>
  if (hasFiles && previewHtml.includes("</body>")) {
    previewHtml = previewHtml.replace("</body>", `${deckBridgeScript}</body>`);
  }

  // Empty state
  if (!hasFiles) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-background">
        <Globe className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-sm">Your deck preview will appear here</p>
        <p className="text-xs mt-1 opacity-60">
          Start by describing the presentation you want to create
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Deck Preview</span>
          {totalSlides > 0 && (
            <span className="text-xs font-mono text-foreground bg-secondary px-2 py-0.5 rounded">
              {currentSlide} / {totalSlides}
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
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

          {/* Print / PDF */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrint}
            className="h-8 w-8 text-muted-foreground"
            aria-label="Print / Export PDF"
          >
            <Printer className="h-4 w-4" />
          </Button>

          {/* Fullscreen toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8 text-muted-foreground"
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>

          <div className="w-px h-5 bg-border mx-1" />

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
      <div className="flex-1 relative overflow-hidden bg-zinc-950">
        <iframe
          key={iframeKey}
          ref={iframeRef}
          srcDoc={previewHtml}
          className="w-full h-full border-0"
          title="Deck Preview"
          sandbox="allow-scripts allow-same-origin"
        />

        {/* Slide navigation overlay */}
        {totalSlides > 0 && !inspectMode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-full px-4 py-2 shadow-lg">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevSlide}
              disabled={currentSlide <= 1}
              className="h-7 w-7 text-zinc-300 hover:text-white disabled:opacity-30"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-xs font-mono text-zinc-300 min-w-[3rem] text-center">
              {currentSlide} / {totalSlides}
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextSlide}
              disabled={currentSlide >= totalSlides}
              className="h-7 w-7 text-zinc-300 hover:text-white disabled:opacity-30"
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
