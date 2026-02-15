import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGitHubClient } from "@/lib/github/client";
import { listDecks, saveDeck } from "@/lib/github/decks";
import { DeckData } from "@/types/project";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const octokit = await createGitHubClient();
    const decks = await listDecks(octokit, project.github_owner, project.github_repo);

    return NextResponse.json(decks);
  } catch (error) {
    console.error("List decks error:", error);
    return NextResponse.json({ error: "Failed to list decks" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const deck = (await request.json()) as DeckData;
    const octokit = await createGitHubClient();
    await saveDeck(octokit, project.github_owner, project.github_repo, deck);

    return NextResponse.json(deck, { status: 201 });
  } catch (error) {
    console.error("Save deck error:", error);
    return NextResponse.json({ error: "Failed to save deck" }, { status: 500 });
  }
}
