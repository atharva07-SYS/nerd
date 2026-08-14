"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid email address or password.");
        setLoading(false);
      } else {
        router.push("/draw");
        router.refresh();
      }
    } catch {
      setError("An unexpected authentication error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#0c0d0e]">
      <div className="w-full max-w-md archive-card p-8 space-y-6 border border-[#2b2f3b]">
        {/* Pass Header */}
        <div className="text-center space-y-2 pb-4 border-b border-[#232730]">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#181a1f] border border-red-900/60 flex items-center justify-center text-red-500 font-mono font-bold text-xl shadow-inner">
            ⚡
          </div>
          <h1 className="font-serif-archive text-2xl font-bold text-white tracking-wide">
            SCHOLAR ACCESS PASS
          </h1>
          <p className="font-mono-archive text-xs text-zinc-400 uppercase tracking-widest">
            Log in to your research archive
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
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="scholar@thedraw.archive"
                className="w-full bg-[#121417] border border-[#2a2e3a] focus:border-red-500 rounded px-3 py-2.5 pl-9 text-sm text-white focus:outline-none transition-colors"
              />
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-mono-archive text-xs text-zinc-400 uppercase tracking-wider">
                PASSWORD
              </label>
              <Link href="/forgot-password" className="font-mono-archive text-[11px] text-amber-400 hover:text-amber-300">
                FORGOT PASSWORD?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#121417] border border-[#2a2e3a] focus:border-red-500 rounded px-3 py-2.5 pl-9 text-sm text-white focus:outline-none transition-colors"
              />
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded bg-red-600 hover:bg-red-500 text-white font-mono-archive text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-6 shadow-md shadow-red-950/40"
          >
            {loading ? (
              <span>VERIFYING CREDENTIALS...</span>
            ) : (
              <>
                <span>AUTHENTICATE & ENTER</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-[#232730] text-center font-mono-archive text-xs text-zinc-400">
          <span>New researcher? </span>
          <Link href="/signup" className="text-amber-400 hover:text-amber-300 font-semibold underline">
            Register new account
          </Link>
        </div>
      </div>
    </div>
  );
}
