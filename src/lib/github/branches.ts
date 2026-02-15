import { Octokit } from "@octokit/rest";

export async function createBranch(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  fromBranch: string = "main"
) {
  // Get the SHA of the source branch
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${fromBranch}`,
  });

  // Create the new branch
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branch}`,
    sha: ref.object.sha,
  });
}

export async function mergeBranch(
  octokit: Octokit,
  owner: string,
  repo: string,
  head: string,
  base: string = "main",
  message?: string
) {
  const { data } = await octokit.repos.merge({
    owner,
    repo,
    base,
    head,
    commit_message: message || `Merge ${head} into ${base}`,
  });
  return data;
}

export async function branchExists(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string
): Promise<boolean> {
  try {
    await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
    return true;
  } catch {
    return false;
  }
}

export async function ensureStagingBranch(
  octokit: Octokit,
  owner: string,
  repo: string
) {
  const exists = await branchExists(octokit, owner, repo, "staging");
  if (!exists) {
    await createBranch(octokit, owner, repo, "staging", "main");
  }
}
