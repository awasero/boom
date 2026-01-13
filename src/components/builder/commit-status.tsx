"use client";

import { Badge } from "@/components/ui/badge";
import { Check, Loader2, GitCommit } from "lucide-react";

interface CommitStatusProps {
  isCommitting: boolean;
  lastCommit: string | null;
  owner: string;
  repo: string;
}

export function CommitStatus({
  isCommitting,
  lastCommit,
  owner,
  repo,
}: CommitStatusProps) {
  if (isCommitting) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Committing...
      </Badge>
    );
  }

  if (lastCommit) {
    return (
      <a
        href={`https://github.com/${owner}/${repo}/commit/${lastCommit}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex"
      >
        <Badge
          variant="outline"
          className="gap-1 hover:bg-muted cursor-pointer"
        >
          <Check className="h-3 w-3 text-green-600" />
          <GitCommit className="h-3 w-3" />
          {lastCommit.slice(0, 7)}
        </Badge>
      </a>
    );
  }

  return null;
}
