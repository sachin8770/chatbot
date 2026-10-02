import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { db } from "@/src/db";
import { messages, threads } from "@/src/schema/userschema";
import { eq, asc } from "drizzle-orm";
import { getSharedLlm } from "@/src/utils/ai-clients";
import { StringOutputParser } from "@langchain/core/output_parsers";

export async function getDbMessageHistory(threadId: string, userId: number) {
  // Ensure thread exists
  let existingThread = await db.select().from(threads).where(eq(threads.id, threadId));
  if (existingThread.length === 0) {
    await db.insert(threads).values({
      id: threadId,
      userId: userId,
      title: "New Chat",
    });
    existingThread = await db.select().from(threads).where(eq(threads.id, threadId));
  }

  return {
    getMessages: async () => {
      const dbMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.threadId, threadId))
        .orderBy(asc(messages.createdAt));

      return dbMessages.map((m) =>
        m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
      );
    },
    addMessage: async (msg: HumanMessage | AIMessage) => {
      await db.insert(messages).values({
        threadId,
        role: msg instanceof HumanMessage ? "user" : "assistant",
        content: msg.content.toString(),
      });

      // Auto-generate title after the first response
      if (msg instanceof AIMessage && existingThread[0].title === "New Chat") {
        const dbMessages = await db.select().from(messages).where(eq(messages.threadId, threadId)).orderBy(asc(messages.createdAt));
        
        // Generate title based on the first user question
        if (dbMessages.length <= 4) {
          try {
            const firstUserMessage = dbMessages.find(m => m.role === "user");
            if (firstUserMessage) {
              let title = firstUserMessage.content;
              if (title.length > 50) {
                title = title.substring(0, 47) + "...";
              }
              
              await db.update(threads).set({ title: title.trim() }).where(eq(threads.id, threadId));
              existingThread[0].title = title.trim(); // Prevent regenerating
            }
          } catch (e) {
            console.error("Failed to generate chat title", e);
          }
        }
      }
    },
  };
}
