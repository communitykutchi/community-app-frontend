import { useEffect, useMemo, useState, type FormEvent } from "react";
import API from "../api/axios.js";

interface UserItem {
  _id: string;
  fullName: string;
  mobile: string;
  email?: string;
<<<<<<< HEAD
  role: "super_admin" | "moderator" | "member";
  jamaat?: string;
}

function normalizeRole(role?: string): UserItem['role'] {
  if (role === 'super_admin') return 'super_admin';
  if (role === 'jamaat_admin' || role === 'moderator') return 'moderator';
  return 'member';
}

=======
  role: "super_admin" | "jamaat_admin" | "member";
  jamaat?: string;
}

>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [jamaatName, setJamaatName] = useState("");
  const [jamaats, setJamaats] = useState<string[]>([]);
  const [jamaatLoading, setJamaatLoading] = useState(false);
  const [selectedJamaat, setSelectedJamaat] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState<{ role: string; jamaat?: string } | null>(null);
<<<<<<< HEAD
  const [currentUserLoading, setCurrentUserLoading] = useState(true);
=======
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875

  const loadCurrentUser = async () => {
    try {
      const response = await API.get<{ success: boolean; user?: { role: string; jamaat?: string } }>('/auth/me');
      if (response.data.success) {
<<<<<<< HEAD
        const rawUser = response.data.user || null;
        const nextUser = rawUser ? { ...rawUser, role: normalizeRole(rawUser.role) } : null;
        setCurrentUser(nextUser);
        return nextUser;
      } else {
        setCurrentUser(null);
        return null;
      }
    } catch {
      setCurrentUser(null);
      return null;
    } finally {
      setCurrentUserLoading(false);
=======
        setCurrentUser(response.data.user || null);
      }
    } catch {
      setCurrentUser(null);
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setMessage('');
      const response = await API.get<{ success: boolean; users: UserItem[]; message?: string }>('/auth/users');
      if (response.data.success) {
<<<<<<< HEAD
        const normalizedUsers: UserItem[] = (response.data.users || []).map((user) => ({
          ...user,
          role: normalizeRole(user.role),
        }));
        setUsers(normalizedUsers);
=======
        setUsers(response.data.users || []);
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
      } else {
        setMessage(response.data.message || 'Unable to load users.');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await API.get<{ success: boolean; groups: Array<{ name: string }> ; message?: string }>('/auth/groups');
      if (response.data.success) {
        setJamaats(response.data.groups?.map((group) => group.name) || []);
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to load jamaats.');
    }
  };

  useEffect(() => {
    const init = async () => {
<<<<<<< HEAD
      const user = await loadCurrentUser();
      const role = user?.role;
      if (role === 'super_admin' || role === 'moderator') {
        await loadUsers();
      }
      if (role === 'super_admin') {
        await loadGroups();
      }
=======
      await loadCurrentUser();
      await loadUsers();
      await loadGroups();
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
    };

    void init();
  }, []);

  useEffect(() => {
<<<<<<< HEAD
    if (currentUser?.role === 'moderator' && currentUser.jamaat?.trim()) {
=======
    if (currentUser?.role === 'jamaat_admin' && currentUser.jamaat?.trim()) {
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
      setSelectedJamaat(currentUser.jamaat.trim());
    }
  }, [currentUser]);

<<<<<<< HEAD
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isJamaatAdmin = currentUser?.role === 'moderator';
  const canAccessAdminPage = isSuperAdmin || isJamaatAdmin;
  const canManageJamaats = isSuperAdmin;
  const canManageRoles = isSuperAdmin;
  const scopedJamaat = currentUser?.jamaat?.trim() || null;
  const adminCount = useMemo(() => users.filter((user) => user.role === 'super_admin' || user.role === 'moderator').length, [users]);
=======
  const isJamaatAdmin = currentUser?.role === 'jamaat_admin';
  const scopedJamaat = currentUser?.jamaat?.trim() || null;
  const adminCount = useMemo(() => users.filter((user) => user.role === 'super_admin' || user.role === 'jamaat_admin').length, [users]);
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875

  const jamaatGroups = useMemo(() => {
    const grouped = new Map<string, number>();

    users.forEach((user) => {
      const name = user.jamaat?.trim() || 'Unassigned';
      grouped.set(name, (grouped.get(name) || 0) + 1);
    });

    return Array.from(grouped.entries()).sort(([left], [right]) => left.localeCompare(right));
  }, [users]);

  const visibleUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const effectiveJamaat = isJamaatAdmin ? scopedJamaat : selectedJamaat;

    return users.filter((user) => {
      if (user.role === 'super_admin') {
        return false;
      }

      const jamaatName = (user.jamaat?.trim() || 'Unassigned').toLowerCase();
      const matchesJamaat = !effectiveJamaat || jamaatName === effectiveJamaat.toLowerCase();
      const matchesSearch = !normalizedSearch || [user.fullName, user.mobile, user.email, jamaatName]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);

      return matchesJamaat && matchesSearch;
    });
  }, [users, selectedJamaat, search, isJamaatAdmin, scopedJamaat]);

