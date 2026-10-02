"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.refresh(); // Refresh the page to update the UI
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "14px",
        fontWeight: 500,
        color: "#ef4444",
        background: "transparent",
        border: "1px solid #fee2e2",
        padding: "8px 16px",
        borderRadius: "8px",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        opacity: loading ? 0.7 : 1,
      }}
      onMouseOver={(e) => {
        if (!loading) e.currentTarget.style.background = "#fef2f2";
      }}
      onMouseOut={(e) => {
        if (!loading) e.currentTarget.style.background = "transparent";
      }}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
      Sign out
    </button>
  );
}
