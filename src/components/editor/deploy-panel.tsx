"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Rocket,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Globe,
  Copy,
  Check,
} from "lucide-react";

interface DeployPanelProps {
  projectId: string;
  deployUrl: string | null;
  deployStatus: "idle" | "building" | "deployed" | "failed";
  onStatusChange?: (status: string, url?: string) => void;
}

export function DeployPanel({
  projectId,
  deployUrl,
  deployStatus: initialStatus,
  onStatusChange,
}: DeployPanelProps) {
  const [status, setStatus] = useState(initialStatus);
  const [url, setUrl] = useState(deployUrl);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const deploy = useCallback(async () => {
    setStatus("building");
    setError(null);
    onStatusChange?.("building");

    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Deployment failed");
      }

      const data = await response.json();
      setStatus("deployed");
      setUrl(data.url);
      onStatusChange?.("deployed", data.url);
    } catch (err) {
      setStatus("failed");
      setError(err instanceof Error ? err.message : "Deployment failed");
      onStatusChange?.("failed");
    }
  }, [projectId, onStatusChange]);

  const copyUrl = useCallback(() => {
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  return (
    <div className="flex flex-col gap-3 p-3 border-t border-border">
      {/* Deploy button */}
      <Button
        onClick={deploy}
        disabled={status === "building"}
        className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-sm"
        size="sm"
      >
        {status === "building" ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Deploying...
          </>
        ) : (
          <>
            <Rocket className="h-3.5 w-3.5" />
            Deploy to Cloudflare
          </>
        )}
      </Button>

      {/* Status indicator */}
      {status === "deployed" && url && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-950/30 border border-emerald-800/30 px-3 py-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-emerald-300 font-medium">Live</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground truncate transition-colors"
              >
                {url.replace("https://", "")}
              </a>
              <button
                onClick={copyUrl}
                className="p-0.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-0.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {status === "failed" && error && (
        <div className="flex items-start gap-2 rounded-md bg-red-950/30 border border-red-800/30 px-3 py-2">
          <XCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-red-300 font-medium">Deploy failed</p>
            <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
