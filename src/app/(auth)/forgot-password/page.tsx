"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [devResetUrl, setDevResetUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setDevResetUrl("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(data.message || "Reset link sent to your email.");
        if (data.resetUrl) {
          setDevResetUrl(data.resetUrl);
        }
      } else {
        setError(data.error || "Failed to process request.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#0c0d0e]">
      <div className="w-full max-w-md archive-card p-8 space-y-6 border border-[#2b2f3b]">
        <div className="text-center space-y-2 pb-4 border-b border-[#232730]">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#181a1f] border border-amber-900/60 flex items-center justify-center text-amber-400 font-mono font-bold text-xl shadow-inner">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="font-serif-archive text-2xl font-bold text-white tracking-wide">
            RECOVER SCHOLAR ACCESS
          </h1>
          <p className="font-mono-archive text-xs text-zinc-400 uppercase tracking-widest">
            Request Password Reset Token via Email
          </p>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-950/60 border border-red-800/80 text-red-400 text-xs font-mono-archive flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg ? (
          <div className="space-y-4">
            <div className="p-4 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-mono-archive space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>RESET INSTRUCTIONS SENT</span>
              </div>
              <p className="text-zinc-300 font-sans">{successMsg}</p>
            </div>

            {devResetUrl && (
              <div className="bg-[#121417] p-4 rounded border border-[#2b2f3a] space-y-2 font-mono-archive text-xs">
                <span className="text-amber-400 font-bold block">LOCAL DEV RESET LINK GENERATED:</span>
                <a
                  href={devResetUrl}
                  className="text-amber-300 underline break-all block hover:text-white"
                >
                  {devResetUrl}
                </a>
                <p className="text-[10px] text-zinc-400 pt-1 border-t border-[#232730]">
                  Click the link above to proceed to the password reset form directly.
                </p>
              </div>
            )}

            <Link
              href="/login"
              className="w-full py-3 rounded bg-[#1c1f26] hover:bg-[#252933] text-white font-mono-archive text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border border-[#333845]"
            >
              <span>RETURN TO LOG IN</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block font-mono-archive text-xs text-zinc-400 uppercase tracking-wider">
                REGISTERED EMAIL ADDRESS
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="scholar@thedraw.archive"
                  className="w-full bg-[#121417] border border-[#2a2e3a] focus:border-amber-500 rounded px-3 py-2.5 pl-9 text-sm text-white focus:outline-none transition-colors"
                />
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded bg-amber-600 hover:bg-amber-500 text-zinc-950 font-mono-archive text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-6 shadow-md"
            >
              {loading ? (
                <span>GENERATING TOKEN...</span>
              ) : (
                <>
                  <span>SEND PASSWORD RESET EMAIL</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-[#232730] text-center font-mono-archive text-xs text-zinc-400">
          <span>Remembered your password? </span>
          <Link href="/login" className="text-red-400 hover:text-red-300 font-semibold underline">
            Log in to your account
          </Link>
        </div>
      </div>
    </div>
  );
}
