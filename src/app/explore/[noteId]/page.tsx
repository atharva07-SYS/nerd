"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  User,
  Calendar,
  Lock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  BookOpen,
  FileText,
  ExternalLink,
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

const isPdf = (url: string) => {
  if (!url) return false;
  return url.toLowerCase().endsWith(".pdf") || url.toLowerCase().includes(".pdf");
};

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
        <div className="w-8 h-8 border-2 border-[#e6e4df] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-mono-archive text-xs text-[#8a8c91]">RETRIEVING RESEARCH ARCHIVE...</p>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="archive-card p-8 max-w-md w-full text-center space-y-4 border border-[#282a33] bg-[#14151a]">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#18191e] border border-[#282a33] flex items-center justify-center text-[#8a8c91]">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-serif-archive text-xl font-bold text-[#e6e4df]">
            ACCESS RESTRICTED
          </h2>
          <p className="font-mono-archive text-xs text-[#8a8c91]">
            {error || "This note is marked as private by the researcher and cannot be accessed."}
          </p>
          <div className="pt-2">
            <Link
              href="/explore"
              className="px-6 py-2.5 rounded bg-[#18191e] hover:bg-[#22242b] text-[#e6e4df] font-mono-archive text-xs uppercase font-bold inline-flex items-center gap-2 border border-[#282a33]"
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
  const currentFile = note.imageUrls[activePageIndex];
  const isCurrentPdf = isPdf(currentFile);

  return (
    <div className="min-h-screen bg-[#0d0e11] text-[#e6e4df] py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Back Link */}
      <Link
        href="/explore"
        className="inline-flex items-center gap-2 font-mono-archive text-xs text-[#8a8c91] hover:text-[#e6e4df] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>BACK TO EXPLORE FEED</span>
      </Link>

      {/* Header Info */}
      <div className="archive-card p-6 sm:p-8 space-y-4 border border-[#22242b] bg-[#14151a]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono-archive text-xs text-[#8a8c91] font-semibold uppercase tracking-widest">
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

        <h1 className="font-serif-archive text-3xl sm:text-4xl font-extrabold text-[#e6e4df] leading-tight">
          {note.topic.title}
        </h1>

        <div className="pt-4 border-t border-[#1e2026] flex flex-wrap items-center justify-between gap-4 font-mono-archive text-xs text-[#8a8c91]">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#e6e4df]" />
            <span>RESEARCHED BY: </span>
            <span className="text-[#e6e4df] font-bold">{note.authorName}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#8a8c91]" />
            <span>ARCHIVED: {new Date(note.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Note Caption / Summary */}
      {note.caption && (
        <div className="archive-card p-6 border-l-4 border-l-[#e6e4df] bg-[#14151a] space-y-1">
          <span className="font-mono-archive text-[10px] text-[#8a8c91] uppercase tracking-widest block">
            SCHOLAR ABSTRACT / CAPTION
          </span>
          <p className="font-mono-archive text-sm text-[#e6e4df] leading-relaxed italic">
            &ldquo;{note.caption}&rdquo;
          </p>
        </div>
      )}

      {/* Handwritten Pages / PDF Viewer */}
      <div className="space-y-4">
        <div className="flex items-center justify-between font-mono-archive text-xs text-[#8a8c91]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#e6e4df]" />
            <span>RESEARCH ATTACHMENTS ({note.imageUrls.length} TOTAL)</span>
          </div>

          <button
            onClick={() => setFullscreenModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#18191e] hover:bg-[#22242b] border border-[#282a33] text-[#e6e4df]"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>FULLSCREEN / LIGHTBOX VIEWER</span>
          </button>
        </div>

        {/* Main Display Container */}
        <div className="archive-card relative p-4 bg-[#0d0e11] border border-[#22242b] rounded-lg overflow-hidden flex flex-col items-center justify-center min-h-[500px]">
          {isCurrentPdf ? (
            <div className="w-full h-full flex flex-col space-y-3">
              <div className="flex items-center justify-between font-mono-archive text-xs text-[#8a8c91]">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#e6e4df]" />
                  <span>PDF RESEARCH DOCUMENT</span>
                </span>
                <a
                  href={currentFile}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded bg-[#18191e] hover:bg-[#22242b] border border-[#282a33] text-[#e6e4df] font-semibold flex items-center gap-1.5"
                >
                  <span>OPEN PDF IN NEW TAB</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <iframe
                src={currentFile}
                className="w-full h-[70vh] rounded border border-[#282a33] bg-[#14151a]"
                title="PDF Document Viewer"
              />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentFile}
              alt={`Research page ${activePageIndex + 1}`}
              className="max-h-[75vh] w-auto object-contain rounded shadow-2xl cursor-pointer"
              onClick={() => setFullscreenModalOpen(true)}
            />
          )}

          {/* Navigation Controls */}
          {hasMultiplePages && (
            <>
              <button
                onClick={() => setActivePageIndex((prev) => Math.max(0, prev - 1))}
                disabled={activePageIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[#0d0e11]/80 hover:bg-[#0d0e11] text-[#e6e4df] disabled:opacity-30 border border-[#282a33] backdrop-blur"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={() =>
                  setActivePageIndex((prev) => Math.min(note.imageUrls.length - 1, prev + 1))
                }
                disabled={activePageIndex === note.imageUrls.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[#0d0e11]/80 hover:bg-[#0d0e11] text-[#e6e4df] disabled:opacity-30 border border-[#282a33] backdrop-blur"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              <div className="absolute bottom-4 bg-[#0d0e11]/90 px-3 py-1 rounded border border-[#282a33] text-xs font-mono-archive text-[#c4c2bd]">
                FILE {activePageIndex + 1} OF {note.imageUrls.length}
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
                className={`relative w-20 h-20 rounded overflow-hidden border-2 transition-all flex items-center justify-center bg-[#14151a] ${
                  activePageIndex === idx
                    ? "border-[#e6e4df] scale-105 shadow-lg"
                    : "border-[#282a33] opacity-50 hover:opacity-100"
                }`}
              >
                {isPdf(url) ? (
                  <FileText className="w-7 h-7 text-[#e6e4df]" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                )}
                <span className="absolute bottom-0 inset-x-0 bg-[#0d0e11]/90 text-[10px] font-mono-archive text-center text-[#c4c2bd] py-0.5">
                  {isPdf(url) ? "PDF" : `PG ${idx + 1}`}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox / PDF Modal */}
      {fullscreenModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0d0e11]/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6">
          <div className="flex items-center justify-between border-b border-[#22242b] pb-3 text-[#e6e4df] font-mono-archive text-xs">
            <div className="flex items-center gap-3">
              <span className="text-[#e6e4df] font-bold">{note.topic.title}</span>
              <span className="text-[#8a8c91]">|</span>
              <span>
                FILE {activePageIndex + 1} OF {note.imageUrls.length}
              </span>
            </div>
            <button
              onClick={() => setFullscreenModalOpen(false)}
              className="p-2 rounded bg-[#18191e] border border-[#282a33] text-[#8a8c91] hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative my-4 overflow-auto w-full max-w-5xl mx-auto">
            {isCurrentPdf ? (
              <iframe
                src={currentFile}
                className="w-full h-[75vh] rounded border border-[#282a33] bg-[#14151a]"
                title="Full PDF Viewer"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentFile}
                alt={`Full view page ${activePageIndex + 1}`}
                className="max-h-[85vh] max-w-full object-contain rounded border border-[#282a33]"
              />
            )}
          </div>

          {hasMultiplePages && (
            <div className="flex items-center justify-center gap-4 border-t border-[#22242b] pt-3">
              <button
                onClick={() => setActivePageIndex((prev) => Math.max(0, prev - 1))}
                disabled={activePageIndex === 0}
                className="px-4 py-2 rounded bg-[#18191e] border border-[#282a33] text-[#e6e4df] font-mono-archive text-xs disabled:opacity-30"
              >
                PREVIOUS FILE
              </button>
              <span className="font-mono-archive text-xs text-[#8a8c91]">
                {activePageIndex + 1} / {note.imageUrls.length}
              </span>
              <button
                onClick={() =>
                  setActivePageIndex((prev) => Math.min(note.imageUrls.length - 1, prev + 1))
                }
                disabled={activePageIndex === note.imageUrls.length - 1}
                className="px-4 py-2 rounded bg-[#18191e] border border-[#282a33] text-[#e6e4df] font-mono-archive text-xs disabled:opacity-30"
              >
                NEXT FILE
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
