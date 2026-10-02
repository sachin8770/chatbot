"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ChatMessage, { AttachedFile, ChatMessageType } from "./ChatMessage";
import FileUploadButton, { FILE_TYPES } from "./FileUploadButton";
import MicButton from "./MicButton";


type PendingUpload = {
  files: AttachedFile[];
  rawFiles: File[];
  meta: (typeof FILE_TYPES)[0];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

/** Upload files to the correct indexing route, returns the server payload */
async function indexFiles(rawFiles: File[], meta: (typeof FILE_TYPES)[0]): Promise<any> {
  // ── Image: API expects JSON { images: string[] } (base64) ──────────────
  if (meta.type === "image") {
    const base64Array = await Promise.all(
      rawFiles.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              // Strip the data URL prefix to get pure base64
              resolve(result.split(",")[1] ?? result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      )
    );
    const res = await fetch(meta.apiIndexRoute, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images: base64Array }),
    });
    if (!res.ok) throw new Error(`Failed to index image: ${res.statusText}`);
    return res.json();
  }

  // ── Transcript: API expects JSON { name, text } ─────────────────────────
  if (meta.type === "transcript") {
    const text = await rawFiles[0].text();
    const res = await fetch(meta.apiIndexRoute, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: rawFiles[0].name, text }),
    });
    if (!res.ok) throw new Error(`Failed to index transcript: ${res.statusText}`);
    return res.json();
  }

  // ── Video: API expects JSON { videoId } ────────────────────────────────
  if (meta.type === "video") {
    const videoId = await rawFiles[0].text(); // we packed the ID as file text
    const res = await fetch(meta.apiIndexRoute, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    });
    if (!res.ok) throw new Error(`Failed to index video: ${res.statusText}`);
    return res.json();
  }

  // ── PDF: API expects FormData ──────────────────────────────────────────
  const formData = new FormData();
  if (meta.type === "pdf") {
    formData.append("pdf", rawFiles[0]);
  }

  const res = await fetch(meta.apiIndexRoute, { method: "POST", body: formData });
  if (!res.ok) throw new Error(`Failed to index ${meta.type}: ${res.statusText}`);
  return res.json();
}


