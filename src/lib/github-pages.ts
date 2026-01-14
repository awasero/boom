import { Octokit } from "@octokit/rest";

// Static HTML workflow - manual deployment only
const STATIC_WORKFLOW = `name: Deploy to GitHub Pages

on:
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

export interface DeploymentStatus {
  enabled: boolean;
  url: string | null;
  status: "building" | "deployed" | "failed" | "pending" | "not_configured";
  lastDeployedAt: string | null;
}

export async function getDeploymentStatus(
  accessToken: string,
  owner: string,
  repo: string
): Promise<DeploymentStatus> {
  const octokit = new Octokit({ auth: accessToken });

  try {
    // Check if GitHub Pages is enabled
    const { data: pages } = await octokit.repos.getPages({
      owner,
      repo,
    });

    // Get latest deployment
    let lastDeployedAt: string | null = null;
    let status: DeploymentStatus["status"] = "deployed";

    try {
      const { data: deployments } = await octokit.repos.listDeployments({
        owner,
        repo,
        environment: "github-pages",
        per_page: 1,
      });

      if (deployments.length > 0) {
        lastDeployedAt = deployments[0].created_at;

        // Check deployment status
        const { data: statuses } = await octokit.repos.listDeploymentStatuses({
          owner,
          repo,
          deployment_id: deployments[0].id,
          per_page: 1,
        });

        if (statuses.length > 0) {
          const latestStatus = statuses[0].state;
          if (latestStatus === "success") {
            status = "deployed";
          } else if (latestStatus === "in_progress" || latestStatus === "queued" || latestStatus === "pending") {
            status = "building";
          } else if (latestStatus === "failure" || latestStatus === "error") {
            status = "failed";
          }
        }
      }
    } catch {
      // No deployments yet
    }

    return {
      enabled: true,
      url: pages.html_url || `https://${owner}.github.io/${repo}`,
      status,
      lastDeployedAt,
    };
  } catch {
    // Pages not enabled
    return {
      enabled: false,
      url: null,
      status: "not_configured",
      lastDeployedAt: null,
    };
  }
}

export async function enableGitHubPages(
  accessToken: string,
  owner: string,
  repo: string
): Promise<{ success: boolean; url: string; error?: string }> {
  const octokit = new Octokit({ auth: accessToken });

  try {
    // First, verify the repository exists and get default branch
    let defaultBranch = "main";
    try {
      const { data: repoData } = await octokit.repos.get({ owner, repo });
      defaultBranch = repoData.default_branch;
    } catch (error: unknown) {
      const err = error as { status?: number };
      if (err.status === 404) {
        return {
          success: false,
          url: "",
          error: "Repository not found. Make sure you have access to this repository.",
        };
      }
      throw error;
    }

    // Step 1: Create the GitHub Actions workflow file
    const workflowPath = ".github/workflows/deploy.yml";

    // Check if workflow already exists
    let workflowExists = false;
    try {
      await octokit.repos.getContent({
        owner,
        repo,
        path: workflowPath,
      });
      workflowExists = true;
    } catch {
      // Workflow doesn't exist
    }

    if (!workflowExists) {
      try {
        // Create the workflow file
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: workflowPath,
          message: "Add GitHub Pages deployment workflow",
          content: Buffer.from(STATIC_WORKFLOW).toString("base64"),
          branch: defaultBranch,
        });
      } catch (error: unknown) {
        console.error("Failed to create workflow file:", error);
        const err = error as { status?: number; message?: string };

        // Log the full error for debugging
        console.error("Error details:", JSON.stringify(err, null, 2));

        if (err.status === 404) {
          return {
            success: false,
            url: "",
            error: "Cannot create workflow file. Make sure the repository exists and has at least one commit.",
          };
        }
        if (err.status === 422) {
          const message = err.message || "";
          if (message.includes("sha")) {
            return {
              success: false,
              url: "",
              error: "Workflow file already exists but was modified. Please try again.",
            };
          }
          return {
            success: false,
            url: "",
            error: `Cannot create workflow file: ${message}`,
          };
        }
        return {
          success: false,
          url: "",
          error: `Failed to create workflow: ${err.message || "Unknown error"}`,
        };
      }
    }

    // Step 2: Enable GitHub Pages with GitHub Actions as the source
    try {
      await octokit.repos.createPagesSite({
        owner,
        repo,
        build_type: "workflow",
      });
    } catch (error: unknown) {
      // Pages might already be enabled, try updating instead
      const err = error as { status?: number };
      if (err.status === 409) {
        // Already exists, update it
        await octokit.repos.updateInformationAboutPagesSite({
          owner,
          repo,
          build_type: "workflow",
        });
      } else {
        throw error;
      }
    }

    // Step 3: Trigger the workflow to start the first deployment
    try {
      await octokit.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: "deploy.yml",
        ref: defaultBranch,
      });
    } catch {
      // Workflow might not be ready yet, that's OK - it'll run on next push
    }

    const url = `https://${owner}.github.io/${repo}`;

    return { success: true, url };
  } catch (error) {
    console.error("Failed to enable GitHub Pages:", error);
    return {
      success: false,
      url: "",
      error: error instanceof Error ? error.message : "Failed to enable GitHub Pages",
    };
  }
}

