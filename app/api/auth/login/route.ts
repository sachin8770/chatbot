import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { users } from "@/src/schema/userschema";
import { eq } from "drizzle-orm";
import { comparePassword } from "@/src/lib/bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { checkRateLimit, getClientIp } from "@/src/lib/rateLimit";

export async function POST(req: Request) {
  try {
    // Rate limit: 5 login attempts per minute per IP
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, "login", { maxRequests: 5, windowSeconds: 60 });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(rateCheck.resetMs / 1000)) },
        }
      );
    }

    const body = await req.json();

    const { email: rawEmail, password } = body;
    const email = rawEmail?.trim().toLowerCase();

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 }
      );
    }

    // Find the user by email
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = existingUsers[0];

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // Verify the password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error("JWT_SECRET environment variable is not set");
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      jwtSecret,
      { expiresIn: "7d" } // Token expires in 7 days
    );

    // Set the token in an HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Logged in successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Something went wrong during login",
      },
      { status: 500 }
    );
  }
}
