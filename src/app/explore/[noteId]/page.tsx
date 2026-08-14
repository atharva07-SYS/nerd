"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  User,
  Calendar,
  Lock,
  Globe,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  AlertTriangle,
  BookOpen,
  Sparkles,
} from "lucide-react";

interface NoteDetail {
  id: string;
  topic: {
    id: string;
    category: string;
    title: string;
  };
  authorName: string;
  isOwner: boolean;
  visibility: "private" | "public";
  imageUrls: string[];
  caption?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function NoteDetailPage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const resolvedParams = use(params);
  const noteId = resolvedParams.noteId;

  const [note, setNote] = useState<NoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [fullscreenModalOpen, setFullscreenModalOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/explore/${noteId}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setNote(data.note);
        } else {
          setError(data.error || "Failed to load note details.");
        }
      })
      .catch(() => {
        setError("Network error loading note details.");
      })
      .finally(() => setLoading(false));
  }, [noteId]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-mono-archive text-xs text-zinc-400">RETRIEVING RESEARCH NOTE ARCHIVE...</p>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="archive-card p-8 max-w-md w-full text-center space-y-4 border border-red-900/60 bg-[#161214]">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-400">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-serif-archive text-xl font-bold text-white">
            ACCESS RESTRICTED
          </h2>
          <p className="font-mono-archive text-xs text-zinc-400">
            {error || "This note is marked as private by the researcher and cannot be accessed."}
          </p>
          <div className="pt-2">
            <Link
              href="/explore"
              className="px-6 py-2.5 rounded bg-[#1e222b] hover:bg-[#282d39] text-zinc-300 font-mono-archive text-xs uppercase font-bold inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>RETURN TO PUBLIC FEED</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasMultiplePages = note.imageUrls.length > 1;

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-[#e6e8eb] py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Back Link */}
      <Link
        href="/explore"
        className="inline-flex items-center gap-2 font-mono-archive text-xs text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>BACK TO EXPLORE FEED</span>
      </Link>

      {/* Header Info */}
      <div className="archive-card p-6 sm:p-8 space-y-4 border border-[#262a35] bg-gradient-to-b from-[#14161b] to-[#101115]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono-archive text-xs text-amber-400 font-semibold uppercase tracking-widest">
            FIELD: {note.topic.category}
          </span>
          <span
            className={`ink-stamp ${
              note.visibility === "public" ? "ink-stamp-public" : "ink-stamp-private"
            }`}
          >
            {note.visibility === "public" ? "PUBLIC ARCHIVE" : "PRIVATE ARCHIVE"}
          </span>
        </div>

        <h1 className="font-serif-archive text-3xl sm:text-4xl font-extrabold text-white leading-tight">
          {note.topic.title}
        </h1>

        <div className="pt-4 border-t border-[#22252f] flex flex-wrap items-center justify-between gap-4 font-mono-archive text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            <span>RESEARCHED BY: </span>
            <span className="text-white font-bold">{note.authorName}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <span>ARCHIVED: {new Date(note.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Note Caption / Summary */}
      {note.caption && (
        <div className="archive-card p-6 border-l-4 border-l-amber-500 bg-[#14161a] space-y-1">
          <span className="font-mono-archive text-[10px] text-zinc-400 uppercase tracking-widest block">
            SCHOLAR ABSTRACT / CAPTION
          </span>
          <p className="font-mono-archive text-sm text-zinc-200 leading-relaxed italic">
            &ldquo;{note.caption}&rdquo;
          </p>
        </div>
      )}

      {/* Handwritten Pages Gallery Viewer */}
      <div className="space-y-4">
        <div className="flex items-center justify-between font-mono-archive text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-red-400" />
            <span>HANDWRITTEN NOTE PAGES ({note.imageUrls.length} TOTAL)</span>
          </div>

          <button
            onClick={() => setFullscreenModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#181a20] hover:bg-[#222630] border border-[#2d323f] text-zinc-300 hover:text-white"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>FULLSCREEN / LIGHTBOX ZOOM</span>
          </button>
        </div>

        {/* Main Active Page Display */}
        <div className="archive-card relative p-2 sm:p-4 bg-black border border-[#232730] rounded-lg overflow-hidden flex flex-col items-center justify-center min-h-[500px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={note.imageUrls[activePageIndex]}
            alt={`Handwritten note page ${activePageIndex + 1}`}
            className="max-h-[75vh] w-auto object-contain rounded shadow-2xl cursor-pointer"
            onClick={() => setFullscreenModalOpen(true)}
          />

          {/* Navigation Controls on Image */}
          {hasMultiplePages && (
            <>
              <button
                onClick={() => setActivePageIndex((prev) => Math.max(0, prev - 1))}
                disabled={activePageIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black text-white disabled:opacity-30 border border-zinc-700 backdrop-blur"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={() =>
                  setActivePageIndex((prev) => Math.min(note.imageUrls.length - 1, prev + 1))
                }
                disabled={activePageIndex === note.imageUrls.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black text-white disabled:opacity-30 border border-zinc-700 backdrop-blur"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              <div className="absolute bottom-4 bg-black/80 px-3 py-1 rounded border border-zinc-700 text-xs font-mono-archive text-zinc-300">
                PAGE {activePageIndex + 1} OF {note.imageUrls.length}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail Selector Strip */}
        {hasMultiplePages && (
          <div className="flex items-center justify-center gap-3 overflow-x-auto py-2">
            {note.imageUrls.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setActivePageIndex(idx)}
                className={`relative w-20 h-20 rounded overflow-hidden border-2 transition-all ${
                  activePageIndex === idx
                    ? "border-emerald-400 scale-105 shadow-lg shadow-emerald-950/50"
                    : "border-[#2b303d] opacity-50 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[10px] font-mono-archive text-center text-zinc-300 py-0.5">
                  PG {idx + 1}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Zoom Modal */}
      {fullscreenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 text-white font-mono-archive text-xs">
            <div className="flex items-center gap-3">
              <span className="text-amber-400 font-bold">{note.topic.title}</span>
              <span className="text-zinc-500">|</span>
              <span>
                PAGE {activePageIndex + 1} OF {note.imageUrls.length}
              </span>
            </div>
            <button
              onClick={() => setFullscreenModalOpen(false)}
              className="p-2 rounded bg-zinc-800 text-zinc-300 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative my-4 overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={note.imageUrls[activePageIndex]}
              alt={`Full view page ${activePageIndex + 1}`}
              className="max-h-[85vh] max-w-full object-contain rounded border border-zinc-800"
            />
          </div>

          {hasMultiplePages && (
            <div className="flex items-center justify-center gap-4 border-t border-zinc-800 pt-3">
              <button
                onClick={() => setActivePageIndex((prev) => Math.max(0, prev - 1))}
                disabled={activePageIndex === 0}
                className="px-4 py-2 rounded bg-zinc-800 text-white font-mono-archive text-xs disabled:opacity-30"
              >
                PREVIOUS PAGE
              </button>
              <span className="font-mono-archive text-xs text-zinc-400">
                {activePageIndex + 1} / {note.imageUrls.length}
              </span>
              <button
                onClick={() =>
                  setActivePageIndex((prev) => Math.min(note.imageUrls.length - 1, prev + 1))
                }
                disabled={activePageIndex === note.imageUrls.length - 1}
                className="px-4 py-2 rounded bg-zinc-800 text-white font-mono-archive text-xs disabled:opacity-30"
              >
                NEXT PAGE
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
