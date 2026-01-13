import { Octokit } from "@octokit/rest";

const GITHUB_ACTIONS_WORKFLOW = `name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build Astro
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
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
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: workflowPath,
        message: "Add GitHub Pages deployment workflow",
        content: Buffer.from(GITHUB_ACTIONS_WORKFLOW).toString("base64"),
      });
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
        ref: "main",
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
    await octokit.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: "deploy.yml",
      ref: "main",
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
