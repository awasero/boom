"use client";

import { useMemo, useState } from "react";
import { GeneratedFile } from "@/types/project";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Code,
  FileCode,
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  RotateCcw,
} from "lucide-react";

interface PreviewPanelProps {
  files: GeneratedFile[];
}

type ViewportSize = "mobile" | "tablet" | "desktop" | "full";

const VIEWPORT_SIZES: Record<ViewportSize, { width: number; height: number; label: string }> = {
  mobile: { width: 375, height: 667, label: "iPhone SE" },
  tablet: { width: 768, height: 1024, label: "iPad" },
  desktop: { width: 1280, height: 800, label: "Desktop" },
  full: { width: 0, height: 0, label: "Responsive" },
};

export function PreviewPanel({ files }: PreviewPanelProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [viewport, setViewport] = useState<ViewportSize>("full");
  const [scale, setScale] = useState(1);

  const previewHtml = useMemo(() => {
    return generatePreviewHtml(files);
  }, [files]);

  const displayFile = selectedFile
    ? files.find((f) => f.path === selectedFile)
    : files.find((f) => f.path.includes("pages/index"));

  const currentViewport = VIEWPORT_SIZES[viewport];

  return (
    <Tabs defaultValue="preview" className="h-full flex flex-col">
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
            value="code"
            className="gap-2 data-[state=active]:bg-zinc-800/50 data-[state=active]:text-white text-zinc-400 rounded-lg px-3"
          >
            <Code className="h-4 w-4" />
            Code
          </TabsTrigger>
        </TabsList>

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

      <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
        {files.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 bg-[#0a0a0b]">
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
          <div className="h-full w-full flex items-center justify-center bg-[#0a0a0b] overflow-auto p-4">
            {viewport === "full" ? (
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full border-0 bg-white rounded-lg shadow-2xl shadow-black/50"
                sandbox="allow-scripts"
                title="Website Preview"
              />
            ) : (
              <div
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
      </TabsContent>

      <TabsContent value="code" className="flex-1 m-0 flex overflow-hidden">
        {/* File list sidebar */}
        <div className="w-52 border-r border-zinc-800/50 bg-[#0d0d0f] overflow-auto">
          <div className="p-3">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2 py-2">
              Project Files
            </p>
            <div className="space-y-0.5">
              {files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file.path)}
                  className={`
                    w-full text-left px-2.5 py-2 text-sm rounded-lg
                    flex items-center gap-2.5 transition-all
                    ${
                      (selectedFile || files[0]?.path) === file.path
                        ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                    }
                  `}
                >
                  <FileCode className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <span className="truncate text-xs font-medium">
                    {file.path.split("/").pop()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Code viewer */}
        <ScrollArea className="flex-1 bg-[#0a0a0b]">
          {displayFile ? (
            <div className="p-5">
              <div className="flex items-center gap-3 mb-5">
                <Badge
                  variant="secondary"
                  className="bg-zinc-800 text-zinc-300 border-zinc-700 font-mono text-xs"
                >
                  {displayFile.path}
                </Badge>
                <div className="h-px flex-1 bg-zinc-800/50" />
              </div>
              <pre className="text-sm text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">
                <code>{displayFile.content}</code>
              </pre>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500">
              <p>Select a file to view its code</p>
            </div>
          )}
        </ScrollArea>
      </TabsContent>
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

function generatePreviewHtml(files: GeneratedFile[]): string {
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
        </body>
      </html>
    `;
  } else {
    html = html.replace("</head>", `${tailwindScript}</head>`);
  }

  return html;
}
