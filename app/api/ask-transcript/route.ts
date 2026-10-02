import { NextResponse } from "next/server";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { ApiResponse } from "@/src/utils/ApiResponse";
import { askQuestion } from "@/src/services/transcript.service";
import { requireAuth } from "@/src/lib/auth";

export const POST = asyncHandler(async (req: Request) => {
  const { question, sourceNames, threadId } = await req.json();

  const decoded = await requireAuth();

  const data = await askQuestion(question, sourceNames, threadId, decoded.id);

  return NextResponse.json(
    new ApiResponse(200, data, "Successfully retrieved answer from transcripts")
  );
}, { rateLimit: { action: "ask-transcript", maxRequests: 20, windowSeconds: 60 } });
