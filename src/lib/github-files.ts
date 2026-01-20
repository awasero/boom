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
  const visitedPaths = new Set<string>();

  async function fetchDirectory(path: string) {
    // Prevent infinite loops and duplicate fetches
    if (visitedPaths.has(path)) return;
    visitedPaths.add(path);

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
            // Recursively fetch all subdirectories
            await fetchDirectory(item.path);
          }
        }
      }
    } catch {
      // Directory might not exist
    }
  }

  // Start from root and recursively fetch all directories
  await fetchDirectory("");

  return files;
}

function isRelevantFile(path: string): boolean {
  const relevantExtensions = [
    // Web files
    ".html",
    ".htm",
    ".css",
    ".js",
    ".mjs",
    ".json",
    // TypeScript/React
    ".ts",
    ".tsx",
    ".jsx",
    // Astro
    ".astro",
    // Markdown
    ".md",
    ".mdx",
    // Images (for reference, content will be base64)
    ".svg",
    ".ico",
    // Config files
    ".yaml",
    ".yml",
    ".toml",
    ".xml",
    // Text files
    ".txt",
    ".env.example",
  ];

  // Also match specific config filenames
  const relevantFilenames = [
    "package.json",
    "tsconfig.json",
    "tailwind.config.js",
    "tailwind.config.ts",
    "postcss.config.js",
    "vite.config.js",
    "vite.config.ts",
    "astro.config.mjs",
    ".prettierrc",
    ".eslintrc",
  ];

  const filename = path.split("/").pop() || "";

  return (
    relevantExtensions.some((ext) => path.endsWith(ext)) ||
    relevantFilenames.includes(filename)
  );
}

function isIgnoredDir(path: string): boolean {
  const ignoredDirs = [
    "node_modules",
    ".git",
    "dist",
    "build",
    ".astro",
    ".vibesites",
    ".boovibe",
    ".next",
    ".vercel",
    ".github",
    "coverage",
    "__pycache__",
    ".cache",
  ];
  return ignoredDirs.some((dir) => path.startsWith(dir) || path.includes("/" + dir));
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
    message: "Update boom.git project settings",
    content: toBase64(content),
    branch,
    sha,
  });
}

// Commit history types
export interface CommitInfo {
  sha: string;
  message: string;
  date: string;
  author: string;
}

// Get commit history for the repository
export async function getCommitHistory(
  accessToken: string,
  owner: string,
  repo: string,
  limit: number = 20
): Promise<CommitInfo[]> {
  const octokit = new Octokit({ auth: accessToken });

  try {
    const { data } = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: limit,
    });

    return data.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      date: commit.commit.author?.date || "",
      author: commit.commit.author?.name || "Unknown",
    }));
  } catch {
    return [];
  }
}

// Revert to a specific commit by creating a new commit with that state
export async function revertToCommit(
  accessToken: string,
  owner: string,
  repo: string,
  targetSha: string
): Promise<string> {
  const octokit = new Octokit({ auth: accessToken });

  // Get the default branch
  const { data: repoData } = await octokit.repos.get({ owner, repo });
  const branch = repoData.default_branch;

  // Get the tree from the target commit
  const { data: targetCommit } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: targetSha,
  });

  // Get the current HEAD commit
  const { data: refData } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  const currentSha = refData.object.sha;

  // Create a new commit that points to the target tree
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message: `Revert to: ${targetCommit.message.split('\n')[0]}`,
    tree: targetCommit.tree.sha,
    parents: [currentSha],
  });

  // Update the branch reference
  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
  });

  return newCommit.sha;
}
