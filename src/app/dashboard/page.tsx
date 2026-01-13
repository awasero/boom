import { auth } from "@/lib/auth";
import { ProjectList } from "@/components/dashboard/project-list";
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-white">Projects</h1>
          </div>
          <p className="text-zinc-400">
            Your AI-powered websites
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      <ProjectList accessToken={session?.accessToken || ""} />
    </div>
  );
}
