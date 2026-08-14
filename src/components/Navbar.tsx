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
    <header className="border-b border-[#1e2026] bg-[#0d0e11]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-md bg-[#16171d] border border-[#282a33] flex items-center justify-center text-[#e6e4df] font-mono font-bold text-sm shadow group-hover:border-[#383a47] transition-colors">
            D
          </div>
          <div>
            <span className="font-serif-archive font-bold text-lg tracking-wider text-[#e6e4df] group-hover:text-white transition-colors block leading-none">
              THE DRAW
            </span>
            <span className="font-mono-archive text-[9px] text-[#8a8c91] uppercase tracking-widest block mt-0.5">
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
                className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#e6e4df] text-[#0d0e11] font-semibold shadow-sm"
                    : "text-[#9a9c9f] hover:text-[#e6e4df] hover:bg-[#16171d]"
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
              className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 border ${
                pathname === "/admin"
                  ? "bg-[#e6e4df] text-[#0d0e11] font-semibold border-[#e6e4df]"
                  : "bg-[#16171d] text-[#e6e4df] border-[#282a33] hover:bg-[#1f2128]"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#9a9c9f]" />
              <span>ADMIN CONTROL</span>
            </Link>
          )}
        </nav>

        {/* Auth Buttons / Profile */}
        <div className="flex items-center gap-3 font-mono-archive text-xs">
          {session?.user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#14151a] border border-[#22242b]">
                <User className="w-3.5 h-3.5 text-[#8a8c91]" />
                <span className="text-[#e6e4df] text-[11px] font-medium">{session.user.name}</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-3 py-1.5 rounded-md bg-[#16171d] hover:bg-[#1f2128] text-[#9a9c9f] hover:text-[#e6e4df] border border-[#22242b] flex items-center gap-1.5 transition-colors"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5 text-[#8a8c91]" />
                <span className="hidden sm:inline">LOG OUT</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-md text-[#9a9c9f] hover:text-[#e6e4df] hover:bg-[#14151a] transition-colors"
              >
                LOG IN
              </Link>
              <Link
                href="/signup"
                className="px-3.5 py-1.5 rounded-md bg-[#e6e4df] hover:bg-[#d6d4cf] text-[#0d0e11] font-semibold transition-all shadow-sm"
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
