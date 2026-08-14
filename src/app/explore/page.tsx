"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Compass, Search, User, Calendar, BookOpen, Layers, ArrowRight } from "lucide-react";

interface PublicNote {
  id: string;
  topic: {
    id: string;
    category: string;
    title: string;
  };
  authorName: string;
  imageUrls: string[];
  caption?: string | null;
  createdAt: string;
}

export default function ExplorePage() {
  const [notes, setNotes] = useState<PublicNote[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const fetchPublicNotes = useCallback(async () => {
    try {
      const url = new URL("/api/explore", window.location.origin);
      if (search) url.searchParams.set("search", search);
      if (selectedCategory !== "ALL") url.searchParams.set("category", selectedCategory);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      }
    } catch (err) {
      console.error("Error fetching explore feed:", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    fetchPublicNotes();
  }, [fetchPublicNotes]);

  // Fetch unique categories once
  useEffect(() => {
    fetch("/api/topics")
      .then((r) => r.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch((e) => console.error(e));
  }, []);

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-[#e6e8eb] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#232730] pb-6 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 font-mono-archive text-[11px] uppercase tracking-wider mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>PUBLIC SCHOLAR FEED</span>
          </div>
          <h1 className="font-serif-archive text-3xl sm:text-4xl font-extrabold text-white">
            EXPLORE PUBLIC RESEARCH NOTES
          </h1>
          <p className="font-mono-archive text-xs text-zinc-400 uppercase tracking-widest mt-1">
            Handwritten Note Archives Published by Scholars — Free Public Access
          </p>
        </div>

        <Link
          href="/draw"
          className="px-5 py-2.5 rounded bg-red-600 hover:bg-red-500 text-white font-mono-archive text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <BookOpen className="w-4 h-4 text-amber-300" />
          <span>START YOUR OWN DRAW</span>
        </Link>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by topic title, caption summary, or author name..."
              className="w-full bg-[#14161a] border border-[#282c37] focus:border-emerald-500 rounded px-4 py-2.5 pl-10 text-xs text-white font-mono-archive focus:outline-none"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 font-mono-archive text-xs">
          <span className="text-zinc-400 uppercase mr-1">CATEGORY:</span>
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1 rounded transition-colors ${
              selectedCategory === "ALL"
                ? "bg-emerald-500 text-zinc-950 font-bold"
                : "bg-[#14161a] text-zinc-400 hover:text-white border border-[#252832]"
            }`}
          >
            ALL CATEGORIES
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded transition-colors ${
                selectedCategory === cat
                  ? "bg-emerald-500 text-zinc-950 font-bold"
                  : "bg-[#14161a] text-zinc-400 hover:text-white border border-[#252832]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Grid */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-mono-archive text-xs text-zinc-400">FETCHING PUBLIC NOTES...</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="archive-card p-12 text-center space-y-4 max-w-lg mx-auto my-12 border border-dashed border-[#2d323e]">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#14161a] border border-[#282c37] flex items-center justify-center text-zinc-500">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="font-serif-archive text-xl font-bold text-white">
            NO PUBLIC RESEARCH NOTES YET
          </h3>
          <p className="font-mono-archive text-xs text-zinc-400">
            Be the first scholar to draw a topic, upload your handwritten research notes, and flip the visibility toggle to Public!
          </p>
          <Link
            href="/draw"
            className="inline-flex items-center gap-2 px-6 py-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono-archive font-bold text-xs uppercase tracking-wider transition-colors"
          >
            <span>DRAW & PUBLISH FIRST NOTE</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <Link
              key={note.id}
              href={`/explore/${note.id}`}
              className="archive-card block group overflow-hidden"
            >
              {/* Note Cover Thumbnail */}
              <div className="h-52 bg-[#0a0b0d] relative overflow-hidden border-b border-[#22252f]">
                {note.imageUrls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={note.imageUrls[0]}
                    alt={note.topic.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 font-mono-archive text-xs">
                    [HANDWRITTEN NOTE PREVIEW]
                  </div>
                )}
                <span className="absolute top-2 right-2 ink-stamp ink-stamp-public">
                  PUBLIC
                </span>
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur text-[10px] font-mono-archive text-zinc-300 border border-zinc-700">
                  {note.imageUrls.length} PAGE{note.imageUrls.length > 1 ? "S" : ""}
                </span>
              </div>

              {/* Note Details */}
              <div className="p-5 space-y-3">
                <span className="font-mono-archive text-[10px] text-amber-400 uppercase tracking-widest block truncate">
                  {note.topic.category}
                </span>

                <h3 className="font-serif-archive font-bold text-white text-lg group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                  {note.topic.title}
                </h3>

                {note.caption && (
                  <p className="text-xs text-zinc-400 line-clamp-2 font-mono-archive italic">
                    &ldquo;{note.caption}&rdquo;
                  </p>
                )}

                <div className="pt-3 border-t border-[#22252f] flex items-center justify-between font-mono-archive text-[11px] text-zinc-400">
                  <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{note.authorName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-500" />
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
