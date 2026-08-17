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
    const fallbackOrigin = typeof window !== "undefined" && window.location?.origin ? window.location.origin : "https://backend.kutchicommunity.com";
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
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "moderator" | "member" | "banned">("all");
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
  const [promoteModalUser, setPromoteModalUser] = useState<UserItem | null>(null);
  const [userToBan, setUserToBan] = useState<UserItem | null>(null);
  const [banDuration, setBanDuration] = useState<"1day" | "1week" | "1month" | "1year" | "permanent">("permanent");
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [postToDelete, setPostToDelete] = useState<PostItem | null>(null);
  const [jamaatToDelete, setJamaatToDelete] = useState<string | null>(null);
  const [reportToDelete, setReportToDelete] = useState<ReportItem | null>(null);
  const [forceLogoutModal, setForceLogoutModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [openActionUserId, setOpenActionUserId] = useState<string | null>(null);

  // Password Lookup & Reset Feature State
  const [fetchQuery, setFetchQuery] = useState("");
  const [fetchedUser, setFetchedUser] = useState<any | null>(null);
  const [fetchingUser, setFetchingUser] = useState(false);
  const [newPasswordValue, setNewPasswordValue] = useState("123456");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [passwordResetModalUser, setPasswordResetModalUser] = useState<UserItem | null>(null);
  const [modalNewPassword, setModalNewPassword] = useState("123456");
  const [lastResetInfo, setLastResetInfo] = useState<{ user: string; pass: string } | null>(null);
  const [showPlainPassword, setShowPlainPassword] = useState(true);

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

  const handleFetchUser = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!fetchQuery.trim()) {
      showToast("Please enter an email, username, or phone.", "error");
      return;
    }
    setFetchingUser(true);
    setFetchedUser(null);
    setLastResetInfo(null);
    try {
      const res = await API.post("/auth/admin/fetch-user", { query: fetchQuery.trim() });
      if (res.data?.success && res.data.user) {
        setFetchedUser(res.data.user);
        setNewPasswordValue("123456");
        showToast(`Account found for ${res.data.user.fullName}!`, "success");
      } else {
        showToast(res.data?.message || "User not found.", "error");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Member account not found.", "error");
    } finally {
      setFetchingUser(false);
    }
  };

  const handleAdminResetPassword = async (userId: string, targetPassword?: string) => {
    const passwordToSet = targetPassword || newPasswordValue;
    if (!passwordToSet || passwordToSet.length < 4) {
      showToast("Password must be at least 4 characters.", "error");
      return;
    }
    setResettingPassword(true);
    try {
      const res = await API.post("/auth/admin/reset-password", {
        userId,
        newPassword: passwordToSet,
      });
      if (res.data?.success) {
        setLastResetInfo({
          user: res.data.user?.fullName || "Member",
          pass: passwordToSet,
        });
        showToast(res.data.message || "Password updated successfully!", "success");
        setPasswordResetModalUser(null);
        if (fetchedUser && fetchedUser._id === userId) {
          setFetchedUser({ ...fetchedUser, passwordStatus: `Updated to "${passwordToSet}"` });
        }
      } else {
        showToast(res.data?.message || "Failed to reset password.", "error");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to reset password.", "error");
    } finally {
      setResettingPassword(false);
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
      if (u.role === "super_admin") return false;
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
    const total = analytics?.totalUsers ?? users.filter((u) => u.role !== "super_admin").length;
    const superAdmins = analytics?.superAdminsCount ?? 1;
    const admins = users.filter((u) => u.role === "admin").length;
    const mods = users.filter((u) => u.role === "moderator").length;
    const members = users.filter((u) => u.role === "member").length;
    const banned = users.filter((u) => u.isBanned && u.role !== "super_admin").length;
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
      <div className="page-hero-banner relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 via-slate-900 to-amber-950/90 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative border-b border-slate-200 px-6 py-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300 border border-amber-400/30 shadow-sm">
                <img src="/logo.png" alt="Logo" className="h-4 w-4 object-contain" />
                <span>ROOT SUPER ADMIN ACCESS</span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl text-white">Super Admin Control Center</h1>
              <p className="mt-1 text-xs text-amber-100/90 leading-relaxed max-w-2xl">Complete platform authority, user permissions, ban controls, content moderation, and emergency operations.</p>
            </div>

            <button
              onClick={() => setForceLogoutModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/30 hover:bg-rose-500 transition active:scale-95 shrink-0 self-start whitespace-nowrap"
            >
              🚨 Force Logout All Sessions
            </button>
          </div>

          {/* Tab Selection */}
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { id: "overview", label: "📊 System Analytics", badge: null },
              { id: "members", label: "👥 All Members & Roles", badge: users.filter((u) => u.role !== "super_admin").length },
              { id: "posts", label: "📰 Content Moderation", badge: posts.length },
              { id: "jamaats", label: "🏰 Jamaat Groups", badge: jamaats.length },
              { id: "reports", label: "🚩 Live Reports", badge: stats.pendingReportsCount },
              { id: "security", label: "🛡️ Security & Emergency", badge: null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`rounded-xl px-4 py-2 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === tab.id
                    ? "active-green-btn bg-teal-600 !text-white shadow-md shadow-teal-600/30"
                    : "bg-white/10 text-white border border-white/20 hover:bg-white/25 hover:text-white"
                }`}
              >
                <span className="!text-white font-extrabold">{tab.label}</span>
                {tab.badge !== null && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${activeTab === tab.id ? "bg-white text-teal-900" : "bg-white/20 text-white"}`}>
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
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-md">
              <span className="text-2xl">👥</span>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">{stats.total}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Members</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-md">
              <span className="text-2xl">👑</span>
              <p className="mt-2 text-2xl font-extrabold text-amber-500">{stats.superAdmins}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Super Admins</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-md">
              <span className="text-2xl">🛡️</span>
              <p className="mt-2 text-2xl font-extrabold text-teal-600">{stats.admins + stats.mods}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Admins & Mods</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-md">
              <span className="text-2xl">🚫</span>
              <p className="mt-2 text-2xl font-extrabold text-rose-600">{stats.banned}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Banned Accounts</p>
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/notices"
              className="admin-nav-card rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-md flex items-center justify-between transition-all duration-200 hover:border-teal-500 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Post Notice & Mayyat</h4>
                <p className="text-xs text-slate-600">Publish alerts & Janaza announcements</p>
              </div>
              <span className="text-2xl">📢</span>
            </Link>
            <Link
              to="/polls"
              className="admin-nav-card rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-md flex items-center justify-between transition-all duration-200 hover:border-teal-500 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Create Community Poll</h4>
                <p className="text-xs text-slate-600">Start new decision voting</p>
              </div>
              <span className="text-2xl">🗳️</span>
            </Link>
            <Link
              to="/workers"
              className="admin-nav-card rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-md flex items-center justify-between transition-all duration-200 hover:border-teal-500 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Local Workers (کاریگر)</h4>
                <p className="text-xs text-slate-600">Manage local skilled workers</p>
              </div>
              <span className="text-2xl">🛠️</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm space-y-3">
              <h3 className="text-base font-black text-slate-900">Super Admin Capabilities</h3>
              <ul className="space-y-2 text-xs text-slate-600 font-medium">
                <li className="flex items-center gap-2">✅ Promote/Demote any user to Super Admin, Admin, Moderator, or Member.</li>
                <li className="flex items-center gap-2">✅ Suspend accounts for 1 Day, 1 Week, 1 Month, 1 Year, or Permanently.</li>
                <li className="flex items-center gap-2">✅ Execute Emergency Force Logout on all active user sessions across mobile & web.</li>
                <li className="flex items-center gap-2">✅ Manage Jamaat branches & delete harmful feed posts across the platform.</li>
                <li className="flex items-center gap-2">✅ Review and resolve reported posts and profiles from community members.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 mb-2">Switch to Standard Admin View</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Looking for standard Jamaat notices moderation and community inquiries? You can also switch to the standard Admin Panel.
                </p>
              </div>
              <Link
                to="/admin"
                className="mt-4 block text-center rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 py-3 text-xs font-extrabold text-white hover:from-teal-400 hover:to-emerald-500 transition shadow-md"
              >
                Go to Admin Panel →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MEMBERS TAB */}
      {activeTab === "members" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 text-slate-900 shadow-xl space-y-5">
          {/* Member Password Lookup & Direct Reset Control */}
          <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-50/70 via-white to-slate-50 p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-slate-950 text-base shadow-sm font-black">
                  🔑
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Member Password Lookup & Reset Control</h3>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Search any member by Email or Username to inspect details and instantly override their password.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleFetchUser} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={fetchQuery}
                  onChange={(e) => setFetchQuery(e.target.value)}
                  placeholder="Enter member's email, username, or phone number..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                />
              </div>
              <button
                type="submit"
                disabled={fetchingUser}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-black text-white shadow-md transition cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {fetchingUser ? (
                  <span>Fetching...</span>
                ) : (
                  <>
                    <span>🔍 Fetch Account</span>
                  </>
                )}
              </button>
            </form>

            {/* Fetched User Result Box */}
            {fetchedUser && (
              <div className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={fetchedUser.fullName} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-slate-950">{fetchedUser.fullName}</h4>
                        <span className="rounded-md px-2 py-0.5 text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                          {fetchedUser.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Username: <strong className="text-slate-800">@{fetchedUser.username}</strong> • Email: <strong className="text-slate-800">{fetchedUser.email}</strong>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Phone: {fetchedUser.mobile} • Jamaat: {fetchedUser.jamaat} • Status: {fetchedUser.passwordStatus}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPasswordResetModalUser(fetchedUser);
                      setModalNewPassword("123456");
                    }}
                    className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 shadow-md transition cursor-pointer active:scale-95 shrink-0"
                  >
                    🔑 Set / Override Password
                  </button>
                </div>

                {/* CURRENT PASSWORD STATUS & DECRYPTED VALUE */}
                {fetchedUser.currentPassword ? (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50/90 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white text-base shadow-sm font-black">
                        🔓
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                          Current Account Password (Decrypted)
                        </p>
                        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                          <code className="font-mono text-sm font-black text-emerald-950 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">
                            {showPlainPassword ? fetchedUser.currentPassword : "••••••••••••"}
                          </code>
                          <button
                            type="button"
                            onClick={() => setShowPlainPassword(!showPlainPassword)}
                            className="text-xs font-extrabold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                          >
                            {showPlainPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(fetchedUser.currentPassword);
                        showToast("Password copied to clipboard!", "success");
                      }}
                      className="rounded-lg bg-emerald-700 hover:bg-emerald-800 px-3.5 py-1.5 text-xs font-black text-white shadow-sm transition cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      📋 Copy Password
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-amber-900">
                      <span className="text-base">🔒</span>
                      <span>
                        Legacy Encrypted Hash (Bcrypt) • Click <strong>"⚡ Save Now"</strong> below to set a new password and enable continuous instant decryption.
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700 shrink-0">Set New Password:</span>
                  <input
                    type="text"
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    placeholder="Type new password (e.g. 123456)"
                    className="w-full sm:w-48 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 font-mono outline-none focus:border-amber-500"
                  />
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setNewPasswordValue("123456")}
                      className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition"
                    >
                      "123456"
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPasswordValue(`Kutchi@${Math.floor(1000 + Math.random() * 9000)}`)}
                      className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition"
                    >
                      🎲 Random
                    </button>
                    <button
                      type="button"
                      disabled={resettingPassword}
                      onClick={() => handleAdminResetPassword(fetchedUser._id, newPasswordValue)}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-black text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
                    >
                      {resettingPassword ? "Saving..." : "⚡ Save Now"}
                    </button>
                  </div>
                </div>

                {lastResetInfo && (
                  <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-2.5 text-xs text-emerald-900 font-bold flex items-center justify-between gap-2">
                    <span>
                      ✅ Password for {lastResetInfo.user} set to: <code className="bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-800 font-mono font-black">{lastResetInfo.pass}</code>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(lastResetInfo.pass);
                        showToast("Password copied to clipboard!", "success");
                      }}
                      className="rounded-md bg-emerald-700 hover:bg-emerald-800 px-2.5 py-1 text-[11px] font-extrabold text-white cursor-pointer"
                    >
                      📋 Copy Password
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, username, email, phone, or jamaat..."
              className="w-full sm:w-80 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
            />
            <div className="grid grid-cols-3 sm:flex flex-wrap gap-1.5 w-full sm:w-auto">
              {(["all", "admin", "moderator", "member", "banned"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`rounded-xl px-2.5 py-2 sm:px-3 sm:py-1.5 text-xs font-black capitalize transition cursor-pointer text-center ${
                    roleFilter === r
                      ? "bg-amber-500 text-slate-950 shadow-md"
                      : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
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
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500 font-semibold">
                No members matching criteria.
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div key={u._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      to={`/user/${u._id}`}
                      className="flex items-center gap-3 min-w-0 flex-1 group cursor-pointer"
                      title="View member profile"
                    >
                      <UserAvatar name={u.fullName} photoUrl={u.profilePhotoUrl} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-slate-950 text-sm truncate group-hover:text-amber-600 group-hover:underline transition">{u.fullName}</p>
                        <p className="text-[11px] font-semibold text-slate-500 truncate">@{u.username || "user"}</p>
                        <p className="text-[11px] font-medium text-slate-600 truncate">{u.mobile || u.email || "No contact"}</p>
                      </div>
                    </Link>

                    <div className="relative shrink-0 member-action-dropdown">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionUserId((prev) => (prev === u._id ? null : u._id));
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-black text-slate-800 shadow-2xs hover:border-amber-400 hover:bg-amber-50 transition active:scale-95 cursor-pointer"
                      >
                        <span>⚙️ Actions</span>
                        <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${openActionUserId === u._id ? 'rotate-180 text-amber-600' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-bold text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <span>⚙️ Change Role</span>
                          </button>

                          {u.role === "member" && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionUserId(null);
                                setPromoteModalUser(u);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-bold text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                            >
                              <span>🛡️ Promote to Mod</span>
                            </button>
                          )}

                          {u.isBanned ? (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionUserId(null);
                                handleUnbanUser(u._id);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-bold text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
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
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-bold text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                            >
                              <span>🚫 Ban / Suspend</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionUserId(null);
                              setPasswordResetModalUser(u);
                              setModalNewPassword("123456");
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-bold text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                          >
                            <span>🔑 Set / Reset Password</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionUserId(null);
                              setUserToDelete(u);
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-bold text-rose-600 hover:bg-rose-50 transition border-t border-slate-100 mt-1 pt-2 cursor-pointer"
                          >
                            <span>🗑️ Delete Account</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
                    <span className="font-bold text-slate-700 truncate text-[11px]">📍 {u.jamaat || "General"}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="inline-block rounded-md px-2 py-0.5 text-[10px] font-black uppercase bg-slate-100 border border-slate-300 text-slate-800">
                        {u.role.replace("_", " ")}
                      </span>
                      {u.isBanned ? (
                        <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700 uppercase border border-rose-200">
                          Banned ({u.banDuration || "Temp"})
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700 uppercase border border-emerald-200">
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
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-extrabold">
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
                    <tr key={u._id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5">
                        <Link
                          to={`/user/${u._id}`}
                          className="flex items-center gap-3 group cursor-pointer"
                          title="View member profile"
                        >
                          <UserAvatar name={u.fullName} photoUrl={u.profilePhotoUrl} size="sm" />
                          <div>
                            <p className="font-extrabold text-slate-900 group-hover:text-amber-600 group-hover:underline transition">{u.fullName}</p>
                            <p className="text-[11px] text-slate-500">@{u.username || "user"} • {u.mobile || u.email || "No contact"}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="p-3.5 font-bold text-slate-700">{u.jamaat || "General"}</td>
                      <td className="p-3.5">
                        <span className="inline-block rounded-lg px-2.5 py-1 text-[11px] font-black uppercase border border-slate-300 bg-slate-100 text-slate-800 shadow-2xs">
                          {u.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {u.isBanned ? (
                          <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700 uppercase border border-rose-200">
                            Banned ({u.banDuration || "Temp"})
                          </span>
                        ) : (
                          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700 uppercase border border-emerald-200">
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
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-800 shadow-2xs hover:border-amber-400 hover:bg-amber-50 transition active:scale-95 cursor-pointer"
                          >
                            <span>⚙️ Actions</span>
                            <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${openActionUserId === u._id ? 'rotate-180 text-amber-600' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-bold text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                              >
                                <span>⚙️ Change Role</span>
                              </button>

                              {u.role === "member" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionUserId(null);
                                    setPromoteModalUser(u);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-bold text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                                >
                                  <span>🛡️ Promote to Mod</span>
                                </button>
                              )}

                              {u.isBanned ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionUserId(null);
                                    handleUnbanUser(u._id);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-bold text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
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
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-bold text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                                >
                                  <span>🚫 Ban / Suspend</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionUserId(null);
                                  setPasswordResetModalUser(u);
                                  setModalNewPassword("123456");
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-bold text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                              >
                                <span>🔑 Set / Reset Password</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionUserId(null);
                                  setUserToDelete(u);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-bold text-rose-600 hover:bg-rose-50 transition border-t border-slate-100 mt-1 pt-1.5 cursor-pointer"
                              >
                                <span>🗑️ Delete Account</span>
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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Feed Content Moderation</h3>
              <p className="text-xs font-medium text-slate-500">Monitor and delete inappropriate community posts.</p>
            </div>
            <input
              type="text"
              value={postSearch}
              onChange={(e) => setPostSearch(e.target.value)}
              placeholder="Filter posts by text or author..."
              className="w-full sm:w-72 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
            />
          </div>

          {filteredPosts.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-slate-500">
              No posts found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPosts.map((p) => {
                const mediaItems: MediaItem[] = p.media && p.media.length > 0
                  ? p.media
                  : (p.mediaUrls || []).map((u) => ({ url: u }));

                return (
                  <div key={p._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={p.authorName || "Author"} photoUrl={p.authorPhotoUrl} size="sm" />
                          <div>
                            <p className="text-xs font-extrabold text-slate-900">{p.authorName || "Community Member"}</p>
                            <p className="text-[10px] text-slate-500">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "Recent"}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(`/feed?postId=${p._id}`)}
                          className="inline-flex items-center gap-1 rounded-lg bg-teal-50 border border-teal-200 px-2.5 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-100 transition cursor-pointer"
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
                              <div key={idx} className="relative overflow-hidden rounded-xl border border-slate-200 bg-black/50">
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

                    <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-500">❤️ {p.likes || 0} Likes • 💬 {p.comments || 0} Comments</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/feed?postId=${p._id}`)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        >
                          Tap to View ↗
                        </button>
                        <button
                          onClick={() => setPostToDelete(p)}
                          className="rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900">Jamaat Branches & Areas</h3>
            <p className="text-xs font-medium text-slate-500">Manage all registered Jamaat divisions for user profiles.</p>
          </div>

          <form onSubmit={handleAddJamaat} className="flex flex-col sm:flex-row gap-3 max-w-md">
            <input
              type="text"
              value={jamaatInput}
              onChange={(e) => setJamaatInput(e.target.value)}
              placeholder="Enter new Jamaat / Area name..."
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
            />
            <button
              type="submit"
              disabled={actionLoading}
              className="rounded-xl bg-teal-600 hover:bg-teal-700 px-5 py-2.5 text-xs font-black uppercase text-white shadow-md transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              Add Jamaat
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {jamaats.map((j) => (
              <div key={j} className="rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-teal-300 p-4 font-black text-xs text-slate-900 flex items-center justify-between gap-2 shadow-xs transition group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base shrink-0">🏰</span>
                  <span className="truncate font-extrabold text-slate-900 text-sm">{j}</span>
                </div>
                <button
                  onClick={() => setJamaatToDelete(j)}
                  className="text-slate-400 hover:text-rose-600 transition p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer shrink-0"
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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900">User Content Reports</h3>
              <p className="text-xs font-medium text-slate-500">Review flagged posts, comments, and member profiles.</p>
            </div>
            <div className="flex gap-2">
              {(["all", "pending", "resolved"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setReportStatusFilter(st)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-black capitalize transition cursor-pointer ${
                    reportStatusFilter === st
                      ? "bg-teal-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="p-12 text-center text-xs font-bold text-slate-500">
              🎉 No reports found matching filter.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((r) => (
                <div key={r._id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-black uppercase text-amber-800">
                        {r.targetType}
                      </span>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase border ${
                        r.status === "pending" ? "bg-rose-100 text-rose-800 border-rose-200" : "bg-emerald-100 text-emerald-800 border-emerald-200"
                      }`}>
                        {r.status}
                      </span>
                      <span className="text-[11px] text-slate-600">Reported by <strong className="text-slate-900">{r.reporterName}</strong></span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-1">Reason: <span className="font-normal text-slate-700">{r.reason}</span></p>
                    {r.targetId && <p className="text-[10px] text-slate-500 font-mono">Target ID: {r.targetId}</p>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {r.status === "pending" && (
                      <button
                        onClick={() => handleResolveReport(r._id, "resolved")}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white transition cursor-pointer shadow-xs"
                      >
                        Mark Resolved ✓
                      </button>
                    )}
                    <button
                      onClick={() => setReportToDelete(r)}
                      className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
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
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900">Platform Security & Emergency Protocol</h3>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              Super Admin root security controls allow immediate platform-wide session invalidation, protection of root admin credentials, and monitoring system rate limits.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <span className="text-2xl">🔒</span>
                <h4 className="text-xs font-black text-slate-900">JWT Token Security</h4>
                <p className="text-[11px] text-slate-600">Every session is validated against active user session IDs. Force Logout invalidates all existing user tokens instantly.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <span className="text-2xl">⚡</span>
                <h4 className="text-xs font-black text-slate-900">Rate Limiting</h4>
                <p className="text-[11px] text-slate-600">Brute-force protection enabled on /auth routes (max 15 requests/min per IP) and global API (100 req/min).</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <span className="text-2xl">🛡️</span>
                <h4 className="text-xs font-black text-slate-900">Super Admin Lock</h4>
                <p className="text-[11px] text-slate-600">Default Super Admin credentials are hard-protected in dedicated credentials collection.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-6 text-slate-900 shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="text-3xl">🚨</span>
              <div>
                <h3 className="text-base font-black text-slate-900">Emergency Red Button</h3>
                <p className="text-xs text-rose-700 font-medium">Execute emergency actions when security breach or suspicious activity is detected.</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setForceLogoutModal(true)}
                className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-rose-600/30 transition active:scale-95 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative overflow-hidden w-full max-w-sm rounded-3xl border border-slate-200/80 bg-white p-6 text-slate-900 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-600 text-xl">
                ⚙️
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-slate-900 truncate">Change Role</h3>
                <p className="text-xs text-slate-500 truncate">{rolePickerUser.fullName}</p>
              </div>
            </div>

            <div className="space-y-2">
              {(["admin", "moderator", "member"] as const).map((r) => (
                <button
                  key={r}
                  disabled={actionLoading}
                  onClick={() => {
                    if (r === "moderator" && rolePickerUser.role !== "moderator") {
                      const userToPromote = rolePickerUser;
                      setRolePickerUser(null);
                      setPromoteModalUser(userToPromote);
                    } else {
                      handleUpdateRole(rolePickerUser._id, r);
                    }
                  }}
                  className={`w-full rounded-xl p-3 text-left text-xs font-black capitalize transition cursor-pointer flex items-center justify-between ${
                    rolePickerUser.role === r
                      ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                      : "bg-slate-50 text-slate-800 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>{r.replace("_", " ")}</span>
                  {rolePickerUser.role === r && <span>✓</span>}
                </button>
              ))}
            </div>

            <button
              onClick={() => setRolePickerUser(null)}
              className="w-full text-center text-xs font-bold text-slate-600 py-2 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Promote to Moderator Confirmation Modal */}
      {promoteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative overflow-hidden w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 text-slate-900 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 text-2xl shadow-sm">
                🛡️
              </div>
              <div className="space-y-1 pt-0.5 min-w-0 flex-1">
                <h3 className="text-lg font-black tracking-tight text-slate-900 truncate">
                  Promote to Moderator
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-teal-600 truncate">
                  Role Promotion Confirmation
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
              Are you sure you want to promote <strong className="text-slate-900">"{promoteModalUser.fullName}"</strong> (@{promoteModalUser.username || "member"}) to <strong className="text-teal-700">Community Moderator</strong>?
            </p>

            <div className="rounded-2xl bg-teal-50/70 border border-teal-200/70 p-3.5 space-y-1.5 text-xs text-teal-900">
              <p className="font-extrabold flex items-center gap-1.5">
                <span>✨</span> Moderator Privileges Granted:
              </p>
              <ul className="space-y-1 text-[11px] text-teal-800 list-disc list-inside">
                <li>Create & publish official Jamaat Notices</li>
                <li>View member directory and inquiries for their Jamaat</li>
                <li>Assist in feed moderation and community safety</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPromoteModalUser(null)}
                disabled={actionLoading}
                className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = promoteModalUser._id;
                  setPromoteModalUser(null);
                  await handleUpdateRole(targetId, "moderator");
                }}
                disabled={actionLoading}
                className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-teal-600/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? "Promoting..." : "Confirm & Promote"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      {userToBan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative overflow-hidden w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 text-slate-900 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 text-2xl shadow-sm">
                ⛔
              </div>
              <div className="space-y-1 pt-0.5 min-w-0">
                <h3 className="text-lg font-black tracking-tight text-slate-900 truncate">Suspend Account</h3>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600 truncate">{userToBan.fullName}</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-medium text-slate-600">Select suspension duration:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                  className={`rounded-xl p-2.5 text-xs font-extrabold transition cursor-pointer text-center ${
                    banDuration === d.id
                      ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                      : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUserToBan(null)}
                disabled={actionLoading}
                className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBanUser}
                disabled={actionLoading}
                className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-rose-600/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? "Banning..." : "Confirm Ban"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative overflow-hidden w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 text-slate-900 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-2xl shadow-sm">
                ⚠️
              </div>
              <div className="space-y-1 pt-0.5 min-w-0">
                <h3 className="text-lg font-black tracking-tight text-slate-900">Delete Account</h3>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-600 truncate">{userToDelete.fullName}</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900">"{userToDelete.fullName}"</strong>? All their posts, comments, likes, and profile data will be permanently wiped.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={actionLoading}
                className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-rose-600/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Post Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative overflow-hidden w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 text-slate-900 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-2xl shadow-sm">
                🗑️
              </div>
              <div className="space-y-1 pt-0.5 min-w-0">
                <h3 className="text-lg font-black tracking-tight text-slate-900">Delete Post</h3>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-600 truncate">By {postToDelete.authorName || "Member"}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 italic line-clamp-3">
              "{postToDelete.text || "No text content"}"
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                disabled={actionLoading}
                className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePost}
                disabled={actionLoading}
                className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-rose-600/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? "Removing..." : "Remove Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Jamaat Modal */}
      {jamaatToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative overflow-hidden w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 text-slate-900 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-2xl shadow-sm">
                🏰
              </div>
              <div className="space-y-1 pt-0.5 min-w-0">
                <h3 className="text-lg font-black tracking-tight text-slate-900">Delete Jamaat</h3>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-600 truncate">{jamaatToDelete}</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900">"{jamaatToDelete}"</strong>? Assigned members will default to General.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setJamaatToDelete(null)}
                disabled={actionLoading}
                className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteJamaat}
                disabled={actionLoading}
                className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-rose-600/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Report Modal */}
      {reportToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative overflow-hidden w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 text-slate-900 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-2xl shadow-sm">
                🚩
              </div>
              <div className="space-y-1 pt-0.5 min-w-0">
                <h3 className="text-lg font-black tracking-tight text-slate-900">Delete Report</h3>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Pending Investigation</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
              Are you sure you want to remove this report entry from the database?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                disabled={actionLoading}
                className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteReport}
                disabled={actionLoading}
                className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-rose-600/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? "Deleting..." : "Delete Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force Logout Modal */}
      {forceLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative overflow-hidden w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 text-slate-900 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-2xl shadow-sm">
                🚨
              </div>
              <div className="space-y-1 pt-0.5">
                <h3 className="text-lg font-black tracking-tight text-slate-900">
                  Global Force Logout All
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-600">
                  Emergency Security Action
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
              This will immediately invalidate all active JWT tokens across all mobile apps and websites. Everyone will be required to log in again.
            </p>

            <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-200/70 p-3 text-xs font-bold text-amber-800">
              <span className="text-base">⚠️</span>
              <span>All active user sessions across all devices will terminate immediately.</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setForceLogoutModal(false)}
                disabled={actionLoading}
                className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleForceLogoutAll}
                disabled={actionLoading}
                className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-rose-600/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? "Executing..." : "Execute Force Logout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {passwordResetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative overflow-hidden w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 text-slate-900 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 text-2xl shadow-sm">
                🔑
              </div>
              <div className="space-y-1 pt-0.5 min-w-0">
                <h3 className="text-lg font-black tracking-tight text-slate-900 truncate">Set Member Password</h3>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 truncate">{passwordResetModalUser.fullName} (@{passwordResetModalUser.username})</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Enter a new password for <strong className="text-slate-900">{passwordResetModalUser.fullName}</strong> ({passwordResetModalUser.email || passwordResetModalUser.username}). This will immediately update their login credentials.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">New Password</label>
              <input
                type="text"
                value={modalNewPassword}
                onChange={(e) => setModalNewPassword(e.target.value)}
                placeholder="Type password..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-mono text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-500 font-bold">Quick set:</span>
                <button
                  type="button"
                  onClick={() => setModalNewPassword("123456")}
                  className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition"
                >
                  "123456"
                </button>
                <button
                  type="button"
                  onClick={() => setModalNewPassword("Kutchi@2026")}
                  className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition"
                >
                  "Kutchi@2026"
                </button>
                <button
                  type="button"
                  onClick={() => setModalNewPassword(`Pass@${Math.floor(1000 + Math.random() * 9000)}`)}
                  className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition"
                >
                  🎲 Random
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPasswordResetModalUser(null)}
                disabled={resettingPassword}
                className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAdminResetPassword(passwordResetModalUser._id, modalNewPassword)}
                disabled={resettingPassword}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/20 transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {resettingPassword ? "Updating..." : "Confirm & Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
