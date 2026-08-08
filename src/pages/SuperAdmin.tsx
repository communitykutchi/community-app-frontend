import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import UserAvatar from "../components/UserAvatar";
import Toast from "../components/Toast";

type UserRole = "super_admin" | "admin" | "moderator" | "member";

interface UserItem {
  _id: string;
  fullName: string;
  username?: string;
  mobile?: string;
  email?: string;
  role: UserRole;
  jamaat?: string;
  profilePhotoUrl?: string;
  isBanned?: boolean;
  bannedUntil?: string;
  banDuration?: string;
  createdAt?: string;
}

interface MediaItem {
  url: string;
  type?: string;
}

interface PostItem {
  _id: string;
  text?: string;
  content?: string;
  authorName?: string;
  authorPhotoUrl?: string;
  createdAt?: string;
  likes?: number;
  comments?: number;
  media?: MediaItem[];
  mediaUrls?: string[];
}

const configuredApiBase = import.meta.env.VITE_API_URL || "https://backend.kutchicommunity.com";
const apiOrigin = (() => {
  try {
    const fallbackOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    return new URL(configuredApiBase, fallbackOrigin).origin;
  } catch {
    return "https://backend.kutchicommunity.com";
  }
})();

const getMediaUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) {
    try {
      const mediaUrl = new URL(url);
      if (mediaUrl.hostname === "localhost" || mediaUrl.hostname === "127.0.0.1") {
        return `${apiOrigin}${mediaUrl.pathname}${mediaUrl.search}`;
      }
      return mediaUrl.toString();
    } catch {
      return url;
    }
  }
  return url.startsWith("/") ? `${apiOrigin}${url}` : `${apiOrigin}/${url}`;
};

interface ReportItem {
  _id: string;
  reporterName: string;
  targetType: "post" | "user" | "notice" | "poll" | "job";
  targetId?: string;
  reason: string;
  createdAt: string;
  status: "pending" | "resolved" | "dismissed";
}

