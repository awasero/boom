import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Cookie errors in server components can be ignored
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user && data.session) {
      // Use service role to update user profile (session cookies not yet established)
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const githubUsername =
        data.user.user_metadata?.user_name ||
        data.user.user_metadata?.preferred_username;

      const updates: Record<string, string> = {};
      if (githubUsername) updates.github_username = githubUsername;
      if (data.session.provider_token) updates.github_access_token = data.session.provider_token;

      if (Object.keys(updates).length > 0) {
        await adminClient
          .from("users")
          .update(updates)
          .eq("id", data.user.id);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to login with an error
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
