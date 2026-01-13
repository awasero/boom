import { Octokit } from "@octokit/rest";
import { GeneratedFile, VibesitesConfig } from "@/types/project";

// Cross-environment base64 encoding
function toBase64(str: string): string {
  if (typeof window !== "undefined") {
    // Browser environment
    return btoa(unescape(encodeURIComponent(str)));
  } else {
    // Node.js environment
    return Buffer.from(str).toString("base64");
  }
}

// Cross-environment base64 decoding
function fromBase64(base64: string): string {
  if (typeof window !== "undefined") {
    // Browser environment
    return decodeURIComponent(escape(atob(base64)));
  } else {
    // Node.js environment
    return Buffer.from(base64, "base64").toString();
  }
}

export async function commitFiles(
  accessToken: string,
  owner: string,
  repo: string,
  files: GeneratedFile[],
  message: string
): Promise<string> {
  const octokit = new Octokit({ auth: accessToken });

  // Get the default branch
  const { data: repoData } = await octokit.repos.get({ owner, repo });
  const branch = repoData.default_branch;

  // Get the latest commit SHA
  const { data: refData } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  const latestCommitSha = refData.object.sha;

  // Get the tree SHA from the latest commit
  const { data: commitData } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: latestCommitSha,
  });
  const baseTreeSha = commitData.tree.sha;

  // Create blobs for each file
  const blobs = await Promise.all(
    files.map(async (file) => {
      const { data } = await octokit.git.createBlob({
        owner,
        repo,
        content: toBase64(file.content),
        encoding: "base64",
      });
      return { path: file.path, sha: data.sha };
    })
  );

  // Create a new tree with the files
  const { data: newTree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseTreeSha,
    tree: blobs.map((blob) => ({
      path: blob.path,
      mode: "100644" as const,
      type: "blob" as const,
      sha: blob.sha,
    })),
  });

  // Create a new commit
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message,
    tree: newTree.sha,
    parents: [latestCommitSha],
  });

  // Update the reference to point to the new commit
  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
  });

  return newCommit.sha;
}

export async function getFileContent(
  accessToken: string,
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  const octokit = new Octokit({ auth: accessToken });

  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    if ("content" in data) {
      // GitHub returns base64 with newlines, need to remove them
      const cleanBase64 = data.content.replace(/\n/g, "");
      return fromBase64(cleanBase64);
    }
    return null;
  } catch {
    return null;
  }
}

export async function getProjectFiles(
  accessToken: string,
  owner: string,
  repo: string
): Promise<GeneratedFile[]> {
  const octokit = new Octokit({ auth: accessToken });
  const files: GeneratedFile[] = [];

  async function fetchDirectory(path: string) {
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path,
      });

      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.type === "file" && isRelevantFile(item.path)) {
            const content = await getFileContent(
              accessToken,
              owner,
              repo,
              item.path
            );
            if (content) {
              files.push({ path: item.path, content });
            }
          } else if (item.type === "dir" && !isIgnoredDir(item.path)) {
            await fetchDirectory(item.path);
          }
        }
      }
    } catch {
      // Directory might not exist
    }
  }

  // Fetch root level files first (for Opus mode: HTML/CSS/JS)
  await fetchDirectory("");
  // Fetch src and public directories (for Astro mode)
  await fetchDirectory("src");
  await fetchDirectory("public");

  return files;
}

function isRelevantFile(path: string): boolean {
  const relevantExtensions = [
    ".html",
    ".astro",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".css",
    ".json",
    ".md",
    ".mdx",
  ];
  return relevantExtensions.some((ext) => path.endsWith(ext));
}

function isIgnoredDir(path: string): boolean {
  const ignoredDirs = ["node_modules", ".git", "dist", ".astro", ".vibesites", ".boovibe"];
  return ignoredDirs.some((dir) => path.includes(dir));
}

export async function getProjectConfig(
  accessToken: string,
  owner: string,
  repo: string
): Promise<VibesitesConfig | null> {
  // Try new .vibesites path first
  let content = await getFileContent(accessToken, owner, repo, ".vibesites/config.json");

  // Fall back to old .boovibe path for backward compatibility
  if (!content) {
    content = await getFileContent(accessToken, owner, repo, ".boovibe/config.json");
  }

  if (content) {
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  return null;
}

export async function saveProjectConfig(
  accessToken: string,
  owner: string,
  repo: string,
  config: VibesitesConfig
): Promise<void> {
  const octokit = new Octokit({ auth: accessToken });
  const path = ".vibesites/config.json";
  const content = JSON.stringify(config, null, 2);

  // Get the default branch first
  const { data: repoData } = await octokit.repos.get({ owner, repo });
  const branch = repoData.default_branch;

  // Check if file exists to get its SHA
  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });
    if ("sha" in data) {
      sha = data.sha;
    }
  } catch {
    // File doesn't exist yet
  }

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: "Update Vibesites project settings",
    content: toBase64(content),
    branch,
    sha,
  });
}
