import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import API from "../api/axios.js";
function normalizeRole(role) {
    if (role === 'super_admin')
        return 'super_admin';
    if (role === 'jamaat_admin' || role === 'moderator')
        return 'moderator';
    return 'member';
}
export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [jamaatName, setJamaatName] = useState("");
    const [jamaats, setJamaats] = useState([]);
    const [jamaatLoading, setJamaatLoading] = useState(false);
    const [selectedJamaat, setSelectedJamaat] = useState(null);
    const [search, setSearch] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUserLoading, setCurrentUserLoading] = useState(true);
    const loadCurrentUser = async () => {
        try {
            const response = await API.get('/auth/me');
            if (response.data.success) {
                const rawUser = response.data.user || null;
                const nextUser = rawUser ? { ...rawUser, role: normalizeRole(rawUser.role) } : null;
                setCurrentUser(nextUser);
                return nextUser;
            }
            else {
                setCurrentUser(null);
                return null;
            }
        }
        catch {
            setCurrentUser(null);
            return null;
        }
        finally {
            setCurrentUserLoading(false);
        }
    };
    const loadUsers = async () => {
        try {
            setLoading(true);
            setMessage('');
            const response = await API.get('/auth/users');
            if (response.data.success) {
                const normalizedUsers = (response.data.users || []).map((user) => ({
                    ...user,
                    role: normalizeRole(user.role),
                }));
                setUsers(normalizedUsers);
            }
            else {
                setMessage(response.data.message || 'Unable to load users.');
            }
        }
        catch (error) {
            setMessage(error.response?.data?.message || 'Unable to load users.');
        }
        finally {
            setLoading(false);
        }
    };
    const loadGroups = async () => {
        try {
            const response = await API.get('/auth/groups');
            if (response.data.success) {
                setJamaats(response.data.groups?.map((group) => group.name) || []);
            }
        }
        catch (error) {
            setMessage(error.response?.data?.message || 'Unable to load jamaats.');
        }
    };
    useEffect(() => {
        const init = async () => {
            const user = await loadCurrentUser();
            const role = user?.role;
            if (role === 'super_admin' || role === 'moderator') {
                await loadUsers();
            }
            if (role === 'super_admin') {
                await loadGroups();
            }
        };
        void init();
    }, []);
    useEffect(() => {
        if (currentUser?.role === 'moderator' && currentUser.jamaat?.trim()) {
            setSelectedJamaat(currentUser.jamaat.trim());
        }
    }, [currentUser]);
    const isSuperAdmin = currentUser?.role === 'super_admin';
    const isJamaatAdmin = currentUser?.role === 'moderator';
    const canAccessAdminPage = isSuperAdmin || isJamaatAdmin;
    const canManageJamaats = isSuperAdmin;
    const canManageRoles = isSuperAdmin;
    const scopedJamaat = currentUser?.jamaat?.trim() || null;
    const adminCount = useMemo(() => users.filter((user) => user.role === 'super_admin' || user.role === 'moderator').length, [users]);
    const jamaatGroups = useMemo(() => {
        const grouped = new Map();
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
    const handleRoleChange = async (userId, role) => {
        try {
            const response = await API.put(`/auth/users/${userId}/role`, { role });
            if (response.data.success) {
                setMessage('Role updated successfully.');
                await loadUsers();
            }
        }
        catch (error) {
            setMessage(error.response?.data?.message || 'Unable to update role.');
        }
    };
    const handleRemove = async (userId) => {
        try {
            const response = await API.delete(`/auth/users/${userId}`);
            if (response.data.success) {
                setMessage('User removed successfully.');
                await loadUsers();
            }
        }
        catch (error) {
            setMessage(error.response?.data?.message || 'Unable to remove user.');
        }
    };
    const handleAddJamaat = async (event) => {
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
            }
            else {
                setMessage(response.data.message || 'Unable to add jamaat.');
            }
        }
        catch (error) {
            setMessage(error.response?.data?.message || 'Unable to add jamaat.');
        }
        finally {
            setJamaatLoading(false);
        }
    };
    if (currentUserLoading) {
        return (_jsx("div", { className: "mx-auto w-full max-w-5xl space-y-6", children: _jsx("div", { className: "page-card p-6", children: _jsx("p", { className: "text-sm text-slate-600", children: "Checking access..." }) }) }));
    }
    if (!canAccessAdminPage) {
        return (_jsx("div", { className: "mx-auto w-full max-w-5xl space-y-6", children: _jsxs("div", { className: "page-card p-6", children: [_jsx("h1", { className: "page-title text-2xl", children: "Access Restricted" }), _jsx("p", { className: "page-subtitle mt-2 text-sm", children: "You do not have permission to open this page." })] }) }));
    }
    return (_jsxs("div", { className: "mx-auto w-full max-w-5xl space-y-6", children: [_jsxs("div", { className: "page-card p-6", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "page-title text-2xl", children: isJamaatAdmin ? 'Jamaat Member Management' : 'Admin & Member Management' }), _jsx("p", { className: "page-subtitle mt-1 text-sm", children: isJamaatAdmin
                                            ? 'You can view members from your own jamaat only.'
                                            : 'Any admin can promote or remove another user, and the hub keeps at least one admin active.' })] }), _jsxs("div", { className: "rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700", children: [adminCount, " admin(s)"] })] }), message ? _jsx("p", { className: "mt-3 text-sm text-emerald-600", children: message }) : null] }), canManageJamaats ? (_jsxs("div", { className: "page-card p-6", children: [_jsx("div", { className: "flex flex-wrap items-center justify-between gap-3", children: _jsxs("div", { children: [_jsx("h2", { className: "page-title text-xl", children: "Manage Jamaats" }), _jsx("p", { className: "page-subtitle mt-1 text-sm", children: "Add jamaat names here so they can be selected during registration." })] }) }), _jsxs("form", { onSubmit: handleAddJamaat, className: "mt-4 flex flex-col gap-3 sm:flex-row", children: [_jsx("input", { value: jamaatName, onChange: (event) => setJamaatName(event.target.value), placeholder: "e.g. Kutchi Jamaat", className: "form-input w-full px-3 py-2" }), _jsx("button", { type: "submit", disabled: jamaatLoading, className: "btn-primary rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60", children: jamaatLoading ? 'Adding...' : 'Add Jamaat' })] }), _jsx("div", { className: "mt-4 flex flex-wrap gap-2", children: jamaats.length > 0 ? (jamaats.map((jamaat) => (_jsx("span", { className: "rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700", children: jamaat }, jamaat)))) : (_jsx("p", { className: "text-sm text-gray-500", children: "No jamaats yet." })) })] })) : null, _jsxs("div", { className: "page-card p-6", children: [_jsx("div", { className: "flex flex-wrap items-center justify-between gap-3", children: _jsxs("div", { children: [_jsx("h2", { className: "page-title text-xl", children: "Members by Jamaat" }), _jsx("p", { className: "page-subtitle mt-1 text-sm", children: "Click a jamaat to view only that group\u2019s members." })] }) }), canManageJamaats ? (_jsxs("div", { className: "mt-4 flex flex-col gap-3", children: [_jsx("input", { value: search, onChange: (event) => setSearch(event.target.value), placeholder: "Search by name, mobile, email, or jamaat", className: "form-input w-full px-3 py-2" }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { type: "button", onClick: () => setSelectedJamaat(null), className: `rounded-full px-3 py-1 text-sm font-medium ${selectedJamaat === null ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: "All Members" }), jamaatGroups.map(([jamaat, count]) => (_jsxs("button", { type: "button", onClick: () => setSelectedJamaat(jamaat), className: `rounded-full px-3 py-1 text-sm font-medium ${selectedJamaat === jamaat ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`, children: [jamaat, " ", _jsx("span", { className: "ml-1 rounded-full bg-white/70 px-2 py-0.5 text-xs", children: count })] }, jamaat)))] })] })) : (_jsx("div", { className: "mt-4 flex flex-col gap-3", children: _jsx("input", { value: search, onChange: (event) => setSearch(event.target.value), placeholder: "Search by name, mobile, or email", className: "form-input w-full px-3 py-2" }) })), selectedJamaat ? (_jsxs("p", { className: "mt-3 text-sm text-gray-600", children: ["Showing members for ", _jsx("span", { className: "font-semibold text-gray-800", children: selectedJamaat }), "."] })) : (_jsx("p", { className: "mt-3 text-sm text-gray-600", children: "Showing all members." })), loading ? (_jsx("p", { className: "text-sm text-gray-500", children: "Loading users..." })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-slate-200 text-left text-sm", children: [_jsx("thead", { className: "bg-slate-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 font-semibold text-slate-700", children: "Name" }), _jsx("th", { className: "px-4 py-3 font-semibold text-slate-700", children: "Mobile" }), _jsx("th", { className: "px-4 py-3 font-semibold text-slate-700", children: "Email" }), canManageRoles ? _jsx("th", { className: "px-4 py-3 font-semibold text-slate-700", children: "Role" }) : null, _jsx("th", { className: "px-4 py-3 font-semibold text-slate-700", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100", children: visibleUsers.map((user) => (_jsxs("tr", { children: [_jsx("td", { className: "px-4 py-3 font-medium text-slate-800", children: user.fullName }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: user.mobile }), _jsx("td", { className: "px-4 py-3 text-slate-600", children: user.email || '-' }), canManageRoles ? (_jsx("td", { className: "px-4 py-3", children: _jsxs("select", { value: user.role, onChange: (event) => handleRoleChange(user._id, event.target.value), className: "form-input rounded-lg px-3 py-2 text-sm", children: [_jsx("option", { value: "member", children: "Member" }), _jsx("option", { value: "moderator", children: "Moderator" })] }) })) : null, _jsx("td", { className: "px-4 py-3", children: _jsx("button", { type: "button", onClick: () => handleRemove(user._id), className: "rounded-lg border border-red-600 bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700", children: "Remove" }) })] }, user._id))) })] }) }))] })] }));
}
