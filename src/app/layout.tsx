import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
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
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#0d0e11] text-[#e6e4df] antialiased min-h-screen flex flex-col selection:bg-[#25272e] selection:text-[#e6e4df] font-sans">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-[#1e2026] py-8 text-center font-mono-archive text-xs text-[#8a8c91]">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[#e6e4df] font-semibold tracking-wider">THE DRAW</span>
                <span className="text-[#6e7075]">— ARCHIVAL INDEX SYSTEM</span>
              </div>
              <p className="text-[#8a8c91]">
                Independent Per-User Randomization & Shared Master Catalog
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
