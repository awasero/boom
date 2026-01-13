import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BuilderWorkspace } from "@/components/builder/builder-workspace";

interface PageProps {
  params: Promise<{ owner: string; repo: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const session = await auth();
  const { owner, repo } = await params;

  if (!session) {
    redirect("/");
  }

  if (!owner || !repo) {
    redirect("/dashboard");
  }

  return (
    <BuilderWorkspace
      owner={owner}
      repo={repo}
      accessToken={session.accessToken}
    />
  );
}
