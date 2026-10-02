"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const successMessage = searchParams.get("message");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to log in");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10">
      <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            Welcome Back
          </h1>
          <p className="text-neutral-400">Please enter your details to sign in.</p>
        </div>

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 text-sm p-3 rounded-lg mb-6 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {successMessage}
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-300 ml-1">
              Email
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-neutral-500 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <input
                type="email"
                name="email"
                required
                className="w-full bg-neutral-950/50 border border-neutral-800 text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-neutral-600"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-medium text-neutral-300">
                Password
              </label>
              <a href="#" className="text-xs text-indigo-400 hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-neutral-500 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <input
                type="password"
                name="password"
                required
                className="w-full bg-neutral-950/50 border border-neutral-800 text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-neutral-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-white text-black font-semibold rounded-xl py-3 px-4 flex items-center justify-center hover:bg-neutral-200 focus:ring-4 focus:ring-white/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-neutral-400">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="text-white font-medium hover:underline hover:text-indigo-400 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-indigo-500/30">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/20 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
