import { NextResponse } from "next/server";
import { ApiError } from "./ApiError";
import { checkRateLimit, getClientIp } from "@/src/lib/rateLimit";

interface AsyncHandlerOptions {
  /** Rate limit config. If provided, rate limiting is applied before the handler runs. */
  rateLimit?: {
    action: string;
    maxRequests: number;
    windowSeconds: number;
  };
}

export const asyncHandler = (
  requestHandler: (req: Request, ...args: any[]) => Promise<NextResponse | Response>,
  options?: AsyncHandlerOptions
) => {
  return async (req: Request, ...args: any[]) => {
    try {
      // Apply rate limiting if configured
      if (options?.rateLimit) {
        const ip = getClientIp(req);
        const rateCheck = checkRateLimit(ip, options.rateLimit.action, {
          maxRequests: options.rateLimit.maxRequests,
          windowSeconds: options.rateLimit.windowSeconds,
        });
        if (!rateCheck.allowed) {
          return NextResponse.json(
            {
              success: false,
              message: "Too many requests. Please try again later.",
            },
            {
              status: 429,
              headers: { "Retry-After": String(Math.ceil(rateCheck.resetMs / 1000)) },
            }
          );
        }
      }

      return await requestHandler(req, ...args);
    } catch (error: any) {
      console.error("API Error:", error);

      if (error instanceof ApiError) {
        return NextResponse.json(
          {
            success: error.success,
            message: error.message,
            errors: error.errors,
            data: error.data,
          },
          { status: error.statusCode }
        );
      }

      // Fallback for unhandled errors — don't leak internal details to client
      return NextResponse.json(
        {
          success: false,
          message: "Internal Server Error",
          errors: [],
          data: null,
        },
        { status: 500 }
      );
    }
  };
};
