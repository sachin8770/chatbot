"use client";

import { useEffect, useRef, useState } from "react";

function cleanForSpeech(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*#`>_]/g, "")
    .trim();
}

type State = "idle" | "loading" | "playing";

export default function TtsButton({ text }: { text: string }) {
  const [state, setState] = useState<State>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  async function handleClick() {
    if (state === "playing") {
      audioRef.current?.pause();
      setState("idle");
      return;
    }
    if (state === "loading") return;

    // Replay cached audio without re-fetching
    if (blobUrlRef.current) {
      if (!audioRef.current) {
        audioRef.current = new Audio(blobUrlRef.current);
        audioRef.current.onended = () => setState("idle");
      }
      try {
        await audioRef.current.play();
        setState("playing");
      } catch {
        setState("idle");
      }
      return;
    }

    setState("loading");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanForSpeech(text) }),
      });

      if (!res.ok) throw new Error("TTS failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setState("idle");
      await audio.play();
      setState("playing");
    } catch {
      setState("idle");
      // Browser TTS fallback
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(cleanForSpeech(text));
        utterance.onend = () => setState("idle");
        window.speechSynthesis.speak(utterance);
        setState("playing");
      }
    }
  }

  const icons: Record<State, string> = {
    idle: "🔊",
    loading: "⏳",
    playing: "⏹️",
  };

  const titles: Record<State, string> = {
    idle: "Read aloud",
    loading: "Generating audio…",
    playing: "Stop",
  };

  return (
    <button
      id="tts-btn"
      type="button"
      onClick={handleClick}
      title={titles[state]}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "14px",
        padding: "2px 6px",
        borderRadius: "6px",
        color: state === "playing" ? "#ef4444" : "#94a3b8",
        transition: "color 0.2s",
        lineHeight: 1,
        opacity: state === "loading" ? 0.6 : 1,
      }}
    >
      {icons[state]}
    </button>
  );
}
