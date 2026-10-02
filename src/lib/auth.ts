import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { ApiError } from "@/src/utils/ApiError";

/**
 * Centralized authentication check for API routes.
 * Verifies the JWT token from the auth_token cookie and returns the decoded payload.
 * Throws ApiError(401) if no token is present or if verification fails.
 */
export async function requireAuth(): Promise<{ id: number; email: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    throw new ApiError(401, "Unauthorized");
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  try {
    return jwt.verify(token, jwtSecret) as { id: number; email: string };
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }
}
