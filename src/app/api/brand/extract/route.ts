import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractBrandFromCode } from "@/lib/brand/extract";
import { GeneratedFile } from "@/types/project";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { existingFiles } = (await request.json()) as {
      existingFiles: GeneratedFile[];
    };

    if (!existingFiles || existingFiles.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Build a single string from all files
    const filesContent = existingFiles
      .map((f) => `--- ${f.path} ---\n${f.content}`)
      .join("\n\n");

    const brand = await extractBrandFromCode(filesContent);

    return NextResponse.json({ brand });
  } catch (error) {
    console.error("Brand extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract brand" },
      { status: 500 }
    );
  }
}
