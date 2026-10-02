import { NextResponse } from "next/server";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { ApiResponse } from "@/src/utils/ApiResponse";
import { askWithSearch } from "@/src/services/search.service";
import { requireAuth } from "@/src/lib/auth";

export const POST = asyncHandler(async (req: Request) => {
  const { question, threadId } = await req.json();

  const decoded = await requireAuth();

  // Call the search agent service
  const data = await askWithSearch(question, threadId, decoded.id);

  return NextResponse.json(
    new ApiResponse(200, data, "Successfully retrieved answer with web search")
  );
}, { rateLimit: { action: "ask-search", maxRequests: 20, windowSeconds: 60 } });
