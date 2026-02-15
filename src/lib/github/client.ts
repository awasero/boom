import { Octokit } from "@octokit/rest";
import { createClient } from "@/lib/supabase/server";

export async function createGitHubClient(): Promise<Octokit> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get GitHub token from users table
  const { data: profile } = await supabase
    .from("users")
    .select("github_access_token")
    .eq("id", user.id)
    .single();

  if (!profile?.github_access_token) {
    throw new Error("GitHub not connected");
  }

  return new Octokit({ auth: profile.github_access_token });
}