<<<<<<< HEAD
  const handleRoleChange = async (userId: string, role: 'moderator' | 'member') => {
=======
  const handleRoleChange = async (userId: string, role: 'jamaat_admin' | 'member') => {
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
    try {
      const response = await API.put(`/auth/users/${userId}/role`, { role });
      if (response.data.success) {
        setMessage('Role updated successfully.');
        await loadUsers();
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to update role.');
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      const response = await API.delete(`/auth/users/${userId}`);
      if (response.data.success) {
        setMessage('User removed successfully.');
        await loadUsers();
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to remove user.');
    }
  };

  const handleAddJamaat = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = jamaatName.trim();

    if (!trimmed) {
      setMessage('Please enter a jamaat name.');
      return;
    }

    try {
      setJamaatLoading(true);
      const response = await API.post('/auth/groups', { name: trimmed });
      if (response.data.success) {
        const createdName = response.data.group?.name || trimmed;
        setJamaats((current) => [...current, createdName]);
        setJamaatName('');
        setMessage(`Jamaat "${createdName}" added.`);
      } else {
        setMessage(response.data.message || 'Unable to add jamaat.');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to add jamaat.');
    } finally {
      setJamaatLoading(false);
    }
  };

<<<<<<< HEAD
  if (currentUserLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="page-card p-6">
          <p className="text-sm text-slate-600">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!canAccessAdminPage) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="page-card p-6">
          <h1 className="page-title text-2xl">Access Restricted</h1>
          <p className="page-subtitle mt-2 text-sm">You do not have permission to open this page.</p>
        </div>
      </div>
    );
  }

=======
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="page-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="page-title text-2xl">{isJamaatAdmin ? 'Jamaat Member Management' : 'Admin & Member Management'}</h1>
            <p className="page-subtitle mt-1 text-sm">
              {isJamaatAdmin
                ? 'You can view members from your own jamaat only.'
                : 'Any admin can promote or remove another user, and the hub keeps at least one admin active.'}
            </p>
          </div>
          <div className="rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">{adminCount} admin(s)</div>
        </div>

        {message ? <p className="mt-3 text-sm text-emerald-600">{message}</p> : null}
      </div>

<<<<<<< HEAD
      {canManageJamaats ? (
=======
      {!isJamaatAdmin ? (
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
        <div className="page-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="page-title text-xl">Manage Jamaats</h2>
              <p className="page-subtitle mt-1 text-sm">Add jamaat names here so they can be selected during registration.</p>
            </div>
          </div>

          <form onSubmit={handleAddJamaat} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={jamaatName}
              onChange={(event) => setJamaatName(event.target.value)}
              placeholder="e.g. Kutchi Jamaat"
              className="form-input w-full px-3 py-2"
            />
            <button
              type="submit"
              disabled={jamaatLoading}
              className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60"
            >
              {jamaatLoading ? 'Adding...' : 'Add Jamaat'}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {jamaats.length > 0 ? (
              jamaats.map((jamaat) => (
                <span key={jamaat} className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  {jamaat}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-500">No jamaats yet.</p>
            )}
          </div>
        </div>
      ) : null}

      <div className="page-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="page-title text-xl">Members by Jamaat</h2>
            <p className="page-subtitle mt-1 text-sm">Click a jamaat to view only that group’s members.</p>
          </div>
        </div>

<<<<<<< HEAD
        {canManageJamaats ? (
=======
        {!isJamaatAdmin ? (
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
          <div className="mt-4 flex flex-col gap-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, mobile, email, or jamaat"
              className="form-input w-full px-3 py-2"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedJamaat(null)}
                className={`rounded-full px-3 py-1 text-sm font-medium ${selectedJamaat === null ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All Members
              </button>

              {jamaatGroups.map(([jamaat, count]) => (
                <button
                  key={jamaat}
                  type="button"
                  onClick={() => setSelectedJamaat(jamaat)}
                  className={`rounded-full px-3 py-1 text-sm font-medium ${selectedJamaat === jamaat ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                >
                  {jamaat} <span className="ml-1 rounded-full bg-white/70 px-2 py-0.5 text-xs">{count}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, mobile, or email"
              className="form-input w-full px-3 py-2"
            />
          </div>
        )}

        {selectedJamaat ? (
          <p className="mt-3 text-sm text-gray-600">
            Showing members for <span className="font-semibold text-gray-800">{selectedJamaat}</span>.
          </p>
        ) : (
          <p className="mt-3 text-sm text-gray-600">Showing all members.</p>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading users...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700">Name</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Mobile</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Email</th>
<<<<<<< HEAD
                            {canManageRoles ? <th className="px-4 py-3 font-semibold text-slate-700">Role</th> : null}
=======
                  {!isJamaatAdmin ? <th className="px-4 py-3 font-semibold text-slate-700">Role</th> : null}
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
                  <th className="px-4 py-3 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleUsers.map((user) => (
                  <tr key={user._id}>
                    <td className="px-4 py-3 font-medium text-slate-800">{user.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">{user.mobile}</td>
                    <td className="px-4 py-3 text-slate-600">{user.email || '-'}</td>
<<<<<<< HEAD
                    {canManageRoles ? (
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          onChange={(event) => handleRoleChange(user._id, event.target.value as 'moderator' | 'member')}
                          className="form-input rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="member">Member</option>
                          <option value="moderator">Moderator</option>
=======
                    {!isJamaatAdmin ? (
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          onChange={(event) => handleRoleChange(user._id, event.target.value as 'jamaat_admin' | 'member')}
                          className="form-input rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="member">Member</option>
                          <option value="jamaat_admin">Jamaat Admin</option>
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
                        </select>
                      </td>
                    ) : null}
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleRemove(user._id)}
                        className="rounded-lg border border-red-600 bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
