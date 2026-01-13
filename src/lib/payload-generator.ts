import { GeneratedFile } from "@/types/project";

export interface PayloadCollection {
  name: string;
  slug: string;
  fields: PayloadField[];
}

export interface PayloadField {
  name: string;
  type: "text" | "textarea" | "richText" | "number" | "upload" | "array" | "group";
  required?: boolean;
  label?: string;
}

export function generatePayloadFiles(
  projectName: string,
  collections: PayloadCollection[]
): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  // payload.config.ts
  files.push({
    path: "src/payload.config.ts",
    content: `import { buildConfig } from 'payload/config';
import path from 'path';
${collections.map((c) => `import { ${c.name} } from './collections/${c.name}';`).join("\n")}

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: 'users',
  },
  collections: [
    ${collections.map((c) => c.name).join(",\n    ")},
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
});
`,
  });

  // Generate collection files
  for (const collection of collections) {
    files.push({
      path: `src/collections/${collection.name}.ts`,
      content: generateCollectionFile(collection),
    });
  }

  // Users collection (required for Payload)
  files.push({
    path: "src/collections/Users.ts",
    content: `import { CollectionConfig } from 'payload/types';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
};
`,
  });

  // Package.json updates for Payload
  files.push({
    path: "payload-package-additions.json",
    content: JSON.stringify(
      {
        dependencies: {
          payload: "^2.0.0",
          "@payloadcms/bundler-webpack": "^1.0.0",
          "@payloadcms/db-mongodb": "^1.0.0",
          "@payloadcms/richtext-slate": "^1.0.0",
        },
        scripts: {
          "payload:generate": "payload generate:types",
          "payload:seed": "payload seed",
        },
      },
      null,
      2
    ),
  });

  // .env additions
  files.push({
    path: "payload-env-example.txt",
    content: `# Payload CMS
PAYLOAD_SECRET=your-secret-key-here
MONGODB_URI=mongodb://localhost:27017/${projectName}
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
`,
  });

  return files;
}

function generateCollectionFile(collection: PayloadCollection): string {
  const fields = collection.fields
    .map((field) => {
      const baseField = `{
      name: '${field.name}',
      type: '${field.type}',
      ${field.required ? "required: true," : ""}
      ${field.label ? `label: '${field.label}',` : ""}
    }`;
      return baseField;
    })
    .join(",\n    ");

  return `import { CollectionConfig } from 'payload/types';

export const ${collection.name}: CollectionConfig = {
  slug: '${collection.slug}',
  admin: {
    useAsTitle: '${collection.fields[0]?.name || "title"}',
  },
  fields: [
    ${fields}
  ],
};
`;
}

export function inferCollectionsFromContent(
  content: string
): PayloadCollection[] {
  const collections: PayloadCollection[] = [];

  // Infer collections based on common patterns
  const patterns = {
    hero: ["title", "subtitle", "ctaText", "ctaLink", "backgroundImage"],
    services: ["title", "description", "icon", "price"],
    testimonials: ["name", "role", "company", "quote", "avatar"],
    team: ["name", "role", "bio", "image", "socialLinks"],
    products: ["name", "description", "price", "image", "category"],
    posts: ["title", "content", "excerpt", "author", "publishDate", "image"],
    faq: ["question", "answer"],
    features: ["title", "description", "icon"],
    gallery: ["title", "image", "caption"],
    contact: ["name", "email", "phone", "address"],
  };

  const contentLower = content.toLowerCase();

  for (const [name, fields] of Object.entries(patterns)) {
    if (contentLower.includes(name) || contentLower.includes(name.slice(0, -1))) {
      collections.push({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        slug: name,
        fields: fields.map((f) => ({
          name: f,
          type: inferFieldType(f),
          required: ["title", "name"].includes(f),
          label: f.charAt(0).toUpperCase() + f.slice(1).replace(/([A-Z])/g, " $1"),
        })),
      });
    }
  }

  // Always include a Pages collection
  if (!collections.find((c) => c.slug === "pages")) {
    collections.push({
      name: "Pages",
      slug: "pages",
      fields: [
        { name: "title", type: "text", required: true },
        { name: "slug", type: "text", required: true },
        { name: "content", type: "richText" },
        { name: "metaDescription", type: "textarea" },
      ],
    });
  }

  return collections;
}

function inferFieldType(fieldName: string): PayloadField["type"] {
  const fieldLower = fieldName.toLowerCase();

  if (fieldLower.includes("image") || fieldLower.includes("avatar") || fieldLower.includes("photo")) {
    return "upload";
  }
  if (fieldLower.includes("content") || fieldLower.includes("bio") || fieldLower.includes("description")) {
    return "richText";
  }
  if (fieldLower.includes("price") || fieldLower.includes("number") || fieldLower.includes("count")) {
    return "number";
  }
  if (fieldLower.includes("links") || fieldLower.includes("items")) {
    return "array";
  }

  return "text";
}
