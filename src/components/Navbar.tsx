"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Compass, Sparkles, BookOpen, ShieldCheck, LogOut, User } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navLinks = [
    { href: "/draw", label: "MY DRAW DECK", icon: Sparkles },
    { href: "/notes", label: "MY ARCHIVE", icon: BookOpen },
    { href: "/explore", label: "PUBLIC FEED", icon: Compass },
  ];

  return (
    <header className="border-b border-[#27272a] bg-[#090a0b]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded bg-[#181a1f] border border-[#3f3f46] flex items-center justify-center text-white font-mono font-bold text-sm shadow group-hover:border-zinc-300 transition-colors">
            D
          </div>
          <div>
            <span className="font-serif-archive font-bold text-lg tracking-wider text-white group-hover:text-zinc-300 transition-colors block leading-none">
              THE DRAW
            </span>
            <span className="font-mono-archive text-[9px] text-zinc-400 uppercase tracking-widest block mt-0.5">
              RESEARCH ARCHIVE
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 font-mono-archive text-xs">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-white text-black font-bold shadow"
                    : "text-zinc-400 hover:text-white hover:bg-[#14161a]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {session?.user?.role === "admin" && (
            <Link
              href="/admin"
              className={`px-3.5 py-1.5 rounded transition-all flex items-center gap-1.5 border ${
                pathname === "/admin"
                  ? "bg-white text-black font-bold border-white shadow"
                  : "bg-[#181a1f] text-zinc-200 border-[#3f3f46] hover:bg-[#27272a]"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-200" />
              <span>ADMIN CONTROL</span>
            </Link>
          )}
        </nav>

        {/* Auth Buttons / Profile */}
        <div className="flex items-center gap-3 font-mono-archive text-xs">
          {session?.user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#14161a] border border-[#27272a]">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-200 text-[11px] font-medium">{session.user.name}</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-3 py-1.5 rounded bg-[#181a1f] hover:bg-[#27272a] text-zinc-300 hover:text-white border border-[#27272a] flex items-center gap-1.5 transition-colors"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden sm:inline">LOG OUT</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded text-zinc-300 hover:text-white hover:bg-[#14161a] transition-colors"
              >
                LOG IN
              </Link>
              <Link
                href="/signup"
                className="px-3.5 py-1.5 rounded bg-white hover:bg-zinc-200 text-black font-bold transition-all shadow"
              >
                SIGN UP
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
