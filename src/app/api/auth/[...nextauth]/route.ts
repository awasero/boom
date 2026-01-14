import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

async function handleAuth(req: NextRequest, method: "GET" | "POST") {
  try {
    const handler = method === "GET" ? handlers.GET : handlers.POST;
    return await handler(req);
  } catch (error) {
    console.error("NextAuth error:", error);
    return NextResponse.json(
      {
        error: "AuthenticationError",
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleAuth(req, "GET");
}

export async function POST(req: NextRequest) {
  return handleAuth(req, "POST");
}
