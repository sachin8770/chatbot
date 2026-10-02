import { NextResponse } from "next/server";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { ApiResponse } from "@/src/utils/ApiResponse";
import { ApiError } from "@/src/utils/ApiError";
import { indexTranscript } from "@/src/services/transcript.service";
import { requireAuth } from "@/src/lib/auth";

export const POST = asyncHandler(async (req: Request) => {
  await requireAuth();

  const { name, text } = await req.json();

  // 500KB text size limit
  const MAX_TEXT_SIZE = 500 * 1024;
  if (text && text.length > MAX_TEXT_SIZE) {
    throw new ApiError(413, "Transcript text too large (max 500KB)");
  }

  const data = await indexTranscript(name, text);

  return NextResponse.json(
    new ApiResponse(201, data, "Successfully indexed transcript")
  );
}, { rateLimit: { action: "index-transcript", maxRequests: 5, windowSeconds: 60 } });
