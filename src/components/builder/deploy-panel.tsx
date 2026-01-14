"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getDeploymentStatus,
  enableGitHubPages,
  triggerDeployment,
  getWorkflowRuns,
  getCustomDomain,
  setCustomDomain,
  removeCustomDomain,
  generateDNSRecordsMessage,
  GITHUB_PAGES_DNS,
  DeploymentStatus,
} from "@/lib/github-pages";
import {
  X,
  ExternalLink,
  Globe,
  Loader2,
  Rocket,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Zap,
  Copy,
  Check,
  Link2,
  Trash2,
  Share2,
  AlertCircle,
} from "lucide-react";

interface DeployPanelProps {
  owner: string;
  repo: string;
  accessToken: string;
  isOpen: boolean;
  onClose: () => void;
}

interface WorkflowRun {
  id: number;
  status: string;
  conclusion: string | null;
  createdAt: string;
  url: string;
}

export function DeployPanel({
  owner,
  repo,
  accessToken,
  isOpen,
  onClose,
}: DeployPanelProps) {
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Custom domain state
  const [customDomain, setCustomDomainState] = useState<string | null>(null);
  const [domainInput, setDomainInput] = useState("");
  const [savingDomain, setSavingDomain] = useState(false);
  const [showDNS, setShowDNS] = useState(false);
  const [copied, setCopied] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const status = await getDeploymentStatus(accessToken, owner, repo);
      setDeploymentStatus(status);

      if (status.enabled) {
        const runs = await getWorkflowRuns(accessToken, owner, repo);
        setWorkflowRuns(runs);
      }

      // Get custom domain
      const domain = await getCustomDomain(accessToken, owner, repo);
      setCustomDomainState(domain);
    } catch (err) {
      console.error("Failed to check status:", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, owner, repo]);

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen, checkStatus]);

  // Auto-refresh while building
  useEffect(() => {
    if (deploymentStatus?.status === "building") {
      const interval = setInterval(checkStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [deploymentStatus?.status, checkStatus]);

  async function handleEnableDeploy() {
    setDeploying(true);
    setError(null);

    try {
      const result = await enableGitHubPages(accessToken, owner, repo);

      if (result.success) {
        setTimeout(checkStatus, 2000);
      } else {
        setError(result.error || "Failed to enable deployment");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enable deployment");
    } finally {
      setDeploying(false);
    }
  }

  async function handleRedeploy() {
    setDeploying(true);
    setError(null);

    try {
      const result = await triggerDeployment(accessToken, owner, repo);

      if (result.success) {
        setDeploymentStatus((prev) =>
          prev ? { ...prev, status: "building" } : null
        );
        setTimeout(checkStatus, 2000);
      } else {
        setError(result.error || "Failed to trigger deployment");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to redeploy");
    } finally {
      setDeploying(false);
    }
  }

  async function handleSaveCustomDomain() {
    if (!domainInput.trim()) return;

    setSavingDomain(true);
    setError(null);

    try {
      const result = await setCustomDomain(accessToken, owner, repo, domainInput.trim());

      if (result.success) {
        setCustomDomainState(domainInput.trim());
        setDomainInput("");
        setShowDNS(true);
      } else {
        setError(result.error || "Failed to set custom domain");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set custom domain");
    } finally {
      setSavingDomain(false);
    }
  }

  async function handleRemoveCustomDomain() {
    setSavingDomain(true);
    setError(null);

    try {
      const result = await removeCustomDomain(accessToken, owner, repo);

      if (result.success) {
        setCustomDomainState(null);
        setShowDNS(false);
      } else {
        setError(result.error || "Failed to remove custom domain");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove custom domain");
    } finally {
      setSavingDomain(false);
    }
  }

  async function handleCopyDNSRecords() {
    if (!customDomain) return;

    const message = generateDNSRecordsMessage(customDomain, owner);
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isApex = customDomain && !customDomain.startsWith("www.");

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0b] border-l border-zinc-800/50 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="h-14 border-b border-zinc-800/50 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-violet-400" />
            <span className="font-semibold text-white">Deploy</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-3.5rem)] overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
              <p className="text-zinc-500 text-sm">Checking deployment status...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-3 py-2 text-sm flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              {!deploymentStatus?.enabled ? (
                /* Not yet deployed */
                <div className="space-y-4">
                  <div className="text-center py-6">
                    <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
                      <Rocket className="h-7 w-7 text-violet-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">Deploy to GitHub Pages</h3>
                    <p className="text-zinc-500 text-sm">Free hosting, instant setup</p>
                  </div>

                  <div className="bg-zinc-800/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-zinc-400" />
                      <span className="text-zinc-300">{owner}.github.io/{repo}</span>
                    </div>
                    <p className="text-xs text-zinc-500">Your site URL (free SSL included)</p>
                  </div>

                  <Button
                    onClick={handleEnableDeploy}
                    disabled={deploying}
                    className="w-full h-11 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white font-medium rounded-lg"
                  >
                    {deploying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Deploy Now
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                /* Already deployed */
                <div className="space-y-4">
                  {/* Status */}
                  <div className="bg-zinc-800/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={deploymentStatus.status} />
                        <div>
                          <p className="text-white font-medium text-sm">
                            {deploymentStatus.status === "deployed" && "Site is Live"}
                            {deploymentStatus.status === "building" && "Building..."}
                            {deploymentStatus.status === "failed" && "Deployment Failed"}
                            {deploymentStatus.status === "pending" && "Pending"}
                          </p>
                          {deploymentStatus.lastDeployedAt && (
                            <p className="text-xs text-zinc-500">
                              {new Date(deploymentStatus.lastDeployedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={handleRedeploy}
                        disabled={deploying || deploymentStatus.status === "building"}
                        size="sm"
                        variant="outline"
                        className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                      >
                        {deploying || deploymentStatus.status === "building" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {deploymentStatus.url && (
                      <a
                        href={customDomain ? `https://${customDomain}` : deploymentStatus.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 bg-zinc-900/50 rounded-lg hover:bg-zinc-800/50 transition-colors group"
                      >
                        <Globe className="h-4 w-4 text-violet-400" />
                        <span className="text-sm text-white flex-1 truncate">
                          {customDomain || deploymentStatus.url}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 text-zinc-500 group-hover:text-violet-400" />
                      </a>
                    )}
                  </div>

                  {/* Custom Domain */}
                  <div className="bg-zinc-800/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Link2 className="h-4 w-4 text-violet-400" />
                      <span className="text-white font-medium text-sm">Custom Domain</span>
                    </div>

                    {customDomain ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-zinc-900/50 rounded-lg p-2.5">
                          <span className="text-sm text-white">{customDomain}</span>
                          <Button
                            onClick={handleRemoveCustomDomain}
                            disabled={savingDomain}
                            size="sm"
                            variant="ghost"
                            className="text-zinc-400 hover:text-red-400 h-7 w-7 p-0"
                          >
                            {savingDomain ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>

                        <Button
                          onClick={() => setShowDNS(!showDNS)}
                          variant="outline"
                          size="sm"
                          className="w-full border-zinc-700 text-zinc-300 hover:text-white"
                        >
                          {showDNS ? "Hide" : "Show"} DNS Records
                        </Button>

                        {showDNS && (
                          <div className="space-y-3 pt-2">
                            <div className="bg-zinc-900/70 rounded-lg p-3">
                              <p className="text-xs text-zinc-400 mb-2 font-medium">
                                {isApex ? "A Records (required)" : "CNAME Record"}
                              </p>
                              {isApex ? (
                                <div className="space-y-1.5">
                                  {GITHUB_PAGES_DNS.apex.records.map((ip) => (
                                    <div
                                      key={ip}
                                      className="flex items-center justify-between text-xs bg-zinc-800/50 rounded px-2 py-1.5"
                                    >
                                      <span className="text-zinc-500">A</span>
                                      <span className="text-zinc-400">@</span>
                                      <span className="text-white font-mono">{ip}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center justify-between text-xs bg-zinc-800/50 rounded px-2 py-1.5">
                                  <span className="text-zinc-500">CNAME</span>
                                  <span className="text-zinc-400">www</span>
                                  <span className="text-white font-mono">{owner}.github.io</span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={handleCopyDNSRecords}
                                size="sm"
                                variant="outline"
                                className="flex-1 border-zinc-700 text-zinc-300 hover:text-white"
                              >
                                {copied ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 mr-1.5 text-green-400" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                                    Copy DNS Records
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={handleCopyDNSRecords}
                                size="sm"
                                variant="outline"
                                className="border-zinc-700 text-zinc-300 hover:text-white px-2.5"
                                title="Share DNS Records"
                              >
                                <Share2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>

                            <p className="text-[10px] text-zinc-500 text-center">
                              DNS changes can take up to 48 hours to propagate
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={domainInput}
                            onChange={(e) => setDomainInput(e.target.value)}
                            placeholder="example.com"
                            className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-600 h-9"
                          />
                          <Button
                            onClick={handleSaveCustomDomain}
                            disabled={!domainInput.trim() || savingDomain}
                            size="sm"
                            className="bg-violet-500 hover:bg-violet-400 text-white px-4"
                          >
                            {savingDomain ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Add"
                            )}
                          </Button>
                        </div>
                        <p className="text-[10px] text-zinc-500">
                          Enter your domain (e.g., example.com or www.example.com)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Recent Deployments */}
                  {workflowRuns.length > 0 && (
                    <div className="bg-zinc-800/30 rounded-lg p-4">
                      <p className="text-white font-medium text-sm mb-3">Recent Deployments</p>
                      <div className="space-y-1.5">
                        {workflowRuns.slice(0, 3).map((run) => (
                          <a
                            key={run.id}
                            href={run.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2 bg-zinc-900/50 rounded-lg hover:bg-zinc-800/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <RunStatusIcon status={run.status} conclusion={run.conclusion} />
                              <span className="text-xs text-zinc-400">
                                {new Date(run.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                run.conclusion === "success"
                                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                                  : run.conclusion === "failure"
                                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                                  : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                              }`}
                            >
                              {run.conclusion || run.status}
                            </Badge>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function StatusIcon({ status }: { status: DeploymentStatus["status"] }) {
  switch (status) {
    case "deployed":
      return <CheckCircle className="h-5 w-5 text-green-400" />;
    case "building":
      return <Loader2 className="h-5 w-5 text-yellow-400 animate-spin" />;
    case "failed":
      return <XCircle className="h-5 w-5 text-red-400" />;
    default:
      return <Clock className="h-5 w-5 text-zinc-400" />;
  }
}

function RunStatusIcon({ status, conclusion }: { status: string; conclusion: string | null }) {
  if (status === "in_progress" || status === "queued") {
    return <Loader2 className="h-3.5 w-3.5 text-yellow-400 animate-spin" />;
  }
  if (conclusion === "success") {
    return <CheckCircle className="h-3.5 w-3.5 text-green-400" />;
  }
  if (conclusion === "failure") {
    return <XCircle className="h-3.5 w-3.5 text-red-400" />;
  }
  return <Clock className="h-3.5 w-3.5 text-zinc-500" />;
}
