import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Clear the auth cookie by setting it to expire immediately
    cookieStore.set("auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0), // Expire immediately
      path: "/",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong during logout",
      },
      { status: 500 }
    );
  }
}
