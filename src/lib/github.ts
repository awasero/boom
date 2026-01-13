import { Octokit } from "@octokit/rest";
import { Project, VibesitesConfig, BuildMode } from "@/types/project";

// Cross-environment base64 encoding
function toBase64(str: string): string {
  if (typeof window !== "undefined") {
    return btoa(unescape(encodeURIComponent(str)));
  } else {
    return Buffer.from(str).toString("base64");
  }
}

// Cross-environment base64 decoding
function fromBase64(base64: string): string {
  if (typeof window !== "undefined") {
    return decodeURIComponent(escape(atob(base64.replace(/\n/g, ""))));
  } else {
    return Buffer.from(base64, "base64").toString();
  }
}

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
      let isVibesitesProject = false;
      let config: VibesitesConfig | undefined;

      // Check for new .vibesites config first, then fall back to old .boovibe for backward compatibility
      try {
        const { data } = await octokit.repos.getContent({
          owner: repo.owner.login,
          repo: repo.name,
          path: ".vibesites/config.json",
        });

        if ("content" in data) {
          isVibesitesProject = true;
          const content = fromBase64(data.content);
          config = JSON.parse(content);
        }
      } catch {
        // Try old .boovibe path for backward compatibility
        try {
          const { data } = await octokit.repos.getContent({
            owner: repo.owner.login,
            repo: repo.name,
            path: ".boovibe/config.json",
          });

          if ("content" in data) {
            isVibesitesProject = true;
            const content = fromBase64(data.content);
            config = JSON.parse(content);
          }
        } catch {
          // Not a Vibesites project
        }
      }

      return {
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        htmlUrl: repo.html_url,
        defaultBranch: repo.default_branch,
        updatedAt: repo.updated_at || new Date().toISOString(),
        isVibesitesProject,
        config,
      };
    })
  );

  return projects;
}

export async function createProject(
  accessToken: string,
  name: string,
  description: string,
  buildMode: BuildMode = "opus"
): Promise<Project> {
  const octokit = createOctokit(accessToken);

  // Create the repository
  let repo;
  try {
    const { data } = await octokit.repos.createForAuthenticatedUser({
      name,
      description,
      auto_init: true,
      private: false,
    });
    repo = data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String((error as { message: string }).message);
      if (message.includes('name already exists')) {
        throw new Error(`A repository named "${name}" already exists. Please choose a different name.`);
      }
    }
    throw error;
  }

  // Create Vibesites config with build mode
  const config: VibesitesConfig = {
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    name,
    description,
    template: "custom",
    buildMode,
  };

  // Create .vibesites/config.json
  await octokit.repos.createOrUpdateFileContents({
    owner: repo.owner.login,
    repo: repo.name,
    path: ".vibesites/config.json",
    message: "Initialize Vibesites project",
    content: toBase64(JSON.stringify(config, null, 2)),
  });

  // Create project structure based on build mode
  const templateFiles = buildMode === "opus"
    ? getOpusTemplateFiles(name, description)
    : getAstroTemplateFiles(name, description);

  for (const file of templateFiles) {
    await octokit.repos.createOrUpdateFileContents({
      owner: repo.owner.login,
      repo: repo.name,
      path: file.path,
      message: `Add ${file.path}`,
      content: toBase64(file.content),
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
    isVibesitesProject: true,
    config,
  };
}

function getOpusTemplateFiles(
  name: string,
  description: string
): { path: string; content: string }[] {
  return [
    {
      path: "index.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description || "Built with Vibesites"}">
  <title>${name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="styles.css">
</head>
<body class="min-h-screen bg-white text-gray-900 antialiased">
  <main class="flex min-h-screen flex-col items-center justify-center p-8">
    <h1 class="text-4xl font-bold mb-4">${name}</h1>
    <p class="text-xl text-gray-600 mb-8">${description || "Welcome to your new website"}</p>
    <p class="text-sm text-gray-400">
      Start chatting in Vibesites to build your site
    </p>
  </main>
  <script src="script.js"></script>
</body>
</html>`,
    },
    {
      path: "styles.css",
      content: `/* Custom styles for ${name} */

/* Add your custom CSS here */
`,
    },
    {
      path: "script.js",
      content: `// JavaScript for ${name}

// Add your custom JavaScript here
document.addEventListener('DOMContentLoaded', () => {
  console.log('${name} loaded');
});
`,
    },
    {
      path: "favicon.svg",
      content: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 128 128">
  <circle cx="64" cy="64" r="60" fill="#6366f1"/>
  <text x="64" y="80" text-anchor="middle" fill="white" font-size="48" font-family="system-ui">V</text>
</svg>`,
    },
  ];
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

const { title, description = "${description || "Built with Vibesites"}" } = Astro.props;
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
      Start chatting in Vibesites to build your site
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

export async function deleteProject(
  accessToken: string,
  owner: string,
  repo: string
): Promise<void> {
  const octokit = createOctokit(accessToken);

  await octokit.repos.delete({
    owner,
    repo,
  });
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
          content: fromBase64(data.content),
        },
      ];
    }

    return [];
  } catch {
    return [];
  }
}
