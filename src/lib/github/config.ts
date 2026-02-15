import { Octokit } from "@octokit/rest";
import { getFileContent } from "./files";
import { commitFiles } from "./files";

export interface BoomConfig {
  name: string;
  type: "website" | "deck";
  version: string;
  createdAt: string;
}

export async function getProjectConfig(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<BoomConfig | null> {
  try {
    const content = await getFileContent(octokit, owner, repo, ".boom/config.json");
    return JSON.parse(content) as BoomConfig;
  } catch {
    return null;
  }
}

export async function saveProjectConfig(
  octokit: Octokit,
  owner: string,
  repo: string,
  config: BoomConfig
) {
  await commitFiles(
    octokit,
    owner,
    repo,
    [{ path: ".boom/config.json", content: JSON.stringify(config, null, 2) }],
    "chore: update boom config"
  );
}
