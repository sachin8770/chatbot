import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { threads } from "@/src/schema/userschema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/src/lib/auth";

export async function GET() {
  try {
    const decoded = await requireAuth();

    const userThreads = await db
      .select({
        id: threads.id,
        title: threads.title,
      })
      .from(threads)
      .where(eq(threads.userId, decoded.id))
      .orderBy(desc(threads.createdAt));

    return NextResponse.json({ success: true, threads: userThreads });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ success: false, message: error.message }, { status });
  }
}

