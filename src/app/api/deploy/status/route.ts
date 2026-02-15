import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listDeployments } from "@/lib/cloudflare/pages";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 }
    );
  }

  try {
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

    if (!project.cloudflare_project_id) {
      return NextResponse.json({
        status: "not_deployed",
        message: "Project has not been deployed yet",
      });
    }

    // Get latest deployment status from Cloudflare
    const deployments = await listDeployments(project.cloudflare_project_id);

    if (!deployments || deployments.length === 0) {
      return NextResponse.json({
        status: "not_deployed",
        message: "No deployments found",
      });
    }

    // Return the latest deployment info
    const latest = deployments[0];

    return NextResponse.json({
      deploymentId: latest.id,
      url: latest.url,
      environment: latest.environment,
      status: latest.latest_stage.status,
      stageName: latest.latest_stage.name,
      createdOn: latest.created_on,
      deployUrl: project.deploy_url,
      deployStatus: project.deploy_status,
    });
  } catch (error) {
    console.error("Deploy status error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to check deploy status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
