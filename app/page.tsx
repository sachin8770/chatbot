import React, { Suspense } from "react";
import ChatInterface from "@/src/components/chat/ChatInterface";
import Sidebar from "@/src/components/chat/Sidebar";
import Link from "next/link";
import { cookies } from "next/headers";
import SignOutButton from "@/src/components/chat/SignOutButton";
import jwt from "jsonwebtoken";
import { db } from "@/src/db";
import { users } from "@/src/schema/userschema";
import { eq } from "drizzle-orm";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  let isLoggedIn = false;
  let invalidToken = false;
  let user = null;

  if (token) {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) throw new Error("JWT_SECRET environment variable is not set");
      const decoded = jwt.verify(token, jwtSecret) as any;
      const dbUsers = await db.select().from(users).where(eq(users.email, decoded.email)).limit(1);
      if (dbUsers.length > 0) {
        user = dbUsers[0];
        isLoggedIn = true;
      }
    } catch (e) {
      console.warn("Token verification failed (invalid token). Clearing cookie.");
      invalidToken = true;
    }
  }

  return (
    <main
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        background: "#ffffff",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        overflow: "hidden"
      }}
    >
      {invalidToken && (
        <script dangerouslySetInnerHTML={{ __html: `fetch('/api/auth/logout', { method: 'POST' }).then(() => window.location.reload());` }} />
      )}
      <Suspense fallback={<div style={{ width: "260px", background: "#f9fafb", borderRight: "1px solid #e2e8f0" }} />}>
        <Sidebar user={user} />
      </Suspense>

      {/* Main chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
        {/* Header */}
        <div
          style={{
            padding: "14px 24px",
            background: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          {/* Logo mark */}
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            CB
          </div>

          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 600,
                color: "#0f172a",
                letterSpacing: "-0.2px",
              }}
            >
              Helpful Chatbot
            </h1>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
              Try out Images, PDFs, Transcripts & Videos
            </p>
          </div>

          {/* Auth Buttons */}
          <div style={{ marginLeft: "auto", display: "flex", gap: "12px", alignItems: "center" }}>
            {isLoggedIn ? (
              <SignOutButton />
            ) : (
              <>
                <Link 
                  href="/login"
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#475569",
                    textDecoration: "none",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    transition: "all 0.2s"
                  }}
                >
                  Log in
                </Link>
                <Link 
                  href="/signup"
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#ffffff",
                    background: "#0f172a",
                    textDecoration: "none",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                  }}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>


        {/* Chat Interface Container */}
        <div style={{ flex: 1, overflow: "hidden", maxWidth: "800px", margin: "0 auto", width: "100%", padding: "16px 16px 0 16px" }}>
          <Suspense fallback={<div style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>Loading...</div>}>
            <ChatInterface />
          </Suspense>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </main>
  );
}
