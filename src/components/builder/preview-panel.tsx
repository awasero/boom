"use client";

import { useMemo, useState } from "react";
import { GeneratedFile } from "@/types/project";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Eye, Code, FileCode } from "lucide-react";

interface PreviewPanelProps {
  files: GeneratedFile[];
}

export function PreviewPanel({ files }: PreviewPanelProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const previewHtml = useMemo(() => {
    return generatePreviewHtml(files);
  }, [files]);

  const displayFile = selectedFile
    ? files.find((f) => f.path === selectedFile)
    : files.find((f) => f.path.includes("pages/index"));

  return (
    <Tabs defaultValue="preview" className="h-full flex flex-col">
      <div className="border-b bg-white px-4">
        <TabsList className="h-12">
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="code" className="gap-2">
            <Code className="h-4 w-4" />
            Code
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="preview" className="flex-1 m-0">
        {files.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p>Preview will appear after generating code</p>
          </div>
        ) : (
          <iframe
            srcDoc={previewHtml}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts"
            title="Website Preview"
          />
        )}
      </TabsContent>

      <TabsContent value="code" className="flex-1 m-0 flex">
        {/* File list sidebar */}
        <div className="w-48 border-r bg-slate-50 overflow-auto">
          <div className="p-2">
            <p className="text-xs font-medium text-muted-foreground px-2 py-1">
              FILES
            </p>
            {files.map((file) => (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file.path)}
                className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-slate-100 flex items-center gap-2 ${
                  (selectedFile || files[0]?.path) === file.path
                    ? "bg-slate-200"
                    : ""
                }`}
              >
                <FileCode className="h-3 w-3 shrink-0" />
                <span className="truncate">{file.path.split("/").pop()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Code viewer */}
        <ScrollArea className="flex-1 bg-slate-900">
          {displayFile ? (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">{displayFile.path}</Badge>
              </div>
              <pre className="text-sm text-slate-100 font-mono whitespace-pre-wrap">
                {displayFile.content}
              </pre>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p>Select a file to view its code</p>
            </div>
          )}
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}

function generatePreviewHtml(files: GeneratedFile[]): string {
  // Find the main index page
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
              font-family: system-ui;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              color: #666;
            }
          </style>
        </head>
        <body>
          <p>No preview available yet</p>
        </body>
      </html>
    `;
  }

  // Extract layout
  const layoutFile = files.find(
    (f) => f.path.includes("layouts/Layout") || f.path.includes("Layout.astro")
  );

  // Build component map
  const components = new Map<string, string>();
  files.forEach((file) => {
    const name = file.path.split("/").pop()?.replace(".astro", "") || "";
    components.set(name, file.content);
  });

  // Simple Astro-to-HTML transformation for preview
  let html = indexFile.content;

  // Process frontmatter (remove it)
  html = html.replace(/---[\s\S]*?---/, "");

  // Replace component imports with actual content
  components.forEach((content, name) => {
    const componentContent = content.replace(/---[\s\S]*?---/, "");
    const regex = new RegExp(`<${name}\\s*/>`, "g");
    html = html.replace(regex, componentContent);
  });

  // If we have a layout, wrap content in it
  if (layoutFile) {
    let layoutHtml = layoutFile.content.replace(/---[\s\S]*?---/, "");
    layoutHtml = layoutHtml.replace(/<slot\s*\/>/, html);
    html = layoutHtml;
  }

  // Clean up Astro-specific syntax
  html = html.replace(/\{[^}]+\}/g, ""); // Remove JS expressions
  html = html.replace(/<Fragment>/g, "").replace(/<\/Fragment>/g, "");

  // Add Tailwind CDN for styling
  const tailwindScript = `<script src="https://cdn.tailwindcss.com"></script>`;

  // Ensure proper HTML structure
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
    // Inject Tailwind into existing head
    html = html.replace("</head>", `${tailwindScript}</head>`);
  }

  return html;
}
