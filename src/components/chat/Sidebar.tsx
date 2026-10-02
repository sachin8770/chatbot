"use client";

import React, { useState, useEffect } from "react";
import { User as UserIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Sidebar({ user }: { user?: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentThreadId = searchParams?.get("thread") || "";
  console.log(currentThreadId, "currentThreadId");
  const [threads, setThreads] = useState<{id: string, title: string}[]>([]);
  const initRef = React.useRef(false);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const res = await fetch("/api/threads");
        const data = await res.json();
        let loadedThreads = data.success ? data.threads : [];

        if (!currentThreadId && !initRef.current) {
          // User opened root URL without a thread ID -> ALWAYS generate a new one
          initRef.current = true;
          const newId = Math.random().toString(36).slice(2, 10);
          loadedThreads = [{ id: newId, title: "New Chat" }, ...loadedThreads];
          router.replace(`/?thread=${newId}&isNew=true`);
        } else if (currentThreadId) {
          // If URL has a thread ID but it's not in DB yet, show it locally
          const exists = loadedThreads.some((t: any) => t.id === currentThreadId);
          if (!exists) {
            loadedThreads = [{ id: currentThreadId, title: "New Chat" }, ...loadedThreads];
          }
        }

        setThreads(loadedThreads);
      } catch (err) {
        console.error("Failed to fetch threads:", err);
      }
    };

    fetchThreads();

    // Listen for custom event from ChatInterface to refresh titles
    const handleUpdate = () => fetchThreads();
    window.addEventListener("chatUpdated", handleUpdate);
    return () => window.removeEventListener("chatUpdated", handleUpdate);
  }, [router, currentThreadId]);

  const handleNewChat = () => {
    // Generate new thread ID locally, it will be saved to DB on first message
    const newId = Math.random().toString(36).slice(2, 10);
    const updated = [{ id: newId, title: "New Chat" }, ...threads];
    setThreads(updated);
    router.push(`/?thread=${newId}&isNew=true`);
  };

  const handleDelete = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    try {
      const res = await fetch("/api/deleat-chat", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: threadId }) // Passing ID in the body as requested
      });
      const data = await res.json();
      
      if (data.success) {
        const updated = threads.filter(t => t.id !== threadId);
        setThreads(updated);
        
        // If the current thread was deleted, redirect
        if (currentThreadId === threadId) {
          if (updated.length > 0) {
            router.push(`/?thread=${updated[0].id}`);
          } else {
            handleNewChat();
          }
        }
      } else {
        alert(data.message || "Failed to delete thread");
      }
    } catch (err) {
      console.error("Failed to delete thread:", err);
      alert("An error occurred while deleting the thread.");
    }
  };

  return (
    <div
      style={{
        width: "260px",
        height: "100%",
        background: "#f9fafb",
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        padding: "16px",
      }}
    >
      <button
        style={{
          width: "100%",
          padding: "12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: 500,
          fontSize: "14px",
          color: "#0f172a",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          transition: "background 0.2s, box-shadow 0.2s",
        }}
        onClick={handleNewChat}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#f8fafc";
          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#ffffff";
          e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Chat
      </button>

      <div style={{ marginTop: "24px", flex: 1, minHeight: 0, overflowY: "auto", display: "", flexDirection: "column", gap: "4px", paddingRight: "4px" }}>
        <div style={{ fontSize: "20px", fontWeight: 600, color: "#64748b", marginBottom: "4px", paddingLeft: "8px", marginTop: "8px" }}>
          Conversations
        </div>
        {threads.map((thread) => (
          <HistoryItem 
            key={thread.id} 
            title={thread.title} 
            active={thread.id === currentThreadId} 
            onClick={() => router.push(`/?thread=${thread.id}`)}
            onDelete={thread.title === "New Chat" ? undefined : (e) => handleDelete(e, thread.id)}
          />
        ))}
      </div>

      {/* User profile section */}
      {user && (
        <div 
          onClick={() => router.push("/profile")}
          style={{ 
            marginTop: "auto", 
            paddingTop: "16px", 
            borderTop: "1px solid #e2e8f0", 
            display: "flex", 
            alignItems: "center", 
            gap: "10px", 
            padding: "16px 8px 8px 8px", 
            cursor: "pointer",
            borderRadius: "8px",
            transition: "background 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold", color: "#475569" }}>
            {user.firstName?.charAt(0) || "U"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.firstName} {user.lastName}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryItem({ title, active = false, onClick, onDelete }: { title: string; active?: boolean; onClick?: () => void; onDelete?: (e: React.MouseEvent) => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "10px 12px",
        borderRadius: "8px",
        background: active ? "#e2e8f0" : "transparent",
        color: active ? "#0f172a" : "#475569",
        fontSize: "14px",
        cursor: "pointer",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        transition: "background 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#f1f5f9" }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
      </div>
      {onDelete && (
        <button
          onClick={onDelete}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#94a3b8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px",
            borderRadius: "4px",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "#fee2e2"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "transparent"; }}
          title="Delete chat"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      )}
    </div>
  );
}
