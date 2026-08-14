"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to register account.");
        setLoading(false);
        return;
      }

      // Automatically sign in upon registration
      const signInRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (signInRes?.error) {
        setError("Account created. Please log in manually.");
        setLoading(false);
      } else {
        router.push("/draw");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred during account setup.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#0c0d0e]">
      <div className="w-full max-w-md archive-card p-8 space-y-6 border border-[#2b2f3b]">
        <div className="text-center space-y-2 pb-4 border-b border-[#232730]">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#181a1f] border border-amber-900/60 flex items-center justify-center text-amber-400 font-mono font-bold text-xl shadow-inner">
            ✍️
          </div>
          <h1 className="font-serif-archive text-2xl font-bold text-white tracking-wide">
            CREATE SCHOLAR PROFILE
          </h1>
          <p className="font-mono-archive text-xs text-zinc-400 uppercase tracking-widest">
            Register your independent draw deck
          </p>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-950/60 border border-red-800/80 text-red-400 text-xs font-mono-archive flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block font-mono-archive text-xs text-zinc-400 uppercase tracking-wider">
              DISPLAY NAME / SCHOLAR ALIAS
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Hypatia of Alexandria"
                className="w-full bg-[#121417] border border-[#2a2e3a] focus:border-amber-500 rounded px-3 py-2.5 pl-9 text-sm text-white focus:outline-none transition-colors"
              />
              <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-mono-archive text-xs text-zinc-400 uppercase tracking-wider">
              EMAIL ADDRESS
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

          <div className="space-y-1.5">
            <label className="block font-mono-archive text-xs text-zinc-400 uppercase tracking-wider">
              PASSWORD (MIN 6 CHARS)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#121417] border border-[#2a2e3a] focus:border-amber-500 rounded px-3 py-2.5 pl-9 text-sm text-white focus:outline-none transition-colors"
              />
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded bg-amber-600 hover:bg-amber-500 text-zinc-950 font-mono-archive text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-6 shadow-md shadow-amber-950/40"
          >
            {loading ? (
              <span>INITIALIZING PROFILE...</span>
            ) : (
              <>
                <span>REGISTER & GENERATE DECK</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-[#232730] text-center font-mono-archive text-xs text-zinc-400">
          <span>Already registered? </span>
          <Link href="/login" className="text-red-400 hover:text-red-300 font-semibold underline">
            Log in to existing pass
          </Link>
        </div>
      </div>
    </div>
  );
}
