import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeploymentManager } from "@/components/deploy/deployment-manager";

interface PageProps {
  params: Promise<{ owner: string; repo: string }>;
}

export default async function DeployPage({ params }: PageProps) {
  const session = await auth();
  const { owner, repo } = await params;

  if (!session) {
    redirect("/");
  }

  if (!owner || !repo) {
    redirect("/dashboard");
  }

  return (
    <DeploymentManager
      owner={owner}
      repo={repo}
      accessToken={session.accessToken}
    />
  );
}
