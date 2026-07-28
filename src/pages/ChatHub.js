import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios.js";
import UserAvatar from "../components/UserAvatar.js";
import { getPresenceStatus } from "../utils/presence.js";
export default function ChatHub() {
    const { friendId: paramFriendId } = useParams();
    const navigate = useNavigate();
    const [friends, setFriends] = useState([]);
    const [chatsMap, setChatsMap] = useState({});
    const [selectedFriendId, setSelectedFriendId] = useState(paramFriendId || null);
    const [activeChat, setActiveChat] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterTab, setFilterTab] = useState("all");
    const [messageText, setMessageText] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    useEffect(() => {
        API.get("/auth/me")
            .then((res) => {
            if (res.data?.user) {
                setCurrentUser(res.data.user);
            }
        })
            .catch(() => { });
    }, []);
    // Sync param to selected friend
    useEffect(() => {
        if (paramFriendId) {
            setSelectedFriendId(paramFriendId);
        }
    }, [paramFriendId]);
    // Load friends and existing chats
    const loadData = async () => {
        setLoading(true);
        try {
            // Load friends
            const friendsRes = await API.get("/friends/me");
            const loadedFriends = friendsRes.data.friends || [];
            setFriends(loadedFriends);
            // Load user chats if available
            try {
                const chatsRes = await API.get("/friends/chats");
                const chatsList = chatsRes.data.chats || [];
                const map = {};
                chatsList.forEach((c) => {
                    c.participants.forEach((p) => {
                        map[p._id] = c;
                    });
                });
                setChatsMap(map);
            }
            catch {
                // Fallback if chats list endpoint is pending
            }
        }
        catch (err) {
            setStatus(err.response?.data?.message || "Failed to load chat data.");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadData();
    }, []);
    // Load specific active chat
    const loadActiveChat = async (friendId) => {
        try {
            const res = await API.get(`/friends/chats/${encodeURIComponent(friendId)}`);
            setActiveChat(res.data.chat);
            setChatsMap((prev) => ({
                ...prev,
                [friendId]: res.data.chat,
            }));
        }
        catch (err) {
            setStatus(err.response?.data?.message || "Could not open chat with this friend.");
        }
    };
    useEffect(() => {
        if (selectedFriendId) {
            loadActiveChat(selectedFriendId);
            // Auto poll every 3 seconds for active chat
            const timer = setInterval(() => {
                loadActiveChat(selectedFriendId);
            }, 3000);
            return () => clearInterval(timer);
        }
        else {
            setActiveChat(null);
        }
    }, [selectedFriendId]);
    // Scroll to bottom when messages update
    useEffect(() => {
        const el = document.getElementById("chat-messages-container");
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    }, [activeChat?.messages]);
    const handleSelectFriend = (id) => {
        setSelectedFriendId(id);
        navigate(`/friends/${id}/chat`, { replace: true });
    };
    const handleSendMessage = async () => {
        if (!activeChat || !messageText.trim() || sending)
            return;
        setSending(true);
        setStatus(null);
        try {
            const res = await API.post(`/friends/chats/${activeChat._id}/messages`, { text: messageText.trim() });
            setActiveChat(res.data.chat);
            if (selectedFriendId) {
                setChatsMap((prev) => ({
                    ...prev,
                    [selectedFriendId]: res.data.chat,
                }));
            }
            setMessageText("");
            setShowEmojiPicker(false);
        }
        catch (err) {
            setStatus(err.response?.data?.message || "Message failed to send.");
        }
        finally {
            setSending(false);
        }
    };
    const addEmoji = (emoji) => {
        setMessageText((prev) => prev + emoji);
    };
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    const filteredFriends = useMemo(() => {
        return friends.filter((friend) => {
            const q = searchQuery.toLowerCase().trim();
            const nameMatch = !q ||
                (friend.fullName?.toLowerCase().includes(q) ?? false) ||
                (friend.username?.toLowerCase().includes(q) ?? false) ||
                (friend.email?.toLowerCase().includes(q) ?? false);
            if (!nameMatch)
                return false;
            if (filterTab === "recent") {
                return Boolean(chatsMap[friend._id]);
            }
            return true;
        });
    }, [friends, searchQuery, filterTab, chatsMap]);
    const renderMessageTicks = (message) => {
        if (message.isRead) {
            return (_jsxs("svg", { viewBox: "0 0 24 24", className: "w-3.5 h-3.5 text-emerald-400 inline-block", fill: "none", stroke: "currentColor", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M1 10l4 4L14 3" })] }));
        }
        if (message.isDelivered) {
            return (_jsxs("svg", { viewBox: "0 0 24 24", className: "w-3.5 h-3.5 text-slate-200 inline-block", fill: "none", stroke: "currentColor", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M1 10l4 4L14 3" })] }));
        }
        return (_jsx("svg", { viewBox: "0 0 24 24", className: "w-3.5 h-3.5 text-slate-400 inline-block", fill: "none", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" }) }));
    };
    const activePartner = useMemo(() => {
        if (!selectedFriendId)
            return null;
        const friendObj = friends.find((f) => f._id === selectedFriendId);
        const chatPartner = activeChat?.participants.find((p) => p._id === selectedFriendId);
        if (!friendObj && !chatPartner)
            return null;
        return {
            ...friendObj,
            ...chatPartner,
        };
    }, [selectedFriendId, friends, activeChat]);
    const activePartnerPresence = getPresenceStatus(activePartner?.isOnline, activePartner?.lastActive);
    const emojis = ["😊", "😂", "❤️", "👍", "🔥", "🎉", "👋", "🙌", "😍", "✨", "🙏", "😎"];
    return (_jsxs("section", { className: "mx-auto max-w-7xl px-2 py-4 sm:px-4 lg:px-6", children: [_jsxs("div", { className: "mb-4 flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 px-6 py-5 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "inline-block h-3 w-3 rounded-full bg-emerald-400 animate-pulse" }), _jsx("span", { className: "text-xs font-bold uppercase tracking-widest text-emerald-300", children: "Messages Hub" })] }), _jsx("h1", { className: "mt-1 text-2xl font-black tracking-tight sm:text-3xl", children: "Community Chat Section" }), _jsx("p", { className: "mt-1 text-xs text-slate-300 sm:text-sm", children: "Connect & talk with your community friends in real-time." })] }), _jsx("div", { className: "flex items-center gap-3", children: _jsxs("button", { onClick: () => navigate("/friends"), className: "inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-white/20 transition", children: [_jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" }) }), "Add Friends"] }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-4 h-[calc(100vh-12rem)] min-h-[580px]", children: [_jsxs("div", { className: `flex flex-col rounded-3xl border border-slate-200 bg-white shadow-lg overflow-hidden ${selectedFriendId ? 'hidden lg:flex' : 'flex'}`, children: [_jsxs("div", { className: "border-b border-slate-100 bg-slate-50/70 p-4", children: [_jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute inset-y-0 left-3 grid place-items-center text-slate-400", children: _jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }) }), _jsx("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Search friends...", className: "w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition" })] }), _jsxs("div", { className: "mt-3 flex gap-2", children: [_jsxs("button", { onClick: () => setFilterTab("all"), className: `flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${filterTab === "all" ? "bg-emerald-700 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-100"}`, children: ["All Friends (", friends.length, ")"] }), _jsx("button", { onClick: () => setFilterTab("recent"), className: `flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${filterTab === "recent" ? "bg-emerald-700 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-100"}`, children: "Recent Chats" })] })] }), _jsx("div", { className: "flex-1 overflow-y-auto divide-y divide-slate-100 p-2", children: loading ? (_jsx("div", { className: "p-8 text-center text-xs text-slate-400 animate-pulse", children: "Loading friends..." })) : filteredFriends.length === 0 ? (_jsxs("div", { className: "p-8 text-center", children: [_jsx("div", { className: "mx-auto w-12 h-12 rounded-full bg-slate-100 grid place-items-center text-slate-400 mb-2", children: "\uD83D\uDCAC" }), _jsx("p", { className: "text-xs font-bold text-slate-700", children: "No friends found" }), _jsx("p", { className: "text-[11px] text-slate-400 mt-1", children: "Search or add friends to start chatting." })] })) : (filteredFriends.map((friend) => {
                                    const isSelected = friend._id === selectedFriendId;
                                    const friendChat = chatsMap[friend._id];
                                    const lastMsg = friendChat?.messages?.[friendChat.messages.length - 1];
                                    const friendPresence = getPresenceStatus(friend.isOnline, friend.lastActive);
                                    return (_jsxs("div", { onClick: () => handleSelectFriend(friend._id), className: `flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition ${isSelected ? "bg-emerald-50/80 border border-emerald-200/60 shadow-sm" : "hover:bg-slate-50"}`, children: [_jsxs("div", { className: "relative", children: [_jsx(UserAvatar, { name: friend.fullName || friend.username, photoUrl: friend.profilePhotoUrl || friend.photoUrl, size: "md", className: "ring-2 ring-emerald-600/20" }), _jsx("span", { className: `absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white ${friendPresence.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}` })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h4", { className: "text-xs font-bold text-slate-900 truncate", children: friend.fullName || friend.username || "Friend" }), lastMsg?.createdAt && (_jsx("span", { className: "text-[10px] text-slate-400", children: new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }))] }), _jsx("p", { className: "text-[11px] text-slate-500 truncate mt-0.5", children: lastMsg ? lastMsg.text : "@" + (friend.username || "friend") })] })] }, friend._id));
                                })) })] }), _jsx("div", { className: `flex-1 flex flex-col rounded-3xl border border-slate-200 bg-white shadow-lg overflow-hidden ${!selectedFriendId ? 'hidden lg:flex' : 'flex'}`, children: selectedFriendId && activePartner ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-between border-b border-slate-100 bg-slate-900 px-5 py-3 text-white", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: () => setSelectedFriendId(null), className: "lg:hidden p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20", children: _jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15 19l-7-7 7-7" }) }) }), _jsxs("div", { className: "relative", children: [_jsx(UserAvatar, { name: activePartner.fullName || activePartner.username, photoUrl: activePartner.profilePhotoUrl || activePartner.photoUrl, size: "md", className: activePartnerPresence.isOnline ? "ring-2 ring-emerald-400" : "ring-2 ring-slate-600" }), _jsx("span", { className: `absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-slate-900 ${activePartnerPresence.isOnline ? 'bg-emerald-400' : 'bg-slate-500'}` })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-black text-white leading-tight", children: activePartner.fullName || activePartner.username || "Friend" }), _jsx("p", { className: `text-[11px] font-semibold ${activePartnerPresence.isOnline ? 'text-emerald-400' : 'text-emerald-200'}`, children: activePartnerPresence.text })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => setSoundEnabled((s) => !s), className: `p-2 rounded-xl transition ${soundEnabled ? 'bg-emerald-600/30 text-emerald-300' : 'bg-white/10 text-slate-400'}`, title: soundEnabled ? 'Sound On' : 'Sound Muted', children: soundEnabled ? (_jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" }) })) : (_jsxs("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" })] })) }), _jsx("button", { onClick: () => loadActiveChat(selectedFriendId), className: "p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition", title: "Refresh Chat", children: _jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) }) })] })] }), status && (_jsxs("div", { className: "bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 border-b border-rose-100 flex items-center justify-between", children: [_jsx("span", { children: status }), _jsx("button", { onClick: () => setStatus(null), className: "text-rose-500 hover:text-rose-800", children: "\u2715" })] })), _jsx("div", { id: "chat-messages-container", className: "flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 via-slate-100/50 to-emerald-50/20 p-4 space-y-3", children: !activeChat?.messages?.length ? (_jsxs("div", { className: "h-full flex flex-col items-center justify-center p-6 text-center", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center text-2xl shadow-inner mb-3", children: "\uD83D\uDC4B" }), _jsxs("h3", { className: "text-sm font-bold text-slate-800", children: ["Say Hello to ", activePartner.fullName || activePartner.username, "!"] }), _jsx("p", { className: "text-xs text-slate-500 max-w-xs mt-1", children: "Start your conversation by sending a message below." })] })) : (activeChat.messages.map((item, idx) => {
                                        const senderId = typeof item.sender === "object" && item.sender?._id
                                            ? String(item.sender._id)
                                            : String(item.sender || "");
                                        const isOutgoing = currentUser?._id
                                            ? senderId === String(currentUser._id)
                                            : (selectedFriendId ? senderId !== String(selectedFriendId) : false);
                                        const senderName = isOutgoing
                                            ? "You"
                                            : typeof item.sender === "object"
                                                ? item.sender.fullName || item.sender.username || activePartner?.fullName || "Friend"
                                                : activePartner?.fullName || activePartner?.username || "Friend";
                                        const senderPhoto = typeof item.sender === "object"
                                            ? item.sender.profilePhotoUrl || item.sender.photoUrl
                                            : undefined;
                                        return (_jsxs("div", { className: `flex items-end gap-2 ${isOutgoing ? "justify-end" : "justify-start"}`, children: [!isOutgoing && (_jsx(UserAvatar, { name: senderName, photoUrl: senderPhoto || activePartner?.profilePhotoUrl || activePartner?.photoUrl, size: "sm", className: "ring-1 ring-slate-300 mb-0.5 shrink-0" })), _jsxs("div", { className: `max-w-[82%] sm:max-w-[75%] rounded-2xl ${isOutgoing
                                                        ? "bg-emerald-600 text-white rounded-br-xs shadow-sm px-3.5 py-1.5"
                                                        : "bg-white text-slate-900 border border-slate-200/90 rounded-bl-xs shadow-sm px-3.5 py-1.5"}`, children: [_jsx("p", { className: `text-[11px] font-bold mb-0.5 ${isOutgoing ? 'text-emerald-100' : 'text-emerald-700'}`, children: senderName }), _jsxs("div", { className: "flex flex-wrap items-baseline justify-between gap-x-3", children: [_jsx("span", { className: "text-xs sm:text-sm leading-snug whitespace-pre-wrap break-words font-normal", children: item.text }), _jsxs("span", { className: `text-[10px] ml-auto shrink-0 flex items-center gap-1 mt-0.5 ${isOutgoing ? 'text-emerald-100' : 'text-slate-400'}`, children: [new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isOutgoing && (_jsx("svg", { className: "w-3.5 h-3.5 text-emerald-100 inline-block", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" }) }))] })] })] }), isOutgoing && (_jsx(UserAvatar, { name: currentUser?.fullName || currentUser?.username || 'You', photoUrl: currentUser?.profilePhotoUrl || currentUser?.photoUrl || senderPhoto, size: "sm", className: "ring-1 ring-emerald-500/40 mb-0.5 shrink-0" }))] }, idx));
                                    })) }), showEmojiPicker && (_jsx("div", { className: "bg-white border-t border-slate-200 px-4 py-2 flex flex-wrap gap-2 shadow-inner", children: emojis.map((e) => (_jsx("button", { type: "button", onClick: () => addEmoji(e), className: "text-lg hover:scale-125 transition p-1", children: e }, e))) })), _jsxs("div", { className: "p-3 bg-white border-t border-slate-100 flex items-center gap-2", children: [_jsx("button", { type: "button", onClick: () => setShowEmojiPicker((v) => !v), className: "p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition", title: "Emoji", children: "\uD83D\uDE0A" }), _jsx("textarea", { value: messageText, onChange: (e) => setMessageText(e.target.value), onKeyDown: handleKeyDown, placeholder: "Type a message... (Press Enter to send)", rows: 1, className: "flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition min-h-[38px] max-h-[100px]" }), _jsx("button", { type: "button", onClick: handleSendMessage, disabled: sending || !messageText.trim(), className: "inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed", children: sending ? (_jsxs("svg", { className: "w-4 h-4 animate-spin text-white", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v8H4z" })] })) : (_jsxs("span", { className: "flex items-center gap-1.5", children: ["Send", _jsx("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8" }) })] })) })] })] })) : (
                        /* Unselected Hero View */
                        _jsxs("div", { className: "flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 text-center", children: [_jsx("div", { className: "w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white grid place-items-center text-3xl shadow-xl shadow-emerald-600/20 mb-4 animate-bounce", children: "\uD83D\uDCAC" }), _jsx("h2", { className: "text-xl font-black text-slate-900", children: "Your Chat Space" }), _jsx("p", { className: "text-xs text-slate-500 max-w-sm mt-2 leading-relaxed", children: "Select any friend from the sidebar to view their messages or start a new conversation." }), friends.length > 0 && (_jsxs("div", { className: "mt-6 w-full max-w-md bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-left", children: [_jsx("h4", { className: "text-xs font-bold text-slate-700 uppercase tracking-wider mb-3", children: "Quick Start Chat" }), _jsx("div", { className: "flex flex-wrap gap-2", children: friends.slice(0, 5).map((f) => (_jsxs("button", { onClick: () => handleSelectFriend(f._id), className: "inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 px-3 py-2 text-xs font-semibold transition", children: [_jsx(UserAvatar, { name: f.fullName || f.username, photoUrl: f.profilePhotoUrl, size: "sm" }), _jsx("span", { children: f.fullName || f.username })] }, f._id))) })] }))] })) })] })] }));
}
