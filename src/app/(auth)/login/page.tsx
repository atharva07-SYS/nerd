"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, AlertCircle, KeyRound } from "lucide-react";

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
        setError("Invalid email address or password. Please verify your credentials or register a new account.");
      } else {
        router.push("/draw");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#090a0b]">
      <div className="w-full max-w-md archive-card p-8 space-y-6 border border-[#27272a]">
        <div className="text-center space-y-2 pb-4 border-b border-[#27272a]">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#14161a] border border-[#3f3f46] flex items-center justify-center text-white font-mono font-bold text-xl shadow-inner">
            <KeyRound className="w-5 h-5 text-zinc-200" />
          </div>
          <h1 className="font-serif-archive text-2xl font-bold text-white tracking-wide">
            SCHOLAR ACCESS PASS
          </h1>
          <p className="font-mono-archive text-xs text-zinc-400 uppercase tracking-widest">
            Enter your credentials to access your deck
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded bg-[#16181d] border border-zinc-700 text-zinc-200 text-xs font-mono-archive flex items-start gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
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
                className="w-full bg-[#121417] border border-[#27272a] focus:border-zinc-400 rounded px-3 py-2.5 pl-9 text-sm text-white focus:outline-none transition-colors"
              />
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-mono-archive text-xs text-zinc-400 uppercase tracking-wider">
                PASSWORD
              </label>
              <Link href="/forgot-password" className="font-mono-archive text-[11px] text-zinc-400 hover:text-white underline">
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
                className="w-full bg-[#121417] border border-[#27272a] focus:border-zinc-400 rounded px-3 py-2.5 pl-9 text-sm text-white focus:outline-none transition-colors"
              />
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded bg-white hover:bg-zinc-200 text-black font-mono-archive text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-6 shadow-md"
          >
            {loading ? (
              <span>AUTHENTICATING...</span>
            ) : (
              <>
                <span>AUTHENTICATE & ENTER</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-[#27272a] text-center font-mono-archive text-xs text-zinc-400">
          <span>New researcher? </span>
          <Link href="/signup" className="text-white hover:underline font-bold">
            Register new account
          </Link>
        </div>
      </div>
    </div>
  );
}
