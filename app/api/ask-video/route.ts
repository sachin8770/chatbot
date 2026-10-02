import { NextResponse } from "next/server";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { ApiResponse } from "@/src/utils/ApiResponse";
import { askQuestion } from "@/src/services/video.service";
import { requireAuth } from "@/src/lib/auth";

export const POST = asyncHandler(async (req: Request) => {
  const { question, videoId, threadId } = await req.json();

  const decoded = await requireAuth();

  const data = await askQuestion(question, videoId, threadId, decoded.id);

  return NextResponse.json(
    new ApiResponse(200, data, "Successfully processed video query")
  );
}, { rateLimit: { action: "ask-video", maxRequests: 20, windowSeconds: 60 } });
