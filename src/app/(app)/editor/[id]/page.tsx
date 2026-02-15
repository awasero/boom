import { createClient } from "@/lib/supabase/server";
import { EditorWorkspace } from "@/components/editor/editor-workspace";
import { redirect } from "next/navigation";
import { Project } from "@/types/project";

interface EditorPageProps {
  params: { id: string };
}

export default async function EditorPage({ params }: EditorPageProps) {
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !project) {
    redirect("/dashboard");
  }

  const typedProject = project as Project;

  return (
    <EditorWorkspace
      projectId={typedProject.id}
      projectName={typedProject.name}
      projectType={typedProject.type}
    />
  );
}