interface AnalyticsData {
  totalUsers: number;
  bannedUsers: number;
  superAdminsCount: number;
  moderatorsCount: number;
  membersCount: number;
  totalPosts: number;
  totalJamaats: number;
}

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserItem | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "posts" | "jamaats" | "reports" | "security">("overview");

  const [users, setUsers] = useState<UserItem[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [jamaats, setJamaats] = useState<string[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState<"all" | "pending" | "resolved">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "super_admin" | "admin" | "moderator" | "member" | "banned">("all");
  const [jamaatInput, setJamaatInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; isVisible: boolean }>({
    message: "",
    type: "success",
    isVisible: false,
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type, isVisible: true });
  };

  // Modals state
  const [rolePickerUser, setRolePickerUser] = useState<UserItem | null>(null);
  const [userToBan, setUserToBan] = useState<UserItem | null>(null);
  const [banDuration, setBanDuration] = useState<"1day" | "1week" | "1month" | "1year" | "permanent">("permanent");
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [postToDelete, setPostToDelete] = useState<PostItem | null>(null);
  const [jamaatToDelete, setJamaatToDelete] = useState<string | null>(null);
  const [reportToDelete, setReportToDelete] = useState<ReportItem | null>(null);
  const [forceLogoutModal, setForceLogoutModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [openActionUserId, setOpenActionUserId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".member-action-dropdown")) {
        setOpenActionUserId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    API.get<{ user?: UserItem }>("/auth/me")
      .then((res) => {
        const u = res.data?.user;
        if (!u || u.role !== "super_admin") {
          navigate("/admin");
          return;
        }
        setCurrentUser(u);
        loadAllData();
      })
      .catch(() => {
        navigate("/login");
      });
  }, [navigate]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [usersRes, postsRes, groupsRes, reportsRes, analyticsRes] = await Promise.all([
        API.get<{ success: boolean; users: UserItem[] }>("/auth/users"),
        API.get<PostItem[]>("/posts/all").catch(() => ({ data: [] })),
        API.get<{ groups: Array<{ name: string }> }>("/auth/groups").catch(() => ({ data: { groups: [] } })),
        API.get<{ success: boolean; reports: ReportItem[] }>("/auth/reports").catch(() => ({ data: { reports: [] } })),
        API.get<{ success: boolean; analytics: AnalyticsData }>("/auth/analytics").catch(() => ({ data: null })),
      ]);

      if (usersRes.data?.success && Array.isArray(usersRes.data.users)) {
        setUsers(usersRes.data.users);
      }
      if (Array.isArray(postsRes.data)) {
        setPosts(postsRes.data);
      }
      if (groupsRes.data?.groups) {
        setJamaats(groupsRes.data.groups.map((g) => g.name));
      }
      if (reportsRes.data?.reports) {
        setReports(reportsRes.data.reports);
      }
      if (analyticsRes.data?.analytics) {
        setAnalytics(analyticsRes.data.analytics);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to load super admin data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, nextRole: UserRole) => {
    setActionLoading(true);
    try {
      await API.put(`/auth/users/${userId}/role`, { role: nextRole });
      showToast(`User role updated to ${nextRole.replace("_", " ").toUpperCase()}.`, "success");
      setRolePickerUser(null);
      await loadAllData();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Role update failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!userToBan) return;
    setActionLoading(true);
    try {
      await API.put(`/auth/users/${userToBan._id}/ban`, { isBanned: true, duration: banDuration });
      showToast(`Member ${userToBan.fullName} suspended (${banDuration.toUpperCase()}).`, "success");
      setUserToBan(null);
      await loadAllData();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Ban failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    setActionLoading(true);
    try {
      await API.put(`/auth/users/${userId}/ban`, { isBanned: false });
      showToast("Account unsuspended successfully.", "success");
      await loadAllData();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Unban failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setActionLoading(true);
    try {
      await API.delete(`/auth/users/${userToDelete._id}`);
      showToast(`User ${userToDelete.fullName} and their data were deleted permanently.`, "success");
      setUserToDelete(null);
      await loadAllData();
    } catch (err: any) {
      showToast(err.response?.data?.message || "User removal failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    setActionLoading(true);
    try {
      await API.delete(`/posts/${postToDelete._id}`);
      showToast("Feed post removed successfully.", "success");
      setPostToDelete(null);
      await loadAllData();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Post removal failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddJamaat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jamaatInput.trim()) return;
    setActionLoading(true);
    try {
      await API.post("/auth/groups", { name: jamaatInput.trim() });
      showToast(`Jamaat "${jamaatInput.trim()}" added successfully.`, "success");
      setJamaatInput("");
      await loadAllData();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to add Jamaat.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteJamaat = async () => {
    if (!jamaatToDelete) return;
    setActionLoading(true);
    try {
      await API.delete(`/auth/groups/${encodeURIComponent(jamaatToDelete)}`);
      showToast(`Jamaat "${jamaatToDelete}" deleted permanently.`, "success");
      setJamaatToDelete(null);
      await loadAllData();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to delete Jamaat.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveReport = async (reportId: string, status: "resolved" | "dismissed" = "resolved") => {
    setActionLoading(true);
    try {
      await API.put(`/auth/reports/${reportId}/resolve`, { status });
      showToast(`Report marked as ${status}.`, "success");
      await loadAllData();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update report.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!reportToDelete) return;
    setActionLoading(true);
    try {
      await API.delete(`/auth/reports/${reportToDelete._id}`);
      showToast("Report removed from system.", "success");
      setReportToDelete(null);
      await loadAllData();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to delete report.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceLogoutAll = async () => {
    setActionLoading(true);
    try {
      await API.post("/auth/force-logout-all");
      showToast("Emergency Force Logout executed across all active sessions.", "success");
      setForceLogoutModal(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Force logout failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter === "banned" && !u.isBanned) return false;
      if (roleFilter !== "all" && roleFilter !== "banned" && u.role !== roleFilter) return false;

      if (!q) return true;
      return (
        u.fullName?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.mobile?.toLowerCase().includes(q) ||
        u.jamaat?.toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  const filteredPosts = useMemo(() => {
    const q = postSearch.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        p.text?.toLowerCase().includes(q) ||
        p.authorName?.toLowerCase().includes(q)
    );
  }, [posts, postSearch]);

  const filteredReports = useMemo(() => {
    if (reportStatusFilter === "all") return reports;
    return reports.filter((r) => r.status === reportStatusFilter);
  }, [reports, reportStatusFilter]);

  const stats = useMemo(() => {
    const total = analytics?.totalUsers || users.length;
    const superAdmins = users.filter((u) => u.role === "super_admin").length;
    const admins = users.filter((u) => u.role === "admin").length;
    const mods = users.filter((u) => u.role === "moderator").length;
    const members = users.filter((u) => u.role === "member").length;
    const banned = users.filter((u) => u.isBanned).length;
    const pendingReports = reports.filter((r) => r.status === "pending").length;
    return {
      total,
      superAdmins,
      admins,
      mods,
      members,
      banned,
      postsCount: posts.length,
      jamaatsCount: jamaats.length,
      pendingReportsCount: pendingReports,
    };
  }, [users, posts, jamaats, reports, analytics]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl py-12 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        <p className="mt-4 text-xs font-bold text-slate-500">Loading Super Admin Control Center...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast((t) => ({ ...t, isVisible: false }))} />

      {/* Super Admin Control Center Header */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-800 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 px-6 py-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300 border border-amber-500/30">
                <img src="/logo.png" alt="Logo" className="h-4 w-4 object-contain" />
                <span>ROOT SUPER ADMIN ACCESS</span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl text-white">Super Admin Control Center</h1>
              <p className="mt-1 text-xs text-slate-300">Complete platform authority, user permissions, ban controls, content moderation, and emergency operations.</p>
            </div>

            <button
              onClick={() => setForceLogoutModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 transition active:scale-95 shrink-0"
            >
              🚨 Force Logout All Sessions
            </button>
          </div>

          {/* Tab Selection */}
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { id: "overview", label: "📊 System Analytics", badge: null },
              { id: "members", label: "👥 All Members & Roles", badge: users.length },
              { id: "posts", label: "📰 Content Moderation", badge: posts.length },
              { id: "jamaats", label: "🏰 Jamaat Groups", badge: jamaats.length },
              { id: "reports", label: "🚩 Live Reports", badge: stats.pendingReportsCount },
              { id: "security", label: "🛡️ Security & Emergency", badge: null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`rounded-xl px-4 py-2 text-xs font-extrabold transition flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/30"
                    : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${activeTab === tab.id ? "bg-white text-teal-800" : "bg-white/20 text-white"}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-2xl">👥</span>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">{stats.total}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Members</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-2xl">👑</span>
              <p className="mt-2 text-2xl font-extrabold text-amber-600">{stats.superAdmins}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Super Admins</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-2xl">🛡️</span>
              <p className="mt-2 text-2xl font-extrabold text-teal-600">{stats.admins + stats.mods}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Admins & Mods</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-2xl">🚫</span>
              <p className="mt-2 text-2xl font-extrabold text-rose-600">{stats.banned}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Banned Accounts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Super Admin Capabilities</h3>
              <ul className="space-y-2 text-xs text-slate-600 font-medium">
                <li className="flex items-center gap-2">✅ Promote/Demote any user to Super Admin, Admin, Moderator, or Member.</li>
                <li className="flex items-center gap-2">✅ Suspend accounts for 1 Day, 1 Week, 1 Month, 1 Year, or Permanently.</li>
                <li className="flex items-center gap-2">✅ Execute Emergency Force Logout on all active user sessions across mobile & web.</li>
                <li className="flex items-center gap-2">✅ Manage Jamaat branches & delete harmful feed posts across the platform.</li>
                <li className="flex items-center gap-2">✅ Review and resolve reported posts and profiles from community members.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 mb-2">Switch to Standard Admin View</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Looking for standard Jamaat notices moderation and community inquiries? You can also switch to the standard Admin Panel.
                </p>
              </div>
              <Link
                to="/admin"
                className="mt-4 block text-center rounded-xl bg-slate-900 py-3 text-xs font-extrabold text-white hover:bg-slate-800 transition"
              >
                Go to Admin Panel →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MEMBERS TAB */}
      {activeTab === "members" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, username, email, phone, or jamaat..."
              className="w-full sm:w-80 rounded-xl border border-slate-300 px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-teal-500"
            />
            <div className="flex flex-wrap gap-1.5">
              {(["all", "super_admin", "admin", "moderator", "member", "banned"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition ${
                    roleFilter === r ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {r.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Card List (sm:hidden) */}
          <div className="space-y-3 sm:hidden">
            {filteredUsers.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 font-medium">
                No members matching criteria.
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div key={u._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar name={u.fullName} photoUrl={u.profilePhotoUrl} size="md" />
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900 text-sm truncate">{u.fullName}</p>
                        <p className="text-xs text-slate-400 truncate">@{u.username || "user"}</p>
                        <p className="text-[11px] text-slate-500 truncate">{u.mobile || u.email || "No contact"}</p>
                      </div>
                    </div>

                    <div className="relative shrink-0 member-action-dropdown">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionUserId((prev) => (prev === u._id ? null : u._id));
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-700 shadow-sm hover:bg-teal-50 hover:border-teal-500 transition active:scale-95"
                      >
                        <span>⚙️ Actions</span>
                        <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${openActionUserId === u._id ? 'rotate-180 text-teal-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {openActionUserId === u._id && (
                        <div className="absolute right-0 top-full mt-1.5 z-50 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 text-xs shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionUserId(null);
                              setRolePickerUser(u);
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-bold text-slate-700 hover:bg-slate-100 transition"
                          >
                            <span>⚙️ Change Role</span>
                          </button>

                          {u.isBanned ? (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionUserId(null);
                                handleUnbanUser(u._id);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-bold text-emerald-700 hover:bg-emerald-50 transition"
                            >
                              <span>🟢 Lift Suspension</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionUserId(null);
                                setUserToBan(u);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-bold text-amber-700 hover:bg-amber-50 transition"
                            >
                              <span>🚫 Ban / Suspend</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionUserId(null);
                              setUserToDelete(u);
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-bold text-rose-600 hover:bg-rose-50 transition border-t border-slate-100 mt-1 pt-2"
                          >
                            <span>🗑️ Delete Account</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <span className="font-bold text-slate-600">Jamaat: {u.jamaat || "General"}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase border ${
                        u.role === "super_admin"
                          ? "bg-amber-50 text-amber-700 border-amber-300"
                          : u.role === "admin"
                          ? "bg-teal-50 text-teal-700 border-teal-300"
                          : u.role === "moderator"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-300"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}>
                        {u.role.replace("_", " ")}
                      </span>
                      {u.isBanned ? (
                        <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-extrabold text-rose-700 border border-rose-200">
                          Banned ({u.banDuration || "Temp"})
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (hidden sm:block) */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold">
                <tr>
                  <th className="p-3.5">Member</th>
                  <th className="p-3.5">Jamaat</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                      No members matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/50">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={u.fullName} photoUrl={u.profilePhotoUrl} size="sm" />
                          <div>
                            <p className="font-extrabold text-slate-900">{u.fullName}</p>
                            <p className="text-[11px] text-slate-400">@{u.username || "user"} • {u.mobile || u.email || "No contact"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-slate-600">{u.jamaat || "General"}</td>
                      <td className="p-3.5">
                        <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase border ${
                          u.role === "super_admin"
                            ? "bg-amber-50 text-amber-700 border-amber-300"
                            : u.role === "admin"
                            ? "bg-teal-50 text-teal-700 border-teal-300"
                            : u.role === "moderator"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-300"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          {u.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {u.isBanned ? (
                          <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-extrabold text-rose-700 border border-rose-200">
                            Banned ({u.banDuration || "Temp"})
                          </span>
                        ) : (
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="relative inline-block text-left member-action-dropdown">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionUserId((prev) => (prev === u._id ? null : u._id));
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700 shadow-sm hover:border-teal-500 hover:bg-teal-50 transition active:scale-95"
                          >
                            <span>⚙️ Actions</span>
                            <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${openActionUserId === u._id ? 'rotate-180 text-teal-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {openActionUserId === u._id && (
                            <div className="absolute right-0 mt-1.5 z-50 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 text-xs shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionUserId(null);
                                  setRolePickerUser(u);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-bold text-slate-700 hover:bg-slate-100 transition"
                              >
                                <span>⚙️ Change Role</span>
                              </button>

                              {u.isBanned ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionUserId(null);
                                    handleUnbanUser(u._id);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-bold text-emerald-700 hover:bg-emerald-50 transition"
                                >
                                  <span>🟢 Lift Ban</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionUserId(null);
                                    setUserToBan(u);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-bold text-amber-700 hover:bg-amber-50 transition"
                                >
                                  <span>🚫 Ban / Suspend</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionUserId(null);
                                  setUserToDelete(u);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-bold text-rose-600 hover:bg-rose-50 transition border-t border-slate-100 mt-1 pt-1.5"
                              >
                                <span>🗑️ Delete Member</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POSTS MODERATION TAB */}
      {activeTab === "posts" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Feed Content Moderation</h3>
              <p className="text-xs text-slate-500">Monitor and delete inappropriate community posts.</p>
            </div>
            <input
              type="text"
              value={postSearch}
              onChange={(e) => setPostSearch(e.target.value)}
              placeholder="Filter posts by text or author..."
              className="w-full sm:w-72 rounded-xl border border-slate-300 px-4 py-2 text-xs outline-none focus:border-teal-500"
            />
          </div>

          {filteredPosts.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-slate-400">
              No posts found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPosts.map((p) => {
                const mediaItems: MediaItem[] = p.media && p.media.length > 0
                  ? p.media
                  : (p.mediaUrls || []).map((u) => ({ url: u }));

                return (
                  <div key={p._id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={p.authorName || "Author"} photoUrl={p.authorPhotoUrl} size="sm" />
                          <div>
                            <p className="text-xs font-extrabold text-slate-900">{p.authorName || "Community Member"}</p>
                            <p className="text-[10px] text-slate-400">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "Recent"}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(`/feed?postId=${p._id}`)}
                          className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-100 border border-teal-200/80 transition"
                          title="View post in community feed"
                        >
                          👁️ View Post
                        </button>
                      </div>

                      {p.text && <p className="mt-3 text-xs text-slate-700 leading-relaxed line-clamp-3">{p.text}</p>}

                      {/* Post Media (Images & Videos) */}
                      {mediaItems.length > 0 && (
                        <div className={`mt-3 grid gap-2 ${mediaItems.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                          {mediaItems.map((item, idx) => {
                            const mediaUrl = getMediaUrl(item.url);
                            const isVideo = (item.type || "").startsWith("video/") || mediaUrl.match(/\.(mp4|mov|webm)(\?.*)?$/i);

                            return (
                              <div key={idx} className="relative overflow-hidden rounded-xl border border-slate-200 bg-black/5">
                                {isVideo ? (
                                  <video controls src={mediaUrl} className="max-h-44 w-full object-cover bg-black rounded-xl" />
                                ) : (
                                  <img
                                    src={mediaUrl}
                                    alt="Post media"
                                    className="max-h-44 w-full object-cover rounded-xl cursor-pointer hover:opacity-90 transition"
                                    onClick={() => window.open(mediaUrl, "_blank")}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-500">❤️ {p.likes || 0} Likes • 💬 {p.comments || 0} Comments</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/feed?postId=${p._id}`)}
                          className="rounded-lg bg-slate-200/80 px-2.5 py-1 text-[11px] font-bold text-slate-800 hover:bg-slate-300 transition"
                        >
                          Tap to View ↗
                        </button>
                        <button
                          onClick={() => setPostToDelete(p)}
                          className="rounded-lg bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-200 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* JAMAATS TAB */}
      {activeTab === "jamaats" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Jamaat Branches & Areas</h3>
            <p className="text-xs text-slate-500">Manage all registered Jamaat divisions for user profiles.</p>
          </div>

          <form onSubmit={handleAddJamaat} className="flex gap-3 max-w-md">
            <input
              type="text"
              value={jamaatInput}
              onChange={(e) => setJamaatInput(e.target.value)}
              placeholder="Enter new Jamaat / Area name..."
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-xs outline-none focus:border-teal-500"
            />
            <button
              type="submit"
              disabled={actionLoading}
              className="rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-teal-500 transition"
            >
              Add Jamaat
            </button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {jamaats.map((j) => (
              <div key={j} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 font-extrabold text-xs text-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span>🏰</span>
                  <span>{j}</span>
                </div>
                <button
                  onClick={() => setJamaatToDelete(j)}
                  className="text-slate-400 hover:text-rose-600 transition"
                  title="Delete Jamaat"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === "reports" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">User Content Reports</h3>
              <p className="text-xs text-slate-500">Review flagged posts, comments, and member profiles.</p>
            </div>
            <div className="flex gap-2">
              {(["all", "pending", "resolved"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setReportStatusFilter(st)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition ${
                    reportStatusFilter === st ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="p-12 text-center text-xs font-bold text-slate-400">
              🎉 No reports found matching filter.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((r) => (
                <div key={r._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-800">
                        {r.targetType}
                      </span>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                        r.status === "pending" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {r.status}
                      </span>
                      <span className="text-[11px] text-slate-400">Reported by <strong>{r.reporterName}</strong></span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-1">Reason: <span className="font-normal text-slate-700">{r.reason}</span></p>
                    {r.targetId && <p className="text-[10px] text-slate-400 font-mono">Target ID: {r.targetId}</p>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {r.status === "pending" && (
                      <button
                        onClick={() => handleResolveReport(r._id, "resolved")}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition"
                      >
                        Mark Resolved ✓
                      </button>
                    )}
                    <button
                      onClick={() => setReportToDelete(r)}
                      className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                    >
                      Delete Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECURITY TAB */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Platform Security & Emergency Protocol</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Super Admin root security controls allow immediate platform-wide session invalidation, protection of root admin credentials, and monitoring system rate limits.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <span className="text-2xl">🔒</span>
                <h4 className="text-xs font-black text-slate-900">JWT Token Security</h4>
                <p className="text-[11px] text-slate-500">Every session is validated against active user session IDs. Force Logout invalidates all existing user tokens instantly.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <span className="text-2xl">⚡</span>
                <h4 className="text-xs font-black text-slate-900">Rate Limiting</h4>
                <p className="text-[11px] text-slate-500">Brute-force protection enabled on /auth routes (max 15 requests/min per IP) and global API (100 req/min).</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <span className="text-2xl">🛡️</span>
                <h4 className="text-xs font-black text-slate-900">Super Admin Lock</h4>
                <p className="text-[11px] text-slate-500">Default Super Admin credentials are hard-protected from deletion or accidental privilege demotion.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <span className="text-3xl">🚨</span>
              <div>
                <h3 className="text-base font-extrabold">Emergency Red Button</h3>
                <p className="text-xs text-rose-600">Execute emergency actions when security breach or suspicious activity is detected.</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setForceLogoutModal(true)}
                className="rounded-xl bg-rose-600 px-6 py-3 text-xs font-extrabold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 transition active:scale-95"
              >
                🚨 Execute Force Logout Across All Devices
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}

      {/* Change Role Modal */}
      {rolePickerUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Change Role for {rolePickerUser.fullName}</h3>
            <div className="space-y-2">
              {(["admin", "moderator", "member"] as const).map((r) => (
                <button
                  key={r}
                  disabled={actionLoading}
                  onClick={() => handleUpdateRole(rolePickerUser._id, r)}
                  className={`w-full rounded-xl p-3 text-left text-xs font-extrabold capitalize transition ${
                    rolePickerUser.role === r ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  {r.replace("_", " ")}
                </button>
              ))}
            </div>
            <button onClick={() => setRolePickerUser(null)} className="w-full text-center text-xs font-bold text-slate-500 py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      {userToBan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Suspend Account: {userToBan.fullName}</h3>
            <p className="text-xs text-slate-500">Select suspension duration:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "1day", label: "1 Day" },
                { id: "1week", label: "1 Week" },
                { id: "1month", label: "1 Month" },
                { id: "1year", label: "1 Year" },
                { id: "permanent", label: "Permanent" },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setBanDuration(d.id as any)}
                  className={`rounded-xl p-2.5 text-xs font-extrabold transition ${
                    banDuration === d.id ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setUserToBan(null)} disabled={actionLoading} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-600">
                Cancel
              </button>
              <button onClick={handleBanUser} disabled={actionLoading} className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-md">
                {actionLoading ? "Banning..." : "Confirm Ban"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-base font-extrabold">Permanently Delete User Account</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900">"{userToDelete.fullName}"</strong>? All their posts, comments, likes, and profile data will be permanently removed from the community database.
            </p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setUserToDelete(null)} disabled={actionLoading} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-600">
                Cancel
              </button>
              <button onClick={handleDeleteUser} disabled={actionLoading} className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-md">
                {actionLoading ? "Deleting..." : "Delete Account Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Post Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="text-3xl">🗑️</span>
              <h3 className="text-base font-extrabold">Delete Feed Post</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove this post by <strong className="text-slate-900">{postToDelete.authorName || "Member"}</strong>?
            </p>
            <div className="rounded-xl bg-slate-100 p-3 text-xs text-slate-700 italic line-clamp-3">
              "{postToDelete.text || "No text content"}"
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setPostToDelete(null)} disabled={actionLoading} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-600">
                Cancel
              </button>
              <button onClick={handleDeletePost} disabled={actionLoading} className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-md">
                {actionLoading ? "Removing..." : "Remove Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Jamaat Modal */}
      {jamaatToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="text-3xl">🏰</span>
              <h3 className="text-base font-extrabold">Permanently Delete Jamaat</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900">"{jamaatToDelete}"</strong>? All members currently assigned to this Jamaat will be updated to <strong className="text-slate-900">General</strong>.
            </p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setJamaatToDelete(null)} disabled={actionLoading} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-600">
                Cancel
              </button>
              <button onClick={handleDeleteJamaat} disabled={actionLoading} className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-md">
                {actionLoading ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Report Modal */}
      {reportToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="text-3xl">🚩</span>
              <h3 className="text-base font-extrabold">Delete Report Entry</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove this report entry from the database?
            </p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setReportToDelete(null)} disabled={actionLoading} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-600">
                Cancel
              </button>
              <button onClick={handleDeleteReport} disabled={actionLoading} className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-md">
                {actionLoading ? "Deleting..." : "Delete Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force Logout Modal */}
      {forceLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="text-3xl">🚨</span>
              <h3 className="text-base font-extrabold">Emergency Force Logout All</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will immediately invalidate all active JWT tokens across all mobile apps and websites. Everyone will be required to log in again.
            </p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setForceLogoutModal(false)} disabled={actionLoading} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-600">
                Cancel
              </button>
              <button onClick={handleForceLogoutAll} disabled={actionLoading} className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-md">
                {actionLoading ? "Executing..." : "Execute Force Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
