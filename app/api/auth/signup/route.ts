import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { users } from "@/src/schema/userschema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/src/lib/bcrypt";
import { checkRateLimit, getClientIp } from "@/src/lib/rateLimit";

export async function POST(req: Request) {
  try {
    // Rate limit: 3 signups per minute per IP
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, "signup", { maxRequests: 3, windowSeconds: 60 });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many signup attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(rateCheck.resetMs / 1000)) },
        }
      );
    }

    const body = await req.json();

    const { firstName, lastName, email: rawEmail, password } = body;

    const email = rawEmail?.trim().toLowerCase();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, password, first name, and last name are required",
        },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email format",
        },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters long",
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUsers.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "User already exists with this email. Please login.",
        },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the new user
    const [newUser] = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        email,
        password: hashedPassword,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Something went wrong during signup",
      },
      { status: 500 }
    );
  }
}
