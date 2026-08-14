"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Users,
  BookOpen,
  Eye,
  Trash2,
  Lock,
  Search,
  Sparkles,
  BarChart3,
  ShieldCheck,
  X,
  UserPlus,
  RotateCcw,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Database,
  Terminal,
  Play,
  Key,
  RefreshCw,
} from "lucide-react";

interface AdminStats {
  users: { total: number; active: number; inactive: number };
  topics: { masterTotal: number; totalCompleted: number; totalActiveDrawn: number };
  notes: { total: number; public: number; private: number };
  topTopics: Array<{ topicId: string; title: string; category: string; completedCount: number }>;
}

interface ScholarUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  drawnCount: number;
  completedCount: number;
  notesCount: number;
  publicNotesCount: number;
  activeDrawTopic?: string | null;
  isActive: boolean;
}

interface GlobalNote {
  id: string;
  topic: { title: string; category: string };
  user: { id: string; name: string; email: string };
  visibility: "private" | "public";
  imageUrls: string[];
  caption?: string | null;
  createdAt: string;
}

export default function AdminPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"overview" | "users" | "notes" | "passkey" | "database">("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<ScholarUser[]>([]);
  const [notes, setNotes] = useState<GlobalNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [userSearch, setUserSearch] = useState("");
  const [noteSearch, setNoteSearch] = useState("");

  // Create User Modal state
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"user" | "admin">("user");
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState("");
  const [createUserSuccess, setCreateUserSuccess] = useState("");

  // Inspect note modal
  const [selectedNote, setSelectedNote] = useState<GlobalNote | null>(null);

  // Owner Passkey state
  const [activeOwnerKey, setActiveOwnerKey] = useState("");
  const [customPasskeyInput, setCustomPasskeyInput] = useState("");
  const [keyUpdatedAt, setKeyUpdatedAt] = useState<string | null>(null);
  const [updatingKey, setUpdatingKey] = useState(false);
  const [keyMsg, setKeyMsg] = useState("");

  // Database Explorer state
  const [dbTables, setDbTables] = useState<string[]>([]);
  const [dbCounts, setDbCounts] = useState<Record<string, number>>({});
  const [selectedDbTable, setSelectedDbTable] = useState("User");
  const [dbRows, setDbRows] = useState<Record<string, unknown>[]>([]);
  const [loadingDbRows, setLoadingDbRows] = useState(false);

  // SQL Console state
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM User LIMIT 10;");
  const [sqlResult, setSqlResult] = useState<unknown>(null);
  const [sqlError, setSqlError] = useState("");
  const [executingSql, setExecutingSql] = useState(false);

  const fetchAdminData = useCallback(async () => {
    try {
      const [statsRes, usersRes, notesRes, keyRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
        fetch("/api/admin/notes"),
        fetch("/api/admin/owner-key"),
      ]);

      if (statsRes.ok) setStats((await statsRes.json()).stats);
      if (usersRes.ok) setUsers((await usersRes.json()).users || []);
      if (notesRes.ok) setNotes((await notesRes.json()).notes || []);
      if (keyRes.ok) {
        const keyData = await keyRes.json();
        setActiveOwnerKey(keyData.ownerKey || "");
        setKeyUpdatedAt(keyData.updatedAt);
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    } else if (authStatus === "authenticated") {
      if (session.user.role !== "admin") {
        setLoading(false);
      } else {
        fetchAdminData();
      }
    }
  }, [authStatus, session, router, fetchAdminData]);

  // Fetch Database Explorer Table Data
  const fetchDbTableData = useCallback(async (tableName: string) => {
    setLoadingDbRows(true);
    try {
      const res = await fetch(`/api/admin/db?table=${tableName}`);
      if (res.ok) {
        const data = await res.json();
        setDbTables(data.tables || []);
        setDbCounts(data.counts || {});
        setDbRows(data.rows || []);
      }
    } catch (err) {
      console.error("Error fetching table data:", err);
    } finally {
      setLoadingDbRows(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "database" && session?.user?.role === "admin") {
      fetchDbTableData(selectedDbTable);
    }
  }, [activeTab, selectedDbTable, session, fetchDbTableData]);

  // Generate / Set Owner Passkey
  const handleUpdateOwnerKey = async (useRandom: boolean) => {
    setUpdatingKey(true);
    setKeyMsg("");

    try {
      const res = await fetch("/api/admin/owner-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customKey: useRandom ? "" : customPasskeyInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveOwnerKey(data.ownerKey);
        setKeyUpdatedAt(data.updatedAt);
        setCustomPasskeyInput("");
        setKeyMsg("Owner Passkey updated successfully!");
      } else {
        setKeyMsg(data.error || "Failed to update key.");
      }
    } catch {
      setKeyMsg("Error updating key.");
    } finally {
      setUpdatingKey(false);
    }
  };

  // Run SQL Query
  const handleExecuteSql = async (e: React.FormEvent) => {
    e.preventDefault();
    setSqlError("");
    setSqlResult(null);
    setExecutingSql(true);

    try {
      const res = await fetch("/api/admin/db/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: sqlQuery }),
      });
      const data = await res.json();
      if (res.ok) {
        setSqlResult(data.result);
      } else {
        setSqlError(data.error || "Query execution error.");
      }
    } catch {
      setSqlError("Network error executing SQL query.");
    } finally {
      setExecutingSql(false);
    }
  };

  // Delete Record in Database Explorer
  const handleDeleteDbRecord = async (tableName: string, recordId: string) => {
    if (!confirm(`Delete record ID ${recordId} from ${tableName}?`)) return;

    try {
      const res = await fetch("/api/admin/db", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: tableName, id: recordId }),
      });
      if (res.ok) {
        fetchDbTableData(selectedDbTable);
        fetchAdminData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete record.");
      }
    } catch {
      alert("Error deleting record.");
    }
  };

  // Create User Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError("");
    setCreateUserSuccess("");
    setCreatingUser(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCreateUserSuccess(`Scholar ${data.user.email} created successfully!`);
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("user");
        fetchAdminData();
      } else {
        setCreateUserError(data.error || "Failed to create scholar account.");
      }
    } catch {
      setCreateUserError("Error connecting to server.");
    } finally {
      setCreatingUser(false);
    }
  };

  // Reset User Active Topic Draw
  const handleResetUserDraw = async (userId: string, userEmail: string) => {
    if (!confirm(`Reset active topic draw for user ${userEmail}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/reset`, { method: "POST" });
      if (res.ok) {
        fetchAdminData();
      }
    } catch {
      alert("Error resetting user draw.");
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (
      !confirm(
        `ARE YOU SURE YOU WANT TO DELETE USER ${userEmail}?\n\nThis will permanently purge their account, progress, draw logs, and notes!`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        fetchAdminData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user.");
      }
    } catch {
      alert("Error deleting user.");
    }
  };

  // Toggle Role
  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) fetchAdminData();
    } catch {
      alert("Error updating user role.");
    }
  };

  // Delete Note as Owner
  const handleDeleteNoteAdmin = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note from the platform as Owner?")) return;

    // Optimistic UI update: Remove note immediately from local state
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    setSelectedNote(null);

    try {
      const res = await fetch(`/api/admin/notes?noteId=${noteId}`, { method: "DELETE" });
      if (res.ok) {
        fetchAdminData();
      } else {
        alert("Failed to delete note.");
        fetchAdminData();
      }
    } catch {
      alert("Error deleting note.");
      fetchAdminData();
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-mono-archive text-xs text-zinc-400">VERIFYING HIGH-SECURITY OWNER ACCESS...</p>
      </div>
    );
  }

  if (session?.user?.role !== "admin") {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="archive-card p-8 max-w-md text-center space-y-4 border border-red-900/80 bg-[#161214]">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-950/80 border border-red-800 flex items-center justify-center text-red-500 font-bold text-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="font-serif-archive text-2xl font-bold text-white">ACCESS FORBIDDEN</h2>
          <p className="font-mono-archive text-xs text-zinc-400">
            This dashboard is protected by Owner Secret Key verification and restricted to System Administrators.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 rounded bg-[#1f2229] hover:bg-[#282c36] text-white font-mono-archive text-xs font-bold uppercase"
          >
            RETURN TO HOMEPAGE
          </button>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredNotes = notes.filter(
    (n) =>
      n.topic.title.toLowerCase().includes(noteSearch.toLowerCase()) ||
      n.user.name.toLowerCase().includes(noteSearch.toLowerCase()) ||
      n.user.email.toLowerCase().includes(noteSearch.toLowerCase()) ||
      (n.caption && n.caption.toLowerCase().includes(noteSearch.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-[#e6e8eb] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-[#232730] pb-6 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-amber-950/50 border border-amber-700/60 text-amber-400 font-mono-archive text-[11px] uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PLATFORM OWNER HIGH-SECURITY PORTAL</span>
          </div>
          <h1 className="font-serif-archive text-3xl sm:text-4xl font-extrabold text-white">
            DATABASE METRICS & ADMIN CONTROL
          </h1>
          <p className="font-mono-archive text-xs text-zinc-400 uppercase tracking-widest mt-1">
            Real-time Scholar Tracking, Account CRUD Operations, and Storage Oversight
          </p>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex flex-wrap items-center gap-2 font-mono-archive text-xs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === "overview"
                ? "bg-amber-500 text-zinc-950 font-bold"
                : "bg-[#15171b] text-zinc-400 hover:text-white border border-[#252833]"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>OVERVIEW</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === "users"
                ? "bg-amber-500 text-zinc-950 font-bold"
                : "bg-[#15171b] text-zinc-400 hover:text-white border border-[#252833]"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>SCHOLARS ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === "notes"
                ? "bg-amber-500 text-zinc-950 font-bold"
                : "bg-[#15171b] text-zinc-400 hover:text-white border border-[#252833]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ALL NOTES ({notes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("passkey")}
            className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === "passkey"
                ? "bg-amber-500 text-zinc-950 font-bold"
                : "bg-[#15171b] text-zinc-400 hover:text-white border border-[#252833]"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>OWNER PASSKEY</span>
          </button>

          <button
            onClick={() => setActiveTab("database")}
            className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === "database"
                ? "bg-amber-500 text-zinc-950 font-bold"
                : "bg-[#15171b] text-zinc-400 hover:text-white border border-[#252833]"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>DB CONSOLE</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === "overview" && stats && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono-archive text-xs">
            <div className="archive-card p-5 space-y-2 border border-[#252834]">
              <span className="text-zinc-400 uppercase tracking-wider block">TOTAL SCHOLARS</span>
              <span className="text-3xl font-bold font-serif-archive text-white block">
                {stats.users.total}
              </span>
              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#222530]">
                <span className="text-emerald-400">Active: {stats.users.active}</span>
                <span className="text-zinc-500">Inactive: {stats.users.inactive}</span>
              </div>
            </div>

            <div className="archive-card p-5 space-y-2 border border-[#252834]">
              <span className="text-zinc-400 uppercase tracking-wider block">TOTAL NOTES STORED</span>
              <span className="text-3xl font-bold font-serif-archive text-amber-400 block">
                {stats.notes.total}
              </span>
              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#222530]">
                <span className="text-emerald-400">Public: {stats.notes.public}</span>
                <span className="text-zinc-400">Private: {stats.notes.private}</span>
              </div>
            </div>

            <div className="archive-card p-5 space-y-2 border border-[#252834]">
              <span className="text-zinc-400 uppercase tracking-wider block">TOPICS COMPLETED</span>
              <span className="text-3xl font-bold font-serif-archive text-emerald-400 block">
                {stats.topics.totalCompleted}
              </span>
              <div className="text-[11px] text-zinc-400 pt-2 border-t border-[#222530]">
                Active Draws in Progress: {stats.topics.totalActiveDrawn}
              </div>
            </div>

            <div className="archive-card p-5 space-y-2 border border-[#252834]">
              <span className="text-zinc-400 uppercase tracking-wider block">MASTER TOPIC INDEX</span>
              <span className="text-3xl font-bold font-serif-archive text-zinc-200 block">
                {stats.topics.masterTotal}
              </span>
              <div className="text-[11px] text-zinc-400 pt-2 border-t border-[#222530]">
                8 Knowledge Categories
              </div>
            </div>
          </div>

          <div className="archive-card p-6 border border-[#252834] space-y-4">
            <h3 className="font-serif-archive text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>MOST RESEARCHED TOPICS RANKING</span>
            </h3>

            {stats.topTopics.length === 0 ? (
              <p className="font-mono-archive text-xs text-zinc-400">No completed research topics recorded yet.</p>
            ) : (
              <div className="space-y-3 font-mono-archive text-xs">
                {stats.topTopics.map((item, idx) => (
                  <div
                    key={item.topicId}
                    className="bg-[#121418] p-4 rounded border border-[#222530] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded bg-[#1c1e26] border border-[#2c313f] flex items-center justify-center font-bold text-amber-400">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="text-[10px] text-amber-400 uppercase tracking-widest block">
                          {item.category}
                        </span>
                        <span className="font-serif-archive text-white font-bold text-sm">
                          {item.title}
                        </span>
                      </div>
                    </div>

                    <span className="ink-stamp ink-stamp-completed text-xs">
                      {item.completedCount} SCHOLAR{item.completedCount > 1 ? "S" : ""} COMPLETED
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SCHOLAR USERS MANAGEMENT */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="font-serif-archive text-2xl font-bold text-white">
              REGISTERED SCHOLARS CRUD MANAGEMENT
            </h2>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  setCreateUserModalOpen(true);
                  setCreateUserError("");
                  setCreateUserSuccess("");
                }}
                className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono-archive font-bold text-xs uppercase flex items-center gap-1.5 transition-colors shadow"
              >
                <UserPlus className="w-4 h-4" />
                <span>CREATE NEW SCHOLAR</span>
              </button>

              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search scholars by name or email..."
                  className="w-full bg-[#14161a] border border-[#282c37] focus:border-amber-500 rounded px-3 py-2 pl-9 text-xs text-white font-mono-archive focus:outline-none"
                />
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          <div className="archive-card overflow-hidden border border-[#232730]">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono-archive text-xs">
                <thead className="bg-[#15171c] text-zinc-400 border-b border-[#232730] uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Scholar</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Joined Date</th>
                    <th className="p-4">Completed Topics</th>
                    <th className="p-4">Notes (Pub / Priv)</th>
                    <th className="p-4">Active Topic Draw</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e222b]">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#15171b] transition-colors">
                      <td className="p-4">
                        <span className="font-serif-archive font-bold text-white block text-sm">
                          {u.name}
                        </span>
                        <span className="text-zinc-400 text-[11px]">{u.email}</span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                            u.role === "admin"
                              ? "bg-amber-950/60 border-amber-600 text-amber-400"
                              : "bg-zinc-900 border-zinc-700 text-zinc-400"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="p-4 text-zinc-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="p-4">
                        <span className="text-emerald-400 font-bold">{u.completedCount}</span>
                      </td>

                      <td className="p-4">
                        <span className="text-white font-bold">{u.notesCount}</span>{" "}
                        <span className="text-zinc-400 text-[10px]">
                          ({u.publicNotesCount} public)
                        </span>
                      </td>

                      <td className="p-4">
                        {u.activeDrawTopic ? (
                          <div className="flex items-center gap-2">
                            <span className="text-amber-400 text-[11px] truncate max-w-[180px] font-serif-archive">
                              {u.activeDrawTopic}
                            </span>
                            <button
                              onClick={() => handleResetUserDraw(u.id, u.email)}
                              className="text-zinc-400 hover:text-white p-1"
                              title="Reset user active draw"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-400 text-[10px]">—</span>
                        )}
                      </td>

                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleRole(u.id, u.role)}
                          className="px-2.5 py-1 rounded bg-[#1e222b] hover:bg-[#282d39] text-zinc-300 hover:text-white border border-[#2f3442] text-[10px]"
                        >
                          {u.role === "admin" ? "REVOKE ADMIN" : "MAKE ADMIN"}
                        </button>

                        {u.id !== session?.user?.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            className="px-2.5 py-1 rounded bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-800 text-[10px] font-bold"
                          >
                            DELETE
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GLOBAL NOTES STORAGE MANAGEMENT */}
      {activeTab === "notes" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="font-serif-archive text-2xl font-bold text-white">
                GLOBAL NOTES STORAGE OVERSIGHT
              </h2>
              <p className="font-mono-archive text-xs text-zinc-400">
                Inspect or delete any research note on the platform
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={noteSearch}
                onChange={(e) => setNoteSearch(e.target.value)}
                placeholder="Search by topic, caption, or author..."
                className="w-full bg-[#14161a] border border-[#282c37] focus:border-amber-500 rounded px-3 py-2 pl-9 text-xs text-white font-mono-archive focus:outline-none"
              />
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((n) => (
              <div key={n.id} className="archive-card flex flex-col justify-between overflow-hidden">
                <div className="h-44 bg-[#0a0b0d] relative overflow-hidden border-b border-[#22252f]">
                  {n.imageUrls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={n.imageUrls[0]}
                      alt={n.topic.title}
                      className="w-full h-full object-cover opacity-90 cursor-pointer hover:opacity-100"
                      onClick={() => setSelectedNote(n)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 font-mono-archive text-xs">
                      [ABSTRACT SUMMARY ONLY]
                    </div>
                  )}

                  <span
                    className={`absolute top-2 right-2 ink-stamp ${
                      n.visibility === "public" ? "ink-stamp-public" : "ink-stamp-private"
                    }`}
                  >
                    {n.visibility.toUpperCase()}
                  </span>

                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono-archive text-zinc-300">
                    {n.imageUrls.length} PAGE{n.imageUrls.length > 1 ? "S" : ""}
                  </span>
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="font-mono-archive text-[10px] text-amber-400 uppercase tracking-widest block truncate">
                      {n.topic.category}
                    </span>
                    <h3 className="font-serif-archive font-bold text-white text-base line-clamp-2">
                      {n.topic.title}
                    </h3>
                    <p className="font-mono-archive text-[11px] text-zinc-400">
                      BY: <span className="text-zinc-200 font-bold">{n.user.name}</span> ({n.user.email})
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#22252f] flex items-center justify-between font-mono-archive text-xs">
                    <button
                      onClick={() => setSelectedNote(n)}
                      className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>INSPECT NOTE</span>
                    </button>

                    <button
                      onClick={() => handleDeleteNoteAdmin(n.id)}
                      className="px-2.5 py-1 rounded bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-400 font-bold text-[10px] flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>DELETE</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: OWNER PASSKEY GENERATOR */}
      {activeTab === "passkey" && (
        <div className="archive-card p-6 border border-[#2b303d] space-y-6 max-w-2xl mx-auto font-mono-archive text-xs">
          <div className="pb-4 border-b border-[#232730] space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-amber-950/50 text-amber-400 border border-amber-800/60 uppercase font-bold text-[10px]">
              <Key className="w-3.5 h-3.5" />
              <span>OWNER SECRET KEY MANAGER</span>
            </div>
            <h2 className="font-serif-archive text-2xl font-bold text-white">
              CRYPTOGRAPHIC OWNER PASSKEY
            </h2>
            <p className="text-zinc-400">
              Manage or generate the Master Secret Key required to provision Owner accounts.
            </p>
          </div>

          {keyMsg && (
            <div className="p-3 rounded bg-amber-950/60 border border-amber-800/80 text-amber-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{keyMsg}</span>
            </div>
          )}

          {/* Active Key Display */}
          <div className="bg-[#121418] p-4 rounded border border-[#282c38] space-y-2">
            <span className="text-zinc-400 uppercase text-[10px]">CURRENT ACTIVE OWNER PASSKEY:</span>
            <div className="flex items-center justify-between bg-black p-3 rounded border border-zinc-800 text-amber-400 font-mono text-sm tracking-wider font-bold">
              <span>{activeOwnerKey || "No key set"}</span>
              <button
                onClick={() => navigator.clipboard.writeText(activeOwnerKey)}
                className="px-2 py-1 rounded bg-[#1e222b] text-zinc-300 hover:text-white text-[10px] border border-zinc-700"
              >
                COPY KEY
              </button>
            </div>
            {keyUpdatedAt && (
              <span className="text-[10px] text-zinc-500 block">
                Last updated: {new Date(keyUpdatedAt).toLocaleString()}
              </span>
            )}
          </div>

          {/* Key Actions */}
          <div className="space-y-4 pt-4 border-t border-[#232730]">
            <h3 className="font-serif-archive text-base font-bold text-white">UPDATE OWNER PASSKEY</h3>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleUpdateOwnerKey(true)}
                disabled={updatingKey}
                className="w-full py-3 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{updatingKey ? "GENERATING..." : "GENERATE RANDOM CRYPTOGRAPHIC 32-CHAR KEY"}</span>
              </button>

              <div className="relative flex items-center justify-center text-zinc-600 my-2">
                <div className="border-t border-[#222530] w-full"></div>
                <span className="bg-[#15171a] px-3 text-[10px] uppercase">OR SET CUSTOM KEY</span>
                <div className="border-t border-[#222530] w-full"></div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPasskeyInput}
                  onChange={(e) => setCustomPasskeyInput(e.target.value)}
                  placeholder="Enter custom owner secret key (min 8 chars)..."
                  className="flex-1 bg-[#121418] border border-[#282c38] focus:border-amber-500 rounded p-2.5 text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateOwnerKey(false)}
                  disabled={updatingKey || !customPasskeyInput}
                  className="px-5 py-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase disabled:opacity-50"
                >
                  SAVE KEY
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DATABASE EXPLORER & SQL CONSOLE */}
      {activeTab === "database" && (
        <div className="space-y-8 font-mono-archive text-xs">
          {/* Table Selector & Counts Header */}
          <div className="archive-card p-6 border border-[#2b303d] space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#232730] pb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-400" />
                <h2 className="font-serif-archive text-xl font-bold text-white">DATABASE TABLES EXPLORER</h2>
              </div>
              <span className="text-zinc-400 text-[11px]">SQLite Direct Access</span>
            </div>

            {/* Table Selector Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {dbTables.map((tbl) => (
                <button
                  key={tbl}
                  onClick={() => setSelectedDbTable(tbl)}
                  className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                    selectedDbTable === tbl
                      ? "bg-amber-500 text-zinc-950 font-bold shadow"
                      : "bg-[#121418] text-zinc-400 hover:text-white border border-[#252834]"
                  }`}
                >
                  <span>{tbl}</span>
                  <span className="px-1.5 py-0.2 rounded bg-black/60 text-[10px] font-mono">
                    {dbCounts[tbl] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Raw Table Grid */}
          <div className="archive-card overflow-hidden border border-[#2b303d] space-y-2 p-4">
            <div className="flex items-center justify-between border-b border-[#232730] pb-3">
              <h3 className="font-serif-archive text-base font-bold text-white">
                TABLE: <span className="text-amber-400">{selectedDbTable}</span> ({dbRows.length} ROWS)
              </h3>
              <button
                onClick={() => fetchDbTableData(selectedDbTable)}
                className="px-3 py-1 rounded bg-[#1c1f28] hover:bg-[#262a37] text-zinc-300 hover:text-white border border-[#2e3342] text-[10px] flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>REFRESH TABLE</span>
              </button>
            </div>

            {loadingDbRows ? (
              <div className="py-12 text-center text-zinc-400">Loading table records...</div>
            ) : dbRows.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">No records found in table {selectedDbTable}.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] whitespace-nowrap">
                  <thead className="bg-[#121418] text-amber-400 uppercase text-[10px] border-b border-[#232730]">
                    <tr>
                      <th className="p-3">Actions</th>
                      {Object.keys(dbRows[0] || {}).map((col) => (
                        <th key={col} className="p-3">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1d2029]">
                    {dbRows.map((row, idx) => {
                      const rowId = (row as { id?: string }).id;
                      return (
                        <tr key={idx} className="hover:bg-[#15171c] transition-colors">
                          <td className="p-3">
                            {rowId ? (
                              <button
                                onClick={() => handleDeleteDbRecord(selectedDbTable, rowId)}
                                className="p-1 rounded bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-400"
                                title="Delete Row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                          {Object.entries(row as Record<string, unknown>).map(([colKey, val]) => (
                            <td key={colKey} className="p-3 text-zinc-300 max-w-xs truncate">
                              {typeof val === "object" && val !== null
                                ? JSON.stringify(val)
                                : String(val ?? "NULL")}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SQL Console */}
          <div className="archive-card p-6 border border-[#2b303d] space-y-4">
            <div className="flex items-center justify-between border-b border-[#232730] pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif-archive text-lg font-bold text-white">RAW SQL QUERY RUNNER</h3>
              </div>
              <span className="text-zinc-500 text-[10px]">Execute Raw Database Commands</span>
            </div>

            {sqlError && (
              <div className="p-3 rounded bg-red-950/60 border border-red-800/80 text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{sqlError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteSql} className="space-y-3">
              <textarea
                rows={3}
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                placeholder="Enter SQL command (e.g. SELECT * FROM User;)"
                className="w-full bg-black border border-[#2c313f] focus:border-amber-500 rounded p-3 text-xs text-amber-300 font-mono focus:outline-none"
              ></textarea>

              <button
                type="submit"
                disabled={executingSql || !sqlQuery.trim()}
                className="px-6 py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold uppercase disabled:opacity-50 flex items-center gap-2 shadow"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{executingSql ? "EXECUTING..." : "EXECUTE SQL QUERY"}</span>
              </button>
            </form>

            {/* SQL Results */}
            {Boolean(sqlResult) && (
              <div className="pt-4 border-t border-[#232730] space-y-2">
                <span className="text-zinc-400 uppercase text-[10px] block">QUERY EXECUTION RESULTS:</span>
                <pre className="bg-black p-4 rounded border border-[#2b303d] text-emerald-400 text-[11px] overflow-x-auto max-h-72 font-mono">
                  {JSON.stringify(sqlResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {createUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121418] border border-[#2d323e] rounded-lg max-w-md w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setCreateUserModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded bg-[#1b1e25]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pb-4 border-b border-[#232730]">
              <h2 className="font-serif-archive text-xl font-bold text-white">CREATE NEW SCHOLAR ACCOUNT</h2>
              <p className="font-mono-archive text-xs text-zinc-400">Provision account from Admin Portal</p>
            </div>

            {createUserError && (
              <div className="p-3 rounded bg-red-950/60 border border-red-800/80 text-red-400 text-xs font-mono-archive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createUserError}</span>
              </div>
            )}

            {createUserSuccess && (
              <div className="p-3 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-mono-archive flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{createUserSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 font-mono-archive text-xs">
              <div className="space-y-1">
                <label className="text-zinc-300">FULL NAME / SCHOLAR ALIAS</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Hypatia"
                  className="w-full bg-[#171a20] border border-[#2c313f] rounded p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-300">EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="scholar@thedraw.archive"
                  className="w-full bg-[#171a20] border border-[#2c313f] rounded p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-300">INITIAL PASSWORD (MIN 6 CHARS)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#171a20] border border-[#2c313f] rounded p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-300">ASSIGNED ROLE</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as "user" | "admin")}
                  className="w-full bg-[#171a20] border border-[#2c313f] rounded p-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="user">USER (Standard Scholar)</option>
                  <option value="admin">ADMIN (Platform Owner)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#232730]">
                <button
                  type="button"
                  onClick={() => setCreateUserModalOpen(false)}
                  className="px-4 py-2 rounded border border-[#2b303c] text-zinc-400 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-6 py-2 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold uppercase disabled:opacity-50"
                >
                  {creatingUser ? "CREATING..." : "CREATE SCHOLAR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Inspection Modal */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8">
          <div className="flex items-center justify-between text-white font-mono-archive text-xs border-b border-zinc-800 pb-4">
            <div>
              <span className="text-amber-400 uppercase tracking-widest">{selectedNote.topic.category}</span>
              <h3 className="font-serif-archive text-lg font-bold text-white">{selectedNote.topic.title}</h3>
              <span className="text-zinc-400">Author: {selectedNote.user.name} ({selectedNote.user.email})</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDeleteNoteAdmin(selectedNote.id)}
                className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>DELETE THIS NOTE</span>
              </button>
              <button
                onClick={() => setSelectedNote(null)}
                className="p-2 rounded bg-zinc-800 text-zinc-300 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-4 relative overflow-auto">
            {selectedNote.imageUrls.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                {selectedNote.imageUrls.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt={`Page ${i + 1}`}
                    className="max-h-[60vh] object-contain rounded border border-zinc-700 shadow-xl"
                  />
                ))}
              </div>
            ) : (
              <p className="text-zinc-400 font-mono-archive">No image scans attached to this note.</p>
            )}

            {selectedNote.caption && (
              <p className="mt-4 text-center font-mono-archive text-xs text-zinc-300 max-w-xl bg-zinc-900/80 p-3 rounded border border-zinc-800">
                &ldquo;{selectedNote.caption}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
