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
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-800 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 px-6 py-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-300 border border-teal-500/30">
                <img src="/logo.png" alt="Logo" className="h-4 w-4 object-contain" />
                <span>JAMAAT ADMIN PANEL</span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl text-white">Admin Control Panel</h1>
              <p className="mt-1 text-xs text-slate-300">Manage Jamaat members, notice alerts, feed moderation, and community inquiries.</p>
            </div>

            {currentUser?.role === "super_admin" && (
              <Link
                to="/super-admin"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-md hover:bg-amber-400 transition"
              >
                👑 Switch to Super Admin
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-2xl">👥</span>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{stats.members}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jamaat Members</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-2xl">🛡️</span>
          <p className="mt-2 text-2xl font-extrabold text-teal-600">{stats.moderators}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Moderators</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-2xl">📢</span>
          <p className="mt-2 text-2xl font-extrabold text-indigo-600">{stats.posts}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Feed Posts</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-2xl">🏰</span>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600">{stats.jamaats}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jamaat Areas</p>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/notices"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-500 transition flex items-center justify-between"
        >
          <div>
            <h4 className="text-sm font-extrabold text-slate-900">Post Notice & Mayyat</h4>
            <p className="text-xs text-slate-500">Publish alerts and Janaza announcements</p>
          </div>
          <span className="text-2xl">📢</span>
        </Link>
        <Link
          to="/polls"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-500 transition flex items-center justify-between"
        >
          <div>
            <h4 className="text-sm font-extrabold text-slate-900">Create Community Poll</h4>
            <p className="text-xs text-slate-500">Start new decision voting</p>
          </div>
          <span className="text-2xl">🗳️</span>
        </Link>
        <Link
          to="/jobs"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-500 transition flex items-center justify-between"
        >
          <div>
            <h4 className="text-sm font-extrabold text-slate-900">Post Job Vacancies</h4>
            <p className="text-xs text-slate-500">Create career opportunities</p>
          </div>
          <span className="text-2xl">💼</span>
        </Link>
      </div>

      {/* Member Management Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Jamaat Members Directory</h3>
            <p className="text-xs text-slate-500">Promote active members to Moderator or manage accounts.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member..."
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs text-slate-900 outline-none focus:border-teal-500"
            />
            {(["all", "member", "moderator"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition ${
                  roleFilter === r ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold">
              <tr>
                <th className="p-3.5">Member Name</th>
                <th className="p-3.5">Jamaat Area</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleUsers.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/50">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={u.fullName} photoUrl={u.profilePhotoUrl} size="sm" />
                      <div>
                        <p className="font-extrabold text-slate-900">{u.fullName}</p>
                        <p className="text-[11px] text-slate-400">@{u.username || "member"} • {u.mobile || u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-bold text-slate-600">{u.jamaat || "General"}</td>
                  <td className="p-3.5">
                    <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase border ${
                      u.role === "moderator" ? "bg-indigo-50 text-indigo-700 border-indigo-300" : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    {u.role === "member" ? (
                      <button
                        onClick={() => handleRoleChange(u._id, "moderator")}
                        className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-100"
                      >
                        Promote to Moderator
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRoleChange(u._id, "member")}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
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
    </div>
  );
}
