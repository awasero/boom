import { Octokit } from "@octokit/rest";
import { GeneratedFile } from "@/types/project";

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
        content: Buffer.from(file.content).toString("base64"),
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
      return Buffer.from(data.content, "base64").toString();
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

  await fetchDirectory("src");
  await fetchDirectory("public");

  return files;
}

function isRelevantFile(path: string): boolean {
  const relevantExtensions = [
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
  const ignoredDirs = ["node_modules", ".git", "dist", ".astro"];
  return ignoredDirs.some((dir) => path.includes(dir));
}
