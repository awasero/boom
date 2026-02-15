import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProjectList } from "@/components/dashboard/project-list";
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types/project";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Projects
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create and manage your projects.
            </p>
          </div>
          <CreateProjectDialog>
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </CreateProjectDialog>
        </div>

        <div className="mt-8">
          {projects && projects.length > 0 ? (
            <ProjectList projects={projects as Project[]} />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-16">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-600/10">
                <Plus className="h-6 w-6 text-violet-500" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                No projects yet
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating your first project.
              </p>
              <CreateProjectDialog>
                <Button className="mt-6 bg-violet-600 hover:bg-violet-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </CreateProjectDialog>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