/** Ask a question against the correct API route */
async function askQuestion(
  question: string,
  meta: (typeof FILE_TYPES)[0],
  indexPayload: any,
  threadId?: string
): Promise<string> {
  let body: any = { question, threadId };

  if (meta.type === "image") {
    body.sessionImageUrls = indexPayload?.data?.indexed?.map((i: any) => i.imageUrl) ?? [];
  } else if (meta.type === "pdf") {
    body.source = indexPayload?.data?.fileName;
  } else if (meta.type === "transcript") {
    body.sourceNames = [indexPayload?.data?.name];
  } else if (meta.type === "video") {
    body.videoId = indexPayload?.data?.videoId;
  }

  const res = await fetch(meta.apiAskRoute, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Failed to query ${meta.type}: ${res.statusText}`);
  const json = await res.json();
  return json?.data?.answer ?? "No answer returned.";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChatInterface() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const threadId = searchParams?.get("thread") || undefined;
  const isNew = searchParams?.get("isNew") === "true";

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputText, setInputText] = useState("");
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [indexPayload, setIndexPayload] = useState<{ meta: (typeof FILE_TYPES)[0]; data: any } | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch thread messages from Database
  useEffect(() => {
    // Reset local state when switching threads
    setIndexPayload(null);
    setPendingUpload(null);
    setInputText("");

    if (!threadId || isNew) {
      setMessages([{ id: "welcome", role: "assistant", content: "Hi! I'm your AI assistant. Ask me anything, or tap the **+** button below to upload an image, PDF, transcript, or video and I'll answer questions based on its content." }]);
      return;
    }

    // Set a loading state so the previous chat's messages are cleared from view
    setMessages([{ id: "loading", role: "assistant", content: "", isLoading: true }]);

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/threads/${threadId}`);
        const data = await res.json();
        if (data.success && data.messages.length > 0) {
          setMessages(
            data.messages.map((m: any) => ({
              id: m.id.toString(),
              role: m.role,
              content: m.content,
            }))
          );
        } else {
          setMessages([{ id: "welcome", role: "assistant", content: "Hi! I'm your AI assistant. Ask me anything, or tap the **+** button below to upload an image, PDF, transcript, or video and I'll answer questions based on its content." }]);
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        setMessages([{ id: "error", role: "assistant", content: "Failed to load messages." }]);
      }
    };
    fetchMessages();
  }, [threadId, isNew]);

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const addMessage = useCallback((msg: Omit<ChatMessageType, "id">) => {
    setMessages((prev) => [...prev, { id: generateId(), ...msg }]);
  }, []);

  const removeLoadingMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // ── Handle file selection from FileUploadButton ──────────────────────────
  const handleFilesSelected = async (
    attachedFiles: AttachedFile[],
    rawFiles: File[],
    meta: (typeof FILE_TYPES)[0]
  ) => {
    // Show a user bubble announcing the upload
    const uploadMsgId = generateId();
    const loadingMsgId = generateId();

    setMessages((prev) => [
      ...prev,
      {
        id: uploadMsgId,
        role: "user",
        content: `Uploading ${attachedFiles.map((f) => f.name).join(", ")}...`,
        attachments: attachedFiles,
      },
      { id: loadingMsgId, role: "assistant", content: "", isLoading: true },
    ]);

    setIsIndexing(true);
    try {
      const data = await indexFiles(rawFiles, meta);
      removeLoadingMessage(loadingMsgId);

      const indexed = { meta, data };
      setIndexPayload(indexed);
      setPendingUpload({ files: attachedFiles, rawFiles, meta });

      // Update the user message to show "ready"
      setMessages((prev) =>
        prev.map((m) =>
          m.id === uploadMsgId
            ? { ...m, content: `Uploaded ${attachedFiles.map((f) => f.name).join(", ")}` }
            : m
        )
      );

      const descMsgId = generateId();
      setMessages((prev) => [
        ...prev,
        { id: descMsgId, role: "assistant", content: `✅ **${meta.label}** indexed successfully! Generating a brief summary...`, isLoading: true }
      ]);

      try {
        // Wait 2 seconds before asking for the summary to give Qdrant time to index the vector chunks
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        const summary = await askQuestion("Please provide a brief, maximum 3-line description of what this uploaded content is about. Do not include timestamps in this summary.", meta, data, threadId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === descMsgId
              ? { ...m, content: `✅ **${meta.label}** indexed successfully!\n\n**About this file:**\n${summary}\n\nNow ask me anything else about it!`, isLoading: false }
              : m
          )
        );
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === descMsgId
              ? { ...m, content: `✅ **${meta.label}** indexed successfully! Now ask me anything about it.`, isLoading: false }
              : m
          )
        );
      }
    } catch (err: any) {
      removeLoadingMessage(loadingMsgId);
      addMessage({ role: "assistant", content: `❌ Failed to index: ${err.message}` });
      setPendingUpload(null);
      setIndexPayload(null);
    } finally {
      setIsIndexing(false);
    }
  };

  // ── Handle sending a message ─────────────────────────────────────────────
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending || isIndexing) return;

    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    if (isNew && threadId) {
      router.replace(`/?thread=${threadId}`, { scroll: false });
    }

    const loadingId = generateId();

    addMessage({ role: "user", content: text });
    setMessages((prev) => [
      ...prev,
      { id: loadingId, role: "assistant", content: "", isLoading: true },
    ]);
    setIsSending(true);

    try {
      let answer: string;

      if (indexPayload) {
        // Context-aware: query the indexed content
        answer = await askQuestion(text, indexPayload.meta, indexPayload.data, threadId);
      } else {
        // No context: hit the general ask-image route (general LLM fallback)
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: text, sessionImageUrls: [], threadId }),
        });
        const json = await res.json();
        answer = json?.data?.answer ?? "I couldn't process that.";
      }

      removeLoadingMessage(loadingId);
      addMessage({ role: "assistant", content: answer });
    } catch (err: any) {
      removeLoadingMessage(loadingId);
      addMessage({ role: "assistant", content: `❌ Error: ${err.message}` });
    } finally {
      setIsSending(false);
      // Give DB a tiny bit of time to save auto-generated title before sidebar fetches
      setTimeout(() => window.dispatchEvent(new Event("chatUpdated")), 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = inputText.trim().length > 0 && !isSending && !isIndexing;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "transparent",
      }}
    >
      {/* Context badge */}
      {indexPayload && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            background: `${indexPayload.meta.color}12`,
            borderBottom: `1px solid ${indexPayload.meta.color}22`,
            fontSize: "13px",
            color: indexPayload.meta.color,
            fontWeight: 500,
          }}
        >
          <span>
            {FILE_TYPES.find((f) => f.type === indexPayload.meta.type)?.icon}
          </span>
          <span>
            Context: {indexPayload.meta.label} indexed — questions will use this as source
          </span>
          <button
            onClick={() => { setIndexPayload(null); setPendingUpload(null); }}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94a3b8",
              fontSize: "16px",
              lineHeight: 1,
            }}
            title="Clear context"
          >
            ✕
          </button>
        </div>
      )}

      {/* Messages scroll area */}
      <div
        id="chat-messages"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar wrapper */}
      <div
        style={{
          padding: "0 16px 24px 16px",
          background: "transparent",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          onMouseDown={(e) => {
            // Prevent the browser from blurring the active element when clicking the wrapper
            if (e.target !== textareaRef.current && !(e.target as HTMLElement).closest("button") && !(e.target as HTMLElement).closest("label")) {
              e.preventDefault();
            }
          }}
          onClick={(e) => {
            if (!(e.target as HTMLElement).closest("button") && !(e.target as HTMLElement).closest("label")) {
              textareaRef.current?.focus();
            }
          }}
          style={{
            flex: 1,
            maxWidth: "760px", // constrain input bar width
            background: "#f1f5f9",
            borderRadius: "26px", // ChatGPT-like rounded pill
            padding: "8px 8px 8px 12px",
            display: "flex",
            alignItems: "flex-end",
            gap: "8px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            cursor: "text",
          }}
        >
          <FileUploadButton onFilesSelected={handleFilesSelected} />

          <textarea
            id="chat-input"
            ref={textareaRef}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isIndexing
                ? "Indexing your file, please wait…"
                : indexPayload
                  ? `Ask about your ${indexPayload.meta.label}…`
                  : "Ask me anything…"
            }
            rows={1}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "14.5px",
              color: "#1e293b",
              resize: "none",
              maxHeight: "120px",
              lineHeight: "1.5",
              padding: "8px 4px",
              fontFamily: "inherit",
              marginBottom: "2px", // align nicely with buttons
            }}
          />

          <div style={{ display: "flex", gap: "4px", paddingBottom: "2px" }}>
            <MicButton
              currentText={inputText}
              onUpdate={(text) => {
                setInputText(text);
                if (textareaRef.current) {
                  textareaRef.current.style.height = "auto";
                  textareaRef.current.style.height =
                    Math.min(textareaRef.current.scrollHeight, 120) + "px";
                }
              }}
            />

            {/* Send button */}
            <button
              id="chat-send-btn"
              onClick={handleSend}
              disabled={!canSend}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "none",
                background: canSend ? "#1e293b" : "transparent", // Dark background when active
                color: canSend ? "#ffffff" : "#94a3b8",
                cursor: canSend ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
