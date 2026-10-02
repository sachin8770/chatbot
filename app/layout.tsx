import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "----font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Visual RAG — AI Chat Assistant",
  description:
    "Chat with your images, PDFs, transcripts, and videos using Gemini AI. Upload any file and ask questions in natural language.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column", margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
