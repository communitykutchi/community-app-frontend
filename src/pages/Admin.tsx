import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import UserAvatar from "../components/UserAvatar";
import Toast from "../components/Toast";

type UserRole = "super_admin" | "admin" | "jamaat_admin" | "moderator" | "member";

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
  createdAt?: string;
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

export default function Admin() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserItem | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "member" | "moderator">("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [promoteModalUser, setPromoteModalUser] = useState<UserItem | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; isVisible: boolean }>({
    message: "",
    type: "success",
    isVisible: false,
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type, isVisible: true });
  };

  useEffect(() => {
    API.get<{ user?: UserItem }>("/auth/me")
      .then((res) => {
        const u = res.data?.user;
        const normalized = u?.role === "jamaat_admin" ? "moderator" : u?.role;
        if (!u || !["super_admin", "admin", "jamaat_admin", "moderator"].includes(normalized || "")) {
          navigate("/");
          return;
        }
        setCurrentUser(u);
        loadAdminData();
      })
      .catch(() => {
        navigate("/login");
      });
  }, [navigate]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [usersRes, analyticsRes] = await Promise.all([
        API.get<{ success: boolean; users: UserItem[] }>("/auth/users"),
        API.get<{ success: boolean; analytics: AnalyticsData }>("/auth/analytics").catch(() => ({ data: null })),
      ]);

      if (usersRes.data?.success && Array.isArray(usersRes.data.users)) {
        setUsers(usersRes.data.users);
      }
      if (analyticsRes.data?.analytics) {
        setAnalytics(analyticsRes.data.analytics);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to load admin panel data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, nextRole: "moderator" | "member") => {
    setActionLoading(true);
    try {
      await API.put(`/auth/users/${userId}/role`, { role: nextRole });
      showToast(nextRole === "moderator" ? "Member promoted to Moderator." : "Demoted to Member.", "success");
      await loadAdminData();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Role change failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (u.role === "super_admin" || u.role === "admin") return false;
      if (roleFilter === "member" && u.role !== "member") return false;
      if (roleFilter === "moderator" && u.role !== "moderator") return false;

      if (!q) return true;
      return (
        u.fullName?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.mobile?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.jamaat?.toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  const stats = useMemo(() => {
    const totalMembers = users.filter((u) => u.role === "member").length;
    const totalMods = users.filter((u) => u.role === "moderator").length;
    return {
      total: analytics?.totalUsers || users.length,
      members: totalMembers,
      moderators: totalMods,
      posts: analytics?.totalPosts || 0,
      jamaats: analytics?.totalJamaats || 0,
    };
  }, [users, analytics]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl py-12 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        <p className="mt-4 text-xs font-bold text-slate-500">Loading Admin Control Panel...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast((t) => ({ ...t, isVisible: false }))} />

      {/* Admin Panel Header */}
      <div className="page-hero-banner relative overflow-hidden rounded-3xl border border-teal-500/40 bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 via-slate-900 to-teal-950/90 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="relative border-b border-slate-200 px-6 py-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-teal-500/20 px-3.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-teal-300 border border-teal-400/30 shadow-sm backdrop-blur-md">
                <img src="/logo.png" alt="Logo" className="h-4 w-4 shrink-0 object-contain" />
                <span className="truncate">JAMAAT ADMIN PANEL</span>
              </div>
              <h1 className="mt-2 text-xl sm:text-3xl font-black text-white leading-tight break-words">Admin Control Panel</h1>
              <p className="mt-1 text-xs font-medium text-slate-200 leading-relaxed">Manage Jamaat members, notice alerts, feed moderation, and community inquiries.</p>
            </div>

            {currentUser?.role === "super_admin" && (
              <Link
                to="/super-admin"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-md hover:bg-amber-400 transition shrink-0"
              >
                👑 Switch to Super Admin
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-md">
          <span className="text-2xl">👥</span>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{stats.members}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jamaat Members</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-md">
          <span className="text-2xl">🛡️</span>
          <p className="mt-2 text-2xl font-extrabold text-teal-600">{stats.moderators}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Moderators</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-md">
          <span className="text-2xl">📢</span>
          <p className="mt-2 text-2xl font-extrabold text-indigo-600">{stats.posts}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Feed Posts</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-md">
          <span className="text-2xl">🏰</span>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600">{stats.jamaats}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jamaat Areas</p>
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
            <p className="text-xs text-slate-600">Publish alerts and Janaza announcements</p>
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

      {/* Member Management Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 text-slate-900 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-950">Jamaat Members Directory</h3>
            <p className="text-xs text-slate-600 font-medium">Promote active members to Moderator or manage accounts.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member name, phone, area..."
              className="w-full sm:w-64 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-teal-500 transition"
            />
            <div className="grid grid-cols-3 gap-1.5 w-full sm:flex sm:w-auto">
              {(["all", "member", "moderator"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`rounded-xl px-3 py-2 text-xs font-black capitalize transition cursor-pointer text-center ${
                    roleFilter === r
                      ? "bg-teal-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile View Card List (sm:hidden) */}
        <div className="space-y-3 sm:hidden">
          {visibleUsers.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-xs font-semibold text-slate-500">
              No members matching criteria.
            </div>
          ) : (
            visibleUsers.map((u) => (
              <div key={u._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to={`/user/${u._id}`}
                    className="flex items-center gap-3 min-w-0 flex-1 group cursor-pointer"
                    title="View member profile"
                  >
                    <UserAvatar name={u.fullName} photoUrl={u.profilePhotoUrl} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-slate-950 text-sm truncate group-hover:text-teal-600 group-hover:underline transition">{u.fullName}</p>
                      <p className="text-[11px] font-semibold text-slate-500 truncate">@{u.username || "member"}</p>
                      <p className="text-[11px] font-medium text-slate-600 truncate">{u.mobile || u.email || "No contact"}</p>
                    </div>
                  </Link>
                </div>

                <div className="pt-2.5 border-t border-slate-200 space-y-2">
                  <div className="text-[11px] font-bold text-slate-600 truncate w-full">
                    📍 Jamaat: <span className="font-extrabold text-slate-800">{u.jamaat || "General"}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="inline-block shrink-0 rounded-md px-2 py-0.5 text-[10px] font-black uppercase bg-white border border-slate-300 text-slate-800 shadow-2xs whitespace-nowrap">
                      {u.role.replace("_", " ")}
                    </span>

                    <div className="shrink-0">
                      {u.role === "member" ? (
                        <button
                          onClick={() => setPromoteModalUser(u)}
                          disabled={actionLoading}
                          className="rounded-xl bg-teal-600 text-white px-2.5 py-1 text-[10px] sm:text-[11px] font-black shadow-xs hover:bg-teal-700 transition cursor-pointer whitespace-nowrap"
                        >
                          Promote to Moderator
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRoleChange(u._id, "member")}
                          disabled={actionLoading}
                          className="rounded-xl bg-slate-200 border border-slate-300 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-slate-800 hover:bg-slate-300 transition cursor-pointer whitespace-nowrap"
                        >
                          Demote to Member
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View Table (hidden sm:block) */}
        <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-extrabold">
              <tr>
                <th className="p-3.5">Member Name</th>
                <th className="p-3.5">Jamaat Area</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {visibleUsers.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50 transition">
                  <td className="p-3.5">
                    <Link
                      to={`/user/${u._id}`}
                      className="flex items-center gap-3 group cursor-pointer"
                      title="View member profile"
                    >
                      <UserAvatar name={u.fullName} photoUrl={u.profilePhotoUrl} size="sm" />
                      <div>
                        <p className="font-extrabold text-slate-900 group-hover:text-teal-600 group-hover:underline transition">{u.fullName}</p>
                        <p className="text-[11px] text-slate-500">@{u.username || "member"} • {u.mobile || u.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="p-3.5 font-bold text-slate-700">{u.jamaat || "General"}</td>
                  <td className="p-3.5">
                    <span className="inline-block rounded-lg px-3 py-1 text-[11px] font-black uppercase border border-slate-300 bg-slate-100 text-slate-800 shadow-2xs">
                      {u.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    {u.role === "member" ? (
                      <button
                        onClick={() => setPromoteModalUser(u)}
                        disabled={actionLoading}
                        className="rounded-lg bg-teal-600 text-white px-3 py-1.5 text-xs font-extrabold shadow-sm hover:bg-teal-700 transition cursor-pointer"
                      >
                        Promote to Moderator
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRoleChange(u._id, "member")}
                        disabled={actionLoading}
                        className="rounded-lg bg-slate-200 border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-300 transition cursor-pointer"
                      >
                        Demote to Member
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
                  await handleRoleChange(targetId, "moderator");
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
    </div>
  );
}
