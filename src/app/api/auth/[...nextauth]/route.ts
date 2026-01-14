import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Wrap handlers with error handling to prevent empty 500 responses
async function wrappedHandler(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<Response>
) {
  try {
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
  return wrappedHandler(req, handlers.GET);
}

export async function POST(req: NextRequest) {
  return wrappedHandler(req, handlers.POST);
}
