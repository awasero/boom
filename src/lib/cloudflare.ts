interface CloudflareProject {
  id: string;
  name: string;
  subdomain: string;
  domains: string[];
  production_branch: string;
  created_on: string;
  source?: {
    type: string;
    config?: {
      owner: string;
      repo_name: string;
    };
  };
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

export async function listProjects(
  apiToken: string,
  accountId: string
): Promise<CloudflareProject[]> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || "Failed to fetch projects");
  }

  return data.result;
}

export async function createProject(
  apiToken: string,
  accountId: string,
  name: string,
  githubOwner: string,
  githubRepo: string,
  productionBranch: string = "main"
): Promise<CloudflareProject> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        production_branch: productionBranch,
        build_config: {
          build_command: "npm run build",
          destination_dir: "dist",
          root_dir: "",
        },
        source: {
          type: "github",
          config: {
            owner: githubOwner,
            repo_name: githubRepo,
            production_branch: productionBranch,
            pr_comments_enabled: true,
            deployments_enabled: true,
          },
        },
      }),
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || "Failed to create project");
  }

  return data.result;
}

export async function getProject(
  apiToken: string,
  accountId: string,
  projectName: string
): Promise<CloudflareProject | null> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!data.success) {
      return null;
    }

    return data.result;
  } catch {
    return null;
  }
}

export async function triggerDeployment(
  apiToken: string,
  accountId: string,
  projectName: string,
  branch: string = "main"
): Promise<Deployment> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        branch,
      }),
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || "Failed to trigger deployment");
  }

  return data.result;
}

export async function getDeployments(
  apiToken: string,
  accountId: string,
  projectName: string
): Promise<Deployment[]> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || "Failed to fetch deployments");
  }

  return data.result;
}

export async function addCustomDomain(
  apiToken: string,
  accountId: string,
  projectName: string,
  domain: string
): Promise<void> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain }),
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || "Failed to add domain");
  }
}

export async function validateCredentials(
  apiToken: string,
  accountId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  }
}
