import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGitHubClient } from "@/lib/github/client";
import { createRepo } from "@/lib/github/repos";
import { ensureStagingBranch } from "@/lib/github/branches";
import { saveProjectConfig } from "@/lib/github/config";
import type { ProjectType } from "@/types/project";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, type } = body as {
      name: string;
      description?: string;
      type: ProjectType;
    };

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    if (!type || !["website", "deck"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid project type" },
        { status: 400 }
      );
    }

    // Get user's GitHub username
    const { data: profile } = await supabase
      .from("users")
      .select("github_username")
      .eq("id", user.id)
      .single();

    if (!profile?.github_username) {
      return NextResponse.json(
        { error: "GitHub account not connected" },
        { status: 400 }
      );
    }

    // Create GitHub repo
    const octokit = await createGitHubClient();
    const repoName = name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const repo = await createRepo(octokit, repoName, description);

    // Create staging branch
    await ensureStagingBranch(octokit, profile.github_username, repo.name);

    // Save .boom/config.json
    await saveProjectConfig(octokit, profile.github_username, repo.name, {
      name: name.trim(),
      type,
      version: "1.0.0",
      createdAt: new Date().toISOString(),
    });

    // Insert project record
    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        type,
        github_repo: repo.name,
        github_owner: profile.github_username,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
