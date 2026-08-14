"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  FileText,
  ExternalLink,
  Search,
  X,
  AlertCircle,
  Edit3,
  Trash2,
} from "lucide-react";

interface Topic {
  id: string;
  category: string;
  title: string;
}

interface NoteItem {
  progressId: string;
  topic: Topic;
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

const isPdf = (url: string) => {
  if (!url) return false;
  return url.toLowerCase().endsWith(".pdf") || url.toLowerCase().includes(".pdf");
};

export default function MyNotesPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [items, setItems] = useState<NoteItem[]>([]);
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Freedom Topic Selector State
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Edit / Add note modal state
  const [editTopic, setEditTopic] = useState<Topic | null>(null);
  const [customTopicTitle, setCustomTopicTitle] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Lightbox modal state for viewing full notes / PDFs
  const [selectedNoteImages, setSelectedNoteImages] = useState<{
    title: string;
    category: string;
    images: string[];
    caption?: string | null;
  } | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const fetchNotesAndTopics = useCallback(async () => {
    try {
      const [notesRes, topicsRes] = await Promise.all([
        fetch("/api/notes"),
        fetch("/api/topics"),
      ]);

      if (notesRes.ok) {
        const data = await notesRes.json();
        setItems(data.items || []);
      }

      if (topicsRes.ok) {
        const data = await topicsRes.json();
        setAllTopics(data.topics || []);
      }
    } catch (err) {
      console.error("Error fetching notes or topics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    } else if (authStatus === "authenticated") {
      fetchNotesAndTopics();
    }
  }, [authStatus, router, fetchNotesAndTopics]);

  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  // Filter existing notes by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (it) =>
        it.topic.title.toLowerCase().includes(q) ||
        it.topic.category.toLowerCase().includes(q) ||
        (it.note?.caption && it.note.caption.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  // Filter catalog topics for direct note attachment search
  const searchedCatalogTopics = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allTopics.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [allTopics, searchQuery]);

  // Handle Note Deletion
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this research note? This action cannot be undone.")) {
      return;
    }

    setItems((prev) =>
      prev.map((it) => (it.note?.id === noteId ? { ...it, note: null } : it))
    );
    setEditTopic(null);

