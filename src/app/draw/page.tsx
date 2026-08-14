"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Search,
  BookOpen,
  Clock,
  Award,
  Layers,
  Upload,
  AlertCircle,
  X,
  FileImage,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Topic {
  id: string;
  category: string;
  title: string;
  userStatus: "available" | "drawn" | "completed";
  drawnAt?: string | null;
  completedAt?: string | null;
}

interface DrawState {
  currentDraw: {
    id: string;
    topicId: string;
    status: string;
    drawnAt: string;
    topic: Topic;
  } | null;
  stats: {
    total: number;
    available: number;
    drawn: number;
    completed: number;
  };
  drawLogs: Array<{
    id: string;
    topicId: string;
    drawnAt: string;
    completedAt?: string | null;
    topic: Topic;
  }>;
}

export default function DrawPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [drawState, setDrawState] = useState<DrawState | null>(null);
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [reelTitle, setReelTitle] = useState<string>("");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [showDrawLogs, setShowDrawLogs] = useState(false);

  // Notes Modal state
  const [noteModalTopic, setNoteModalTopic] = useState<Topic | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState("");

  // Fetch user draw state & topics list
  const fetchDrawData = useCallback(async () => {
    try {
      const [drawRes, topicsRes] = await Promise.all([
        fetch("/api/draw"),
        fetch("/api/topics"),
      ]);

      if (drawRes.ok) {
        const drawData = await drawRes.json();
        setDrawState(drawData);
      }

      if (topicsRes.ok) {
        const topicsData = await topicsRes.json();
        setAllTopics(topicsData.topics || []);
        setCategories(topicsData.categories || []);
      }
    } catch (err) {
      console.error("Error fetching draw data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    } else if (authStatus === "authenticated") {
      fetchDrawData();
    }
  }, [authStatus, router, fetchDrawData]);

  // Execute Topic Draw with Rolodex Reel Animation
  const handleDrawTopic = async () => {
    if (drawing || !allTopics.length) return;
    setDrawing(true);

    const availableList = allTopics.filter((t) => t.userStatus === "available");
    if (!availableList.length) {
      setDrawing(false);
      return;
    }

    // Rolodex slot animation: rapidly cycle through titles for 2 seconds
    let count = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * availableList.length);
      setReelTitle(availableList[randomIndex].title);
      count++;
      if (count > 15) {
        clearInterval(interval);
      }
    }, 100);

    try {
      const res = await fetch("/api/draw", { method: "POST" });
      const data = await res.json();

      setTimeout(() => {
        clearInterval(interval);
        if (data.currentDraw) {
          setReelTitle(data.currentDraw.topic.title);
        }
        setDrawing(false);
        fetchDrawData();
      }, 1600);
    } catch (err) {
      console.error("Draw request failed:", err);
      clearInterval(interval);
      setDrawing(false);
    }
  };

  // Mark currently drawn topic as complete
  const handleMarkComplete = async (topicToComplete?: Topic) => {
    const topicId = topicToComplete?.id || drawState?.currentDraw?.topicId;
    if (!topicId) return;

    try {
      const res = await fetch("/api/draw/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId }),
      });

      if (res.ok) {
        const targetTopic = topicToComplete || drawState?.currentDraw?.topic;
        if (targetTopic) {
          setNoteModalTopic(targetTopic);
        }
        fetchDrawData();
      }
    } catch (err) {
      console.error("Mark complete failed:", err);
    }
  };

  // Redraw / return topic to available pool
  const handleRedraw = async () => {
    if (!drawState?.currentDraw) return;
    try {
      const res = await fetch("/api/draw/redraw", { method: "POST" });
      if (res.ok) {
        fetchDrawData();
      }
    } catch (err) {
      console.error("Redraw failed:", err);
    }
  };

  // Handle multi-image file uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    setNoteError("");

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
        setNoteError(data.error || "Failed to upload image(s).");
      }
    } catch {
      setNoteError("Error uploading image file.");
    } finally {
      setUploadingImages(false);
    }
  };

  // Save Note submit
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteModalTopic) return;
    if (imageUrls.length === 0) {
      setNoteError("Please upload at least one handwritten note image.");
      return;
    }

    setSavingNote(true);
    setNoteError("");

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: noteModalTopic.id,
          imageUrls,
          caption,
          visibility,
        }),
      });

      if (res.ok) {
        setNoteModalTopic(null);
        setImageUrls([]);
        setCaption("");
        setVisibility("private");
        router.push("/notes");
      } else {
        const data = await res.json();
        setNoteError(data.error || "Failed to save notes.");
      }
    } catch {
      setNoteError("Unexpected error saving note.");
    } finally {
      setSavingNote(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-mono-archive text-xs text-zinc-400">LOADING SCHOLAR DECK...</p>
      </div>
    );
  }

  // Filter topics catalog
  const filteredTopics = allTopics.filter((topic) => {
    const matchesSearch =
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || topic.category === selectedCategory;
    const matchesStatus =
      selectedStatusFilter === "ALL" || topic.userStatus === selectedStatusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const isDeckCompleted = drawState?.stats.available === 0 && !drawState?.currentDraw;

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-[#e6e8eb] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#232730] pb-6 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-[#181a20] border border-[#2b303c] text-zinc-400 font-mono-archive text-[11px] uppercase tracking-wider mb-2">
            <span>DECK SCHOLAR:</span>
            <span className="text-white font-bold">{session?.user?.name}</span>
          </div>
          <h1 className="font-serif-archive text-3xl sm:text-4xl font-extrabold text-white">
            RESEARCH TOPIC REEL
          </h1>
          <p className="font-mono-archive text-xs text-zinc-400 uppercase tracking-widest mt-1">
            Independent Per-User Deck — 43 Master Topics
          </p>
        </div>

        {/* Deck Progress Bar & Stats */}
        <div className="bg-[#14161a] border border-[#252832] p-4 rounded min-w-[280px] space-y-2">
          <div className="flex justify-between font-mono-archive text-xs">
            <span className="text-zinc-400 uppercase">ARCHIVE PROGRESS</span>
            <span className="text-amber-400 font-bold">
              {drawState?.stats.completed || 0} / {drawState?.stats.total || 43} COMPLETED
            </span>
          </div>
          <div className="w-full h-2 bg-[#22252e] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-500"
              style={{
                width: `${Math.round(
                  ((drawState?.stats.completed || 0) / (drawState?.stats.total || 43)) * 100
                )}%`,
              }}
            ></div>
          </div>
          <div className="flex justify-between font-mono-archive text-[10px] text-zinc-400 pt-1">
            <span>Available: {drawState?.stats.available || 0}</span>
            <span>Active: {drawState?.stats.drawn || 0}</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: TOPIC REEL / DRAW MACHINE */}
      <section className="archive-card p-6 sm:p-10 border border-[#2d313d] bg-gradient-to-b from-[#16181f] to-[#111216] relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-8 text-center">
          {isDeckCompleted ? (
            /* Completed Deck Trophy State */
            <div className="py-8 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-950/50 border border-amber-500/50 flex items-center justify-center text-amber-400">
                <Award className="w-8 h-8" />
              </div>
              <h2 className="font-serif-archive text-2xl sm:text-3xl font-bold text-white">
                MASTER DECK FULLY ARCHIVED!
              </h2>
              <p className="text-sm text-zinc-300 font-mono-archive max-w-md mx-auto">
                Congratulations, Scholar! You have drawn and completed research on all 43 master topics.
              </p>
              <button
                onClick={() => router.push("/notes")}
                className="px-6 py-3 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono-archive font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>REVIEW ALL MY COMPLETED NOTES</span>
              </button>
            </div>
          ) : drawState?.currentDraw ? (
            /* Active Draw State Card */
            <div className="space-y-6 animate-fadeIn">
              <div className="inline-flex items-center gap-2">
                <span className="ink-stamp ink-stamp-drawn">CURRENT DRAW</span>
                <span className="font-mono-archive text-xs text-zinc-400">
                  DRAWN: {new Date(drawState.currentDraw.drawnAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="bg-[#0e0f12] border border-[#2b2f3a] p-6 sm:p-8 rounded-lg shadow-inner space-y-3">
                <span className="font-mono-archive text-xs text-amber-400 uppercase tracking-widest block font-semibold">
                  {drawState.currentDraw.topic.category}
                </span>
                <h2 className="font-serif-archive text-2xl sm:text-4xl font-bold text-white leading-tight">
                  {drawState.currentDraw.topic.title}
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 font-mono-archive text-xs pt-2">
                <button
                  onClick={() => handleMarkComplete()}
                  className="w-full sm:w-auto px-6 py-3.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 transition-all border border-red-500/50"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>MARK RESEARCHED & UPLOAD NOTES</span>
                </button>

                <button
                  onClick={handleRedraw}
                  className="w-full sm:w-auto px-5 py-3.5 rounded bg-[#1c1f26] hover:bg-[#252933] text-zinc-300 hover:text-white border border-[#333845] font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>REDRAW / RETURN TO POOL</span>
                </button>
              </div>
            </div>
          ) : (
            /* Slot Machine Draw Button State */
            <div className="space-y-6 py-6">
              {drawing ? (
                <div className="bg-[#0e0f12] border border-amber-900/60 p-8 rounded-lg space-y-3 min-h-[140px] flex flex-col items-center justify-center">
                  <span className="font-mono-archive text-xs text-amber-400 uppercase tracking-widest animate-pulse">
                    SHUFFLING MASTER TOPIC DECK...
                  </span>
                  <h2 className="font-serif-archive text-2xl sm:text-3xl font-bold text-zinc-100 animate-slot-spin">
                    {reelTitle || "Selecting Topic..."}
                  </h2>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-[#0e0f12]/60 border border-dashed border-[#2b2f3a] p-8 rounded-lg space-y-2">
                    <p className="font-serif-archive text-xl text-zinc-300 italic">
                      &ldquo;Ready for your next research endeavor?&rdquo;
                    </p>
                    <p className="font-mono-archive text-xs text-zinc-400">
                      {drawState?.stats.available} topic{drawState?.stats.available === 1 ? "" : "s"} waiting in your available deck pool.
                    </p>
                  </div>

                  <button
                    onClick={handleDrawTopic}
                    disabled={drawing}
                    className="px-10 py-5 rounded bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-mono-archive text-sm font-extrabold tracking-widest uppercase flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-950/60 mx-auto border border-amber-400/40 transform hover:scale-[1.02]"
                  >
                    <Sparkles className="w-5 h-5 text-amber-200 animate-spin" />
                    <span>DRAW RANDOM TOPIC</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: DRAW LOG HISTORY */}
      {drawState?.drawLogs && drawState.drawLogs.length > 0 && (
        <section className="archive-card p-4 sm:p-6 border border-[#232730]">
          <div
            onClick={() => setShowDrawLogs(!showDrawLogs)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-amber-400" />
              <h2 className="font-serif-archive text-lg font-bold text-white">
                PERSONAL DRAW LOG HISTORY
              </h2>
              <span className="px-2 py-0.5 rounded bg-[#1e222a] border border-[#2c313d] text-zinc-400 font-mono-archive text-[10px]">
                {drawState.drawLogs.length} ENTRIES
              </span>
            </div>
            <button className="text-zinc-400 hover:text-white">
              {showDrawLogs ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {showDrawLogs && (
            <div className="mt-4 pt-4 border-t border-[#232730] space-y-2 max-h-60 overflow-y-auto pr-2 font-mono-archive text-xs">
              {drawState.drawLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-[#121417] p-3 rounded border border-[#22252f] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-amber-400 uppercase tracking-widest block">
                      {log.topic.category}
                    </span>
                    <span className="font-serif-archive text-white font-medium">
                      {log.topic.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-zinc-400">
                      DRAWN: {new Date(log.drawnAt).toLocaleDateString()}
                    </span>
                    {log.completedAt ? (
                      <span className="ink-stamp ink-stamp-completed text-[9px] py-0 px-1.5">
                        COMPLETED
                      </span>
                    ) : (
                      <span className="ink-stamp ink-stamp-drawn text-[9px] py-0 px-1.5">
                        ACTIVE
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* SECTION 3: MASTER TOPICS CATALOG GRID */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#232730] pb-4">
          <div>
            <h2 className="font-serif-archive text-2xl font-bold text-white">
              MASTER TOPICS CATALOG
            </h2>
            <p className="font-mono-archive text-xs text-zinc-400 uppercase tracking-widest mt-0.5">
              Showing your personal status for all 43 topics
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics or categories..."
              className="w-full bg-[#14161a] border border-[#282c37] focus:border-amber-500 rounded px-3 py-2 pl-9 text-xs text-white font-mono-archive focus:outline-none"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 font-mono-archive text-xs">
          <span className="text-zinc-400 uppercase mr-1">CATEGORY:</span>
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1 rounded transition-colors ${
              selectedCategory === "ALL"
                ? "bg-amber-500 text-zinc-950 font-bold"
                : "bg-[#14161a] text-zinc-400 hover:text-white border border-[#252832]"
            }`}
          >
            ALL ({allTopics.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded transition-colors ${
                selectedCategory === cat
                  ? "bg-amber-500 text-zinc-950 font-bold"
                  : "bg-[#14161a] text-zinc-400 hover:text-white border border-[#252832]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono-archive text-xs pt-1">
          <span className="text-zinc-400 uppercase mr-1">STATUS:</span>
          {["ALL", "available", "drawn", "completed"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatusFilter(st)}
              className={`px-3 py-1 rounded uppercase transition-colors ${
                selectedStatusFilter === st
                  ? "bg-red-600 text-white font-bold"
                  : "bg-[#14161a] text-zinc-400 hover:text-white border border-[#252832]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Topics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map((t) => (
            <div
              key={t.id}
              className={`archive-card p-5 space-y-3 flex flex-col justify-between ${
                t.userStatus === "completed"
                  ? "border-red-900/40 bg-[#161314]"
                  : t.userStatus === "drawn"
                  ? "border-amber-700/50 bg-[#191713]"
                  : "border-[#232730]"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-archive text-[10px] text-amber-400 uppercase tracking-widest truncate">
                    {t.category}
                  </span>
                  {t.userStatus === "completed" && (
                    <span className="ink-stamp ink-stamp-completed">COMPLETED</span>
                  )}
                  {t.userStatus === "drawn" && (
                    <span className="ink-stamp ink-stamp-drawn">DRAWN</span>
                  )}
                  {t.userStatus === "available" && (
                    <span className="font-mono-archive text-[10px] text-zinc-400 uppercase border border-zinc-700 px-1.5 py-0.5 rounded">
                      AVAILABLE
                    </span>
                  )}
                </div>

                <h3 className="font-serif-archive font-bold text-white text-base leading-snug">
                  {t.title}
                </h3>
              </div>

              <div className="pt-3 border-t border-[#22252f] flex items-center justify-between font-mono-archive text-xs">
                {t.userStatus === "completed" ? (
                  <button
                    onClick={() => handleMarkComplete(t)}
                    className="text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>VIEW / ATTACH NOTES</span>
                  </button>
                ) : t.userStatus === "drawn" ? (
                  <button
                    onClick={() => handleMarkComplete(t)}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>MARK RESEARCHED</span>
                  </button>
                ) : (
                  <span className="text-zinc-400 text-[11px]">READY IN POOL</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: NOTES UPLOAD MODAL */}
      {noteModalTopic && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121418] border border-[#2d323e] rounded-lg max-w-2xl w-full p-6 space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => setNoteModalTopic(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded bg-[#1b1e25]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pb-4 border-b border-[#232730]">
              <span className="ink-stamp ink-stamp-completed">TOPIC COMPLETED</span>
              <h2 className="font-serif-archive text-xl font-bold text-white mt-2">
                UPLOAD HANDWRITTEN RESEARCH NOTES
              </h2>
              <p className="font-mono-archive text-xs text-amber-400">{noteModalTopic.title}</p>
            </div>

            {noteError && (
              <div className="p-3 rounded bg-red-950/60 border border-red-800/80 text-red-400 text-xs font-mono-archive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{noteError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNote} className="space-y-6">
              {/* Image Uploader */}
              <div className="space-y-2">
                <label className="block font-mono-archive text-xs text-zinc-300 uppercase tracking-wider">
                  HANDWRITTEN NOTE PAGES (PHOTOS / SCANS)
                </label>

                {/* Uploaded Previews */}
                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
                    {imageUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative h-24 rounded border border-[#2b303d] overflow-hidden group bg-black"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Note page ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-90 hover:opacity-100"
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
                    {uploadingImages ? "UPLOADING IMAGES..." : "CLICK OR DRAG MULTIPLE PAGES HERE"}
                  </span>
                  <span className="font-mono-archive text-[10px] text-zinc-400">
                    Supports JPG, PNG, WEBP (Handwritten photos / notebook scans)
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploadingImages}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Caption */}
              <div className="space-y-1.5">
                <label className="block font-mono-archive text-xs text-zinc-300 uppercase tracking-wider">
                  SHORT CAPTION / RESEARCH SUMMARY (OPTIONAL)
                </label>
                <textarea
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Key findings, primary sources, or personal thoughts..."
                  className="w-full bg-[#171a20] border border-[#2c313f] focus:border-amber-500 rounded p-3 text-xs text-white font-mono-archive focus:outline-none"
                ></textarea>
              </div>

              {/* Visibility Toggle */}
              <div className="space-y-2 pt-2 border-t border-[#232730]">
                <label className="block font-mono-archive text-xs text-zinc-300 uppercase tracking-wider">
                  VISIBILITY SETTING
                </label>
                <div className="grid grid-cols-2 gap-3 font-mono-archive text-xs">
                  <button
                    type="button"
                    onClick={() => setVisibility("private")}
                    className={`p-3 rounded border text-left space-y-1 transition-colors ${
                      visibility === "private"
                        ? "bg-[#1e222a] border-zinc-500 text-white"
                        : "bg-[#14161a] border-[#252934] text-zinc-400 hover:text-white"
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>PRIVATE</span>
                      <span className="ink-stamp ink-stamp-private text-[10px]">ONLY YOU</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      Visible exclusively to your logged-in account in My Notes.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisibility("public")}
                    className={`p-3 rounded border text-left space-y-1 transition-colors ${
                      visibility === "public"
                        ? "bg-emerald-950/40 border-emerald-500 text-white"
                        : "bg-[#14161a] border-[#252934] text-zinc-400 hover:text-white"
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>PUBLIC</span>
                      <span className="ink-stamp ink-stamp-public text-[10px]">EVERYONE</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      Publish notes to the global Explore feed for all visitors.
                    </p>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#232730] font-mono-archive text-xs">
                <button
                  type="button"
                  onClick={() => setNoteModalTopic(null)}
                  className="px-4 py-2.5 rounded border border-[#2b303c] text-zinc-400 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={savingNote || imageUrls.length === 0}
                  className="px-6 py-2.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold tracking-wider uppercase disabled:opacity-50 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{savingNote ? "SAVING NOTE..." : "SAVE NOTE TO ARCHIVE"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
