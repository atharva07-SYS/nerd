"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Missing password reset token in link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to reset password.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md archive-card p-8 space-y-6 border border-[#2b2f3b]">
      <div className="text-center space-y-2 pb-4 border-b border-[#232730]">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#181a1f] border border-red-900/60 flex items-center justify-center text-red-400 font-mono font-bold text-xl shadow-inner">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="font-serif-archive text-2xl font-bold text-white tracking-wide">
          SET NEW PASSWORD
        </h1>
        <p className="font-mono-archive text-xs text-zinc-400 uppercase tracking-widest">
          Enter your new scholar credentials
        </p>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-950/60 border border-red-800/80 text-red-400 text-xs font-mono-archive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="space-y-6 text-center">
          <div className="p-4 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-mono-archive space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="font-bold text-sm text-white">PASSWORD UPDATED SUCCESSFULLY</h3>
            <p className="text-zinc-300 font-sans">
              Your password has been updated. You may now log in to your account.
            </p>
          </div>

          <Link
            href="/login"
            className="w-full py-3 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono-archive font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors block"
          >
            <span>LOG IN TO YOUR DECK &rarr;</span>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block font-mono-archive text-xs text-zinc-400 uppercase tracking-wider">
              NEW PASSWORD (MIN 6 CHARS)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#121417] border border-[#2a2e3a] focus:border-red-500 rounded px-3 py-2.5 pl-9 text-sm text-white focus:outline-none transition-colors"
              />
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-mono-archive text-xs text-zinc-400 uppercase tracking-wider">
              CONFIRM NEW PASSWORD
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#121417] border border-[#2a2e3a] focus:border-red-500 rounded px-3 py-2.5 pl-9 text-sm text-white focus:outline-none transition-colors"
              />
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full py-3 px-4 rounded bg-red-600 hover:bg-red-500 text-white font-mono-archive text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-6 shadow-md"
          >
            {loading ? (
              <span>UPDATING PASSWORD...</span>
            ) : (
              <>
                <span>CONFIRM & SAVE PASSWORD</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#0c0d0e]">
      <Suspense
        fallback={
          <div className="archive-card p-8 text-center text-zinc-400 font-mono-archive text-xs">
            LOADING PASSWORD RESET FORM...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
