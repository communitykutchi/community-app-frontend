import { useEffect, useMemo, useRef, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";
import UserAvatar from "../components/UserAvatar";
import { getPresenceStatus } from "../utils/presence";

interface FriendUser {
  _id: string;
  fullName?: string;
  username?: string;
  email?: string;
  mobile?: string;
  profilePhotoUrl?: string;
  photoUrl?: string;
  isOnline?: boolean;
  lastActive?: string;
  unreadCount?: number;
}

interface ChatMessage {
  _id?: string;
  sender: { _id: string; fullName?: string; username?: string; profilePhotoUrl?: string; photoUrl?: string };
  text: string;
  isDelivered?: boolean;
  isRead?: boolean;
  isDeletedForEveryone?: boolean;
  createdAt: string;
}

interface ChatItem {
  _id: string;
  participants: FriendUser[];
  messages: ChatMessage[];
  updatedAt?: string;
  unreadCount?: number;
}

export default function ChatHub() {
  const { friendId: paramFriendId } = useParams();
  const navigate = useNavigate();

  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [chatsMap, setChatsMap] = useState<Record<string, ChatItem>>({});
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(paramFriendId || null);
  const [activeChat, setActiveChat] = useState<ChatItem | null>(null);
  const [selectedDeleteMsg, setSelectedDeleteMsg] = useState<ChatMessage | null>(null);

  const handleDeleteMessage = async (deleteType: "me" | "everyone") => {
    if (!selectedDeleteMsg || !activeChat?._id) return;
    const msgId = (selectedDeleteMsg as any)._id || (selectedDeleteMsg as any).id;
    try {
      const res = await API.delete<{ success: boolean; chat: ChatItem }>(
        `/friends/chats/${activeChat._id}/messages/${msgId}`,
        { data: { deleteType } }
      );
      if (res.data?.chat) {
        setActiveChat(res.data.chat);
      }
      setSelectedDeleteMsg(null);
    } catch (err: any) {
      setStatus(err?.response?.data?.message || "Could not delete message.");
      setSelectedDeleteMsg(null);
    }
  };
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "recent">("all");
  
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  
  const [currentUser, setCurrentUser] = useState<FriendUser | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    API.get<{ user?: any }>("/auth/me")
      .then((res) => {
        if (res.data?.user) {
          setCurrentUser(res.data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Sync param to selected friend
  useEffect(() => {
    if (paramFriendId) {
      setSelectedFriendId(paramFriendId);
    }
  }, [paramFriendId]);

  // Load friends and existing chats
  const loadData = async () => {
    try {
      // Load friends
      const friendsRes = await API.get<{ success: boolean; friends: FriendUser[] }>("/friends/me");
      const loadedFriends = friendsRes.data.friends || [];
      setFriends(loadedFriends);

      // Load user chats if available
      try {
        const chatsRes = await API.get<{ success: boolean; chats: ChatItem[] }>("/friends/chats");
        const chatsList = chatsRes.data.chats || [];
        const map: Record<string, ChatItem> = {};

        chatsList.forEach((c) => {
          c.participants.forEach((p) => {
            map[p._id] = c;
          });
        });
        setChatsMap(map);
      } catch {
        // Fallback if chats list endpoint is pending
      }
    } catch (err: any) {
      setStatus(err.response?.data?.message || "Failed to load chat data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      loadData();
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Load specific active chat
  const loadActiveChat = async (friendId: string) => {
    try {
      const res = await API.get<{ success: boolean; chat: ChatItem }>(`/friends/chats/${encodeURIComponent(friendId)}`);
      setActiveChat(res.data.chat);
      setChatsMap((prev) => ({
        ...prev,
        [friendId]: res.data.chat,
      }));
    } catch (err: any) {
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
    } else {
      setActiveChat(null);
    }
  }, [selectedFriendId]);

  const userScrolledUpRef = useRef<boolean>(false);
  const [userScrolledUp, setUserScrolledUp] = useState<boolean>(false);
  const prevFriendIdRef = useRef<string | null>(null);

  const handleScrollMessages = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 80;
    userScrolledUpRef.current = !isAtBottom;
    setUserScrolledUp(!isAtBottom);
  };

  const scrollToBottom = () => {
    const el = document.getElementById("chat-messages-container");
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  };

  useEffect(() => {
    if (selectedFriendId !== prevFriendIdRef.current) {
      // Friend changed - force scroll to bottom on mount
      prevFriendIdRef.current = selectedFriendId;
      userScrolledUpRef.current = false;
      setUserScrolledUp(false);
      setTimeout(scrollToBottom, 50);
      return;
    }

    // Messages updated for same friend - only scroll if user hasn't scrolled up!
    if (!userScrolledUpRef.current) {
      scrollToBottom();
    }
  }, [activeChat?.messages?.length, selectedFriendId]);

  const handleSelectFriend = (id: string) => {
    setSelectedFriendId(id);
    navigate(`/friends/${id}/chat`, { replace: true });
  };

  const handleSendMessage = async () => {
    if (!activeChat || !messageText.trim()) return;
    const textToSend = messageText.trim();

    setMessageText("");
    setShowEmojiPicker(false);
    setStatus(null);
    userScrolledUpRef.current = false;
    setUserScrolledUp(false);

    const tempId = "temp-" + Date.now();
    const tempMsg: ChatMessage = {
      _id: tempId,
      sender: currentUser ? { _id: currentUser._id, fullName: currentUser.fullName, username: currentUser.username } : { _id: "" },
      text: textToSend,
      createdAt: new Date().toISOString(),
      isDelivered: false,
      isRead: false,
    };

    setActiveChat((prev) => (prev ? { ...prev, messages: [...prev.messages, tempMsg] } : prev));
    setTimeout(scrollToBottom, 20);

    try {
      const res = await API.post<{ success: boolean; chat: ChatItem }>(
        `/friends/chats/${activeChat._id}/messages`,
        { text: textToSend }
      );
      setActiveChat(res.data.chat);
      if (selectedFriendId) {
        setChatsMap((prev) => ({
          ...prev,
          [selectedFriendId]: res.data.chat,
        }));
      }
      setTimeout(scrollToBottom, 50);
    } catch (err: any) {
      setStatus(err.response?.data?.message || "Message failed to send.");
      setActiveChat((prev) => (prev ? { ...prev, messages: prev.messages.filter((m) => m._id !== tempId) } : prev));
    }
  };

  const addEmoji = (emoji: string) => {
    setMessageText((prev) => prev + emoji);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredFriends = useMemo(() => {
    return friends.filter((friend) => {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch =
        !q ||
        (friend.fullName?.toLowerCase().includes(q) ?? false) ||
        (friend.username?.toLowerCase().includes(q) ?? false) ||
        (friend.email?.toLowerCase().includes(q) ?? false);

      if (!nameMatch) return false;

      if (filterTab === "recent") {
        return Boolean(chatsMap[friend._id]);
      }
      return true;
    });
  }, [friends, searchQuery, filterTab, chatsMap]);

  const renderMessageTicks = (message: ChatMessage) => {
    if (message.isRead) {
      return (
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-emerald-400 inline-block" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 10l4 4L14 3" />
        </svg>
      );
    }
    if (message.isDelivered) {
      return (
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-slate-200 inline-block" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 10l4 4L14 3" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-slate-400 inline-block" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
    );
  };

  const activePartner = useMemo(() => {
    if (!selectedFriendId) return null;

    const friendObj = friends.find((f) => f._id === selectedFriendId);
    const chatPartner = activeChat?.participants.find((p) => p._id === selectedFriendId);

    if (!friendObj && !chatPartner) return null;

    return {
      ...friendObj,
      ...chatPartner,
    };
  }, [selectedFriendId, friends, activeChat]);

  const activePartnerPresence = getPresenceStatus(activePartner?.isOnline, activePartner?.lastActive);

  const emojis = ["😊", "😂", "❤️", "👍", "🔥", "🎉", "👋", "🙌", "😍", "✨", "🙏", "😎"];

  return (
    <section className="flex h-[calc(100vh-4.25rem)] w-full flex-col overflow-hidden px-2 py-2 sm:px-4 lg:px-6">
      {/* Main Split Interface */}
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-3 min-h-0 overflow-hidden">
        {/* Left Friends / Chats List Sidebar */}
        <div className={`flex flex-col h-full min-h-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden ${selectedFriendId ? 'hidden lg:flex' : 'flex'}`}>
          {/* Sidebar Header & Search */}
          <div className="shrink-0 border-b border-slate-100 bg-slate-50/70 p-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-3 grid place-items-center text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friends..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition"
              />
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setFilterTab("all")}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${filterTab === "all" ? "bg-emerald-700 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-100"}`}
              >
                All Friends ({friends.length})
              </button>
              <button
                onClick={() => setFilterTab("recent")}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${filterTab === "recent" ? "bg-emerald-700 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-100"}`}
              >
                Recent Chats
              </button>
            </div>
          </div>

          {/* Friends List Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 animate-pulse">Loading friends...</div>
            ) : filteredFriends.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 grid place-items-center text-slate-400 mb-2">
                  💬
                </div>
                <p className="text-xs font-bold text-slate-700">No friends found</p>
                <p className="text-[11px] text-slate-400 mt-1">Search or add friends to start chatting.</p>
              </div>
            ) : (
              filteredFriends.map((friend) => {
                const isSelected = friend._id === selectedFriendId;
                const friendChat = chatsMap[friend._id];
                const lastMsg = friendChat?.messages?.[friendChat.messages.length - 1];
                const friendPresence = getPresenceStatus(friend.isOnline, friend.lastActive);
                const unreadCount = Number(friend.unreadCount || (friendChat as any)?.unreadCount || 0);

                return (
                  <div
                    key={friend._id}
                    onClick={() => handleSelectFriend(friend._id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition ${isSelected ? "bg-emerald-50/80 border border-emerald-200/60 shadow-sm" : "hover:bg-slate-50"}`}
                  >
                    <div className="relative">
                      <UserAvatar
                        name={friend.fullName || friend.username}
                        photoUrl={friend.profilePhotoUrl || friend.photoUrl}
                        size="md"
                        className="ring-2 ring-emerald-600/20"
                      />
                      <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white ${friendPresence.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {friend.fullName || friend.username || "Friend"}
                        </h4>
                        {unreadCount > 0 ? (
                          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white shrink-0">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        ) : (
                          lastMsg?.createdAt && (
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {lastMsg ? lastMsg.text : "@" + (friend.username || "friend")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Chat Pane */}
        <div className={`flex-1 flex flex-col rounded-3xl border border-slate-200 bg-white shadow-lg overflow-hidden ${!selectedFriendId ? 'hidden lg:flex' : 'flex'}`}>
          {selectedFriendId && activePartner ? (
            <>
              {/* Chat View Header */}
              <div className="shrink-0 flex items-center justify-between border-b border-slate-100 bg-slate-900 px-5 py-3 text-white">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedFriendId(null)}
                    className="lg:hidden p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="relative">
                    <UserAvatar
                      name={activePartner.fullName || activePartner.username}
                      photoUrl={activePartner.profilePhotoUrl || activePartner.photoUrl}
                      size="md"
                      className={activePartnerPresence.isOnline ? "ring-2 ring-emerald-400" : "ring-2 ring-slate-600"}
                    />
                    <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-slate-900 ${activePartnerPresence.isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white leading-tight">
                      {activePartner.fullName || activePartner.username || "Friend"}
                    </h3>
                    <p className={`text-[11px] font-semibold ${activePartnerPresence.isOnline ? 'text-emerald-400' : 'text-emerald-200'}`}>
                      {activePartnerPresence.text}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSoundEnabled((s) => !s)}
                    className={`p-2 rounded-xl transition ${soundEnabled ? 'bg-emerald-600/30 text-emerald-300' : 'bg-white/10 text-slate-400'}`}
                    title={soundEnabled ? 'Sound On' : 'Sound Muted'}
                  >
                    {soundEnabled ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => loadActiveChat(selectedFriendId)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                    title="Refresh Chat"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Status Notice */}
              {status && (
                <div className="bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 border-b border-rose-100 flex items-center justify-between">
                  <span>{status}</span>
                  <button onClick={() => setStatus(null)} className="text-rose-500 hover:text-rose-800">✕</button>
                </div>
              )}

              {/* Chat Messages Log */}
              <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col">
                <div
                  id="chat-messages-container"
                  onScroll={handleScrollMessages}
                  className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 via-slate-100/50 to-emerald-50/20 p-4 space-y-3"
                >
                  {!activeChat?.messages?.length ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center text-2xl shadow-inner mb-3">
                        👋
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">Say Hello to {activePartner.fullName || activePartner.username}!</h3>
                      <p className="text-xs text-slate-500 max-w-xs mt-1">
                        Start your conversation by sending a message below.
                      </p>
                    </div>
                  ) : (
                    activeChat.messages.map((item, idx) => {
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

                      return (
                        <div
                          key={idx}
                          className={`flex items-end gap-2 ${isOutgoing ? "justify-end" : "justify-start"}`}
                        >
                          {!isOutgoing && (
                            <UserAvatar
                              name={senderName}
                              photoUrl={senderPhoto || activePartner?.profilePhotoUrl || activePartner?.photoUrl}
                              size="sm"
                              className="ring-1 ring-slate-300 mb-0.5 shrink-0"
                            />
                          )}

                          <div className="group relative flex items-center max-w-[82%] sm:max-w-[75%]">
                            <div
                              className={`w-full rounded-2xl ${
                                isOutgoing
                                  ? "bg-emerald-600 text-white rounded-br-xs shadow-sm px-3.5 py-1.5"
                                  : "bg-white text-slate-900 border border-slate-200/90 rounded-bl-xs shadow-sm px-3.5 py-1.5"
                              }`}
                            >
                              <p className={`text-[11px] font-bold mb-0.5 ${isOutgoing ? 'text-emerald-100' : 'text-emerald-700'}`}>
                                {senderName}
                              </p>
                              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                                <span className={`text-xs sm:text-sm leading-snug whitespace-pre-wrap break-words font-normal ${item.isDeletedForEveryone ? 'italic opacity-80' : ''}`}>
                                  {item.isDeletedForEveryone ? "🚫 " + item.text : item.text}
                                </span>
                                <span className={`text-[10px] ml-auto shrink-0 flex items-center gap-1 mt-0.5 ${isOutgoing ? 'text-emerald-100' : 'text-slate-400'}`}>
                                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  {isOutgoing && (
                                    <svg className="w-3.5 h-3.5 text-emerald-100 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedDeleteMsg(item)}
                              className={`opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 text-slate-400 hover:text-rose-500 rounded-full hover:bg-slate-200/60 ${isOutgoing ? 'order-first mr-1.5' : 'ml-1.5'}`}
                              title="Delete message"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          {isOutgoing && (
                            <UserAvatar
                              name={currentUser?.fullName || currentUser?.username || 'You'}
                              photoUrl={currentUser?.profilePhotoUrl || currentUser?.photoUrl || senderPhoto}
                              size="sm"
                              className="ring-1 ring-emerald-500/40 mb-0.5 shrink-0"
                            />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {userScrolledUp && (
                  <button
                    type="button"
                    onClick={() => {
                      userScrolledUpRef.current = false;
                      setUserScrolledUp(false);
                      scrollToBottom();
                    }}
                    className="absolute bottom-4 right-6 z-20 flex items-center gap-1.5 rounded-full bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-800 transition animate-bounce"
                  >
                    <span>↓ Scroll to bottom</span>
                  </button>
                )}
              </div>

              {/* Emoji Picker Popup */}
              {showEmojiPicker && (
                <div className="bg-white border-t border-slate-200 px-4 py-2 flex flex-wrap gap-2 shadow-inner">
                  {emojis.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => addEmoji(e)}
                      className="text-lg hover:scale-125 transition p-1"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}

              {/* Message Input Box */}
              <div className="shrink-0 p-3 bg-white border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                  title="Emoji"
                >
                  😊
                </button>

                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message... (Press Enter to send)"
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition min-h-[38px] max-h-[100px]"
                />

                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={sending || !messageText.trim()}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      Send
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </span>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Unselected Hero View */
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white grid place-items-center text-3xl shadow-xl shadow-emerald-600/20 mb-4 animate-bounce">
                💬
              </div>
              <h2 className="text-xl font-black text-slate-900">Your Chat Space</h2>
              <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
                Select any friend from the sidebar to view their messages or start a new conversation.
              </p>

              {friends.length > 0 && (
                <div className="mt-6 w-full max-w-md bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-left">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Quick Start Chat</h4>
                  <div className="flex flex-wrap gap-2">
                    {friends.slice(0, 5).map((f) => (
                      <button
                        key={f._id}
                        onClick={() => handleSelectFriend(f._id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 px-3 py-2 text-xs font-semibold transition"
                      >
                        <UserAvatar name={f.fullName || f.username} photoUrl={f.profilePhotoUrl} size="sm" />
                        <span>{f.fullName || f.username}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Delete Message Modal */}
      {selectedDeleteMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-slate-900">Delete Message</h3>
            <p className="mt-1 text-xs text-slate-500">Choose how you would like to delete this message.</p>

            <div className="mt-4 space-y-2.5">
              {/* Delete for Me Button */}
              <button
                type="button"
                onClick={() => handleDeleteMessage("me")}
                className="w-full flex items-center gap-3 rounded-2xl bg-slate-100 p-3 text-left hover:bg-slate-200 transition"
              >
                <span className="text-xl">🗑️</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Delete for Me</h4>
                  <p className="text-[11px] text-slate-500">Remove from your chat view</p>
                </div>
              </button>

              {/* Delete for Everyone Button */}
              {(() => {
                const senderId = typeof selectedDeleteMsg.sender === "object" && selectedDeleteMsg.sender?._id
                  ? String(selectedDeleteMsg.sender._id)
                  : String(selectedDeleteMsg.sender || "");
                const isOutgoing = currentUser?._id
                  ? senderId === String(currentUser._id)
                  : selectedFriendId
                  ? senderId !== String(selectedFriendId)
                  : false;
                const hoursDiff = (Date.now() - new Date(selectedDeleteMsg.createdAt).getTime()) / (1000 * 60 * 60);
                const canDeleteEveryone = isOutgoing && hoursDiff <= 24 && !selectedDeleteMsg.isDeletedForEveryone;

                if (!canDeleteEveryone) return null;

                return (
                  <button
                    type="button"
                    onClick={() => handleDeleteMessage("everyone")}
                    className="w-full flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-left hover:bg-rose-100 transition"
                  >
                    <span className="text-xl">🌐</span>
                    <div>
                      <h4 className="text-xs font-bold text-rose-700">Delete for Everyone</h4>
                      <p className="text-[11px] text-rose-600">Remove for both participants (24h limit)</p>
                    </div>
                  </button>
                );
              })()}
            </div>

            <button
              type="button"
              onClick={() => setSelectedDeleteMsg(null)}
              className="mt-4 w-full py-2 text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
