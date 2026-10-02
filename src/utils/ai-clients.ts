import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { Document } from "@langchain/core/documents";
import { QDRANT_URL, QDRANT_API_KEY, GEMINI_MODEL, GEMINI_EMBEDDING_MODEL } from "@/src/utils/constants";

// ── Singletons ────────────────────────────────────────────────────────────────
// Lazy-initialized so the server doesn't create connections at import time.

let llmInstance: ChatGoogleGenerativeAI | null = null;
let embeddingsInstance: GoogleGenerativeAIEmbeddings | null = null;

/**
 * 🦜 LangChain heavy-lifting: ChatGoogleGenerativeAI wraps the Gemini REST API,
 * handles retries, streaming, token counting, and tool-call parsing automatically.
 */
export function getSharedLlm() {
  if (!llmInstance) {
    llmInstance = new ChatGoogleGenerativeAI({
      model: GEMINI_MODEL,
      apiKey: process.env.GEMINI_API_KEY || "",
    });
  }
  return llmInstance;
}

/**
 * 🦜 LangChain heavy-lifting: GoogleGenerativeAIEmbeddings batches texts,
 * calls the Gemini embedding endpoint, and returns float32 vectors — no manual
 * HTTP or base64 encoding needed.
 */
export function getSharedEmbeddings() {
  if (!embeddingsInstance) {
    embeddingsInstance = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY || "",
      model: GEMINI_EMBEDDING_MODEL,
      maxRetries: 2,
    });
  }
  return embeddingsInstance;
}

/**
 * 🦜 LangChain heavy-lifting: Qdrant vector store integration — handles
 * collection management, upserts, and similarity search over
 * the remote Qdrant Cloud instance.
 */
export function getSharedVectorStore(collectionName: string) {
  return new QdrantVectorStore(getSharedEmbeddings(), {
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
    collectionName,
  });
}

/**
 * 🦜 Safely adds documents by filtering out empty text, then relying on LangChain
 * to handle the heavy lifting (embeddings, API batching, and database insertion).
 */
export async function safeAddDocuments(vectorStore: QdrantVectorStore, documents: Document[], ids?: string[]) {
  const validDocs: Document[] = [];
  const validIds: string[] = [];

  // 1. Filter out completely empty chunks so we don't send garbage to the LLM
  for (let i = 0; i < documents.length; i++) {
    const content = documents[i].pageContent;
    if (content && content.trim().length > 0) {
      validDocs.push(documents[i]);
      if (ids) validIds.push(ids[i]);
    }
  }

  if (validDocs.length === 0) {
    return 0;
  }

  // 2. LangChain Heavy Lifting: Automatically generates embeddings and inserts them into Qdrant
  await vectorStore.ensureCollection();
  
  // Create payload indexes to prevent Qdrant from throwing 'Index required' during exact match filtering
  try {
    await vectorStore.client.createPayloadIndex(vectorStore.collectionName, { field_name: "metadata.videoId", field_schema: "keyword", wait: true });
  } catch (e: any) { /* ignore if exists */ }
  try {
    await vectorStore.client.createPayloadIndex(vectorStore.collectionName, { field_name: "metadata.source", field_schema: "keyword", wait: true });
  } catch (e: any) { /* ignore if exists */ }
  try {
    await vectorStore.client.createPayloadIndex(vectorStore.collectionName, { field_name: "imageUrl", field_schema: "keyword", wait: true });
  } catch (e: any) { /* ignore if exists */ }
  try {
    await vectorStore.client.createPayloadIndex(vectorStore.collectionName, { field_name: "metadata.imageUrl", field_schema: "keyword", wait: true });
  } catch (e: any) { /* ignore if exists */ }

  await vectorStore.addDocuments(validDocs, validIds.length > 0 ? { ids: validIds } : undefined);

  return validDocs.length;
}
