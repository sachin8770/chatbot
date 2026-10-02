import { NextResponse } from "next/server";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { ApiResponse } from "@/src/utils/ApiResponse";
import { ApiError } from "@/src/utils/ApiError";
import { indexVideo } from "@/src/services/video.service";
import { requireAuth } from "@/src/lib/auth";
import { extractYoutubeId } from "@/src/utils/youtube";

export const POST = asyncHandler(async (req: Request) => {
  await requireAuth();

  const body = await req.json().catch(() => ({}));
  const rawInput = typeof body.videoId === "string" ? body.videoId : "";
  const cleanId = extractYoutubeId(rawInput);

  if (!cleanId) {
    throw new ApiError(400, "Invalid YouTube video ID or URL format");
  }

  const data = await indexVideo(cleanId);

  return NextResponse.json(
    new ApiResponse(201, data, "Successfully indexed video")
  );
}, { rateLimit: { action: "index-video", maxRequests: 5, windowSeconds: 60 } });
