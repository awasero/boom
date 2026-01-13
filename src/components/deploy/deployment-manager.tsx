"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getDeploymentStatus,
  enableGitHubPages,
  triggerDeployment,
  getWorkflowRuns,
  DeploymentStatus,
} from "@/lib/github-pages";
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  Loader2,
  Rocket,
  Settings,
  Sparkles,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Github,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface DeploymentManagerProps {
  owner: string;
  repo: string;
  accessToken: string;
}

interface WorkflowRun {
  id: number;
  status: string;
  conclusion: string | null;
  createdAt: string;
  url: string;
}

export function DeploymentManager({
  owner,
  repo,
  accessToken,
}: DeploymentManagerProps) {
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const status = await getDeploymentStatus(accessToken, owner, repo);
      setDeploymentStatus(status);

      if (status.enabled) {
        const runs = await getWorkflowRuns(accessToken, owner, repo);
        setWorkflowRuns(runs);
      }
    } catch (err) {
      console.error("Failed to check status:", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, owner, repo]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

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
        // Wait a moment then refresh status
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          <p className="text-zinc-500 text-sm">Checking deployment status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Header */}
      <header className="h-14 border-b border-zinc-800/50 bg-[#0a0a0b]/80 backdrop-blur-xl flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          >
            <Link href={`/project/${owner}/${repo}`}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Builder
            </Link>
          </Button>
          <div className="h-5 w-px bg-zinc-800" />
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-violet-400" />
            <span className="font-semibold text-white">Deploy</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
        >
          <Link href="/settings">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {!deploymentStatus?.enabled ? (
          /* Not yet deployed */
          <Card className="bg-[#111113] border-zinc-800/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5" />
            <CardHeader className="relative text-center pb-2">
              <div className="mx-auto mb-4 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl blur-xl opacity-30" />
                <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
                  <Rocket className="h-8 w-8 text-violet-400" />
                </div>
              </div>
              <CardTitle className="text-white text-xl">Deploy to GitHub Pages</CardTitle>
              <CardDescription className="text-zinc-400">
                One click to make your site live. Free hosting, no setup required.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-6">
              <div className="bg-zinc-800/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-zinc-700/50 flex items-center justify-center">
                    <Github className="h-4 w-4 text-zinc-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{owner}/{repo}</p>
                    <p className="text-xs text-zinc-500">Will be deployed automatically</p>
                  </div>
                </div>

                <div className="h-px bg-zinc-700/50" />

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-zinc-700/50 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-zinc-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{owner}.github.io/{repo}</p>
                    <p className="text-xs text-zinc-500">Your site URL (free SSL included)</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-zinc-500 text-center">What happens when you click deploy:</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { icon: "1", text: "Creates workflow" },
                    { icon: "2", text: "Builds your site" },
                    { icon: "3", text: "Goes live!" },
                  ].map((step) => (
                    <div key={step.icon} className="bg-zinc-800/30 rounded-lg p-3">
                      <div className="h-6 w-6 rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold flex items-center justify-center mx-auto mb-1">
                        {step.icon}
                      </div>
                      <p className="text-[11px] text-zinc-400">{step.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleEnableDeploy}
                disabled={deploying}
                className="w-full h-12 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white font-medium rounded-xl shadow-lg shadow-violet-500/20"
              >
                {deploying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Deploy Now — It&apos;s Free
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Already deployed */
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="bg-[#111113] border-zinc-800/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIcon status={deploymentStatus.status} />
                    <div>
                      <CardTitle className="text-white text-lg">
                        {deploymentStatus.status === "deployed" && "Site is Live"}
                        {deploymentStatus.status === "building" && "Building..."}
                        {deploymentStatus.status === "failed" && "Deployment Failed"}
                        {deploymentStatus.status === "pending" && "Deployment Pending"}
                      </CardTitle>
                      <CardDescription className="text-zinc-400">
                        {deploymentStatus.lastDeployedAt && (
                          <>Last deployed {new Date(deploymentStatus.lastDeployedAt).toLocaleString()}</>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={handleRedeploy}
                    disabled={deploying || deploymentStatus.status === "building"}
                    variant="outline"
                    className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                  >
                    {deploying || deploymentStatus.status === "building" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Building...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Redeploy
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {deploymentStatus.url && (
                  <a
                    href={deploymentStatus.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-zinc-800/30 rounded-xl hover:bg-zinc-800/50 transition-colors group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{deploymentStatus.url}</p>
                      <p className="text-xs text-zinc-500">Click to visit your live site</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-zinc-500 group-hover:text-violet-400 transition-colors" />
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Recent Deployments */}
            {workflowRuns.length > 0 && (
              <Card className="bg-[#111113] border-zinc-800/50">
                <CardHeader>
                  <CardTitle className="text-white text-base">Recent Deployments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {workflowRuns.map((run) => (
                      <a
                        key={run.id}
                        href={run.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <RunStatusIcon status={run.status} conclusion={run.conclusion} />
                          <div>
                            <p className="text-sm text-white">
                              {run.conclusion === "success" && "Deployed successfully"}
                              {run.conclusion === "failure" && "Deployment failed"}
                              {run.status === "in_progress" && "Building..."}
                              {run.status === "queued" && "Queued"}
                              {!run.conclusion && run.status !== "in_progress" && run.status !== "queued" && "Unknown"}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {new Date(run.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-zinc-600" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Help Card */}
            <Card className="bg-zinc-800/20 border-zinc-800/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-violet-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-zinc-300 font-medium mb-1">Automatic Deployments</p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Every time you make changes in the AI builder, they&apos;re committed to GitHub.
                      This triggers an automatic deployment — your site updates within minutes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

function StatusIcon({ status }: { status: DeploymentStatus["status"] }) {
  switch (status) {
    case "deployed":
      return (
        <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
          <CheckCircle className="h-5 w-5 text-green-400" />
        </div>
      );
    case "building":
      return (
        <div className="h-10 w-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
          <Loader2 className="h-5 w-5 text-yellow-400 animate-spin" />
        </div>
      );
    case "failed":
      return (
        <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center">
          <XCircle className="h-5 w-5 text-red-400" />
        </div>
      );
    default:
      return (
        <div className="h-10 w-10 rounded-xl bg-zinc-700/50 flex items-center justify-center">
          <Clock className="h-5 w-5 text-zinc-400" />
        </div>
      );
  }
}

function RunStatusIcon({ status, conclusion }: { status: string; conclusion: string | null }) {
  if (status === "in_progress" || status === "queued") {
    return <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />;
  }
  if (conclusion === "success") {
    return <CheckCircle className="h-4 w-4 text-green-400" />;
  }
  if (conclusion === "failure") {
    return <XCircle className="h-4 w-4 text-red-400" />;
  }
  return <Clock className="h-4 w-4 text-zinc-500" />;
}
