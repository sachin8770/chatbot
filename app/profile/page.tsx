import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { db } from "@/src/db";
import { users } from "@/src/schema/userschema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, User as UserIcon, Mail, Lock } from "lucide-react";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  let user = null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key_change_in_production") as any;
    const dbUsers = await db.select().from(users).where(eq(users.email, decoded.email)).limit(1);
    if (dbUsers.length > 0) {
      user = dbUsers[0];
    }
  } catch (e) {
    redirect("/login");
  }

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-500/30 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Back to Chat
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="flex items-center gap-6 mb-10 border-b border-slate-200 pb-8">
            <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-3xl font-bold text-slate-700">
              {user.firstName?.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1 text-slate-900">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-slate-500 flex items-center gap-2">
                <Mail size={14} />
                {user.email}
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold mb-4 text-slate-800">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">First Name</span>
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <UserIcon size={16} className="text-slate-400" />
                    {user.firstName}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Last Name</span>
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <UserIcon size={16} className="text-slate-400" />
                    {user.lastName}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:col-span-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Email Address</span>
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <Mail size={16} className="text-slate-400" />
                    {user.email}
                  </div>
                </div>
              </div>
            </section>

            <section className="pt-4 border-t border-slate-200">
              <h2 className="text-lg font-semibold mb-4 text-slate-800 flex items-center gap-2">
                <Lock size={18} className="text-indigo-500" />
                Security
              </h2>
              
              {/* Single button to change password */}
              <button 
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-5 rounded-lg border border-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
              >
                Change Password
              </button>
              <p className="text-sm text-slate-500 mt-3">
                Clicking this button will allow you to update your account password.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
