"use client";

import React from "react";
import TtsButton from "./TtsButton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type MessageRole = "user" | "assistant";

export type AttachedFile = {
  type: "image" | "pdf" | "transcript" | "video";
  name: string;
  preview?: string; // base64 data URL for images
};

export type ChatMessageType = {
  id: string;
  role: MessageRole;
  content: string;
  attachments?: AttachedFile[];
  isLoading?: boolean;
};

const FileChip = ({ file }: { file: AttachedFile }) => {
  const icons: Record<AttachedFile["type"], string> = {
    image: "🖼️",
    pdf: "📄",
    transcript: "📝",
    video: "🎬",
  };
  const colors: Record<AttachedFile["type"], string> = {
    image: "#3b82f6",
    pdf: "#f97316",
    transcript: "#14b8a6",
    video: "#ef4444",
  };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "20px",
        background: `${colors[file.type]}22`,
        border: `1px solid ${colors[file.type]}44`,
        fontSize: "12px",
        color: colors[file.type],
        fontWeight: 500,
        marginBottom: "6px",
        marginRight: "6px",
      }}
    >
      <span>{icons[file.type]}</span>
      <span style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {file.name}
      </span>
    </div>
  );
};

const LoadingDots = () => (
  <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "4px 0" }}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: "#94a3b8",
          animation: "bounce 1.4s infinite ease-in-out",
          animationDelay: `${i * 0.16}s`,
        }}
      />
    ))}
    <style>{`
      @keyframes bounce {
        0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
        40% { transform: scale(1.2); opacity: 1; }
      }
    `}</style>
  </div>
);

export default function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: "10px",
        marginBottom: "16px",
        animation: "fadeSlideIn 0.3s ease-out",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          background: isUser
            ? "linear-gradient(135deg, #3b82f6, #6366f1)"
            : "linear-gradient(135deg, #e0f2fe, #bfdbfe)",
          color: isUser ? "#fff" : "#1e40af",
          fontWeight: 700,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        {isUser ? "U" : "CB"}
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div style={{ marginBottom: "6px" }}>
            {message.attachments.map((f, i) => (
              <FileChip key={i} file={f} />
            ))}
          </div>
        )}

        {/* TTS button — only on complete assistant messages */}
        {!isUser && !message.isLoading && message.content && (
          <div style={{ marginBottom: "6px", display: "flex", alignItems: "center" }}>
            <TtsButton text={message.content} />
          </div>
        )}

        {/* Message bubble */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            background: isUser
              ? "linear-gradient(135deg, #2563eb, #4f46e5)"
              : "#ffffff",
            color: isUser ? "#ffffff" : "#1e293b",
            fontSize: "14.5px",
            lineHeight: "1.65",
            boxShadow: isUser
              ? "0 4px 16px rgba(59,130,246,0.25)"
              : "0 2px 12px rgba(0,0,0,0.08)",
            border: isUser ? "none" : "1px solid #e2e8f0",
            wordBreak: "break-word",
          }}
        >
          {message.isLoading ? (
            <LoadingDots />
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                ul: ({ node, ...props }) => <ul style={{ listStyleType: "disc", paddingLeft: "24px", margin: "8px 0" }} {...props} />,
                ol: ({ node, ...props }) => <ol style={{ listStyleType: "decimal", paddingLeft: "24px", margin: "8px 0" }} {...props} />,
                li: ({ node, ...props }) => <li style={{ marginBottom: "4px" }} {...props} />,
                p: ({ node, ...props }) => <p style={{ margin: "0 0 8px 0" }} {...props} />,
                strong: ({ node, ...props }) => <strong style={{ fontWeight: 600 }} {...props} />,
                h1: ({ node, ...props }) => <h1 style={{ fontSize: "1.2em", fontWeight: 700, margin: "12px 0 8px" }} {...props} />,
                h2: ({ node, ...props }) => <h2 style={{ fontSize: "1.1em", fontWeight: 700, margin: "12px 0 8px" }} {...props} />,
                h3: ({ node, ...props }) => <h3 style={{ fontSize: "1.05em", fontWeight: 600, margin: "10px 0 8px" }} {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
