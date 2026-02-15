import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGitHubClient } from "@/lib/github/client";
import { getProjectFiles } from "@/lib/github/files";
import { createPagesProject, deployProject } from "@/lib/cloudflare/pages";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // Fetch project from Supabase
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Update status to deploying
    await supabase
      .from("projects")
      .update({ deploy_status: "deploying" })
      .eq("id", projectId);

    // Get files from GitHub
    const octokit = await createGitHubClient();
    const files = await getProjectFiles(
      octokit,
      project.github_owner,
      project.github_repo
    );

    // Map to the format Cloudflare expects
    const deployFiles = files.map((f) => ({
      path: f.path,
      content: f.content,
    }));

    // Create Pages project if it doesn't exist
    let cloudflareProjectName = project.cloudflare_project_id;
    if (!cloudflareProjectName) {
      const pagesProject = await createPagesProject(project.name);
      cloudflareProjectName = pagesProject.name;

      // Save cloudflare_project_id to the project record
      await supabase
        .from("projects")
        .update({ cloudflare_project_id: cloudflareProjectName })
        .eq("id", projectId);
    }

    // Deploy via Direct Upload
    const deployment = await deployProject(
      cloudflareProjectName,
      deployFiles,
      "main"
    );

    // Update project record with deploy info
    await supabase
      .from("projects")
      .update({
        deploy_url: deployment.url,
        deploy_status: "success",
        last_deployed_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    return NextResponse.json({
      deploymentId: deployment.id,
      url: deployment.url,
      status: deployment.latest_stage.status,
    });
  } catch (error) {
    console.error("Deploy error:", error);

    // Try to update status to failed
    try {
      const { projectId } = await request.clone().json();
      if (projectId) {
        await supabase
          .from("projects")
          .update({ deploy_status: "failed" })
          .eq("id", projectId);
      }
    } catch {
      // Ignore error during cleanup
    }

    const message =
      error instanceof Error ? error.message : "Deployment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
