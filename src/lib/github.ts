import { Octokit } from "@octokit/rest";
import { Project, BooVibeConfig } from "@/types/project";

export function createOctokit(accessToken: string): Octokit {
  return new Octokit({ auth: accessToken });
}

export async function getUserRepos(accessToken: string): Promise<Project[]> {
  const octokit = createOctokit(accessToken);

  const { data: repos } = await octokit.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 100,
    affiliation: "owner",
  });

  const projects: Project[] = await Promise.all(
    repos.map(async (repo) => {
      let isBooVibeProject = false;
      let config: BooVibeConfig | undefined;

      try {
        const { data } = await octokit.repos.getContent({
          owner: repo.owner.login,
          repo: repo.name,
          path: ".boovibe/config.json",
        });

        if ("content" in data) {
          isBooVibeProject = true;
          const content = Buffer.from(data.content, "base64").toString();
          config = JSON.parse(content);
        }
      } catch {
        // Not a BooVibe project
      }

      return {
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        htmlUrl: repo.html_url,
        defaultBranch: repo.default_branch,
        updatedAt: repo.updated_at || new Date().toISOString(),
        isBooVibeProject,
        config,
      };
    })
  );

  return projects;
}

export async function createProject(
  accessToken: string,
  name: string,
  description: string
): Promise<Project> {
  const octokit = createOctokit(accessToken);

  // Create the repository
  const { data: repo } = await octokit.repos.createForAuthenticatedUser({
    name,
    description,
    auto_init: true,
    private: false,
  });

  // Create BooVibe config
  const config: BooVibeConfig = {
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    name,
    description,
    template: "custom",
  };

  // Create .boovibe/config.json
  await octokit.repos.createOrUpdateFileContents({
    owner: repo.owner.login,
    repo: repo.name,
    path: ".boovibe/config.json",
    message: "Initialize BooVibe project",
    content: Buffer.from(JSON.stringify(config, null, 2)).toString("base64"),
  });

  // Create basic Astro project structure
  const astroFiles = getAstroTemplateFiles(name, description);

  for (const file of astroFiles) {
    await octokit.repos.createOrUpdateFileContents({
      owner: repo.owner.login,
      repo: repo.name,
      path: file.path,
      message: `Add ${file.path}`,
      content: Buffer.from(file.content).toString("base64"),
    });
  }

  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    htmlUrl: repo.html_url,
    defaultBranch: repo.default_branch,
    updatedAt: repo.updated_at || new Date().toISOString(),
    isBooVibeProject: true,
    config,
  };
}

function getAstroTemplateFiles(
  name: string,
  description: string
): { path: string; content: string }[] {
  return [
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name: name.toLowerCase().replace(/\s+/g, "-"),
          type: "module",
          version: "0.0.1",
          scripts: {
            dev: "astro dev",
            start: "astro dev",
            build: "astro build",
            preview: "astro preview",
            astro: "astro",
          },
          dependencies: {
            astro: "^4.0.0",
            "@astrojs/tailwind": "^5.0.0",
            tailwindcss: "^3.4.0",
          },
        },
        null,
        2
      ),
    },
    {
      path: "astro.config.mjs",
      content: `import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
});
`,
    },
    {
      path: "tailwind.config.mjs",
      content: `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
`,
    },
    {
      path: "tsconfig.json",
      content: JSON.stringify(
        {
          extends: "astro/tsconfigs/strict",
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "@/*": ["src/*"],
            },
          },
        },
        null,
        2
      ),
    },
    {
      path: "src/layouts/Layout.astro",
      content: `---
interface Props {
  title: string;
  description?: string;
}

const { title, description = "${description || "Built with BooVibe"}" } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <meta name="generator" content={Astro.generator} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
  </head>
  <body class="min-h-screen bg-white text-gray-900 antialiased">
    <slot />
  </body>
</html>
`,
    },
    {
      path: "src/pages/index.astro",
      content: `---
import Layout from '../layouts/Layout.astro';
---

<Layout title="${name}">
  <main class="flex min-h-screen flex-col items-center justify-center p-8">
    <h1 class="text-4xl font-bold mb-4">${name}</h1>
    <p class="text-xl text-gray-600 mb-8">${description || "Welcome to your new website"}</p>
    <p class="text-sm text-gray-400">
      Start chatting in BooVibe to build your site
    </p>
  </main>
</Layout>
`,
    },
    {
      path: "public/favicon.svg",
      content: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 128 128">
  <circle cx="64" cy="64" r="60" fill="#6366f1"/>
  <text x="64" y="80" text-anchor="middle" fill="white" font-size="48" font-family="system-ui">B</text>
</svg>
`,
    },
  ];
}

export async function getRepoFiles(
  accessToken: string,
  owner: string,
  repo: string,
  path: string = ""
): Promise<{ path: string; type: string; content?: string }[]> {
  const octokit = createOctokit(accessToken);

  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    if (Array.isArray(data)) {
      return data.map((item) => ({
        path: item.path,
        type: item.type,
      }));
    }

    if ("content" in data) {
      return [
        {
          path: data.path,
          type: data.type,
          content: Buffer.from(data.content, "base64").toString(),
        },
      ];
    }

    return [];
  } catch {
    return [];
  }
}
