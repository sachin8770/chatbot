import { NextResponse } from "next/server";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { ApiResponse } from "@/src/utils/ApiResponse";
import { ApiError } from "@/src/utils/ApiError";
import { indexVideo } from "@/src/services/video.service";
import { requireAuth } from "@/src/lib/auth";

export const POST = asyncHandler(async (req: Request) => {
  await requireAuth();

  const { videoId } = await req.json();

  if (!videoId || typeof videoId !== "string") {
    throw new ApiError(400, "videoId is required");
  }

  // YouTube video IDs are 11 characters (alphanumeric, hyphens, underscores)
  if (!/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) {
    throw new ApiError(400, "Invalid YouTube video ID format");
  }

  const data = await indexVideo(videoId);

  return NextResponse.json(
    new ApiResponse(201, data, "Successfully indexed video")
  );
}, { rateLimit: { action: "index-video", maxRequests: 5, windowSeconds: 60 } });
