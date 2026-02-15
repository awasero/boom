import { Octokit } from "@octokit/rest";
import { commitFiles, getFileContent } from "./files";
import { DeckData } from "@/types/project";

const DECKS_DIR = "boom-decks";

export async function listDecks(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<DeckData[]> {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: DECKS_DIR,
    });

    if (!Array.isArray(data)) {
      return [];
    }

    const jsonFiles = data.filter(
      (item) => item.type === "file" && item.name.endsWith(".json")
    );

    const decks = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const content = await getFileContent(
            octokit,
            owner,
            repo,
            `${DECKS_DIR}/${file.name}`
          );
          return JSON.parse(content) as DeckData;
        } catch {
          return null;
        }
      })
    );

    return decks.filter((d): d is DeckData => d !== null);
  } catch {
    // Directory doesn't exist yet
    return [];
  }
}

export async function saveDeck(
  octokit: Octokit,
  owner: string,
  repo: string,
  deck: DeckData
): Promise<void> {
  await commitFiles(
    octokit,
    owner,
    repo,
    [
      {
        path: `${DECKS_DIR}/${deck.slug}.json`,
        content: JSON.stringify(deck, null, 2),
      },
    ],
    `feat: update deck "${deck.name}"`
  );
}

export async function deleteDeck(
  octokit: Octokit,
  owner: string,
  repo: string,
  slug: string
): Promise<void> {
  // To delete a file via Git Data API, we need to create a commit without it
  // Using the repos.deleteFile API instead for simplicity
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: `${DECKS_DIR}/${slug}.json`,
    });

    if (!Array.isArray(data) && data.type === "file") {
      await octokit.repos.deleteFile({
        owner,
        repo,
        path: `${DECKS_DIR}/${slug}.json`,
        message: `chore: delete deck "${slug}"`,
        sha: data.sha,
      });
    }
  } catch {
    // File doesn't exist, nothing to delete
  }
}
