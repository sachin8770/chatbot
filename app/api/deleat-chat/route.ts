import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { threads, messages } from "@/src/schema/userschema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/src/lib/auth";

export async function DELETE(req: Request) {
    try {
        const decoded = await requireAuth();

        let threadId: string | undefined;
        try {
            const body = await req.json();
            threadId = body.id;
        } catch (e) {
            // Ignore json parse error if body is empty
        }

        if (!threadId) {
            return NextResponse.json({ success: false, message: "Thread ID is required" }, { status: 400 });
        }

        // 3. Check if thread exists
        const existingThreads = await db
            .select({
                id: threads.id,
                userId: threads.userId,
            })
            .from(threads)
            .where(eq(threads.id, threadId))
            .limit(1);

        if (existingThreads.length === 0) {
            return NextResponse.json({ success: false, message: "Thread not found" }, { status: 404 });
        }

        const thread = existingThreads[0];

        // 4. Check if the thread belongs to the authenticated user
        if (thread.userId !== decoded.id) {
            return NextResponse.json({ success: false, message: "Unauthorized to delete this thread" }, { status: 403 });
        }

        // 5. Delete the messages first due to foreign key constraint without cascade
        await db.delete(messages).where(eq(messages.threadId, threadId));

        // 6. Delete the thread
        await db.delete(threads).where(eq(threads.id, threadId));

        return NextResponse.json({ success: true, message: "Thread deleted successfully" });
    } catch (error: any) {
        const status = error.statusCode || 500;
        return NextResponse.json({ success: false, message: error.message }, { status });
    }
}