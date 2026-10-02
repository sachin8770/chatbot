import { NextResponse } from "next/server";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { ApiResponse } from "@/src/utils/ApiResponse";
import { askQuestion } from "@/src/services/image.service";
import { requireAuth } from "@/src/lib/auth";

export const POST = asyncHandler(async (req: Request) => {
  const { question, sessionImageUrls, threadId } = await req.json();

  const decoded = await requireAuth();

  const data = await askQuestion(question, sessionImageUrls, threadId, decoded.id);

  return NextResponse.json(
    new ApiResponse(200, data, "Successfully retrieved answer from images")
  );
}, { rateLimit: { action: "ask", maxRequests: 20, windowSeconds: 60 } });