    setDeletingNoteId(noteId);
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
        fetchNotesAndTopics();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete note.");
        fetchNotesAndTopics();
      }
    } catch {
      alert("Unexpected error deleting note.");
      fetchNotesAndTopics();
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
        fetchNotesAndTopics();
      }
    } catch (err) {
      console.error("Failed to toggle visibility:", err);
    }
  };

  // Open edit modal prefilled for existing item
  const openEditModal = (item: NoteItem) => {
    setEditTopic(item.topic);
    setCustomTopicTitle("");
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

  // Open modal directly for a catalog topic or custom topic search
  const openDirectTopicModal = (topic: Topic) => {
    setEditTopic(topic);
    setCustomTopicTitle("");
    const existing = items.find((it) => it.topic.id === topic.id);
    if (existing && existing.note) {
      setEditingNoteId(existing.note.id);
      setImageUrls(existing.note.imageUrls || []);
      setCaption(existing.note.caption || "");
      setVisibility(existing.note.visibility);
    } else {
      setEditingNoteId(null);
      setImageUrls([]);
      setCaption("");
      setVisibility("private");
    }
    setShowDropdown(false);
    setErrorMsg("");
  };

  // Open modal for brand-new custom topic title
  const openCustomTopicModal = (title: string) => {
    setEditTopic(null);
    setCustomTopicTitle(title);
    setEditingNoteId(null);
    setImageUrls([]);
    setCaption("");
    setVisibility("private");
    setShowDropdown(false);
    setErrorMsg("");
  };

  // Multi-file upload (Images & PDFs)
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
        setErrorMsg(data.error || "File upload failed.");
      }
    } catch {
      setErrorMsg("Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  // Submit note save
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTopic && !customTopicTitle.trim()) {
      setErrorMsg("Please select or enter a topic title.");
      return;
    }
    if (imageUrls.length === 0 && !caption.trim()) {
      setErrorMsg("Please upload at least one image/PDF attachment or write a research summary.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: editTopic ? editTopic.id : undefined,
          customTitle: !editTopic ? customTopicTitle.trim() : undefined,
          customCategory: "Custom Research",
          imageUrls,
          caption,
          visibility,
        }),
      });

      if (res.ok) {
        setEditTopic(null);
        setCustomTopicTitle("");
        fetchNotesAndTopics();
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
        <div className="w-8 h-8 border-2 border-[#e6e4df] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-mono-archive text-xs text-[#8a8c91]">LOADING SCHOLAR ARCHIVE...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0e11] text-[#e6e4df] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#1e2026] pb-6 gap-4">
        <div>
          <h1 className="font-serif-archive text-3xl sm:text-4xl font-extrabold text-[#e6e4df]">
            MY RESEARCH ARCHIVE
          </h1>
          <p className="font-mono-archive text-xs text-[#8a8c91] uppercase tracking-widest mt-1">
            Search Any Topic & Attach Notes or PDF Files Anytime
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openCustomTopicModal("")}
            className="px-4 py-2.5 rounded bg-[#18191e] hover:bg-[#22242b] text-[#e6e4df] font-mono-archive text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors border border-[#282a33]"
          >
            <Plus className="w-4 h-4 text-[#e6e4df]" />
            <span>ADD CUSTOM TOPIC</span>
          </button>

          <Link
            href="/draw"
            className="px-5 py-2.5 rounded bg-[#e6e4df] hover:bg-[#d6d4cf] text-[#0d0e11] font-mono-archive text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-[#0d0e11]" />
            <span>DRAW RANDOM TOPIC</span>
          </Link>
        </div>
      </div>

      {/* TOPIC SEARCH & FREEDOM NOTE CREATOR BAR */}
      <div className="relative z-30">
        <div className="bg-[#14151a] border border-[#282a33] rounded-lg p-3 flex items-center gap-3 shadow-lg focus-within:border-[#383a47]">
          <Search className="w-5 h-5 text-[#8a8c91] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search any topic in catalog or type a new topic title to attach notes..."
            className="w-full bg-transparent text-sm text-[#e6e4df] font-mono-archive focus:outline-none placeholder-[#6e7075]"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setShowDropdown(false);
              }}
              className="text-[#8a8c91] hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live Search & Direct Attach Dropdown */}
        {showDropdown && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-[#14151a] border border-[#282a33] rounded-lg shadow-2xl overflow-hidden max-h-80 overflow-y-auto z-40 divide-y divide-[#1e2026]">
            {/* Matching Master Catalog Topics */}
            {searchedCatalogTopics.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-1 font-mono-archive text-[10px] text-[#8a8c91] uppercase tracking-widest">
                  MATCHING MASTER TOPICS ({searchedCatalogTopics.length})
                </div>
                {searchedCatalogTopics.map((topic) => {
                  const existingNote = items.find((it) => it.topic.id === topic.id);
                  return (
                    <div
                      key={topic.id}
                      onClick={() => openDirectTopicModal(topic)}
                      className="px-3 py-2.5 rounded hover:bg-[#1f2128] cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <span className="font-mono-archive text-[10px] text-[#8a8c91] uppercase block">
                          {topic.category}
                        </span>
                        <span className="font-serif-archive text-sm font-semibold text-[#e6e4df]">
                          {topic.title}
                        </span>
                      </div>
                      <span className="ink-stamp ink-stamp-drawn shrink-0">
                        {existingNote?.note ? "EDIT ATTACHMENT" : "+ ATTACH NOTES"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Custom Topic Creation Option */}
            <div
              onClick={() => openCustomTopicModal(searchQuery)}
              className="p-3 bg-[#18191e] hover:bg-[#22242b] cursor-pointer flex items-center justify-between text-[#e6e4df] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#e6e4df]" />
                <span className="font-mono-archive text-xs">
                  Create custom topic & attach notes for: <strong className="text-white">&ldquo;{searchQuery}&rdquo;</strong>
                </span>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#e6e4df] text-[#0d0e11] font-mono-archive text-[10px] font-bold uppercase">
                CREATE & ATTACH
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Grid of Completed Topics & Notes */}
      {filteredItems.length === 0 ? (
        <div className="archive-card p-12 text-center space-y-4 max-w-lg mx-auto my-12 border border-dashed border-[#282a33]">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#14151a] border border-[#282a33] flex items-center justify-center text-[#8a8c91]">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-serif-archive text-xl font-bold text-[#e6e4df]">
            {searchQuery ? "NO MATCHING RESEARCH NOTES FOUND" : "NO RESEARCH NOTES ARCHIVED YET"}
          </h3>
          <p className="font-mono-archive text-xs text-[#8a8c91]">
            {searchQuery
              ? `No archived notes found matching "${searchQuery}". Click below to attach notes to this topic!`
              : "Search any topic above or head to the Draw deck to pull a random research topic!"}
          </p>

          {searchQuery ? (
            <button
              onClick={() => openCustomTopicModal(searchQuery)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded bg-[#e6e4df] hover:bg-[#d6d4cf] text-[#0d0e11] font-mono-archive font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>ATTACH NOTES TO &ldquo;{searchQuery}&rdquo;</span>
            </button>
          ) : (
            <Link
              href="/draw"
              className="inline-flex items-center gap-2 px-6 py-3 rounded bg-[#e6e4df] hover:bg-[#d6d4cf] text-[#0d0e11] font-mono-archive font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <span>DRAW FIRST TOPIC</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.progressId} className="archive-card flex flex-col justify-between overflow-hidden">
              {/* Note Thumbnail / PDF Preview */}
              <div className="h-48 bg-[#0d0e11] relative overflow-hidden border-b border-[#1e2026]">
                {item.note && item.note.imageUrls.length > 0 ? (
                  isPdf(item.note.imageUrls[0]) ? (
                    <div
                      onClick={() => {
                        setSelectedNoteImages({
                          title: item.topic.title,
                          category: item.topic.category,
                          images: item.note!.imageUrls,
                          caption: item.note!.caption,
                        });
                        setActiveImageIndex(0);
                      }}
                      className="w-full h-full bg-[#14151a] border border-[#22242b] flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-[#1b1c23] transition-colors space-y-2"
                    >
                      <FileText className="w-10 h-10 text-[#e6e4df]" />
                      <span className="font-mono-archive text-xs text-[#e6e4df] font-semibold tracking-wider">
                        PDF RESEARCH DOCUMENT
                      </span>
                      <span className="font-mono-archive text-[10px] text-[#8a8c91]">
                        CLICK TO OPEN PDF VIEWER
                      </span>
                    </div>
                  ) : (
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
                  )
                ) : (
                  <div
                    onClick={() => openEditModal(item)}
                    className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-[#8a8c91] hover:text-[#e6e4df] space-y-2 hover:bg-[#14151a] transition-colors"
                  >
                    <Plus className="w-8 h-8 text-[#e6e4df]" />
                    <span className="font-mono-archive text-xs uppercase tracking-wider">
                      ATTACH NOTES / PDF
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
                    <span className="ink-stamp ink-stamp-drawn">NO ATTACHMENTS</span>
                  )}
                </div>

                {item.note && item.note.imageUrls.length > 0 && (
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-[#0d0e11]/80 backdrop-blur text-[10px] font-mono-archive text-[#c4c2bd] border border-[#282a33]">
                    {item.note.imageUrls.length} {isPdf(item.note.imageUrls[0]) ? "PDF FILE" : "FILE"}{item.note.imageUrls.length > 1 ? "S" : ""}
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="font-mono-archive text-[10px] text-[#8a8c91] uppercase tracking-widest block truncate">
                    {item.topic.category}
                  </span>
                  <h3 className="font-serif-archive font-bold text-[#e6e4df] text-lg leading-snug">
                    {item.topic.title}
                  </h3>
                  {item.note?.caption && (
                    <p className="text-xs text-[#9a9c9f] line-clamp-2 font-mono-archive pt-1 italic">
                      &ldquo;{item.note.caption}&rdquo;
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-[#1e2026] flex items-center justify-between font-mono-archive text-xs">
                  <span className="text-[10px] text-[#8a8c91]">
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
                          className="p-1.5 rounded bg-[#18191e] hover:bg-[#22242b] text-[#c4c2bd] hover:text-white"
                          title="View Attachment"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteNote(item.note!.id)}
                          disabled={deletingNoteId === item.note!.id}
                          className="p-1.5 rounded bg-[#1b1c23] hover:bg-[#282a33] border border-[#282a33] text-[#8a8c91] hover:text-[#e6e4df] transition-colors"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => openEditModal(item)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#18191e] hover:bg-[#22242b] text-[#e6e4df] font-semibold border border-[#282a33]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{item.note ? "EDIT" : "ADD NOTES/PDF"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT / UPLOAD MODAL */}
      {(editTopic || customTopicTitle !== "") && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#14151a] border border-[#282a33] rounded-lg max-w-2xl w-full p-6 space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => {
                setEditTopic(null);
                setCustomTopicTitle("");
              }}
              className="absolute top-4 right-4 text-[#8a8c91] hover:text-white p-1 rounded bg-[#18191e]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pb-4 border-b border-[#1e2026]">
              <span className="ink-stamp ink-stamp-completed">RESEARCH ARCHIVE</span>
              <h2 className="font-serif-archive text-xl font-bold text-[#e6e4df] mt-2">
                {editingNoteId ? "EDIT RESEARCH ATTACHMENTS" : "ATTACH RESEARCH NOTES OR PDF"}
              </h2>

              {!editTopic ? (
                <div className="pt-2 space-y-2">
                  <label className="block font-mono-archive text-[11px] text-[#8a8c91] uppercase">
                    RESEARCH TOPIC TITLE
                  </label>
                  <input
                    type="text"
                    value={customTopicTitle}
                    onChange={(e) => setCustomTopicTitle(e.target.value)}
                    placeholder="e.g. Quantum Computing, Black Hole Entropy, Artificial Intelligence"
                    className="w-full bg-[#0d0e11] border border-[#282a33] focus:border-[#383a47] rounded p-2.5 text-xs text-[#e6e4df] font-mono-archive focus:outline-none"
                  />
                </div>
              ) : (
                <p className="font-mono-archive text-xs text-[#9a9c9f]">{editTopic.title}</p>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded bg-[#1f1618] border border-[#3b2427] text-zinc-300 text-xs font-mono-archive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveNote} className="space-y-6">
              {/* File Uploader */}
              <div className="space-y-2">
                <label className="block font-mono-archive text-xs text-[#c4c2bd] uppercase tracking-wider">
                  RESEARCH FILES (IMAGES OR PDF DOCUMENTS)
                </label>

                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                    {imageUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative h-24 rounded border border-[#282a33] overflow-hidden group bg-[#0d0e11] flex items-center justify-center p-2"
                      >
                        {isPdf(url) ? (
                          <div className="flex flex-col items-center justify-center text-center space-y-1">
                            <FileText className="w-7 h-7 text-[#e6e4df]" />
                            <span className="font-mono-archive text-[10px] text-[#c4c2bd] truncate max-w-[110px]">
                              PDF DOCUMENT
                            </span>
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt={`File ${idx + 1}`} className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-[#282a33] text-white rounded-full p-1 hover:bg-[#383a47]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-[#0d0e11]/80 text-[10px] font-mono-archive text-[#c4c2bd]">
                          {isPdf(url) ? "PDF" : `PG ${idx + 1}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <label className="border-2 border-dashed border-[#282a33] hover:border-[#383a47] bg-[#0d0e11] rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center space-y-2">
                  <div className="flex items-center gap-2 text-[#e6e4df]">
                    <FileImage className="w-6 h-6" />
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="font-mono-archive text-xs text-[#e6e4df]">
                    {uploading ? "UPLOADING FILE(S)..." : "UPLOAD IMAGES OR PDF FILE"}
                  </span>
                  <span className="font-mono-archive text-[10px] text-[#8a8c91]">
                    Supports JPG, PNG, WEBP, and PDF documents (Max 25MB)
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Caption */}
              <div className="space-y-1.5">
                <label className="block font-mono-archive text-xs text-[#c4c2bd] uppercase tracking-wider">
                  RESEARCH ABSTRACT / SUMMARY
                </label>
                <textarea
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Summarize key findings or PDF sources..."
                  className="w-full bg-[#0d0e11] border border-[#282a33] focus:border-[#383a47] rounded p-3 text-xs text-[#e6e4df] font-mono-archive focus:outline-none"
                ></textarea>
              </div>

              {/* Visibility Settings */}
              <div className="space-y-2 pt-2 border-t border-[#1e2026]">
                <label className="block font-mono-archive text-xs text-[#c4c2bd] uppercase tracking-wider">
                  VISIBILITY SETTING
                </label>
                <div className="grid grid-cols-2 gap-3 font-mono-archive text-xs">
                  <button
                    type="button"
                    onClick={() => setVisibility("private")}
                    className={`p-3 rounded border text-left transition-colors ${
                      visibility === "private"
                        ? "bg-[#1f2128] border-[#383a47] text-[#e6e4df] font-bold"
                        : "bg-[#0d0e11] border-[#22242b] text-[#8a8c91]"
                    }`}
                  >
                    PRIVATE (Only You)
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisibility("public")}
                    className={`p-3 rounded border text-left transition-colors ${
                      visibility === "public"
                        ? "bg-[#1f2128] border-[#383a47] text-[#e6e4df] font-bold"
                        : "bg-[#0d0e11] border-[#22242b] text-[#8a8c91]"
                    }`}
                  >
                    PUBLIC (Everyone)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#1e2026] font-mono-archive text-xs">
                {editingNoteId ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(editingNoteId)}
                    disabled={deletingNoteId === editingNoteId}
                    className="px-3.5 py-2.5 rounded bg-[#1b1c23] hover:bg-[#282a33] border border-[#282a33] text-[#8a8c91] hover:text-[#e6e4df] font-semibold flex items-center gap-1.5 transition-colors"
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
                    onClick={() => {
                      setEditTopic(null);
                      setCustomTopicTitle("");
                    }}
                    className="px-4 py-2.5 rounded border border-[#282a33] text-[#8a8c91] hover:text-white"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded bg-[#e6e4df] hover:bg-[#d6d4cf] text-[#0d0e11] font-bold uppercase disabled:opacity-50 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{saving ? "SAVING..." : "SAVE ARCHIVE NOTE"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX / PDF VIEWER MODAL */}
      {selectedNoteImages && (
        <div className="fixed inset-0 z-50 bg-[#0d0e11]/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8">
          <div className="flex items-center justify-between text-[#e6e4df] font-mono-archive text-xs border-b border-[#22242b] pb-4">
            <div>
              <span className="text-[#8a8c91] uppercase tracking-widest">{selectedNoteImages.category}</span>
              <h3 className="font-serif-archive text-lg font-bold text-[#e6e4df]">{selectedNoteImages.title}</h3>
            </div>
            <button
              onClick={() => setSelectedNoteImages(null)}
              className="p-2 rounded bg-[#18191e] border border-[#282a33] text-[#8a8c91] hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-4 relative w-full max-w-5xl mx-auto">
            {isPdf(selectedNoteImages.images[activeImageIndex]) ? (
              <div className="w-full h-full flex flex-col space-y-3">
                <div className="flex items-center justify-between font-mono-archive text-xs text-[#8a8c91]">
                  <span>EMBEDDED PDF DOCUMENT VIEWER</span>
                  <a
                    href={selectedNoteImages.images[activeImageIndex]}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded bg-[#18191e] hover:bg-[#22242b] border border-[#282a33] text-[#e6e4df] font-semibold flex items-center gap-1.5"
                  >
                    <span>OPEN PDF IN NEW TAB</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <iframe
                  src={selectedNoteImages.images[activeImageIndex]}
                  className="w-full h-[70vh] rounded border border-[#282a33] bg-[#14151a]"
                  title="PDF Viewer"
                />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedNoteImages.images[activeImageIndex]}
                alt="Handwritten note page"
                className="max-h-[70vh] max-w-full object-contain rounded border border-[#282a33] shadow-2xl"
              />
            )}

            {selectedNoteImages.caption && (
              <p className="mt-4 text-center font-mono-archive text-xs text-[#c4c2bd] max-w-xl bg-[#14151a] p-3 rounded border border-[#22242b]">
                &ldquo;{selectedNoteImages.caption}&rdquo;
              </p>
            )}
          </div>

          {/* Thumbnail Strip */}
          {selectedNoteImages.images.length > 1 && (
            <div className="flex items-center justify-center gap-3 border-t border-[#22242b] pt-4 overflow-x-auto">
              {selectedNoteImages.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded overflow-hidden border-2 transition-all flex items-center justify-center bg-[#14151a] ${
                    activeImageIndex === idx ? "border-[#e6e4df] scale-105" : "border-[#282a33] opacity-60"
                  }`}
                >
                  {isPdf(img) ? (
                    <FileText className="w-6 h-6 text-[#e6e4df]" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
