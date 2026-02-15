"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/types/project";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteProjectDialog } from "@/components/dashboard/delete-project-dialog";
import {
  MoreVertical,
  ExternalLink,
  Trash2,
  Globe,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface ProjectListProps {
  projects: Project[];
}

function DeployStatusBadge({
  status,
}: {
  status: Project["deploy_status"];
}) {
  switch (status) {
    case "deployed":
      return (
        <Badge
          variant="secondary"
          className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
        >
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Deployed
        </Badge>
      );
    case "building":
      return (
        <Badge
          variant="secondary"
          className="border-amber-500/20 bg-amber-500/10 text-amber-400"
        >
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          Building
        </Badge>
      );
    case "failed":
      return (
        <Badge
          variant="secondary"
          className="border-red-500/20 bg-red-500/10 text-red-400"
        >
          <XCircle className="mr-1 h-3 w-3" />
          Failed
        </Badge>
      );
    default:
      return (
        <Badge
          variant="secondary"
          className="border-border bg-muted text-muted-foreground"
        >
          <Clock className="mr-1 h-3 w-3" />
          Idle
        </Badge>
      );
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function ProjectList({ projects }: ProjectListProps) {
  const router = useRouter();
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);

  const handleProjectDeleted = () => {
    setDeleteProject(null);
    router.refresh();
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="group cursor-pointer border-border bg-card transition-colors hover:border-violet-500/50 hover:bg-card/80"
            onClick={() => router.push(`/editor/${project.id}`)}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-violet-400" />
                  <CardTitle className="text-base text-foreground">
                    {project.name}
                  </CardTitle>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/editor/${project.id}`);
                    }}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-400 focus:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteProject(project);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              {project.description && (
                <CardDescription className="mb-3 line-clamp-2">
                  {project.description}
                </CardDescription>
              )}
              <div className="flex items-center justify-between">
                <DeployStatusBadge status={project.deploy_status} />
                <span className="text-xs text-muted-foreground">
                  {formatDate(project.updated_at)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {deleteProject && (
        <DeleteProjectDialog
          project={deleteProject}
          open={!!deleteProject}
          onOpenChange={(open) => {
            if (!open) setDeleteProject(null);
          }}
          onDeleted={handleProjectDeleted}
        />
      )}
    </>
  );
}
