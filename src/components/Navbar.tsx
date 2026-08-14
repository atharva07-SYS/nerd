"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Compass, Sparkles, BookOpen, LogOut, LogIn, UserPlus, Menu, X, ShieldCheck } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#0c0d0e]/90 backdrop-blur-md border-b border-[#232730]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded bg-[#181a1f] border border-[#2d313c] flex items-center justify-center text-red-500 font-mono font-bold text-lg shadow-inner group-hover:border-red-600/50 transition-colors">
              ⚡
            </div>
            <div>
              <span className="font-serif-archive font-bold text-lg sm:text-xl tracking-wider text-white group-hover:text-red-400 transition-colors">
                THE DRAW
              </span>
              <span className="block font-mono-archive text-[10px] text-zinc-400 tracking-widest uppercase">
                Research Archive
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 font-mono-archive text-xs">
            <Link
              href="/explore"
              className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                isActive("/explore")
                  ? "bg-[#1f2229] text-white font-medium border border-[#333844]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#15171c]"
              }`}
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>EXPLORE FEED</span>
            </Link>

            {status === "authenticated" && (
              <>
                <Link
                  href="/draw"
                  className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                    isActive("/draw")
                      ? "bg-[#1f2229] text-white font-medium border border-[#333844]"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-[#15171c]"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>DRAW TOPIC</span>
                </Link>

                <Link
                  href="/notes"
                  className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                    isActive("/notes")
                      ? "bg-[#1f2229] text-white font-medium border border-[#333844]"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-[#15171c]"
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-red-400" />
                  <span>MY NOTES</span>
                </Link>

                {session.user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                      isActive("/admin")
                        ? "bg-amber-950/60 text-amber-300 font-bold border border-amber-800/80"
                        : "text-amber-400 hover:text-amber-300 hover:bg-amber-950/30"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>ADMIN CONTROL</span>
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Desktop Auth Controls */}
          <div className="hidden md:flex items-center gap-3">
            {status === "authenticated" ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#15171a] border border-[#262a33] font-mono-archive text-xs text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="truncate max-w-[140px] font-semibold">{session.user?.name}</span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-archive text-zinc-400 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 rounded transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>EXIT</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 font-mono-archive text-xs text-zinc-300 hover:text-white hover:bg-[#181a1f] border border-[#2b2f3a] rounded transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 text-zinc-400" />
                  <span>LOG IN</span>
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 font-mono-archive text-xs text-zinc-900 font-semibold bg-zinc-200 hover:bg-white rounded transition-colors shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5 text-zinc-900" />
                  <span>SIGN UP</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-zinc-400 hover:text-white rounded bg-[#181a1f] border border-[#282c35]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#121417] border-b border-[#262a33] px-4 pt-2 pb-4 space-y-2 font-mono-archive text-xs">
          <Link
            href="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded ${
              isActive("/explore") ? "bg-[#1e2128] text-white" : "text-zinc-300"
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>EXPLORE FEED</span>
          </Link>

          {status === "authenticated" ? (
            <>
              <Link
                href="/draw"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded ${
                  isActive("/draw") ? "bg-[#1e2128] text-white" : "text-zinc-300"
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>DRAW TOPIC</span>
              </Link>

              <Link
                href="/notes"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded ${
                  isActive("/notes") ? "bg-[#1e2128] text-white" : "text-zinc-300"
                }`}
              >
                <BookOpen className="w-4 h-4 text-red-400" />
                <span>MY NOTES</span>
              </Link>

              <div className="pt-2 border-t border-[#232730] flex items-center justify-between">
                <span className="text-zinc-400 font-semibold">{session.user?.name}</span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-1 text-red-400 hover:text-red-300"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>LOG OUT</span>
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 border-t border-[#232730] flex gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 border border-[#2b2f3a] rounded text-zinc-200"
              >
                LOG IN
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 bg-zinc-200 text-zinc-900 font-bold rounded"
              >
                SIGN UP
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
