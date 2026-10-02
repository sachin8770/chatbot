"use client";

import React, { useRef, useState } from "react";
import { AttachedFile } from "./ChatMessage";

const FILE_TYPES = [
  {
    type: "image" as const,
    label: "Image",
    icon: "🖼️",
    accept: "image/*",
    color: "#3b82f6",
    description: "Upload images to ask visual questions",
    apiIndexRoute: "/api/index-image",
    apiAskRoute: "/api/ask",
    fieldName: "images",
  },
  {
    type: "pdf" as const,
    label: "PDF",
    icon: "📄",
    accept: "application/pdf",
    color: "#f97316",
    description: "Index a PDF document for Q&A",
    apiIndexRoute: "/api/index-pdf",
    apiAskRoute: "/api/ask-pdf",
    fieldName: "pdf",
  },
  {
    type: "transcript" as const,
    label: "Transcript",
    icon: "📝",
    accept: ".txt,text/plain",
    color: "#14b8a6",
    description: "Index a meeting or lecture transcript",
    apiIndexRoute: "/api/index-transcript",
    apiAskRoute: "/api/ask-transcript",
    fieldName: "transcript",
  },
  {
    type: "video" as const,
    label: "Video",
    icon: "🎬",
    accept: ".mp4,.avi,.mov,video/*",
    color: "#ef4444",
    description: "Upload a video for YouTube-style Q&A",
    apiIndexRoute: "/api/index-video",
    apiAskRoute: "/api/ask-video",
    fieldName: "video",
  },
];

type Props = {
  onFilesSelected: (files: AttachedFile[], rawFiles: File[], meta: (typeof FILE_TYPES)[0]) => void;
};

export default function FileUploadButton({ onFilesSelected }: Props) {
  const [open, setOpen] = useState(false);
  const [activeInput, setActiveInput] = useState<(typeof FILE_TYPES)[0] | null>(null);
  const [inputValue, setInputValue] = useState("");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleTypeClick = (meta: (typeof FILE_TYPES)[0]) => {
    if (meta.type === "transcript" || meta.type === "video") {
      setActiveInput(meta);
      setInputValue("");
      return;
    }

    setOpen(false);
    // Default for images and PDFs
    fileRefs.current[meta.type]?.click();
  };

  const handleInputSubmit = () => {
    if (!activeInput || !inputValue) return;

    if (activeInput.type === "transcript") {
      const file = new File([inputValue], "pasted-transcript.txt", { type: "text/plain" });
      onFilesSelected([{ type: "transcript", name: "Pasted Transcript" }], [file], activeInput);
    } else if (activeInput.type === "video") {
      let videoId = inputValue;
      if (videoId.includes("v=")) {
        videoId = new URLSearchParams(videoId.split("?")[1]).get("v") || videoId;
      } else if (videoId.includes("youtu.be/")) {
        videoId = videoId.split("youtu.be/")[1]?.split("?")[0] || videoId;
      }
      const file = new File([videoId], "youtube-video.txt", { type: "text/plain" });
      onFilesSelected([{ type: "video", name: `YouTube: ${videoId}` }], [file], activeInput);
    }

    setActiveInput(null);
    setOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, meta: (typeof FILE_TYPES)[0]) => {
    const rawFiles = Array.from(e.target.files ?? []);
    if (rawFiles.length === 0) return;

    const attachedFiles: AttachedFile[] = await Promise.all(
      rawFiles.map(
        (file) =>
          new Promise<AttachedFile>((resolve) => {
            if (meta.type === "image") {
              const reader = new FileReader();
              reader.onload = () =>
                resolve({ type: meta.type, name: file.name, preview: reader.result as string });
              reader.readAsDataURL(file);
            } else {
              resolve({ type: meta.type, name: file.name });
            }
          })
      )
    );

    onFilesSelected(attachedFiles, rawFiles, meta);
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Hidden file inputs for each type */}
      {FILE_TYPES.map((meta) => (
        <input
          key={meta.type}
          type="file"
          ref={(el) => { fileRefs.current[meta.type] = el; }}
          accept={meta.accept}
          multiple={meta.type === "image"}
          style={{ display: "none" }}
          onChange={(e) => handleFileChange(e, meta)}
        />
      ))}

      {/* Plus button */}
      <button
        id="file-upload-toggle"
        onClick={() => {
          setOpen((o) => {
            if (o) setActiveInput(null);
            return !o;
          });
        }}
        title="Attach files"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          border: "none",
          background: open ? "#e2e8f0" : "transparent",
          color: open ? "#0f172a" : "#64748b",
          fontSize: "24px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.15s ease",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.background = "#e2e8f0";
            e.currentTarget.style.color = "#0f172a";
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#64748b";
          }
        }}
      >
        +
      </button>

      {/* Popup menu */}
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "52px",
            left: "0",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "8px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            minWidth: "210px",
            animation: "popIn 0.18s ease-out",
            zIndex: 100,
          }}
        >
          {activeInput ? (
            <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>{activeInput.icon}</span> {activeInput.label}
              </div>
              {activeInput.type === "transcript" ? (
                <textarea
                  autoFocus
                  placeholder="Paste transcript text..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: "100px",
                    padding: "8px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              ) : (
                <input
                  type="text"
                  autoFocus
                  placeholder="Paste YouTube ID or URL..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleInputSubmit();
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              )}
              <div style={{ display: "flex", gap: "8px", marginTop: "4px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setActiveInput(null)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#64748b",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInputSubmit}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "none",
                    background: activeInput.color,
                    color: "#fff",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Submit
                </button>
              </div>
            </div>
          ) : (
            FILE_TYPES.map((meta) => (
              <button
                key={meta.type}
                id={`upload-${meta.type}`}
                onClick={() => handleTypeClick(meta)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = `${meta.color}11`)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
              >
                <span
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: `${meta.color}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    flexShrink: 0,
                  }}
                >
                  {meta.icon}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b" }}>{meta.label}</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{meta.description}</div>
                </div>
              </button>
            ))
          )}

          <style>{`
            @keyframes popIn {
              from { opacity: 0; transform: translateY(8px) scale(0.96); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

export { FILE_TYPES };
