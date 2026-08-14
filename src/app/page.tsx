import Link from "next/link";
import { Compass, Sparkles, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";

export const revalidate = 60; // Refresh category counts every minute

export default async function LandingPage() {
  let totalTopics = 43;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let categories: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let samplePublicNotes: any[] = [];

  try {
    totalTopics = await db.topic.count();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categories = (await db.topic.groupBy({
      by: ["category"],
      _count: { id: true },
    })) as unknown as any[];

    samplePublicNotes = (await db.note.findMany({
      where: { visibility: "public" },
      take: 3,
      orderBy: { createdAt: "desc" },
      include: {
        topic: true,
        user: { select: { name: true } },
      },
    })) as unknown as any[];
  } catch (err) {
    console.warn("Landing Page DB fetch warning (DB uninitialized during prerender):", err);
  }

  return (
    <div className="min-h-screen bg-[#0d0e11] text-[#e6e4df]">
      {/* Scholarly Minimal Hero Section */}
      <section className="relative border-b border-[#1e2026] py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#14151a] to-[#0d0e11] overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#282a33] bg-[#16171d] text-[#a0a29f] font-mono-archive text-[11px] tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#e6e4df]" />
            <span>ARCHIVAL RESEARCH PROTOCOL</span>
          </div>

          <h1 className="font-serif-archive text-4xl sm:text-6xl font-bold tracking-tight text-[#e6e4df] leading-tight">
            Draw a Topic. <br />
            <span className="text-[#a0a29f]">Research Deeply.</span> Archive Notes.
          </h1>

          {/* Clean Single/Double Line Balanced Subtitle Alignment */}
          <div className="max-w-2xl mx-auto text-center px-4">
            <p className="text-[#a0a29f] font-sans text-sm sm:text-base leading-relaxed tracking-normal font-normal">
              A randomized research archive system with a master index of 43 topics. Scholars draw independently, lock completed research, and upload handwritten notes.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 font-sans text-sm">
            <Link
              href="/draw"
              className="w-full sm:w-auto px-7 py-3.5 rounded-md bg-[#e6e4df] hover:bg-[#d6d4cf] text-[#0d0e11] font-semibold tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-[#0d0e11]" />
              <span>ENTER THE DRAW</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/explore"
              className="w-full sm:w-auto px-7 py-3.5 rounded-md bg-[#16171d] hover:bg-[#1f2128] text-[#e6e4df] border border-[#282a33] flex items-center justify-center gap-2.5 transition-colors font-medium"
            >
              <Compass className="w-4 h-4 text-[#8a8c91]" />
              <span>EXPLORE PUBLIC NOTES</span>
            </Link>
          </div>

          {/* Quick Stats Banner */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto font-mono-archive text-xs">
            <div className="bg-[#14151a] border border-[#22242b] p-4 rounded-md text-center">
              <span className="block text-2xl font-bold text-[#e6e4df] font-sans">{totalTopics}</span>
              <span className="text-[#8a8c91] uppercase tracking-wider text-[10px]">Master Topics</span>
            </div>
            <div className="bg-[#14151a] border border-[#22242b] p-4 rounded-md text-center">
              <span className="block text-2xl font-bold text-[#c4c2bd] font-sans">{categories.length || 8}</span>
              <span className="text-[#8a8c91] uppercase tracking-wider text-[10px]">Knowledge Fields</span>
            </div>
            <div className="bg-[#14151a] border border-[#22242b] p-4 rounded-md text-center col-span-2 sm:col-span-1">
              <span className="block text-2xl font-bold text-[#c4c2bd] font-sans">100%</span>
              <span className="text-[#8a8c91] uppercase tracking-wider text-[10px]">Per-User Random</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Rules & Concept Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12 space-y-1">
          <h2 className="font-serif-archive text-2xl sm:text-3xl font-bold text-[#e6e4df] tracking-tight">
            HOW THE DRAW WORKS
          </h2>
          <p className="font-mono-archive text-xs text-[#8a8c91] uppercase tracking-widest">
            Rules of the Archival Engine
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="archive-card p-6 space-y-3">
            <div className="w-9 h-9 rounded-md bg-[#18191e] border border-[#282a33] flex items-center justify-center text-[#e6e4df] font-mono text-xs font-semibold">
              01
            </div>
            <h3 className="font-serif-archive text-base font-semibold text-[#e6e4df]">
              Truly Independent Per-User Deck
            </h3>
            <p className="text-xs text-[#9a9c9f] leading-relaxed font-sans">
              Every registered user draws from their own independent deck of 43 topics. One user marking a topic complete never affects another scholar&apos;s deck.
            </p>
          </div>

          <div className="archive-card p-6 space-y-3">
            <div className="w-9 h-9 rounded-md bg-[#18191e] border border-[#282a33] flex items-center justify-center text-[#e6e4df] font-mono text-xs font-semibold">
              02
            </div>
            <h3 className="font-serif-archive text-base font-semibold text-[#e6e4df]">
              Locked On Completion
            </h3>
            <p className="text-xs text-[#9a9c9f] leading-relaxed font-sans">
              Once you hit <span className="text-[#e6e4df] font-mono text-xs font-medium">MARK RESEARCHED</span>, that topic is locked permanently into your completed archive.
            </p>
          </div>

          <div className="archive-card p-6 space-y-3">
            <div className="w-9 h-9 rounded-md bg-[#18191e] border border-[#282a33] flex items-center justify-center text-[#e6e4df] font-mono text-xs font-semibold">
              03
            </div>
            <h3 className="font-serif-archive text-base font-semibold text-[#e6e4df]">
              Handwritten Notes & Privacy
            </h3>
            <p className="text-xs text-[#9a9c9f] leading-relaxed font-sans">
              Upload photos/scans of your multi-page handwritten notes. Keep them <strong>Private</strong> for personal archival or publish them to the <strong>Public Feed</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#1e2026]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="font-serif-archive text-xl font-bold text-[#e6e4df]">
              THE MASTER TOPICS INDEX
            </h2>
            <p className="font-mono-archive text-xs text-[#8a8c91] uppercase tracking-widest mt-0.5">
              43 Deep Topics Across 8 Categories
            </p>
          </div>
          <Link
            href="/draw"
            className="font-mono-archive text-xs text-[#9a9c9f] hover:text-[#e6e4df] flex items-center gap-1.5 transition-colors"
          >
            <span>VIEW CATALOG IN DRAW DECK</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono-archive text-xs">
          {categories.map((cat) => (
            <div
              key={cat.category}
              className="bg-[#14151a] border border-[#22242b] p-3.5 rounded-md hover:border-[#282a33] transition-colors flex items-center justify-between"
            >
              <span className="text-[#c4c2bd] font-medium truncate pr-2">{cat.category}</span>
              <span className="px-2 py-0.5 rounded bg-[#18191e] border border-[#282a33] text-[#8a8c91] text-[10px] font-medium">
                {cat._count.id} topics
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Public Notes Teaser */}
      {samplePublicNotes.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#1e2026]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-serif-archive text-xl font-bold text-[#e6e4df]">
                RECENT SCHOLARLY ARCHIVES
              </h2>
              <p className="font-mono-archive text-xs text-[#8a8c91] uppercase tracking-widest mt-0.5">
                Handwritten Notes Shared Publicly
              </p>
            </div>
            <Link
              href="/explore"
              className="font-mono-archive text-xs text-[#9a9c9f] hover:text-[#e6e4df] flex items-center gap-1 transition-colors"
            >
              <span>EXPLORE PUBLIC FEED</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {samplePublicNotes.map((note) => {
              let parsedUrls: string[] = [];
              try {
                parsedUrls = JSON.parse(note.imageUrls);
              } catch {
                parsedUrls = [note.imageUrls];
              }

              return (
                <Link
                  key={note.id}
                  href={`/explore/${note.id}`}
                  className="archive-card block group overflow-hidden"
                >
                  <div className="h-44 bg-[#0d0e11] relative overflow-hidden border-b border-[#22242b]">
                    {parsedUrls[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={parsedUrls[0]}
                        alt={note.topic.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#6e7075] font-mono-archive text-xs">
                        [NO IMAGE PREVIEW]
                      </div>
                    )}
                    <span className="absolute top-2 right-2 ink-stamp ink-stamp-public">
                      PUBLIC
                    </span>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-[#0d0e11]/80 backdrop-blur text-[10px] font-mono-archive text-[#c4c2bd] border border-[#282a33]">
                      {parsedUrls.length} PAGE{parsedUrls.length > 1 ? "S" : ""}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <span className="font-mono-archive text-[10px] text-[#8a8c91] uppercase tracking-widest block truncate">
                      {note.topic.category}
                    </span>
                    <h3 className="font-serif-archive font-medium text-[#e6e4df] group-hover:text-white transition-colors line-clamp-2 text-sm">
                      {note.topic.title}
                    </h3>
                    <p className="font-mono-archive text-[11px] text-[#8a8c91] pt-2 flex items-center justify-between border-t border-[#22242b]">
                      <span>BY: {note.user.name}</span>
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
