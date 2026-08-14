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
    <div className="min-h-screen bg-[#090a0b] text-[#f4f4f5]">
      {/* Hero Section */}
      <section className="relative border-b border-[#27272a] py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#14161a] to-[#090a0b] overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-[#3f3f46] bg-[#14161a] text-zinc-300 font-mono-archive text-xs tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-zinc-100" />
            <span>ARCHIVAL RESEARCH PROTOCOL</span>
          </div>

          <h1 className="font-serif-archive text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Draw a Topic. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-300 to-zinc-500">
              Research Deeply.
            </span>{" "}
            Archive Notes.
          </h1>

          {/* Clean Single/Double Line Balanced Subtitle Alignment (Photo 2 Fix) */}
          <div className="max-w-3xl mx-auto text-center px-4">
            <p className="text-zinc-300 font-sans text-sm sm:text-base leading-relaxed tracking-wide font-normal">
              A randomized research archive system with a master index of 43 topics. Scholars draw independently, lock completed research, and upload handwritten notes.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 font-mono-archive text-sm">
            <Link
              href="/draw"
              className="w-full sm:w-auto px-8 py-4 rounded bg-white hover:bg-zinc-200 text-black font-bold tracking-wider flex items-center justify-center gap-3 transition-all shadow-lg border border-white"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>ENTER THE DRAW</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/explore"
              className="w-full sm:w-auto px-8 py-4 rounded bg-[#14161a] hover:bg-[#1f2229] text-zinc-200 hover:text-white border border-[#27272a] flex items-center justify-center gap-3 transition-colors"
            >
              <Compass className="w-4 h-4 text-zinc-400" />
              <span>EXPLORE PUBLIC NOTES</span>
            </Link>
          </div>

          {/* Quick Stats Banner */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto font-mono-archive text-xs">
            <div className="bg-[#121417] border border-[#27272a] p-4 rounded text-center">
              <span className="block text-2xl font-bold font-serif-archive text-white">{totalTopics}</span>
              <span className="text-zinc-400 uppercase tracking-wider">Master Topics</span>
            </div>
            <div className="bg-[#121417] border border-[#27272a] p-4 rounded text-center">
              <span className="block text-2xl font-bold font-serif-archive text-zinc-200">{categories.length || 8}</span>
              <span className="text-zinc-400 uppercase tracking-wider">Knowledge Fields</span>
            </div>
            <div className="bg-[#121417] border border-[#27272a] p-4 rounded text-center col-span-2 sm:col-span-1">
              <span className="block text-2xl font-bold font-serif-archive text-zinc-200">100%</span>
              <span className="text-zinc-400 uppercase tracking-wider">Per-User Random</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Rules & Concept Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-2">
          <h2 className="font-serif-archive text-2xl sm:text-3xl font-bold text-white">
            HOW THE DRAW WORKS
          </h2>
          <p className="font-mono-archive text-xs text-zinc-400 uppercase tracking-widest">
            Rules of the Archival Engine
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="archive-card p-6 space-y-4">
            <div className="w-10 h-10 rounded bg-[#181a1f] border border-[#3f3f46] flex items-center justify-center text-white font-mono font-bold">
              01
            </div>
            <h3 className="font-serif-archive text-lg font-bold text-white">
              Truly Independent Per-User Deck
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Every registered user draws from their own independent deck of 43 topics. One user marking a topic complete never affects another scholar&apos;s deck.
            </p>
          </div>

          <div className="archive-card p-6 space-y-4">
            <div className="w-10 h-10 rounded bg-[#181a1f] border border-[#3f3f46] flex items-center justify-center text-white font-mono font-bold">
              02
            </div>
            <h3 className="font-serif-archive text-lg font-bold text-white">
              Locked On Completion
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Once you hit <span className="text-white font-mono text-xs font-semibold">MARK RESEARCHED</span>, that topic is locked permanently into your completed archive and removed from your draw deck.
            </p>
          </div>

          <div className="archive-card p-6 space-y-4">
            <div className="w-10 h-10 rounded bg-[#181a1f] border border-[#3f3f46] flex items-center justify-center text-white font-mono font-bold">
              03
            </div>
            <h3 className="font-serif-archive text-lg font-bold text-white">
              Handwritten Notes & Privacy
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Upload photos/scans of your multi-page handwritten notes. Keep them <strong>Private</strong> for personal archival or publish them to the <strong>Public Feed</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#27272a]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="font-serif-archive text-2xl font-bold text-white">
              THE MASTER TOPICS INDEX
            </h2>
            <p className="font-mono-archive text-xs text-zinc-400 uppercase tracking-widest mt-1">
              43 Deep Topics Across 8 Categories
            </p>
          </div>
          <Link
            href="/draw"
            className="font-mono-archive text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 underline"
          >
            <span>VIEW FULL CATALOG IN DRAW DECK</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono-archive text-xs">
          {categories.map((cat) => (
            <div
              key={cat.category}
              className="bg-[#121417] border border-[#27272a] p-4 rounded hover:border-[#3f3f46] transition-colors flex items-center justify-between"
            >
              <span className="text-zinc-200 font-medium truncate pr-2">{cat.category}</span>
              <span className="px-2 py-0.5 rounded bg-[#181a1f] border border-[#3f3f46] text-zinc-400 font-semibold">
                {cat._count.id} topics
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Public Notes Teaser */}
      {samplePublicNotes.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#27272a]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-serif-archive text-2xl font-bold text-white">
                RECENT SCHOLARLY ARCHIVES
              </h2>
              <p className="font-mono-archive text-xs text-zinc-400 uppercase tracking-widest mt-1">
                Handwritten Notes Shared Publicly
              </p>
            </div>
            <Link
              href="/explore"
              className="font-mono-archive text-xs text-zinc-300 hover:text-white flex items-center gap-1 underline"
            >
              <span>EXPLORE ALL PUBLIC NOTES</span>
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
                  <div className="h-44 bg-[#0a0a0c] relative overflow-hidden border-b border-[#27272a]">
                    {parsedUrls[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={parsedUrls[0]}
                        alt={note.topic.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 font-mono-archive text-xs">
                        [NO IMAGE PREVIEW]
                      </div>
                    )}
                    <span className="absolute top-2 right-2 ink-stamp ink-stamp-public">
                      PUBLIC
                    </span>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] font-mono-archive text-zinc-300 border border-zinc-700">
                      {parsedUrls.length} PAGE{parsedUrls.length > 1 ? "S" : ""}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <span className="font-mono-archive text-[10px] text-zinc-400 uppercase tracking-widest block truncate">
                      {note.topic.category}
                    </span>
                    <h3 className="font-serif-archive font-bold text-white group-hover:text-zinc-300 transition-colors line-clamp-2">
                      {note.topic.title}
                    </h3>
                    <p className="font-mono-archive text-xs text-zinc-400 pt-2 flex items-center justify-between border-t border-[#27272a]">
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
