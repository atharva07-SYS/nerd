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
    <div className="min-h-screen bg-[#09090b] text-[#fafafa]">
      {/* Minimal Peaceful Hero Section */}
      <section className="relative border-b border-[#18181b] py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#121215] to-[#09090b] overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#27272a] bg-[#141417] text-zinc-300 font-mono-archive text-[11px] tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
            <span>ARCHIVAL RESEARCH PROTOCOL</span>
          </div>

          <h1 className="font-serif-archive text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight">
            Draw a Topic. <br />
            <span className="text-zinc-400">Research Deeply.</span> Archive Notes.
          </h1>

          {/* Clean Single/Double Line Balanced Subtitle Alignment */}
          <div className="max-w-2xl mx-auto text-center px-4">
            <p className="text-zinc-400 font-sans text-sm sm:text-base leading-relaxed tracking-normal font-normal">
              A randomized research archive system with a master index of 43 topics. Scholars draw independently, lock completed research, and upload handwritten notes.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 font-sans text-sm">
            <Link
              href="/draw"
              className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-md"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>ENTER THE DRAW</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/explore"
              className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-[#141417] hover:bg-[#1c1c20] text-zinc-300 hover:text-white border border-[#27272a] flex items-center justify-center gap-2.5 transition-colors font-medium"
            >
              <Compass className="w-4 h-4 text-zinc-400" />
              <span>EXPLORE PUBLIC NOTES</span>
            </Link>
          </div>

          {/* Quick Stats Banner */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto font-mono-archive text-xs">
            <div className="bg-[#121215] border border-[#1f1f23] p-4 rounded-lg text-center">
              <span className="block text-2xl font-bold text-white font-sans">{totalTopics}</span>
              <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Master Topics</span>
            </div>
            <div className="bg-[#121215] border border-[#1f1f23] p-4 rounded-lg text-center">
              <span className="block text-2xl font-bold text-zinc-200 font-sans">{categories.length || 8}</span>
              <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Knowledge Fields</span>
            </div>
            <div className="bg-[#121215] border border-[#1f1f23] p-4 rounded-lg text-center col-span-2 sm:col-span-1">
              <span className="block text-2xl font-bold text-zinc-200 font-sans">100%</span>
              <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Per-User Random</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Rules & Concept Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12 space-y-1">
          <h2 className="font-serif-archive text-2xl sm:text-3xl font-bold text-white tracking-tight">
            HOW THE DRAW WORKS
          </h2>
          <p className="font-mono-archive text-xs text-zinc-500 uppercase tracking-widest">
            Rules of the Archival Engine
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="archive-card p-6 space-y-3">
            <div className="w-9 h-9 rounded-md bg-[#18181b] border border-[#27272a] flex items-center justify-center text-white font-mono text-xs font-semibold">
              01
            </div>
            <h3 className="font-serif-archive text-base font-semibold text-white">
              Truly Independent Per-User Deck
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Every registered user draws from their own independent deck of 43 topics. One user marking a topic complete never affects another scholar&apos;s deck.
            </p>
          </div>

          <div className="archive-card p-6 space-y-3">
            <div className="w-9 h-9 rounded-md bg-[#18181b] border border-[#27272a] flex items-center justify-center text-white font-mono text-xs font-semibold">
              02
            </div>
            <h3 className="font-serif-archive text-base font-semibold text-white">
              Locked On Completion
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Once you hit <span className="text-white font-mono text-xs font-medium">MARK RESEARCHED</span>, that topic is locked permanently into your completed archive.
            </p>
          </div>

          <div className="archive-card p-6 space-y-3">
            <div className="w-9 h-9 rounded-md bg-[#18181b] border border-[#27272a] flex items-center justify-center text-white font-mono text-xs font-semibold">
              03
            </div>
            <h3 className="font-serif-archive text-base font-semibold text-white">
              Handwritten Notes & Privacy
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Upload photos/scans of your multi-page handwritten notes. Keep them <strong>Private</strong> for personal archival or publish them to the <strong>Public Feed</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#18181b]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="font-serif-archive text-xl font-bold text-white">
              THE MASTER TOPICS INDEX
            </h2>
            <p className="font-mono-archive text-xs text-zinc-500 uppercase tracking-widest mt-0.5">
              43 Deep Topics Across 8 Categories
            </p>
          </div>
          <Link
            href="/draw"
            className="font-mono-archive text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <span>VIEW CATALOG IN DRAW DECK</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono-archive text-xs">
          {categories.map((cat) => (
            <div
              key={cat.category}
              className="bg-[#121215] border border-[#1f1f23] p-3.5 rounded-lg hover:border-[#27272a] transition-colors flex items-center justify-between"
            >
              <span className="text-zinc-300 font-medium truncate pr-2">{cat.category}</span>
              <span className="px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-zinc-400 text-[10px] font-medium">
                {cat._count.id} topics
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Public Notes Teaser */}
      {samplePublicNotes.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#18181b]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-serif-archive text-xl font-bold text-white">
                RECENT SCHOLARLY ARCHIVES
              </h2>
              <p className="font-mono-archive text-xs text-zinc-500 uppercase tracking-widest mt-0.5">
                Handwritten Notes Shared Publicly
              </p>
            </div>
            <Link
              href="/explore"
              className="font-mono-archive text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
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
                  <div className="h-44 bg-[#0d0d0f] relative overflow-hidden border-b border-[#1f1f23]">
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
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur text-[10px] font-mono-archive text-zinc-300 border border-zinc-800">
                      {parsedUrls.length} PAGE{parsedUrls.length > 1 ? "S" : ""}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <span className="font-mono-archive text-[10px] text-zinc-500 uppercase tracking-widest block truncate">
                      {note.topic.category}
                    </span>
                    <h3 className="font-serif-archive font-medium text-white group-hover:text-zinc-300 transition-colors line-clamp-2 text-sm">
                      {note.topic.title}
                    </h3>
                    <p className="font-mono-archive text-[11px] text-zinc-500 pt-2 flex items-center justify-between border-t border-[#1f1f23]">
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
