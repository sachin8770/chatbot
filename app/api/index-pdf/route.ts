import { NextResponse } from "next/server";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { ApiResponse } from "@/src/utils/ApiResponse";
import { indexPdf } from "@/src/services/pdf.service";
import { requireAuth } from "@/src/lib/auth";

export const POST = asyncHandler(async (req: Request) => {
  await requireAuth();

  const formData = await req.formData();
  const file = formData.get("pdf") as File | null;

  if (!file) {
    return NextResponse.json(
      new ApiResponse(400, null, "No PDF file provided"), { status: 400 }
    );
  }

  // 10MB file size limit
  const MAX_PDF_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_PDF_SIZE) {
    return NextResponse.json(
      new ApiResponse(413, null, "File too large (max 10MB)"), { status: 413 }
    );
  }

  const data = await indexPdf(file);

  return NextResponse.json(
    new ApiResponse(201, data, "Successfully indexed PDF")
  );
}, { rateLimit: { action: "index-pdf", maxRequests: 5, windowSeconds: 60 } });
