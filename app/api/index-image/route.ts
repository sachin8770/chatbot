import { NextResponse } from "next/server";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { ApiResponse } from "@/src/utils/ApiResponse";
import { ApiError } from "@/src/utils/ApiError";
import { indexImages } from "@/src/services/image.service";
import { requireAuth } from "@/src/lib/auth";

export const POST = asyncHandler(async (req: Request) => {
  await requireAuth();

  const body = await req.json();

  let imagesArray: string[] = [];
  if (body.images && Array.isArray(body.images)) {
    imagesArray = body.images;
  } else if (body.imageBase64) {
    imagesArray = [body.imageBase64];
  }

  if (imagesArray.length === 0) {
    throw new ApiError(400, "At least one image is required");
  }

  // Max 10 images per request
  if (imagesArray.length > 10) {
    throw new ApiError(400, "Maximum 10 images per request");
  }

  // 5MB per image (base64 string length)
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  for (const img of imagesArray) {
    if (img.length > MAX_IMAGE_SIZE) {
      throw new ApiError(413, "Individual image too large (max 5MB)");
    }
  }

  const data = await indexImages(imagesArray);

  return NextResponse.json(
    new ApiResponse(201, data, "Successfully indexed images")
  );
}, { rateLimit: { action: "index-image", maxRequests: 5, windowSeconds: 60 } });
