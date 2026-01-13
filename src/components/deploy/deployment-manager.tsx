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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getCloudflareToken,
  getCloudflareAccountId,
  hasDeploymentKeys,
} from "@/lib/storage";
import {
  getProject,
  createProject,
  triggerDeployment,
  getDeployments,
  addCustomDomain,
} from "@/lib/cloudflare";
import {
  ArrowLeft,
  Cloud,
  ExternalLink,
  Globe,
  Loader2,
  Plus,
  Rocket,
  Settings,
  Sparkles,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface DeploymentManagerProps {
  owner: string;
  repo: string;
  accessToken: string;
}

interface Deployment {
  id: string;
  url: string;
  environment: string;
  created_on: string;
  latest_stage: {
    name: string;
    status: string;
  };
}

export function DeploymentManager({
  owner,
  repo,
}: DeploymentManagerProps) {
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [projectUrl, setProjectUrl] = useState<string | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [customDomain, setCustomDomain] = useState("");
  const [addingDomain, setAddingDomain] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectName = repo.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  const checkProjectStatus = useCallback(async () => {
    if (!hasDeploymentKeys()) {
      setLoading(false);
      return;
    }

    const token = getCloudflareToken()!;
    const accountId = getCloudflareAccountId()!;

    try {
      const project = await getProject(token, accountId, projectName);

      if (project) {
        setIsConnected(true);
        setProjectUrl(`https://${project.subdomain}.pages.dev`);

        const deps = await getDeployments(token, accountId, projectName);
        setDeployments(deps.slice(0, 5));
      }
    } catch (err) {
      console.error("Failed to check project status:", err);
    } finally {
      setLoading(false);
    }
  }, [projectName]);

  useEffect(() => {
    checkProjectStatus();
  }, [checkProjectStatus]);

  async function handleConnect() {
    if (!hasDeploymentKeys()) {
      setError("Please configure your Cloudflare API credentials in Settings first.");
      return;
    }

    setDeploying(true);
    setError(null);

    const token = getCloudflareToken()!;
    const accountId = getCloudflareAccountId()!;

    try {
      const project = await createProject(
        token,
        accountId,
        projectName,
        owner,
        repo
      );

      setIsConnected(true);
      setProjectUrl(`https://${project.subdomain}.pages.dev`);

      // Trigger initial deployment
      await triggerDeployment(token, accountId, projectName);

      // Refresh deployments
      const deps = await getDeployments(token, accountId, projectName);
      setDeployments(deps.slice(0, 5));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect to Cloudflare"
      );
    } finally {
      setDeploying(false);
    }
  }

  async function handleDeploy() {
    if (!hasDeploymentKeys()) return;

    setDeploying(true);
    setError(null);

    const token = getCloudflareToken()!;
    const accountId = getCloudflareAccountId()!;

    try {
      await triggerDeployment(token, accountId, projectName);

      // Refresh deployments after a short delay
      setTimeout(async () => {
        const deps = await getDeployments(token, accountId, projectName);
        setDeployments(deps.slice(0, 5));
        setDeploying(false);
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to trigger deployment"
      );
      setDeploying(false);
    }
  }

  async function handleAddDomain() {
    if (!customDomain.trim() || !hasDeploymentKeys()) return;

    setAddingDomain(true);
    setError(null);

    const token = getCloudflareToken()!;
    const accountId = getCloudflareAccountId()!;

    try {
      await addCustomDomain(token, accountId, projectName, customDomain.trim());
      setCustomDomain("");
      // Refresh project to get updated domains
      await checkProjectStatus();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add custom domain"
      );
    } finally {
      setAddingDomain(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="h-14 border-b bg-white flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/project/${owner}/${repo}`}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Builder
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            <span className="font-semibold">Deploy {repo}</span>
          </div>
        </div>

        <Button variant="ghost" size="sm" asChild>
          <Link href="/settings">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {!hasDeploymentKeys() ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Connect Cloudflare
              </CardTitle>
              <CardDescription>
                Add your Cloudflare API credentials to deploy your site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You need to configure your Cloudflare API token and Account ID
                in Settings before deploying.
              </p>
              <Button asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Go to Settings
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : !isConnected ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Deploy to Cloudflare Pages
              </CardTitle>
              <CardDescription>
                Connect your GitHub repository to Cloudflare Pages for automatic
                deployments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Sparkles className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">
                    {owner}/{repo}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Will be deployed to {projectName}.pages.dev
                  </p>
                </div>
              </div>

              <Button
                onClick={handleConnect}
                disabled={deploying}
                className="w-full"
              >
                {deploying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Cloud className="h-4 w-4 mr-2" />
                    Connect & Deploy
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Project Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Site Connected
                    </CardTitle>
                    <CardDescription>
                      Your site is live on Cloudflare Pages
                    </CardDescription>
                  </div>
                  <Button onClick={handleDeploy} disabled={deploying}>
                    {deploying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Rocket className="h-4 w-4 mr-2" />
                        Deploy Now
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {projectUrl && (
                  <a
                    href={projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    {projectUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Recent Deployments */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Deployments</CardTitle>
              </CardHeader>
              <CardContent>
                {deployments.length === 0 ? (
                  <p className="text-muted-foreground">No deployments yet</p>
                ) : (
                  <div className="space-y-3">
                    {deployments.map((deployment) => (
                      <div
                        key={deployment.id}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex items-center gap-3">
                          <DeploymentStatusIcon
                            status={deployment.latest_stage.status}
                          />
                          <div>
                            <p className="text-sm font-medium">
                              {deployment.environment}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(deployment.created_on).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <a
                          href={deployment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          View
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Custom Domain */}
            <Card>
              <CardHeader>
                <CardTitle>Custom Domain</CardTitle>
                <CardDescription>
                  Add a custom domain to your site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="domain" className="sr-only">
                      Domain
                    </Label>
                    <Input
                      id="domain"
                      placeholder="example.com"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      disabled={addingDomain}
                    />
                  </div>
                  <Button
                    onClick={handleAddDomain}
                    disabled={addingDomain || !customDomain.trim()}
                  >
                    {addingDomain ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  After adding, you&apos;ll need to configure DNS records to point to
                  Cloudflare Pages.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

function DeploymentStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case "active":
    case "building":
      return <Clock className="h-5 w-5 text-yellow-600" />;
    case "failure":
      return <XCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Clock className="h-5 w-5 text-muted-foreground" />;
  }
}
