import type { Metadata } from "next";
import { Inter, Cinzel, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "The Draw — Personal Research Archive",
  description:
    "A randomized research-topic draw system where scholars pull topics, conduct deep research, and publish handwritten notes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${cinzel.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#0c0d0e] text-[#e6e8eb] antialiased min-h-screen flex flex-col selection:bg-red-900/60 selection:text-white">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-[#1a1d24] py-8 text-center font-mono-archive text-xs text-zinc-400">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold">THE DRAW</span>
                <span>— ARCHIVAL INDEX SYSTEM</span>
              </div>
              <p className="text-zinc-400">
                Independent Per-User Randomization & Shared Master Catalog
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
