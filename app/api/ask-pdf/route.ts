import { NextResponse } from "next/server";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { ApiResponse } from "@/src/utils/ApiResponse";
import { askQuestion } from "@/src/services/pdf.service";
import { requireAuth } from "@/src/lib/auth";

export const POST = asyncHandler(async (req: Request) => {
  const { question, source, threadId } = await req.json();

  const decoded = await requireAuth();

  const data = await askQuestion(question, source, threadId, decoded.id);

  return NextResponse.json(
    new ApiResponse(200, data, "Successfully retrieved answer from PDF")
  );
}, { rateLimit: { action: "ask-pdf", maxRequests: 20, windowSeconds: 60 } });
