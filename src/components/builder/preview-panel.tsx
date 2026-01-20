"use client";

import { useMemo, useState, useEffect } from "react";
import { GeneratedFile, ElementContext } from "@/types/project";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  Pencil,
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  RotateCcw,
} from "lucide-react";

interface PreviewPanelProps {
  files: GeneratedFile[];
  onElementSelect?: (elementInfo: ElementContext) => void;
}

type ViewportSize = "mobile" | "tablet" | "desktop" | "full";

const VIEWPORT_SIZES: Record<ViewportSize, { width: number; height: number; label: string }> = {
  mobile: { width: 375, height: 667, label: "iPhone SE" },
  tablet: { width: 768, height: 1024, label: "iPad" },
  desktop: { width: 1280, height: 800, label: "Desktop" },
  full: { width: 0, height: 0, label: "Responsive" },
};

export function PreviewPanel({ files, onElementSelect }: PreviewPanelProps) {
    const [viewport, setViewport] = useState<ViewportSize>("full");
  const [scale, setScale] = useState(1);
  const [activeTab, setActiveTab] = useState<"preview" | "edit">("preview");
  const [currentPage, setCurrentPage] = useState<string>("index.html");
  const [inspectMode, setInspectMode] = useState(false);

  // Get all HTML pages for navigation
  const htmlPages = useMemo(() => {
    return files.filter(f => f.path.endsWith('.html')).map(f => f.path);
  }, [files]);

  const previewHtml = useMemo(() => {
    return generatePreviewHtml(files, currentPage, inspectMode);
  }, [files, currentPage, inspectMode]);

  // Listen for navigation and element selection messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'navigate' && event.data?.page) {
        const page = event.data.page;
        // Check if the page exists in our files
        const pageFile = files.find(f =>
          f.path === page ||
          f.path === page.replace('./', '') ||
          f.path.endsWith(page)
        );
        if (pageFile) {
          setCurrentPage(pageFile.path);
        }
      }
      // Handle element selection from inspect mode
      if (event.data?.type === 'elementSelected' && event.data?.info) {
        onElementSelect?.(event.data.info);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [files, onElementSelect]);

  
  const currentViewport = VIEWPORT_SIZES[viewport];

  return (
    <Tabs value={activeTab} onValueChange={(v) => {
      const newTab = v as "preview" | "edit";
      setActiveTab(newTab);
      // When switching to edit mode, enable inspect; when switching to preview, disable it
      setInspectMode(newTab === "edit");
    }} className="h-full flex flex-col" id="preview-panel-tabs">
      {/* Tab Header with Viewport Controls */}
      <div className="border-b border-zinc-800/50 bg-[#111113] px-4 flex items-center justify-between">
        <TabsList className="h-12 bg-transparent border-0 p-0">
          <TabsTrigger
            value="preview"
            className="gap-2 data-[state=active]:bg-zinc-800/50 data-[state=active]:text-white text-zinc-400 rounded-lg px-3"
          >
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger
            value="edit"
            className="gap-2 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-zinc-400 rounded-lg px-3"
            onClick={() => setInspectMode(true)}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </TabsTrigger>
        </TabsList>

        {/* Page Navigation - show if multiple HTML pages */}
        {htmlPages.length > 1 && (
          <div className="flex items-center gap-1 bg-zinc-800/30 rounded-lg p-1">
            {htmlPages.map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`
                  px-2.5 py-1 text-xs font-medium rounded-md transition-all
                  ${currentPage === page
                    ? "bg-violet-500/20 text-violet-400"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50"
                  }
                `}
              >
                {page.replace('.html', '')}
              </button>
            ))}
          </div>
        )}

        {/* Viewport Controls */}
        <div className="flex items-center gap-1">
          <div className="flex items-center bg-zinc-800/50 rounded-lg p-1 gap-0.5">
            <ViewportButton
              icon={<Smartphone className="h-4 w-4" />}
              active={viewport === "mobile"}
              onClick={() => setViewport("mobile")}
              tooltip="Mobile (375px)"
            />
            <ViewportButton
              icon={<Tablet className="h-4 w-4" />}
              active={viewport === "tablet"}
              onClick={() => setViewport("tablet")}
              tooltip="Tablet (768px)"
            />
            <ViewportButton
              icon={<Monitor className="h-4 w-4" />}
              active={viewport === "desktop"}
              onClick={() => setViewport("desktop")}
              tooltip="Desktop (1280px)"
            />
            <ViewportButton
              icon={<Maximize2 className="h-4 w-4" />}
              active={viewport === "full"}
              onClick={() => setViewport("full")}
              tooltip="Responsive"
            />
          </div>

          {viewport !== "full" && (
            <>
              <div className="h-5 w-px bg-zinc-700 mx-2" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-mono">
                  {currentViewport.width} × {currentViewport.height}
                </span>
                <button
                  onClick={() => setScale(scale === 1 ? 0.75 : scale === 0.75 ? 0.5 : 1)}
                  className="text-xs text-zinc-400 hover:text-white bg-zinc-800/50 px-2 py-1 rounded font-mono transition-colors"
                >
                  {Math.round(scale * 100)}%
                </button>
                <button
                  onClick={() => setScale(1)}
                  className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800/50 transition-colors"
                  title="Reset zoom"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Both preview and edit tabs show the preview - edit mode just has inspect enabled */}
      {(activeTab === "preview" || activeTab === "edit") && (
        <div id="preview-tab-content" className="flex-1 overflow-hidden relative bg-[#0a0a0b]">
          {files.length === 0 ? (
            <div id="preview-empty-state" className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-2xl blur-xl" />
                <div className="relative w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center">
                  <Eye className="h-7 w-7 text-zinc-600" />
                </div>
              </div>
              <p className="font-medium text-zinc-400 mb-1">No preview yet</p>
              <p className="text-sm text-zinc-600">Start chatting to generate your website</p>
            </div>
          ) : (
            <div id="preview-iframe-container" className="absolute inset-0 flex items-center justify-center overflow-auto p-4">
              {viewport === "full" ? (
                <iframe
                  id="preview-iframe"
                  srcDoc={previewHtml}
                  className="w-full h-full border-0 bg-white rounded-lg shadow-2xl shadow-black/50"
                  sandbox="allow-scripts"
                  title="Website Preview"
                />
              ) : (
                <div
                  id="preview-device-frame"
                  className="relative bg-zinc-900 rounded-2xl p-3 shadow-2xl shadow-black/50"
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "center center",
                  }}
                >
                  {/* Device Frame */}
                  <div className="absolute inset-0 rounded-2xl border border-zinc-700/50 pointer-events-none" />

                  {/* Device Notch/Camera for mobile */}
                  {viewport === "mobile" && (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-20 h-5 bg-zinc-900 rounded-b-xl flex items-center justify-center z-10">
                      <div className="w-2 h-2 rounded-full bg-zinc-700" />
                    </div>
                  )}

                  {/* Device Label */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-zinc-500 font-medium whitespace-nowrap">
                    {currentViewport.label}
                  </div>

                  <iframe
                    id="preview-iframe-device"
                    srcDoc={previewHtml}
                    className="bg-white rounded-lg"
                    style={{
                      width: currentViewport.width,
                      height: currentViewport.height,
                      border: "none",
                    }}
                    sandbox="allow-scripts"
                    title="Website Preview"
                  />

                  {/* Device Home Indicator for mobile */}
                  {viewport === "mobile" && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-zinc-700 rounded-full" />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

          </Tabs>
  );
}

function ViewportButton({
  icon,
  active,
  onClick,
  tooltip,
}: {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  tooltip: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        p-2 rounded-md transition-all
        ${
          active
            ? "bg-violet-500/20 text-violet-400"
            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50"
        }
      `}
      title={tooltip}
    >
      {icon}
    </button>
  );
}

function generatePreviewHtml(files: GeneratedFile[], currentPage: string = "index.html", inspectMode: boolean = false): string {
  // Navigation interceptor script - prevents links from navigating parent window
  const navigationScript = `
    <script>
      document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link) {
          const href = link.getAttribute('href');
          if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
            e.preventDefault();
            // Send message to parent to change page
            window.parent.postMessage({ type: 'navigate', page: href }, '*');
          }
        }
      }, true);
    </script>
  `;

  // Element inspection script for inspect mode
  const inspectionScript = inspectMode ? `
    <style>
      .vibesites-inspect-highlight {
        outline: 2px solid #10b981 !important;
        outline-offset: 2px !important;
        cursor: crosshair !important;
      }
      .vibesites-inspect-tooltip {
        position: fixed;
        background: #18181b;
        color: #e4e4e7;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-family: ui-monospace, monospace;
        z-index: 999999;
        pointer-events: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        border: 1px solid #3f3f46;
        max-width: 300px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .vibesites-inspect-tooltip .tag { color: #a78bfa; }
      .vibesites-inspect-tooltip .id { color: #34d399; }
      .vibesites-inspect-tooltip .class { color: #60a5fa; }
      .vibesites-inspect-tooltip .hint { color: #71717a; font-size: 10px; display: block; margin-top: 4px; }
    </style>
    <script>
      (function() {
        let tooltip = null;
        let currentEl = null;

        function createTooltip() {
          tooltip = document.createElement('div');
          tooltip.className = 'vibesites-inspect-tooltip';
          document.body.appendChild(tooltip);
        }

        function getElementInfo(el) {
          const tag = el.tagName.toLowerCase();
          const id = el.id ? '#' + el.id : '';
          const classes = el.className && typeof el.className === 'string'
            ? '.' + el.className.split(' ').filter(c => c && !c.startsWith('vibesites-')).join('.')
            : '';
          return { tag, id, classes };
        }

        function formatTooltip(info) {
          let html = '<span class="tag">' + info.tag + '</span>';
          if (info.id) html += '<span class="id">' + info.id + '</span>';
          if (info.classes) html += '<span class="class">' + info.classes + '</span>';
          html += '<span class="hint">Double-click to select</span>';
          return html;
        }

        function getSelector(el) {
          const info = getElementInfo(el);
          if (info.id) return info.tag + info.id;
          if (info.classes) return info.tag + info.classes;
          return info.tag;
        }

        function getElementContext(el) {
          const selector = getSelector(el);
          const textContent = el.textContent?.trim().slice(0, 100) || '';
          const outerHtml = el.outerHTML?.slice(0, 500) || '';

          // Get parent context for better location
          const parent = el.parentElement;
          const parentInfo = parent ? getElementInfo(parent) : null;
          const parentSelector = parentInfo ? (parentInfo.tag + (parentInfo.id || parentInfo.classes || '')) : '';

          // Find section/landmark context
          let section = el.closest('section, header, footer, main, nav, article, aside');
          const sectionInfo = section ? getElementInfo(section) : null;
          const sectionSelector = sectionInfo ? (sectionInfo.tag + (sectionInfo.id || sectionInfo.classes || '')) : '';

          return {
            selector,
            parent: parentSelector,
            section: sectionSelector,
            text: textContent,
            html: outerHtml
          };
        }

        document.addEventListener('mouseover', function(e) {
          const el = e.target;
          if (el === document.body || el === document.documentElement) return;
          if (el.className && typeof el.className === 'string' && el.className.includes('vibesites-')) return;

          if (currentEl) currentEl.classList.remove('vibesites-inspect-highlight');
          currentEl = el;
          el.classList.add('vibesites-inspect-highlight');

          if (!tooltip) createTooltip();
          tooltip.innerHTML = formatTooltip(getElementInfo(el));
          tooltip.style.display = 'block';
        });

        document.addEventListener('mousemove', function(e) {
          if (tooltip) {
            const x = Math.min(e.clientX + 12, window.innerWidth - tooltip.offsetWidth - 10);
            const y = Math.min(e.clientY + 12, window.innerHeight - tooltip.offsetHeight - 10);
            tooltip.style.left = x + 'px';
            tooltip.style.top = y + 'px';
          }
        });

        document.addEventListener('mouseout', function(e) {
          if (currentEl && !currentEl.contains(e.relatedTarget)) {
            currentEl.classList.remove('vibesites-inspect-highlight');
            currentEl = null;
            if (tooltip) tooltip.style.display = 'none';
          }
        });

        document.addEventListener('dblclick', function(e) {
          if (currentEl) {
            e.preventDefault();
            e.stopPropagation();
            const context = getElementContext(currentEl);
            window.parent.postMessage({ type: 'elementSelected', info: context }, '*');
          }
        });

        // Prevent normal clicks in inspect mode
        document.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
        }, true);
      })();
    </script>
  ` : '';

  // Check for the current page file first
  let htmlFile = files.find((f) => f.path === currentPage);

  // Fall back to index.html if current page not found
  if (!htmlFile) {
    htmlFile = files.find((f) => f.path === "index.html" || f.path.endsWith("/index.html"));
  }

  if (htmlFile) {
    // For Opus mode: plain HTML with inline CSS/JS
    let html = htmlFile.content;

    // Find and inline CSS
    const cssFile = files.find((f) => f.path === "styles.css" || f.path.endsWith("/styles.css"));
    if (cssFile) {
      html = html.replace(
        /<link[^>]*href=["'](?:\.\/)?styles\.css["'][^>]*>/i,
        `<style>${cssFile.content}</style>`
      );
    }

    // Find and inline JS
    const jsFile = files.find((f) => f.path === "script.js" || f.path.endsWith("/script.js"));
    if (jsFile) {
      html = html.replace(
        /<script[^>]*src=["'](?:\.\/)?script\.js["'][^>]*><\/script>/i,
        `<script>${jsFile.content}</script>`
      );
    }

    // Ensure Tailwind CDN is present
    if (!html.includes("tailwindcss.com")) {
      html = html.replace("</head>", `<script src="https://cdn.tailwindcss.com"></script></head>`);
    }

    // Add navigation interceptor and inspection script before closing body
    html = html.replace("</body>", `${inspectMode ? inspectionScript : navigationScript}</body>`);

    return html;
  }

  // Fall back to Astro mode processing
  const indexFile = files.find(
    (f) =>
      f.path.includes("pages/index") || f.path.endsWith("index.astro")
  );

  if (!indexFile) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              color: #71717a;
              background: #fafafa;
            }
          </style>
        </head>
        <body>
          <p>No preview available yet</p>
        </body>
      </html>
    `;
  }

  const layoutFile = files.find(
    (f) => f.path.includes("layouts/Layout") || f.path.includes("Layout.astro")
  );

  const components = new Map<string, string>();
  files.forEach((file) => {
    const name = file.path.split("/").pop()?.replace(".astro", "") || "";
    components.set(name, file.content);
  });

  let html = indexFile.content;
  html = html.replace(/---[\s\S]*?---/, "");

  components.forEach((content, name) => {
    const componentContent = content.replace(/---[\s\S]*?---/, "");
    const regex = new RegExp(`<${name}\\s*/>`, "g");
    html = html.replace(regex, componentContent);
  });

  if (layoutFile) {
    let layoutHtml = layoutFile.content.replace(/---[\s\S]*?---/, "");
    layoutHtml = layoutHtml.replace(/<slot\s*\/>/, html);
    html = layoutHtml;
  }

  html = html.replace(/\{[^}]+\}/g, "");
  html = html.replace(/<Fragment>/g, "").replace(/<\/Fragment>/g, "");

  const tailwindScript = `<script src="https://cdn.tailwindcss.com"></script>`;

  const navScript = `
    <script>
      document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link) {
          const href = link.getAttribute('href');
          if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
            e.preventDefault();
            window.parent.postMessage({ type: 'navigate', page: href }, '*');
          }
        }
      }, true);
    </script>
  `;

  // Use inspection script when in inspect mode, otherwise use nav script
  const scriptToInject = inspectMode ? inspectionScript : navScript;

  if (!html.includes("<!DOCTYPE html>") && !html.includes("<html")) {
    html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          ${tailwindScript}
        </head>
        <body>
          ${html}
          ${scriptToInject}
        </body>
      </html>
    `;
  } else {
    html = html.replace("</head>", `${tailwindScript}</head>`);
    html = html.replace("</body>", `${scriptToInject}</body>`);
  }

  return html;
}
