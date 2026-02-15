import { Octokit } from "@octokit/rest";

export async function createRepo(octokit: Octokit, name: string, description?: string) {
  const { data } = await octokit.repos.createForAuthenticatedUser({
    name,
    description: description || `Built with Boom`,
    private: false,
    auto_init: true,
  });
  return data;
}

export async function deleteRepo(octokit: Octokit, owner: string, repo: string) {
  await octokit.repos.delete({ owner, repo });
}

export async function getRepo(octokit: Octokit, owner: string, repo: string) {
  const { data } = await octokit.repos.get({ owner, repo });
  return data;
}
