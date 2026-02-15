import { cfFetch } from "./client";

interface PagesProject {
  name: string;
  subdomain: string;
  domains: string[];
  created_on: string;
}

interface Deployment {
  id: string;
  url: string;
  environment: string;
  created_on: string;
  latest_stage: { name: string; status: string };
}

// Create a new Pages project
export async function createPagesProject(projectName: string): Promise<PagesProject> {
  // Sanitize name: lowercase, alphanumeric + hyphens only
  const name = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 50);
  return cfFetch<PagesProject>(`/pages/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      production_branch: "main",
    }),
  });
}

// Deploy files to Cloudflare Pages via Direct Upload
export async function deployProject(
  projectName: string,
  files: Array<{ path: string; content: string }>,
  branch: string = "main"
): Promise<Deployment> {
  // Step 1: Create a FormData with the files
  const formData = new FormData();
  formData.append("branch", branch);

  // Each file needs to be added to the form as a Blob
  for (const file of files) {
    // Cloudflare expects the path as the key without leading slash
    const cleanPath = file.path.startsWith("/") ? file.path.slice(1) : file.path;
    formData.append(cleanPath, new Blob([file.content], { type: getMimeType(cleanPath) }), cleanPath);
  }

  // Step 2: Upload via Direct Upload API
  // POST /accounts/{account_id}/pages/projects/{project_name}/deployments
  const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 50);

  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !accountId) throw new Error("Cloudflare credentials not configured");

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${sanitizedName}/deployments`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Deploy failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(`Deploy error: ${data.errors?.map((e: { message: string }) => e.message).join(", ")}`);
  }

  return data.result;
}

// Get deployment status
export async function getDeploymentStatus(projectName: string, deploymentId: string): Promise<Deployment> {
  const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 50);
  return cfFetch<Deployment>(`/pages/projects/${sanitizedName}/deployments/${deploymentId}`);
}

// List deployments
export async function listDeployments(projectName: string): Promise<Deployment[]> {
  const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 50);
  return cfFetch<Deployment[]>(`/pages/projects/${sanitizedName}/deployments`);
}

// Delete Pages project
export async function deletePagesProject(projectName: string): Promise<void> {
  const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 50);
  await cfFetch(`/pages/projects/${sanitizedName}`, { method: "DELETE" });
}

function getMimeType(path: string): string {
  if (path.endsWith(".html")) return "text/html";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".js")) return "application/javascript";
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  return "text/plain";
}
