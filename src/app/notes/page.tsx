"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Eye,
  Lock,
  Globe,
  Upload,
  Plus,
  Sparkles,
  FileImage,
  X,
  AlertCircle,
  Edit3,
  Trash2,
} from "lucide-react";

interface NoteItem {
  progressId: string;
  topic: {
    id: string;
    category: string;
    title: string;
  };
  completedAt: string;
  note: {
    id: string;
    imageUrls: string[];
    caption?: string | null;
    visibility: "private" | "public";
    createdAt: string;
    updatedAt: string;
  } | null;
}

export default function MyNotesPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [items, setItems] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Add note modal state
  const [editTopic, setEditTopic] = useState<NoteItem["topic"] | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Lightbox modal state for viewing full notes
  const [selectedNoteImages, setSelectedNoteImages] = useState<{
    title: string;
    category: string;
    images: string[];
    caption?: string | null;
  } | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch("/api/notes");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    } else if (authStatus === "authenticated") {
      fetchNotes();
    }
  }, [authStatus, router, fetchNotes]);

  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  // Handle Note Deletion
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this research note? This action cannot be undone.")) {
      return;
    }

    setDeletingNoteId(noteId);
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      if (res.ok) {
        setEditTopic(null);
        fetchNotes();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete note.");
      }
    } catch {
      alert("Unexpected error deleting note.");
    } finally {
      setDeletingNoteId(null);
    }
  };

  // Handle Visibility Toggle (Private <-> Public)
  const handleToggleVisibility = async (noteId: string) => {
    try {
      const res = await fetch(`/api/notes/${noteId}/toggle-visibility`, {
        method: "POST",
      });
      if (res.ok) {
        fetchNotes();
      }
    } catch (err) {
      console.error("Failed to toggle visibility:", err);
    }
  };

  // Open edit modal prefilled
  const openEditModal = (item: NoteItem) => {
    setEditTopic(item.topic);
    if (item.note) {
      setEditingNoteId(item.note.id);
      setImageUrls(item.note.imageUrls || []);
      setCaption(item.note.caption || "");
      setVisibility(item.note.visibility);
    } else {
      setEditingNoteId(null);
      setImageUrls([]);
      setCaption("");
      setVisibility("private");
    }
    setErrorMsg("");
  };

  // Multi-image upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setErrorMsg("");

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.urls) {
        setImageUrls((prev) => [...prev, ...data.urls]);
      } else {
        setErrorMsg(data.error || "Image upload failed.");
      }
    } catch {
      setErrorMsg("Failed to upload image file.");
    } finally {
      setUploading(false);
    }
  };

  // Submit note save
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTopic) return;
    if (imageUrls.length === 0) {
      setErrorMsg("Please upload at least one handwritten note photo.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: editTopic.id,
          imageUrls,
          caption,
          visibility,
        }),
      });

      if (res.ok) {
        setEditTopic(null);
        fetchNotes();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to save note.");
      }
    } catch {
      setErrorMsg("Unexpected error saving note.");
    } finally {
      setSaving(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-mono-archive text-xs text-zinc-400">LOADING SCHOLAR ARCHIVE...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-[#e6e8eb] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#232730] pb-6 gap-4">
        <div>
          <h1 className="font-serif-archive text-3xl sm:text-4xl font-extrabold text-white">
            MY RESEARCH NOTES ARCHIVE
          </h1>
          <p className="font-mono-archive text-xs text-zinc-400 uppercase tracking-widest mt-1">
            Completed Research & Handwritten Note Storage
          </p>
        </div>

        <Link
          href="/draw"
          className="px-5 py-2.5 rounded bg-red-600 hover:bg-red-500 text-white font-mono-archive text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>DRAW NEW TOPIC</span>
        </Link>
      </div>

      {/* Grid of Completed Topics & Notes */}
      {items.length === 0 ? (
        <div className="archive-card p-12 text-center space-y-4 max-w-lg mx-auto my-12 border border-dashed border-[#2d323e]">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#181a20] border border-[#2b303c] flex items-center justify-center text-zinc-500">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-serif-archive text-xl font-bold text-white">
            NO RESEARCH NOTES ARCHIVED YET
          </h3>
          <p className="font-mono-archive text-xs text-zinc-400">
            You haven&apos;t completed any topics or attached handwritten notes yet. Head to the Draw deck to pull a random research topic!
          </p>
          <Link
            href="/draw"
            className="inline-flex items-center gap-2 px-6 py-3 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono-archive font-bold text-xs uppercase tracking-wider transition-colors"
          >
            <span>DRAW FIRST TOPIC</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.progressId} className="archive-card flex flex-col justify-between overflow-hidden">
              {/* Note Thumbnail / Image Preview */}
              <div className="h-48 bg-[#0a0b0d] relative overflow-hidden border-b border-[#22252f]">
                {item.note && item.note.imageUrls.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.note.imageUrls[0]}
                    alt={item.topic.title}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300 opacity-90 hover:opacity-100"
                    onClick={() => {
                      setSelectedNoteImages({
                        title: item.topic.title,
                        category: item.topic.category,
                        images: item.note!.imageUrls,
                        caption: item.note!.caption,
                      });
                      setActiveImageIndex(0);
                    }}
                  />
                ) : (
                  <div
                    onClick={() => openEditModal(item)}
                    className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-zinc-500 hover:text-zinc-300 space-y-2 hover:bg-[#121419] transition-colors"
                  >
                    <Plus className="w-8 h-8 text-amber-500" />
                    <span className="font-mono-archive text-xs uppercase tracking-wider">
                      ATTACH HANDWRITTEN NOTES
                    </span>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  {item.note ? (
                    <button
                      onClick={() => handleToggleVisibility(item.note!.id)}
                      className={`ink-stamp cursor-pointer transition-transform hover:scale-105 ${
                        item.note.visibility === "public" ? "ink-stamp-public" : "ink-stamp-private"
                      }`}
                      title="Click to toggle visibility"
                    >
                      {item.note.visibility === "public" ? (
                        <>
                          <Globe className="w-3 h-3" />
                          <span>PUBLIC</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>PRIVATE</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="ink-stamp ink-stamp-drawn">NO NOTES ATTACHED</span>
                  )}
                </div>

                {item.note && item.note.imageUrls.length > 0 && (
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur text-[10px] font-mono-archive text-zinc-300 border border-zinc-700">
                    {item.note.imageUrls.length} PAGE{item.note.imageUrls.length > 1 ? "S" : ""}
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="font-mono-archive text-[10px] text-amber-400 uppercase tracking-widest block truncate">
                    {item.topic.category}
                  </span>
                  <h3 className="font-serif-archive font-bold text-white text-lg leading-snug">
                    {item.topic.title}
                  </h3>
                  {item.note?.caption && (
                    <p className="text-xs text-zinc-400 line-clamp-2 font-mono-archive pt-1 italic">
                      &ldquo;{item.note.caption}&rdquo;
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-[#22252f] flex items-center justify-between font-mono-archive text-xs">
                  <span className="text-[10px] text-zinc-400">
                    COMPLETED: {new Date(item.completedAt).toLocaleDateString()}
                  </span>

                    <div className="flex items-center gap-1.5">
                      {item.note && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedNoteImages({
                                title: item.topic.title,
                                category: item.topic.category,
                                images: item.note!.imageUrls,
                                caption: item.note!.caption,
                              });
                              setActiveImageIndex(0);
                            }}
                            className="p-1.5 rounded bg-[#1c1f27] hover:bg-[#252934] text-zinc-300 hover:text-white"
                            title="View Full Notes"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteNote(item.note!.id)}
                            disabled={deletingNoteId === item.note!.id}
                            className="p-1.5 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 text-red-400 hover:text-red-300 transition-colors"
                            title="Delete Note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => openEditModal(item)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1e222b] hover:bg-[#272c38] text-amber-400 font-semibold"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{item.note ? "EDIT" : "ADD NOTES"}</span>
                      </button>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT / UPLOAD MODAL */}
      {editTopic && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121418] border border-[#2d323e] rounded-lg max-w-2xl w-full p-6 space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => setEditTopic(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded bg-[#1b1e25]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pb-4 border-b border-[#232730]">
              <span className="ink-stamp ink-stamp-completed">RESEARCH ARCHIVE</span>
              <h2 className="font-serif-archive text-xl font-bold text-white mt-2">
                {editingNoteId ? "EDIT HANDWRITTEN NOTES" : "ATTACH HANDWRITTEN NOTES"}
              </h2>
              <p className="font-mono-archive text-xs text-amber-400">{editTopic.title}</p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded bg-red-950/60 border border-red-800/80 text-red-400 text-xs font-mono-archive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveNote} className="space-y-6">
              {/* File Uploader */}
              <div className="space-y-2">
                <label className="block font-mono-archive text-xs text-zinc-300 uppercase tracking-wider">
                  NOTE PAGES (PHOTOS / SCANS)
                </label>

                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
                    {imageUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative h-24 rounded border border-[#2b303d] overflow-hidden group bg-black"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono-archive text-zinc-300">
                          PG {idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <label className="border-2 border-dashed border-[#2c313f] hover:border-amber-500/60 bg-[#171a20] rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center space-y-2">
                  <FileImage className="w-8 h-8 text-amber-400" />
                  <span className="font-mono-archive text-xs text-zinc-300">
                    {uploading ? "UPLOADING..." : "UPLOAD ADDITIONAL PAGES"}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Caption */}
              <div className="space-y-1.5">
                <label className="block font-mono-archive text-xs text-zinc-300 uppercase tracking-wider">
                  RESEARCH CAPTION / ABSTRACT
                </label>
                <textarea
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Summarize key findings or sources..."
                  className="w-full bg-[#171a20] border border-[#2c313f] focus:border-amber-500 rounded p-3 text-xs text-white font-mono-archive focus:outline-none"
                ></textarea>
              </div>

              {/* Visibility Settings */}
              <div className="space-y-2 pt-2 border-t border-[#232730]">
                <label className="block font-mono-archive text-xs text-zinc-300 uppercase tracking-wider">
                  VISIBILITY SETTING
                </label>
                <div className="grid grid-cols-2 gap-3 font-mono-archive text-xs">
                  <button
                    type="button"
                    onClick={() => setVisibility("private")}
                    className={`p-3 rounded border text-left transition-colors ${
                      visibility === "private"
                        ? "bg-[#1e222a] border-zinc-500 text-white font-bold"
                        : "bg-[#14161a] border-[#252934] text-zinc-400"
                    }`}
                  >
                    PRIVATE (Only You)
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisibility("public")}
                    className={`p-3 rounded border text-left transition-colors ${
                      visibility === "public"
                        ? "bg-emerald-950/40 border-emerald-500 text-white font-bold"
                        : "bg-[#14161a] border-[#252934] text-zinc-400"
                    }`}
                  >
                    PUBLIC (Everyone)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#232730] font-mono-archive text-xs">
                {editingNoteId ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(editingNoteId)}
                    disabled={deletingNoteId === editingNoteId}
                    className="px-3.5 py-2.5 rounded bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-400 font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>DELETE NOTE</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditTopic(null)}
                    className="px-4 py-2.5 rounded border border-[#2b303c] text-zinc-400 hover:text-white"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold uppercase disabled:opacity-50 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{saving ? "SAVING..." : "UPDATE ARCHIVE NOTE"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX GALLERY MODAL */}
      {selectedNoteImages && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8">
          <div className="flex items-center justify-between text-white font-mono-archive text-xs border-b border-zinc-800 pb-4">
            <div>
              <span className="text-amber-400 uppercase tracking-widest">{selectedNoteImages.category}</span>
              <h3 className="font-serif-archive text-lg font-bold text-white">{selectedNoteImages.title}</h3>
            </div>
            <button
              onClick={() => setSelectedNoteImages(null)}
              className="p-2 rounded bg-zinc-800 text-zinc-300 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-4 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedNoteImages.images[activeImageIndex]}
              alt="Handwritten note page"
              className="max-h-[70vh] max-w-full object-contain rounded border border-zinc-700 shadow-2xl"
            />

            {selectedNoteImages.caption && (
              <p className="mt-4 text-center font-mono-archive text-xs text-zinc-300 max-w-xl bg-zinc-900/80 p-3 rounded border border-zinc-800">
                &ldquo;{selectedNoteImages.caption}&rdquo;
              </p>
            )}
          </div>

          {/* Thumbnail Strip */}
          {selectedNoteImages.images.length > 1 && (
            <div className="flex items-center justify-center gap-3 border-t border-zinc-800 pt-4 overflow-x-auto">
              {selectedNoteImages.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx ? "border-amber-400 scale-110" : "border-zinc-700 opacity-60"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
