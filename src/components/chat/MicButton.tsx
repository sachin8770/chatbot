"use client";

import { useRef, useState } from "react";

type Props = {
  /** Current textarea value — transcript is appended to it */
  currentText: string;
  onUpdate: (text: string) => void;
  disabled?: boolean;
};

export default function MicButton({ currentText, onUpdate, disabled }: Props) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggle = () => {
    console.log("Mic button clicked");
    if (disabled) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition isn't supported in this browser. Use Chrome or Edge.");
      return;
    }

    // Stop if already listening
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;

    const base = currentText;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      alert(`Microphone error: ${event.error}`);
      setListening(false);
    };

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      onUpdate(base ? base + " " + transcript : transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <button
      id="mic-btn"
      type="button"
      onClick={toggle}
      disabled={disabled}
      title={listening ? "Stop recording" : "Speak your question"}
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        border: "none",
        background: listening ? "#fee2e2" : "transparent",
        color: listening ? "#ef4444" : "#94a3b8",
        cursor: disabled ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "all 0.2s ease",
        animation: listening ? "micPulse 1s infinite" : "none",
      }}
    >
      {/* Mic SVG */}
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>

      <style>{`
        @keyframes micPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }
      `}</style>
    </button>
  );
}
