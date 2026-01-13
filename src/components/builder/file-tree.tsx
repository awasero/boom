"use client";

import { GeneratedFile } from "@/types/project";
import { ScrollArea } from "@/components/ui/scroll-area";
import { File, Folder, FolderOpen } from "lucide-react";
import { useState } from "react";

interface FileTreeProps {
  files: GeneratedFile[];
}

interface TreeNode {
  name: string;
  path: string;
  isFile: boolean;
  children: TreeNode[];
}

export function FileTree({ files }: FileTreeProps) {
  const tree = buildTree(files);

  return (
    <div className="h-full">
      <h3 className="font-semibold mb-4">Project Files</h3>
      <ScrollArea className="h-[calc(100%-2rem)]">
        <div className="pr-4">
          {tree.map((node) => (
            <TreeNodeComponent key={node.path} node={node} depth={0} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function TreeNodeComponent({ node, depth }: { node: TreeNode; depth: number }) {
  const [isOpen, setIsOpen] = useState(true);

  if (node.isFile) {
    return (
      <div
        className="flex items-center gap-2 py-1 px-2 hover:bg-muted rounded text-sm"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <File className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="truncate">{node.name}</span>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 py-1 px-2 hover:bg-muted rounded text-sm w-full text-left"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isOpen ? (
          <FolderOpen className="h-4 w-4 text-primary shrink-0" />
        ) : (
          <Folder className="h-4 w-4 text-primary shrink-0" />
        )}
        <span className="font-medium">{node.name}</span>
      </button>
      {isOpen && (
        <div>
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.path}
              node={child}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function buildTree(files: GeneratedFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join("/");

      let existing = current.find((n) => n.name === part);

      if (!existing) {
        existing = {
          name: part,
          path,
          isFile,
          children: [],
        };
        current.push(existing);
      }

      if (!isFile) {
        current = existing.children;
      }
    }
  }

  // Sort: folders first, then files, alphabetically
  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes
      .sort((a, b) => {
        if (a.isFile !== b.isFile) {
          return a.isFile ? 1 : -1;
        }
        return a.name.localeCompare(b.name);
      })
      .map((node) => ({
        ...node,
        children: sortNodes(node.children),
      }));
  };

  return sortNodes(root);
}
