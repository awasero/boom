"use client";

import { useEffect, useState, useCallback } from "react";
import { Project } from "@/types/project";
import { getUserRepos } from "@/lib/github";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, FolderOpen, Loader2, Sparkles, Globe, Trash2 } from "lucide-react";
import { DeleteProjectDialog } from "./delete-project-dialog";
import Link from "next/link";

interface ProjectListProps {
  accessToken: string;
}

export function ProjectList({ accessToken }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingProjects, setDeletingProjects] = useState<Set<string>>(new Set());

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const repos = await getUserRepos(accessToken);
      setProjects(repos);
    } catch (err) {
      setError("Failed to load projects. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      loadProjects();
    }
  }, [accessToken, loadProjects]);

  const handleDeleteStart = useCallback((projectId: number) => {
    setDeletingProjects(prev => new Set(prev).add(String(projectId)));
  }, []);

  const handleDeleteComplete = useCallback((projectId: number) => {
    setDeletingProjects(prev => {
      const next = new Set(prev);
      next.delete(String(projectId));
      return next;
    });
    // Remove the project from the list immediately
    setProjects(prev => prev.filter(p => p.id !== projectId));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400 mb-4" />
        <p className="text-zinc-500 text-sm">Loading your projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">{error}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
        >
          Try again
        </Button>
      </div>
    );
  }

  const vibesitesProjects = projects.filter((p) => p.isVibesitesProject);
  const otherProjects = projects.filter((p) => !p.isVibesitesProject);

  return (
    <Tabs defaultValue="vibesites" className="w-full">
      <TabsList className="bg-zinc-900/50 border border-zinc-800/50">
        <TabsTrigger
          value="vibesites"
          className="gap-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400"
        >
          <Sparkles className="h-4 w-4" />
          boom.git Projects ({vibesitesProjects.length})
        </TabsTrigger>
        <TabsTrigger
          value="all"
          className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
        >
          All Repos ({otherProjects.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="vibesites" className="mt-6">
        {vibesitesProjects.length === 0 ? (
          <Card className="bg-zinc-900/50 border-zinc-800/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl blur-xl opacity-20" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-violet-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No boom.git projects yet</h3>
              <p className="text-zinc-400 text-center max-w-md">
                Create your first AI-powered website by clicking the button above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vibesitesProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                accessToken={accessToken}
                isDeleting={deletingProjects.has(String(project.id))}
                onDeleteStart={() => handleDeleteStart(project.id)}
                onDeleteComplete={() => handleDeleteComplete(project.id)}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="all" className="mt-6">
        {otherProjects.length === 0 ? (
          <Card className="bg-zinc-900/50 border-zinc-800/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Globe className="h-12 w-12 text-zinc-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No other repositories</h3>
              <p className="text-zinc-400 text-center max-w-md">
                Your other GitHub repositories will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {otherProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                accessToken={accessToken}
                isDeleting={deletingProjects.has(String(project.id))}
                onDeleteStart={() => handleDeleteStart(project.id)}
                onDeleteComplete={() => handleDeleteComplete(project.id)}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

interface ProjectCardProps {
  project: Project;
  accessToken: string;
  isDeleting: boolean;
  onDeleteStart: () => void;
  onDeleteComplete: () => void;
}

function ProjectCard({ project, accessToken, isDeleting, onDeleteStart, onDeleteComplete }: ProjectCardProps) {
  const updatedAt = new Date(project.updatedAt).toLocaleDateString();

  // Show deleting state
  if (isDeleting) {
    return (
      <Card className="bg-zinc-900/50 border-red-500/30 transition-all duration-200 opacity-60">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg text-zinc-500 truncate">
                {project.name}
              </CardTitle>
              <CardDescription className="mt-1 text-zinc-600">
                Deleting from GitHub...
              </CardDescription>
            </div>
            <Badge className="ml-2 shrink-0 bg-red-500/20 text-red-400 border-red-500/30">
              <Trash2 className="h-3 w-3 mr-1 animate-pulse" />
              Deleting
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-red-400 mr-2" />
            <span className="text-sm text-zinc-500">Deletion in progress...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700/50 transition-all duration-200 group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg text-white truncate group-hover:text-violet-400 transition-colors">
              {project.name}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2 text-zinc-400">
              {project.description || "No description"}
            </CardDescription>
          </div>
          {project.isVibesitesProject && (
            <Badge className="ml-2 shrink-0 bg-violet-500/20 text-violet-400 border-violet-500/30">
              <Sparkles className="h-3 w-3 mr-1" />
              boom.git
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">
            Updated {updatedAt}
          </span>
          <div className="flex gap-1">
            <DeleteProjectDialog
              project={project}
              accessToken={accessToken}
              onDeleteStart={onDeleteStart}
              onDeleteComplete={onDeleteComplete}
            />
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <a
                href={project.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            {project.isVibesitesProject && (
              <Button
                size="sm"
                asChild
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white"
              >
                <Link href={`/project/${project.fullName}`}>
                  <FolderOpen className="h-4 w-4 mr-1" />
                  Open
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
