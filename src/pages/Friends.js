import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios.js";
import UserAvatar from "../components/UserAvatar.js";
import { getPresenceStatus } from "../utils/presence.js";
export default function Friends() {
    const navigate = useNavigate();
    const [friends, setFriends] = useState([]);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [message, setMessage] = useState(null);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [activeTab, setActiveTab] = useState("search");
    const [unfriendConfirmUser, setUnfriendConfirmUser] = useState(null);
    const sentRequestIds = useMemo(() => new Set(sentRequests.map((request) => request._id)), [sentRequests]);
    const hiddenIds = useMemo(() => new Set([...(friends || []).map((friend) => friend._id), ...(incomingRequests || []).map((request) => request._id)]), [friends, incomingRequests]);
    const loadFriends = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const response = await API.get('/friends/me');
            setFriends(response.data.friends || []);
            setIncomingRequests(response.data.incomingRequests || []);
            setSentRequests(response.data.sentRequests || []);
        }
        catch (err) {
            setMessage(err.response?.data?.message || 'Unable to load friends.');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadFriends();
    }, []);
    const runSearch = async (searchText) => {
        const trimmed = searchText.trim();
        if (!trimmed) {
            setResults([]);
            return;
        }
        setSearching(true);
        setMessage(null);
        try {
            const response = await API.get(`/friends/search?q=${encodeURIComponent(trimmed)}`);
            const users = response.data.users || [];
            setResults(users.filter((user) => !hiddenIds.has(user._id)));
        }
        catch (err) {
            setMessage(err.response?.data?.message || 'Unable to search users.');
        }
        finally {
            setSearching(false);
        }
    };
    useEffect(() => {
        const timeout = setTimeout(() => {
            runSearch(query);
        }, 250);
        return () => clearTimeout(timeout);
    }, [query, hiddenIds, sentRequestIds]);
    const handleSearchClick = () => {
        runSearch(query);
    };
    const handleAcceptRequest = async (requesterId) => {
        setMessage(null);
        try {
            await API.post(`/friends/request/${requesterId}/accept`);
            setMessage('Friend request accepted.');
            await loadFriends();
        }
        catch (err) {
            setMessage(err.response?.data?.message || 'Unable to accept friend request.');
        }
    };
    const handleRejectRequest = async (requesterId) => {
        setMessage(null);
        try {
            await API.post(`/friends/request/${requesterId}/reject`);
            setMessage('Friend request rejected.');
            await loadFriends();
        }
        catch (err) {
            setMessage(err.response?.data?.message || 'Unable to reject friend request.');
        }
    };
    const handleSendRequest = async (friendId) => {
        setMessage(null);
        try {
            await API.post(`/friends/request/${friendId}`);
            setMessage('Friend request sent.');
            const sentUser = results.find((item) => item._id === friendId);
            setSentRequests((prev) => [
                ...prev,
                sentUser || { _id: friendId },
            ]);
        }
        catch (err) {
            setMessage(err.response?.data?.message || 'Unable to send friend request.');
        }
    };
    const handleCancelRequest = async (friendId) => {
        setMessage(null);
        try {
            await API.post(`/friends/request/${friendId}/cancel`);
            setMessage('Friend request canceled.');
            setSentRequests((prev) => prev.filter((request) => request._id !== friendId));
        }
        catch (err) {
            setMessage(err.response?.data?.message || 'Unable to cancel friend request.');
        }
    };
    const handleUnfriend = async (friendId) => {
        setMessage(null);
        try {
            await API.post(`/friends/unfriend/${friendId}`);
            setMessage('Friend removed.');
            await loadFriends();
        }
        catch (err) {
            setMessage(err.response?.data?.message || 'Unable to unfriend.');
        }
    };
    return (_jsxs("section", { className: "space-y-6", children: [_jsxs("div", { className: "overflow-hidden rounded-[1.5rem] border border-emerald-200 bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-700 p-6 sm:p-8 text-white shadow-[0_24px_60px_-30px_rgba(5,150,105,0.55)]", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100", children: "Community Friends" }), _jsx("h1", { className: "mt-2 text-2xl font-black sm:text-3xl text-white", children: "Friends" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-emerald-50", children: "Search community members, add friends, and manage requests." })] }), _jsx("div", { className: "mt-6 flex flex-wrap gap-2", children: ["search", "requests", "friends"].map((tab) => (_jsx("button", { type: "button", onClick: () => setActiveTab(tab), className: `rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "bg-white/15 text-white hover:bg-white/25"}`, children: tab === "search" ? "Search" : tab === "requests" ? "Requests" : "Friends" }, tab))) })] }), activeTab === "search" ? (_jsx("div", { className: "rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-sm", children: _jsxs("div", { className: "space-y-4", children: [_jsx("label", { className: "block text-sm font-semibold text-slate-700", children: "Search community members" }), _jsxs("div", { className: "grid gap-2 sm:grid-cols-[1fr_auto]", children: [_jsx("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "Type a name, username, email, or phone", className: "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" }), _jsx("button", { type: "button", onClick: handleSearchClick, disabled: searching, className: "rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60", children: searching ? 'Searching...' : 'Search' })] }), message ? (_jsx("div", { className: "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700", children: message })) : null, query.trim().length > 0 ? (_jsx("div", { className: "rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm", children: searching ? (_jsx("p", { className: "text-sm text-slate-500", children: "Searching members..." })) : results.length === 0 ? (_jsx("p", { className: "text-sm text-slate-500", children: "No matching members found." })) : (_jsx("div", { className: "space-y-3", children: results.map((user) => (_jsxs("div", { className: "flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [user.profilePhotoUrl ? (_jsx("img", { src: user.profilePhotoUrl, alt: user.fullName || user.username || 'User avatar', className: "h-12 w-12 rounded-full object-cover" })) : (_jsx("div", { className: "grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700", children: user.fullName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || '?' })), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-slate-900", children: user.fullName || user.username || 'Member' }), _jsx("p", { className: "text-sm text-slate-600", children: user.username ? `@${user.username}` : user.email || user.mobile })] })] }), sentRequestIds.has(user._id) ? (_jsx("button", { type: "button", onClick: () => handleCancelRequest(user._id), className: "rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700", children: "Cancel Request" })) : (_jsx("button", { type: "button", onClick: () => handleSendRequest(user._id), className: "rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800", children: "Send Request" }))] }, user._id))) })) })) : null] }) })) : null, activeTab === "requests" ? (_jsx("div", { className: "rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-sm", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-black text-slate-900", children: "Friend requests" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-slate-600", children: "See all incoming and outgoing friend requests in one place." })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Incoming requests" }), incomingRequests.length === 0 ? (_jsx("p", { className: "mt-3 text-sm text-slate-500", children: "No pending incoming requests." })) : (_jsx("div", { className: "mt-4 space-y-3", children: incomingRequests.map((requester) => (_jsx("div", { className: "rounded-3xl border border-slate-200 bg-slate-50 p-4", children: _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-slate-900", children: requester.fullName || requester.username || 'Member' }), _jsx("p", { className: "text-sm text-slate-600", children: requester.username ? `@${requester.username}` : requester.email || requester.mobile })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { type: "button", onClick: () => handleAcceptRequest(requester._id), className: "rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800", children: "Accept" }), _jsx("button", { type: "button", onClick: () => handleRejectRequest(requester._id), className: "rounded-2xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-300", children: "Reject" })] })] }) }, requester._id))) }))] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Outgoing requests" }), sentRequests.length === 0 ? (_jsx("p", { className: "mt-3 text-sm text-slate-500", children: "No outgoing requests." })) : (_jsx("div", { className: "mt-4 space-y-3", children: sentRequests.map((request) => (_jsx("div", { className: "rounded-3xl border border-slate-200 bg-slate-50 p-4", children: _jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-slate-900", children: request.fullName || request.username || 'Member' }), _jsx("p", { className: "text-sm text-slate-600", children: request.username ? `@${request.username}` : request.email || request.mobile })] }), _jsx("button", { type: "button", onClick: () => handleCancelRequest(request._id), className: "rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700", children: "Cancel Request" })] }) }, request._id))) }))] })] }) })) : null, activeTab === "friends" ? (_jsxs("div", { className: "rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-sm", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-black text-slate-900", children: "Your friends" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-slate-600", children: "Chat with or remove friends from your list." })] }), loading ? (_jsx("p", { className: "mt-4 text-sm text-slate-500", children: "Loading friends..." })) : friends.length === 0 ? (_jsx("p", { className: "mt-4 text-sm text-slate-500", children: "No friends yet. Search for members to add." })) : (_jsx("div", { className: "mt-6 space-y-3", children: friends.map((friend) => {
                            const friendPresence = getPresenceStatus(friend.isOnline, friend.lastActive);
                            return (_jsx("div", { className: "rounded-3xl border border-slate-200 bg-slate-50 p-4", children: _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "relative", children: [_jsx(UserAvatar, { name: friend.fullName || friend.username, photoUrl: friend.profilePhotoUrl, size: "md", className: "ring-1 ring-slate-200" }), _jsx("span", { className: `absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white ${friendPresence.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}` })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-slate-900", children: friend.fullName || friend.username || 'Member' }), _jsx("p", { className: "text-xs text-slate-600", children: friend.username ? `@${friend.username}` : friend.email || friend.mobile }), _jsxs("p", { className: `text-xs font-medium flex items-center gap-1 mt-0.5 ${friendPresence.isOnline ? 'text-emerald-600' : 'text-slate-500'}`, children: [_jsx("span", { className: `h-1.5 w-1.5 rounded-full ${friendPresence.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}` }), friendPresence.text] })] })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs("button", { type: "button", onClick: () => navigate(`/friends/${friend._id}/chat`), className: "inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800", children: [_jsx("span", { children: "Chat" }), friend.unreadCount && friend.unreadCount > 0 ? (_jsx("span", { className: "inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-black text-white", children: friend.unreadCount > 99 ? '99+' : friend.unreadCount })) : null] }), _jsx("button", { type: "button", onClick: () => setUnfriendConfirmUser(friend), className: "inline-flex items-center justify-center rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700", children: "Unfriend" })] })] }) }, friend._id));
                        }) }))] })) : null, unfriendConfirmUser ? (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm", children: _jsxs("div", { className: "w-full max-w-md space-y-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" }) }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-black text-slate-900", children: "Unfriend Confirmation" }), _jsx("p", { className: "text-xs font-medium text-slate-500", children: "Remove friend from your network" })] })] }), _jsxs("p", { className: "text-sm leading-relaxed text-slate-600", children: ["Are you sure you want to unfriend ", _jsx("span", { className: "font-bold text-slate-900", children: unfriendConfirmUser.fullName || unfriendConfirmUser.username || "this friend" }), "?"] }), _jsxs("div", { className: "flex items-center justify-end gap-3 pt-2", children: [_jsx("button", { type: "button", onClick: () => setUnfriendConfirmUser(null), className: "rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200", children: "Cancel" }), _jsx("button", { type: "button", onClick: () => {
                                        const friendId = unfriendConfirmUser._id;
                                        setUnfriendConfirmUser(null);
                                        handleUnfriend(friendId);
                                    }, className: "rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-600/30 transition hover:bg-rose-700", children: "Unfriend" })] })] }) })) : null] }));
}
