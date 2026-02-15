import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGitHubClient } from "@/lib/github/client";
import { commitFiles } from "@/lib/github/files";
import { brandNucleusSchema } from "@/lib/brand/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select("brand_nucleus")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ brand: project.brand_nucleus });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const brand = brandNucleusSchema.parse(body.brand);

    // Fetch project to get GitHub info
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Update brand_nucleus in Supabase
    const { error: updateError } = await supabase
      .from("projects")
      .update({ brand_nucleus: brand })
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update brand" },
        { status: 500 }
      );
    }

    // Commit brand-nucleus.json to GitHub repo
    try {
      const octokit = await createGitHubClient();
      await commitFiles(
        octokit,
        project.github_owner,
        project.github_repo,
        [
          {
            path: ".boom/brand-nucleus.json",
            content: JSON.stringify(brand, null, 2),
          },
        ],
        "chore: update brand nucleus tokens"
      );
    } catch (ghError) {
      console.error("Failed to commit brand to GitHub:", ghError);
      // Still return success since Supabase was updated
    }

    return NextResponse.json({ brand });
  } catch (error) {
    console.error("Brand update error:", error);
    return NextResponse.json(
      { error: "Failed to update brand" },
      { status: 500 }
    );
  }
}
