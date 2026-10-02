import { NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/auth";
import fs from "fs/promises";
import path from "path";

// Allowed subdirectories to prevent path traversal
const ALLOWED_DIRS = ["pdf-uploads", "uploads"];

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    await requireAuth();

    const segments = (await params).path;

    if (!segments || segments.length < 2) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const dir = segments[0];
    const fileName = segments[segments.length - 1];

    // Validate directory is allowed
    if (!ALLOWED_DIRS.includes(dir)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Prevent path traversal
    if (segments.some((s) => s.includes("..") || s.includes("~"))) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "storage", ...segments);

    // Ensure the resolved path is still within storage/
    const resolvedPath = path.resolve(filePath);
    const storageRoot = path.resolve(path.join(process.cwd(), "storage"));
    if (!resolvedPath.startsWith(storageRoot)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileBuffer = await fs.readFile(filePath);
    const ext = path.extname(fileName).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    if (error.statusCode === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("File serve error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
