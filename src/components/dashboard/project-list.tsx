"use client";

import { useEffect, useState } from "react";
import { Project } from "@/types/project";
import { getUserRepos } from "@/lib/github";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, FolderOpen, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";

interface ProjectListProps {
  accessToken: string;
}

export function ProjectList({ accessToken }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        const repos = await getUserRepos(accessToken);
        setProjects(repos);
      } catch (err) {
        setError("Failed to load projects. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (accessToken) {
      loadProjects();
    }
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try again
        </Button>
      </div>
    );
  }

  const boovibeProjects = projects.filter((p) => p.isBooVibeProject);
  const otherProjects = projects.filter((p) => !p.isBooVibeProject);

  return (
    <Tabs defaultValue="boovibe" className="w-full">
      <TabsList>
        <TabsTrigger value="boovibe" className="gap-2">
          <Sparkles className="h-4 w-4" />
          BooVibe Projects ({boovibeProjects.length})
        </TabsTrigger>
        <TabsTrigger value="all">
          All Repos ({otherProjects.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="boovibe" className="mt-6">
        {boovibeProjects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No BooVibe projects yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Create your first AI-powered website by clicking the button above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {boovibeProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="all" className="mt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {otherProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const updatedAt = new Date(project.updatedAt).toLocaleDateString();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{project.name}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {project.description || "No description"}
            </CardDescription>
          </div>
          {project.isBooVibeProject && (
            <Badge variant="secondary" className="ml-2 shrink-0">
              <Sparkles className="h-3 w-3 mr-1" />
              BooVibe
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Updated {updatedAt}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a
                href={project.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            {project.isBooVibeProject && (
              <Button size="sm" asChild>
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
