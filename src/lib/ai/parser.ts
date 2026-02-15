import { GeneratedFile } from "@/types/project";

export function parseGeneratedFiles(content: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  const filePattern = /FILE:\s*([^\n]+?)\s*\n+\s*```(\w*)\n([\s\S]*?)```/g;

  let match;
  while ((match = filePattern.exec(content)) !== null) {
    const path = match[1].trim();
    const fileContent = match[3].trim();

    if (path && fileContent) {
      files.push({ path, content: fileContent });
    }
  }

  // Fallback: standalone HTML blocks without FILE: prefix
  if (files.length === 0) {
    const standaloneHtmlPattern = /```html\n(<!DOCTYPE[\s\S]*?<\/html>)\s*```/gi;
    let standaloneMatch;
    while ((standaloneMatch = standaloneHtmlPattern.exec(content)) !== null) {
      const fileContent = standaloneMatch[1].trim();
      if (fileContent) {
        files.push({ path: "index.html", content: fileContent });
      }
    }
  }

  return files;
}

// Parse PATCH format (for /text and /tweak commands)
export function parsePatchAndApply(
  patchResponse: string,
  existingFiles: GeneratedFile[]
): { success: boolean; modifiedFile?: GeneratedFile; error?: string } {
  const patchMatch = patchResponse.match(
    /PATCH:\s*```[\s\S]*?FIND:\s*([\s\S]*?)\s*REPLACE:\s*([\s\S]*?)```/i
  );

  if (!patchMatch) {
    const altMatch = patchResponse.match(
      /FIND:\s*([\s\S]*?)\s*REPLACE:\s*([\s\S]*?)(?:```|$)/i
    );
    if (!altMatch) {
      return { success: false, error: "Could not parse PATCH format" };
    }
    return applyPatch(altMatch[1].trim(), altMatch[2].trim(), existingFiles);
  }

  return applyPatch(patchMatch[1].trim(), patchMatch[2].trim(), existingFiles);
}

function applyPatch(
  findText: string,
  replaceText: string,
  existingFiles: GeneratedFile[]
): { success: boolean; modifiedFile?: GeneratedFile; error?: string } {
  for (const file of existingFiles) {
    if (file.content.includes(findText)) {
      return {
        success: true,
        modifiedFile: {
          path: file.path,
          content: file.content.replace(findText, replaceText),
        },
      };
    }
  }

  // Try with normalized whitespace
  const normalizedFind = findText.replace(/\s+/g, " ").trim();
  for (const file of existingFiles) {
    const normalizedContent = file.content.replace(/\s+/g, " ");
    if (normalizedContent.includes(normalizedFind)) {
      const regex = new RegExp(
        findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"),
        "g"
      );
      const newContent = file.content.replace(regex, replaceText);
      if (newContent !== file.content) {
        return { success: true, modifiedFile: { path: file.path, content: newContent } };
      }
    }
  }

  return { success: false, error: "Could not find the target text in any file" };
}