export async function triggerDeployment(
  accessToken: string,
  owner: string,
  repo: string
): Promise<{ success: boolean; error?: string }> {
  const octokit = new Octokit({ auth: accessToken });

  try {
    // Get the default branch
    const { data: repoData } = await octokit.repos.get({ owner, repo });
    const defaultBranch = repoData.default_branch;

    await octokit.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: "deploy.yml",
      ref: defaultBranch,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to trigger deployment",
    };
  }
}

export async function getWorkflowRuns(
  accessToken: string,
  owner: string,
  repo: string
): Promise<Array<{
  id: number;
  status: string;
  conclusion: string | null;
  createdAt: string;
  url: string;
}>> {
  const octokit = new Octokit({ auth: accessToken });

  try {
    const { data } = await octokit.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: "deploy.yml",
      per_page: 5,
    });

    return data.workflow_runs.map((run) => ({
      id: run.id,
      status: run.status || "unknown",
      conclusion: run.conclusion,
      createdAt: run.created_at,
      url: run.html_url,
    }));
  } catch {
    return [];
  }
}

// GitHub Pages DNS records for custom domains
export const GITHUB_PAGES_DNS = {
  apex: {
    type: "A",
    records: [
      "185.199.108.153",
      "185.199.109.153",
      "185.199.110.153",
      "185.199.111.153",
    ],
  },
  apexIPv6: {
    type: "AAAA",
    records: [
      "2606:50c0:8000::153",
      "2606:50c0:8001::153",
      "2606:50c0:8002::153",
      "2606:50c0:8003::153",
    ],
  },
};

export interface CustomDomainResult {
  success: boolean;
  domain?: string;
  error?: string;
}

// Get current custom domain (reads CNAME file)
export async function getCustomDomain(
  accessToken: string,
  owner: string,
  repo: string
): Promise<string | null> {
  const octokit = new Octokit({ auth: accessToken });

  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: "CNAME",
    });

    if (!Array.isArray(data) && data.type === "file" && data.content) {
      return Buffer.from(data.content, "base64").toString("utf-8").trim();
    }
    return null;
  } catch {
    return null;
  }
}

// Set custom domain (creates/updates CNAME file)
export async function setCustomDomain(
  accessToken: string,
  owner: string,
  repo: string,
  domain: string
): Promise<CustomDomainResult> {
  const octokit = new Octokit({ auth: accessToken });

  try {
    // Get default branch
    const { data: repoData } = await octokit.repos.get({ owner, repo });
    const defaultBranch = repoData.default_branch;

    // Check if CNAME already exists
    let existingSha: string | undefined;
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: "CNAME",
      });
      if (!Array.isArray(data) && data.type === "file") {
        existingSha = data.sha;
      }
    } catch {
      // CNAME doesn't exist
    }

    // Create or update CNAME file
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: "CNAME",
      message: `Set custom domain to ${domain}`,
      content: Buffer.from(domain).toString("base64"),
      branch: defaultBranch,
      ...(existingSha && { sha: existingSha }),
    });

    // Also update the GitHub Pages settings
    try {
      await octokit.repos.updateInformationAboutPagesSite({
        owner,
        repo,
        cname: domain,
      });
    } catch {
      // Pages might not be enabled yet, that's OK
    }

    return { success: true, domain };
  } catch (error) {
    console.error("Failed to set custom domain:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set custom domain",
    };
  }
}

// Remove custom domain (deletes CNAME file)
export async function removeCustomDomain(
  accessToken: string,
  owner: string,
  repo: string
): Promise<CustomDomainResult> {
  const octokit = new Octokit({ auth: accessToken });

  try {
    // Get default branch
    const { data: repoData } = await octokit.repos.get({ owner, repo });
    const defaultBranch = repoData.default_branch;

    // Get CNAME file SHA
    let existingSha: string | undefined;
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: "CNAME",
      });
      if (!Array.isArray(data) && data.type === "file") {
        existingSha = data.sha;
      }
    } catch {
      // CNAME doesn't exist, nothing to remove
      return { success: true };
    }

    if (!existingSha) {
      return { success: true };
    }

    // Delete CNAME file
    await octokit.repos.deleteFile({
      owner,
      repo,
      path: "CNAME",
      message: "Remove custom domain",
      sha: existingSha,
      branch: defaultBranch,
    });

    // Also update the GitHub Pages settings
    try {
      await octokit.repos.updateInformationAboutPagesSite({
        owner,
        repo,
        cname: "",
      });
    } catch {
      // Ignore errors
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to remove custom domain:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove custom domain",
    };
  }
}

// Generate DNS records message for sharing
export function generateDNSRecordsMessage(domain: string, owner: string): string {
  const isApex = !domain.startsWith("www.");

  if (isApex) {
    return `## DNS Configuration for ${domain}

Add these A records to your DNS provider:

| Type | Name | Value |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

Optional IPv6 (AAAA records):
| Type | Name | Value |
|------|------|-------|
| AAAA | @ | 2606:50c0:8000::153 |
| AAAA | @ | 2606:50c0:8001::153 |
| AAAA | @ | 2606:50c0:8002::153 |
| AAAA | @ | 2606:50c0:8003::153 |

DNS changes can take up to 48 hours to propagate.`;
  } else {
    return `## DNS Configuration for ${domain}

Add this CNAME record to your DNS provider:

| Type | Name | Value |
|------|------|-------|
| CNAME | www | ${owner}.github.io |

DNS changes can take up to 48 hours to propagate.`;
  }
}
