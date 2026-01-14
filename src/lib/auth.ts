import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

// Validate required environment variables
const githubId = process.env.GITHUB_ID;
const githubSecret = process.env.GITHUB_SECRET;

if (!githubId || !githubSecret) {
  console.error(
    "Missing required GitHub OAuth environment variables: GITHUB_ID and/or GITHUB_SECRET"
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  trustHost: true, // Required for production deployments (Vercel, etc.)
  basePath: "/api/auth",
  providers: [
    GitHub({
      clientId: githubId ?? "",
      clientSecret: githubSecret ?? "",
      authorization: {
        params: {
          scope: "read:user user:email repo delete_repo workflow",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle relative URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Handle same-origin URLs
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        if (urlObj.origin === baseUrlObj.origin) return url;
      } catch {
        // Invalid URL, return base
      }
      return baseUrl;
    },
  },
  debug: process.env.NODE_ENV === "development",
});

declare module "next-auth" {
  interface Session {
    accessToken: string;
  }
}
