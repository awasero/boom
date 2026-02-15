import { Octokit } from "@octokit/rest";

export interface CommitFile {
  path: string;
  content: string;
}

export interface ProjectFile {
  path: string;
  content: string;
  sha: string;
}

function toBase64(content: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(content).toString("base64");
  }
  return btoa(unescape(encodeURIComponent(content)));
}

function fromBase64(content: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(content, "base64").toString("utf-8");
  }
  return decodeURIComponent(escape(atob(content)));
}

/**
 * Commit multiple files to a repo using the Git Data API.
 *
 * 1. Get current ref (heads/branch)
 * 2. Get the current commit
 * 3. Create blobs for each file
 * 4. Create a new tree with those blobs
 * 5. Create a new commit pointing to that tree
 * 6. Update the ref
 */
export async function commitFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  files: CommitFile[],
  message: string,
  branch: string = "main"
) {
  // 1. Get current ref
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  const latestCommitSha = ref.object.sha;

  // 2. Get the current commit to find its tree
  const { data: commit } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: latestCommitSha,
  });
  const baseTreeSha = commit.tree.sha;

  // 3. Create blobs for each file
  const blobs = await Promise.all(
    files.map(async (file) => {
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo,
        content: toBase64(file.content),
        encoding: "base64",
      });
      return { path: file.path, sha: blob.sha };
    })
  );

  // 4. Create a new tree with those blobs
  const { data: tree } = await octokit.git.createTree({
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

  // 5. Create a new commit pointing to that tree
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message,
    tree: tree.sha,
    parents: [latestCommitSha],
  });

  // 6. Update the ref
  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
  });

  return newCommit;
}

/**
 * Recursively fetch all files in a repo using the Git Data API.
 */
export async function getProjectFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string = "main"
): Promise<ProjectFile[]> {
  // Get the tree recursively
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });

  const { data: tree } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: ref.object.sha,
    recursive: "1",
  });

  // Filter for blobs only (files, not directories)
  const blobEntries = tree.tree.filter((entry) => entry.type === "blob");

  // Fetch content for each file
  const files = await Promise.all(
    blobEntries.map(async (entry) => {
      const { data: blob } = await octokit.git.getBlob({
        owner,
        repo,
        file_sha: entry.sha!,
      });

      return {
        path: entry.path!,
        content: fromBase64(blob.content),
        sha: entry.sha!,
      };
    })
  );

  return files;
}

/**
 * Get the content of a single file from the repo.
 */
export async function getFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  branch: string = "main"
): Promise<string> {
  const { data } = await octokit.repos.getContent({
    owner,
    repo,
    path,
    ref: branch,
  });

  if (Array.isArray(data) || data.type !== "file") {
    throw new Error(`Path "${path}" is not a file`);
  }

  return fromBase64(data.content);
}
