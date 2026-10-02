import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { messages, threads } from "@/src/schema/userschema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/src/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: threadId } = await params;
    const decoded = await requireAuth();

    // Verify ownership
    const thread = await db.select().from(threads).where(and(eq(threads.id, threadId), eq(threads.userId, decoded.id))).limit(1);
    
    if (thread.length === 0) {
      return NextResponse.json({ success: false, message: "Thread not found" }, { status: 404 });
    }

    const threadMessages = await db
      .select({
        id: messages.id,
        role: messages.role,
        content: messages.content,
      })
      .from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(messages.createdAt);
       console.log(threadMessages);
    return NextResponse.json({ success: true, messages: threadMessages });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
