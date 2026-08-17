import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import Loader from "../components/Loader";
import Toast from "../components/Toast";
import UserAvatar from "../components/UserAvatar";

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

interface PostItem {
  _id: string;
  content?: string;
  text?: string;
  authorName?: string;
  authorPhotoUrl?: string;
  category?: string;
  likesCount?: number;
  commentsCount?: number;
  createdAt?: string;
}

interface ReportItem {
  _id: string;
  reporterName: string;
  targetType: "post" | "user" | "notice";
  targetId?: string;
  reason: string;
  createdAt: string;
  status: "pending" | "resolved";
}

interface AnalyticsData {
  totalUsers: number;
  bannedUsers: number;
  superAdminsCount: number;
  moderatorsCount: number;
  membersCount: number;
  totalPosts: number;
  totalJamaats: number;
  activeRate: number;
}

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "posts" | "groups" | "reports" | "security">("overview");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [jamaats, setJamaats] = useState<string[]>([]);
  const [jamaatName, setJamaatName] = useState("");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole | "banned">("all");

  // Modals
  const [rolePickerUser, setRolePickerUser] = useState<UserItem | null>(null);
  const [promoteModalUser, setPromoteModalUser] = useState<UserItem | null>(null);
  const [userToBan, setUserToBan] = useState<UserItem | null>(null);
  const [banDuration, setBanDuration] = useState<"1day" | "1week" | "1month" | "1year" | "permanent">("permanent");
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [forceLogoutModal, setForceLogoutModal] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);
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
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users
      const usersRes = await API.get<{ success: boolean; users: UserItem[] }>("/auth/users");
      if (usersRes.data?.success) {
        setUsers(usersRes.data.users || []);
      }

      // 2. Fetch Groups / Jamaats
      const groupsRes = await API.get<{ groups: Array<{ name: string }> }>("/auth/groups").catch(() => null);
      if (groupsRes?.data?.groups) {
        setJamaats(groupsRes.data.groups.map((g) => g.name));
      }

      // 3. Fetch Posts
      const postsRes = await API.get<PostItem[]>("/posts/all").catch(() => null);
      if (postsRes?.data && Array.isArray(postsRes.data)) {
        setPosts(postsRes.data);
      }

      // 4. Fetch Analytics
      const analyticsRes = await API.get<{ success: boolean; analytics: AnalyticsData }>("/auth/analytics").catch(() => null);
      if (analyticsRes?.data?.analytics) {
        setAnalytics(analyticsRes.data.analytics);
      }

      // 5. Fetch Reports
      const reportsRes = await API.get<{ success: boolean; reports: ReportItem[] }>("/auth/reports").catch(() => null);
      if (reportsRes?.data?.reports) {
        setReports(reportsRes.data.reports);
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "Failed to load admin portal data.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    setSubmittingAction(true);
    try {
      const res = await API.put<{ success: boolean; message?: string }>(`/auth/users/${userId}/role`, { role: newRole });
      if (res.data?.success) {
        setToast({ message: `Role updated to ${newRole.toUpperCase()}`, type: "success" });
        setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
        setRolePickerUser(null);
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "Failed to update role.", type: "error" });
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleToggleBan = async () => {
    if (!userToBan) return;
    setSubmittingAction(true);
    try {
      const isBanned = !userToBan.isBanned;
      const res = await API.put<{ success: boolean; message?: string }>(`/auth/users/${userToBan._id}/ban`, {
        isBanned,
        banDuration,
      });

      if (res.data?.success) {
        setToast({
          message: isBanned ? `User banned (${banDuration.toUpperCase()})` : "User unbanned successfully.",
          type: "success",
        });
        setUsers((prev) => prev.map((u) => (u._id === userToBan._id ? { ...u, isBanned } : u)));
        setUserToBan(null);
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "Failed to update ban status.", type: "error" });
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setSubmittingAction(true);
    try {
      const res = await API.delete<{ success: boolean }>(`/auth/users/${userToDelete._id}`);
      if (res.data?.success) {
        setToast({ message: "User deleted permanently.", type: "success" });
        setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
        setUserToDelete(null);
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "Failed to delete user.", type: "error" });
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCreateJamaat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jamaatName.trim()) return;
    try {
      const res = await API.post<{ success: boolean; name?: string }>("/auth/groups", { name: jamaatName });
      if (res.data?.success) {
        setToast({ message: `Jamaat "${jamaatName}" added!`, type: "success" });
        setJamaats([...jamaats, jamaatName.trim()]);
        setJamaatName("");
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "Failed to add Jamaat.", type: "error" });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await API.delete(`/posts/${postId}`);
      setToast({ message: "Post deleted by admin.", type: "success" });
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "Failed to delete post.", type: "error" });
    }
  };

  const handleForceLogoutAll = async () => {
    setSubmittingAction(true);
    try {
      const res = await API.post<{ success: boolean }>("/auth/force-logout-all");
      if (res.data?.success) {
        setToast({ message: "Global force logout executed. All users signed out.", type: "success" });
        setForceLogoutModal(false);
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "Failed to execute global logout.", type: "error" });
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await API.put(`/auth/reports/${reportId}/resolve`);
      setToast({ message: "Report marked as resolved.", type: "success" });
      setReports((prev) => prev.map((r) => (r._id === reportId ? { ...r, status: "resolved" } : r)));
    } catch {
      setToast({ message: "Failed to resolve report.", type: "error" });
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.mobile?.includes(q) ||
        u.jamaat?.toLowerCase().includes(q);

      let matchesRole = true;
      if (roleFilter === "banned") matchesRole = Boolean(u.isBanned);
      else if (roleFilter !== "all") matchesRole = u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const q = postSearch.toLowerCase().trim();
      return !q || p.content?.toLowerCase().includes(q) || p.text?.toLowerCase().includes(q) || p.authorName?.toLowerCase().includes(q);
    });
  }, [posts, postSearch]);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-6 text-white shadow-xl md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-400 border border-teal-500/30">
                👑 SUPER ADMIN CONTROL PANEL
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white md:text-3xl">Community Portal Management</h1>
            <p className="text-sm text-slate-700 max-w-xl">
              Manage member accounts, permissions, jamaats, content moderation, reports, and global security actions.
            </p>
          </div>

          <button
            onClick={() => setForceLogoutModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/30 hover:bg-red-500 transition"
          >
            <span>🚨</span> Force Logout All Users
          </button>
        </div>
      </div>

      {/* Top Tabs */}
      <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        {[
          { id: "overview", label: "📊 Overview" },
          { id: "members", label: `👥 Members (${users.length})` },
          { id: "posts", label: `📝 Feed Moderation (${posts.length})` },
          { id: "groups", label: `🕌 Jamaat Groups (${jamaats.length})` },
          { id: "reports", label: `⚠️ User Reports (${reports.filter((r) => r.status === "pending").length})` },
          { id: "security", label: "🔐 Security & Actions" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Registered</span>
              <p className="mt-2 text-2xl font-black text-slate-900">{analytics?.totalUsers || users.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Rate</span>
              <p className="mt-2 text-2xl font-black text-teal-600">{analytics?.activeRate || 94}%</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Suspended Users</span>
              <p className="mt-2 text-2xl font-black text-red-600">{users.filter((u) => u.isBanned).length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Reports</span>
              <p className="mt-2 text-2xl font-black text-amber-600">{reports.filter((r) => r.status === "pending").length}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">Role Breakdown</h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
                <span className="text-xs font-bold text-blue-700">Jamaat Admins</span>
                <p className="text-xl font-extrabold text-blue-900">{users.filter((u) => u.role === "admin").length}</p>
              </div>
              <div className="rounded-xl bg-teal-50 p-4 border border-teal-100">
                <span className="text-xs font-bold text-teal-700">Moderators</span>
                <p className="text-xl font-extrabold text-teal-900">{users.filter((u) => u.role === "moderator").length}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Community Members</span>
                <p className="text-xl font-extrabold text-slate-900">{users.filter((u) => u.role === "member").length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEMBERS */}
      {activeTab === "members" && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <input
              type="text"
              placeholder="Search by name, email, mobile, or Jamaat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-80 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-teal-500"
            />

            <div className="grid grid-cols-3 sm:flex flex-wrap gap-1.5 w-full sm:w-auto">
              {(["all", "admin", "moderator", "member", "banned"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`rounded-xl px-2.5 py-2 sm:px-3 sm:py-1.5 text-xs font-black uppercase transition cursor-pointer text-center ${
                    roleFilter === r
                      ? "bg-teal-600 text-white shadow-md"
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
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 font-medium">
                No members matching criteria.
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div key={u._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      to={`/user/${u._id}`}
                      className="flex items-center gap-3 min-w-0 group cursor-pointer"
                      title="View member profile"
                    >
                      <UserAvatar name={u.fullName} photoUrl={u.profilePhotoUrl} size="md" />
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900 text-sm truncate group-hover:text-teal-600 group-hover:underline transition">{u.fullName}</p>
                        <p className="text-xs text-slate-500 truncate">@{u.username || "member"}</p>
                        <p className="text-[11px] text-slate-500 truncate">{u.mobile || u.email || "No contact"}</p>
                      </div>
                    </Link>

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
                        <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${openActionUserId === u._id ? 'rotate-180 text-teal-600' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                setUserToBan(u);
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
                            <span>🗑️ Delete Member</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <span className="font-semibold text-slate-600 truncate">{u.jamaat || "General"}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`inline-block rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          u.role === "super_admin"
                            ? "bg-purple-100 text-purple-800"
                            : u.role === "admin"
                            ? "bg-blue-100 text-blue-800"
                            : u.role === "moderator"
                            ? "bg-teal-100 text-teal-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {u.role.replace("_", " ")}
                      </span>
                      {u.isBanned ? (
                        <span className="rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 uppercase">
                          Suspended
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
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
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Contact Details</th>
                  <th className="px-4 py-3">Jamaat</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/user/${u._id}`}
                        className="flex items-center gap-3 group cursor-pointer"
                        title="View member profile"
                      >
                        <UserAvatar name={u.fullName} photoUrl={u.profilePhotoUrl} size="sm" />
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-teal-600 group-hover:underline transition">{u.fullName}</p>
                          <p className="text-[11px] text-slate-500">@{u.username || "member"}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{u.mobile || "N/A"}</p>
                      <p className="text-[11px] text-slate-500">{u.email || ""}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{u.jamaat || "General"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${
                          u.role === "super_admin"
                            ? "bg-purple-100 text-purple-800"
                            : u.role === "admin"
                            ? "bg-blue-100 text-blue-800"
                            : u.role === "moderator"
                            ? "bg-teal-100 text-teal-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {u.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.isBanned ? (
                        <span className="rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 uppercase">
                          Suspended
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block text-left member-action-dropdown">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionUserId((prev) => (prev === u._id ? null : u._id));
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-700 shadow-sm hover:border-teal-500 hover:bg-teal-50 transition active:scale-95"
                        >
                          <span>⚙️ Actions</span>
                          <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${openActionUserId === u._id ? 'rotate-180 text-teal-600' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionUserId(null);
                                setUserToBan(u);
                              }}
                              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-bold transition ${
                                u.isBanned ? "text-emerald-700 hover:bg-emerald-50" : "text-amber-700 hover:bg-amber-50"
                              }`}
                            >
                              <span>{u.isBanned ? "🟢 Unban Member" : "🚫 Ban / Suspend"}</span>
                            </button>

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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: POSTS MODERATION */}
      {activeTab === "posts" && (
        <div className="mt-6 space-y-4">
          <input
            type="text"
            placeholder="Search feed posts by content or author..."
            value={postSearch}
            onChange={(e) => setPostSearch(e.target.value)}
            className="w-full md:w-80 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-teal-500"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPosts.map((post) => (
              <div key={post._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={post.authorName || "User"} photoUrl={post.authorPhotoUrl} size="sm" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{post.authorName || "Anonymous Member"}</h4>
                      <p className="text-[10px] text-slate-500">{new Date(post.createdAt || Date.now()).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePost(post._id)}
                    className="rounded-lg bg-red-50 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-100"
                  >
                    Delete Post
                  </button>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{post.content || post.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: GROUPS / JAMAATS */}
      {activeTab === "groups" && (
        <div className="mt-6 space-y-6">
          <form onSubmit={handleCreateJamaat} className="flex items-center gap-3">
            <input
              type="text"
              required
              placeholder="Enter new Jamaat name (e.g. Kharadar Jamaat)"
              value={jamaatName}
              onChange={(e) => setJamaatName(e.target.value)}
              className="w-full md:w-80 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-teal-500"
            />
            <button
              type="submit"
              className="rounded-2xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-500"
            >
              + Add Jamaat
            </button>
          </form>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {jamaats.map((j, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-xs font-bold text-slate-800">
                🕌 {j}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: REPORTS */}
      {activeTab === "reports" && (
        <div className="mt-6 space-y-4">
          {reports.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
              No reported content at this time.
            </div>
          ) : (
            reports.map((r) => (
              <div key={r._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
                <div>
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase">
                    Reported {r.targetType}
                  </span>
                  <p className="mt-2 text-xs font-bold text-slate-900">Reason: {r.reason}</p>
                  <p className="text-[11px] text-slate-500">By: {r.reporterName} • {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>

                {r.status === "pending" && (
                  <button
                    onClick={() => handleResolveReport(r._id)}
                    className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-500"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 6: SECURITY */}
      {activeTab === "security" && (
        <div className="mt-6 rounded-3xl border border-red-200 bg-red-50/40 p-6 space-y-4">
          <h3 className="text-base font-extrabold text-red-900">Emergency & Global System Actions</h3>
          <p className="text-xs text-red-700 leading-relaxed max-w-xl">
            Executing global actions will affect all active user sessions across mobile apps and website logins.
          </p>
          <button
            onClick={() => setForceLogoutModal(true)}
            className="rounded-2xl bg-red-600 px-6 py-3 text-xs font-extrabold text-white shadow-lg shadow-red-600/30 hover:bg-red-500"
          >
            🚨 Force Logout All Active Sessions
          </button>
        </div>
      )}

      {/* Role Picker Modal */}
      {rolePickerUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative overflow-hidden w-full max-w-sm rounded-3xl border border-slate-200/80 bg-white p-6 text-slate-900 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 border border-teal-200 text-teal-600 text-xl">
                ⚙️
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-slate-900 truncate">Assign Role</h3>
                <p className="text-xs text-slate-500 truncate">{rolePickerUser.fullName}</p>
              </div>
            </div>

            <div className="space-y-2">
              {(["member", "moderator", "admin"] as const).map((r) => (
                <button
                  key={r}
                  disabled={submittingAction}
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
                disabled={submittingAction}
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
                disabled={submittingAction}
                className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-teal-600/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {submittingAction ? "Promoting..." : "Confirm & Promote"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      {userToBan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {userToBan.isBanned ? `Unban ${userToBan.fullName}?` : `Ban ${userToBan.fullName}`}
            </h3>

            {!userToBan.isBanned && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Ban Duration</label>
                <select
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-slate-800"
                >
                  <option value="1day">1 Day</option>
                  <option value="1week">1 Week</option>
                  <option value="1month">1 Month</option>
                  <option value="1year">1 Year</option>
                  <option value="permanent">Permanent Lifetime Ban</option>
                </select>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3">
              <button onClick={() => setUserToBan(null)} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600">
                Cancel
              </button>
              <button
                onClick={handleToggleBan}
                disabled={submittingAction}
                className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-500"
              >
                Confirm {userToBan.isBanned ? "Unban" : "Ban"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force Logout Confirmation Modal */}
      {forceLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-red-600">🚨 Confirm Global Force Logout</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will invalidate all current JWT user tokens and log out every user across mobile and web platforms. Are you sure?
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button onClick={() => setForceLogoutModal(false)} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600">
                Cancel
              </button>
              <button
                onClick={handleForceLogoutAll}
                disabled={submittingAction}
                className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-500"
              >
                Execute Global Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
