import { auth } from "@/lib/auth";
import { ProjectList } from "@/components/dashboard/project-list";
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Your AI-powered websites
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      <ProjectList accessToken={session?.accessToken || ""} />
    </div>
  );
}
