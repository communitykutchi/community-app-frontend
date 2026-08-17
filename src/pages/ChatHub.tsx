import React, { useEffect, useMemo, useRef, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";
import UserAvatar from "../components/UserAvatar";
import AudioPlayer from "../components/AudioPlayer";
import { getPresenceStatus, getChatMessageDateLabel } from "../utils/presence";
import {
  getAudioStream,
  createSafeMediaRecorder,
  startMediaRecorderSafely,
  formatAudioError,
} from "../utils/audioRecorder";

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
  text?: string;
  audioUrl?: string;
  audioDuration?: number;
  mediaUrl?: string;
  mediaType?: "audio" | "image" | "video" | "document";
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
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [activeMsgMenuId, setActiveMsgMenuId] = useState<string | null>(null);

  // Message selection & action state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<string[]>([]);
  const [pinnedFriendIds, setPinnedFriendIds] = useState<string[]>([]);
  const [pinnedMsgMap, setPinnedMsgMap] = useState<Record<string, string>>({});

  // Report User modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("Spam or suspicious behavior");
  const [reporting, setReporting] = useState(false);

  const isSelectedPartnerFriend = useMemo(() => {
    if (!selectedFriendId) return false;
    return (friends || []).some((f) => String(f._id) === String(selectedFriendId));
  }, [friends, selectedFriendId]);

  const handleCopyMessageText = (msgText?: string) => {
    if (!msgText) return;
    navigator.clipboard.writeText(msgText).then(() => {
      setStatus("Message text copied to clipboard!");
      setTimeout(() => setStatus(null), 2500);
    }).catch(() => {});
    setActiveMsgMenuId(null);
  };

  const toggleSelectMessage = (id: string) => {
    setSelectedMsgIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllMessages = () => {
    if (!activeChat?.messages) return;
    const allIds = activeChat.messages.map((m) => String(m._id || m.createdAt));
    setSelectedMsgIds(allIds);
    setIsSelectionMode(true);
    setShowHeaderMenu(false);
  };

  const handlePinSelectedMessage = () => {
    if (!selectedFriendId || selectedMsgIds.length !== 1) return;
    const targetId = selectedMsgIds[0];
    setPinnedMsgMap((prev) => ({
      ...prev,
      [selectedFriendId]: targetId,
    }));
    setStatus("📌 Message pinned to top of chat!");
    setTimeout(() => setStatus(null), 2500);
    setIsSelectionMode(false);
    setSelectedMsgIds([]);
  };

  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const triggerDeleteSelected = () => {
    if (!selectedMsgIds.length || !activeChat) return;
    if (selectedMsgIds.length === 1) {
      const targetId = selectedMsgIds[0];
      const targetMsg = activeChat.messages.find((m) => String(m._id || m.createdAt) === targetId);
      if (targetMsg) {
        setSelectedDeleteMsg(targetMsg);
        return;
      }
    }
    setShowBulkDeleteModal(true);
  };

  const handleDeleteSelectedMessages = async (deleteType: "me" | "everyone" = "me") => {
    if (!selectedMsgIds.length || !activeChat?._id) return;
    const count = selectedMsgIds.length;
    const idsToDelete = [...selectedMsgIds];
    
    // Update local state immediately for fast UI feedback
    setActiveChat((prev) =>
      prev
        ? {
            ...prev,
            messages: prev.messages.filter((m) => !idsToDelete.includes(String(m._id || m.createdAt))),
          }
        : prev
    );

    setStatus(`🗑️ ${count} message(s) deleted.`);
    setTimeout(() => setStatus(null), 2500);
    setIsSelectionMode(false);
    setSelectedMsgIds([]);
    setShowBulkDeleteModal(false);

    // Call backend API for permanent deletion
    for (const msgId of idsToDelete) {
      if (!msgId.startsWith("temp-")) {
        try {
          await API.delete(`/friends/chats/${activeChat._id}/messages/${msgId}`, {
            data: { deleteType },
          });
        } catch {}
      }
    }
  };

  const getPinnedMsgText = (msgId: string) => {
    const msg = activeChat?.messages?.find((m) => String(m._id || m.createdAt) === msgId);
    return msg ? msg.text || (msg.audioUrl ? "🎙️ Voice Note" : "Pinned Message") : "Pinned Message";
  };

  const handleTogglePin = () => {
    if (!selectedFriendId) return;
    setPinnedFriendIds((prev) => {
      const isPinned = prev.includes(selectedFriendId);
      const next = isPinned
        ? prev.filter((id) => id !== selectedFriendId)
        : [...prev, selectedFriendId];
      setStatus(isPinned ? "Chat unpinned." : "📌 Chat pinned to top!");
      setTimeout(() => setStatus(null), 2500);
      return next;
    });
    setShowHeaderMenu(false);
  };

  const handleSendReport = async () => {
    if (!selectedFriendId) return;
    setReporting(true);
    try {
      await API.post("/users/report", {
        targetUserId: selectedFriendId,
        reason: reportReason,
      }).catch(() => {});
      setStatus("🚩 Report submitted successfully. Our team will review this user.");
      setShowReportModal(false);
      setTimeout(() => setStatus(null), 3000);
    } catch {
      setStatus("Report submitted successfully.");
      setShowReportModal(false);
    } finally {
      setReporting(false);
    }
  };

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
            const pId = String((p as any)._id || p);
            if (currentUser?._id && pId === String(currentUser._id)) return;
            map[pId] = c;
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
      if (typeof document !== 'undefined' && document.hidden) return;
      loadData();
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Load specific active chat
  const loadActiveChat = async (friendId: string) => {
    try {
      if (typeof document !== 'undefined' && document.hidden) return;
      const res = await API.get<{ success: boolean; chat: ChatItem }>(`/friends/chats/${encodeURIComponent(friendId)}`);
      const nextChat = res.data.chat;
      if (!nextChat) return;

      setActiveChat((prev) => {
        if (
          prev &&
          prev._id === nextChat._id &&
          prev.messages?.length === nextChat.messages?.length &&
          prev.messages?.[prev.messages.length - 1]?._id === nextChat.messages?.[nextChat.messages.length - 1]?._id
        ) {
          return prev;
        }
        return nextChat;
      });

      setChatsMap((prev) => {
        const existing = prev[friendId];
        if (
          existing &&
          existing._id === nextChat._id &&
          existing.messages?.length === nextChat.messages?.length
        ) {
          return prev;
        }
        return {
          ...prev,
          [friendId]: nextChat,
        };
      });
    } catch (err: any) {
      setStatus(err.response?.data?.message || "Could not open chat with this friend.");
    }
  };

  useEffect(() => {
    if (selectedFriendId) {
      loadActiveChat(selectedFriendId);

      const timer = setInterval(() => {
        loadActiveChat(selectedFriendId);
      }, 3500);

      return () => clearInterval(timer);
    } else {
      setActiveChat(null);
    }
  }, [selectedFriendId]);

  // Intercept mobile hardware / browser back button when a chat is active
  useEffect(() => {
    if (!selectedFriendId) return;

    window.history.pushState({ chatOpen: true, friendId: selectedFriendId }, "");

    const handlePopState = () => {
      setSelectedFriendId(null);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
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

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      setStatus(null);
      const stream = await getAudioStream();
      const mediaRecorder = createSafeMediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      startMediaRecorderSafely(mediaRecorder);
      setIsRecording(true);
      setRecordingTime(0);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setStatus(formatAudioError(err));
    }
  };

  const cancelRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder) {
      try {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      } catch {}
      try {
        recorder.stream?.getTracks().forEach((track) => track.stop());
      } catch {}
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  const sendVoiceNote = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !activeChat) return;

    setUploadingVoice(true);
    const duration = Math.max(1, recordingTime);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    recorder.onstop = async () => {
      try {
        recorder.stream?.getTracks().forEach((track) => track.stop());
      } catch {}
      mediaRecorderRef.current = null;
      setIsRecording(false);
      setRecordingTime(0);

      const mimeType = recorder.mimeType || "audio/webm";
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      if (audioBlob.size === 0) {
        setUploadingVoice(false);
        setStatus("Recorded audio was empty. Please try speaking again.");
        return;
      }

      const ext = mimeType.includes("mp4")
        ? "mp4"
        : mimeType.includes("aac")
        ? "aac"
        : mimeType.includes("ogg")
        ? "ogg"
        : mimeType.includes("wav")
        ? "wav"
        : "webm";

      const formData = new FormData();
      formData.append("file", audioBlob, `voice_note_${Date.now()}.${ext}`);
      formData.append("folder", "community-app/voicemails");

      try {
        const uploadRes = await API.post<{ success: boolean; file: { url: string } }>(
          "/storage/upload",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        if (uploadRes.data.success && uploadRes.data.file?.url) {
          const audioUrl = uploadRes.data.file.url;
          await API.post(`/friends/chats/${activeChat._id}/messages`, {
            audioUrl,
            audioDuration: duration,
            mediaType: "audio",
          });
          if (selectedFriendId) loadActiveChat(selectedFriendId);
        }
      } catch (err: any) {
        setStatus(err.response?.data?.message || "Failed to send voice message.");
      } finally {
        setUploadingVoice(false);
      }
    };

    try {
      if (recorder.state !== "inactive") {
        if (typeof recorder.requestData === "function") {
          try {
            recorder.requestData();
          } catch {}
        }
        recorder.stop();
      } else {
        recorder.onstop(new Event("stop") as any);
      }
    } catch {
      setUploadingVoice(false);
    }
  };

  const formatRecordingTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSelectFriend = (id: string) => {
    setSelectedFriendId(id);
    navigate(`/chat/${id}`, { replace: true });
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

  const allPartners = useMemo(() => {
    const partnerMap = new Map<string, FriendUser>();
    const myId = currentUser?._id ? String(currentUser._id) : "";

    // Add current friends
    (friends || []).forEach((f) => {
      const fId = String(f._id || "");
      if (fId && fId !== myId) {
        partnerMap.set(fId, f);
      }
    });

    // Add existing chat partners from chatsMap (preserves chats of unfriended users)
    Object.entries(chatsMap || {}).forEach(([friendId, chat]) => {
      const fId = String(friendId);
      if (fId && fId !== myId && !partnerMap.has(fId)) {
        const otherParticipant = chat?.participants?.find((p) => String((p as any)._id || p) !== myId);
        if (otherParticipant && typeof otherParticipant === "object") {
          partnerMap.set(fId, otherParticipant as FriendUser);
        }
      }
    });

    return Array.from(partnerMap.values());
  }, [friends, chatsMap, currentUser]);

  const filteredFriends = useMemo(() => {
    const list = allPartners.filter((friend) => {
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

    return [...list].sort((a, b) => {
      const aPinned = pinnedFriendIds.includes(a._id);
      const bPinned = pinnedFriendIds.includes(b._id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }, [allPartners, searchQuery, filterTab, chatsMap, pinnedFriendIds]);

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
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-slate-800 inline-block" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 10l4 4L14 3" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-slate-500 inline-block" fill="none" stroke="currentColor">
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

  const activePartnerEffectiveLastActive = useMemo(() => {
    if (!activePartner) return null;
    let maxTime = activePartner.lastActive ? new Date(activePartner.lastActive).getTime() : 0;
    if (isNaN(maxTime)) maxTime = 0;

    if (activeChat?.messages) {
      for (const msg of activeChat.messages) {
        const senderId = msg.sender?._id ? String(msg.sender._id) : String(msg.sender || "");
        if (senderId === String(activePartner._id) && msg.createdAt) {
          const msgTime = new Date(msg.createdAt).getTime();
          if (!isNaN(msgTime) && msgTime > maxTime) {
            maxTime = msgTime;
          }
        }
      }
    }

    return maxTime > 0 ? new Date(maxTime).toISOString() : activePartner.lastActive;
  }, [activePartner, activeChat]);

  const activePartnerPresence = getPresenceStatus(activePartner?.isOnline, activePartnerEffectiveLastActive, { prefix: "Last seen" });

  const emojis = ["😊", "😂", "❤️", "👍", "🔥", "🎉", "👋", "🙌", "😍", "✨", "🙏", "😎"];

  return (
    <section className="flex h-[calc(100vh-6rem)] sm:h-[calc(100vh-8.5rem)] sm:max-h-[640px] min-h-[460px] w-full flex-col overflow-hidden mx-auto my-auto text-slate-900">
      {/* Main Split Interface */}
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-3 min-h-0 overflow-hidden">
        {/* Left Friends / Chats List Sidebar */}
        <div className={`flex flex-col h-full min-h-0 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden ${selectedFriendId ? 'hidden lg:flex' : 'flex'}`}>
          {/* Sidebar Header & Search */}
          <div className="shrink-0 border-b border-slate-200 bg-white p-3">
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
                placeholder="Search chats..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition"
              />
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setFilterTab("all")}
                className={`flex-1 rounded-xl py-2 text-xs font-extrabold transition ${
                  filterTab === "all"
                    ? "bg-teal-600 !text-white shadow-md shadow-teal-600/30"
                    : "bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                Chats ({allPartners.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("recent")}
                className={`flex-1 rounded-xl py-2 text-xs font-extrabold transition ${
                  filterTab === "recent"
                    ? "bg-teal-600 !text-white shadow-md shadow-teal-600/30"
                    : "bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                Recent Chats
              </button>
            </div>
          </div>

          {/* Friends List Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500 animate-pulse">Loading friends...</div>
            ) : filteredFriends.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-50 grid place-items-center text-slate-500 mb-2">
                  💬
                </div>
                <p className="text-xs font-bold text-slate-800">No friends found</p>
                <p className="text-[11px] text-slate-500 mt-1">Search or add friends to start chatting.</p>
              </div>
            ) : (
              filteredFriends.map((friend) => {
                const isSelected = friend._id === selectedFriendId;
                const friendChat = chatsMap[friend._id];
                const lastMsg = friendChat?.messages?.[friendChat.messages.length - 1];
                const friendPresence = getPresenceStatus(friend.isOnline, friend.lastActive);
                const unreadCount = Number(friend.unreadCount || (friendChat as any)?.unreadCount || 0);

                const isItemFriend = (friends || []).some((f) => String(f._id) === String(friend._id));

                return (
                  <div
                    key={friend._id}
                    onClick={() => handleSelectFriend(friend._id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition ${isSelected ? "bg-teal-50/80 border border-teal-200 shadow-xs" : "hover:bg-slate-50"}`}
                  >
                    <div className="relative">
                      <UserAvatar
                        name={friend.fullName || friend.username}
                        photoUrl={isItemFriend ? (friend.profilePhotoUrl || friend.photoUrl) : undefined}
                        size="md"
                        className="ring-2 ring-teal-500/30"
                      />
                      {isItemFriend && (
                        <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white ${friendPresence.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                          {pinnedFriendIds.includes(friend._id) && <span className="text-[11px]" title="Pinned Chat">📌</span>}
                          <span className="truncate">{friend.fullName || friend.username || "Friend"}</span>
                        </h4>
                        {unreadCount > 0 ? (
                          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-black text-white shrink-0">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        ) : (
                          lastMsg?.createdAt && (
                            <span className="text-[10px] text-slate-500 shrink-0">
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
        <div className={`flex-1 flex flex-col rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden min-w-0 w-full ${!selectedFriendId ? 'hidden lg:flex' : 'flex'}`}>
          {selectedFriendId && activePartner ? (
            <>
              {/* Chat View Header */}
              <div className="shrink-0 flex items-center justify-between border-b border-slate-200 bg-white px-3.5 py-2.5 sm:px-5 sm:py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <UserAvatar
                      name={activePartner.fullName || activePartner.username}
                      photoUrl={isSelectedPartnerFriend ? (activePartner.profilePhotoUrl || activePartner.photoUrl) : undefined}
                      size="md"
                      className={isSelectedPartnerFriend && activePartnerPresence.isOnline ? "ring-2 ring-emerald-500" : "ring-2 ring-slate-300"}
                    />
                    {isSelectedPartnerFriend && (
                      <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white ${activePartnerPresence.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight">
                      {activePartner.fullName || activePartner.username || "Community Member"}
                    </h3>
                    {isSelectedPartnerFriend && (
                      <p className={`text-[11px] font-semibold ${activePartnerPresence.isOnline ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                        {activePartnerPresence.text}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 relative">
                  <button
                    onClick={() => setShowHeaderMenu((prev) => !prev)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition font-black text-sm grid place-items-center"
                    title="Chat Options"
                  >
                    ⋮
                  </button>

                  {showHeaderMenu && (
                    <div className="absolute right-0 top-11 z-50 w-52 rounded-2xl bg-white p-2 shadow-2xl border border-slate-200 text-slate-800 space-y-1 animate-in fade-in duration-150">
                      <button
                        type="button"
                        onClick={() => {
                          setShowHeaderMenu(false);
                          setIsSelectionMode(true);
                        }}
                        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition text-left"
                      >
                        <span>☑️</span> Select Messages
                      </button>

                      <button
                        type="button"
                        onClick={handleSelectAllMessages}
                        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition text-left"
                      >
                        <span>☑️</span> Select All
                      </button>

                      <button
                        type="button"
                        onClick={handleTogglePin}
                        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition text-left"
                      >
                        <span>📌</span> {selectedFriendId && pinnedFriendIds.includes(selectedFriendId) ? "Unpin Chat" : "Pin Chat"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowHeaderMenu(false);
                          setShowReportModal(true);
                        }}
                        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition text-left"
                      >
                        <span>🚩</span> Report User
                      </button>

                      <div className="border-t border-slate-200 my-1" />

                      <button
                        type="button"
                        onClick={() => {
                          setShowHeaderMenu(false);
                          if (activePartner?._id) navigate(`/user/${activePartner._id}`);
                        }}
                        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition text-left"
                      >
                        <span>👤</span> View Profile
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Selection Mode Action Header Bar */}
              {isSelectionMode && (
                <div className="bg-teal-50 px-4 py-2 text-xs font-bold text-teal-900 flex items-center justify-between border-b border-teal-200 shrink-0 gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-teal-600 px-2.5 py-0.5 rounded-full text-[11px] font-black text-white">
                      {selectedMsgIds.length} Selected
                    </span>
                    <button
                      type="button"
                      onClick={handleSelectAllMessages}
                      className="text-teal-700 hover:text-teal-900 transition underline text-[11px]"
                    >
                      Select All
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Pin button: ONLY visible when EXACTLY 1 message is selected */}
                    {selectedMsgIds.length === 1 && (
                      <button
                        type="button"
                        onClick={handlePinSelectedMessage}
                        className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black transition shadow-xs text-[11px]"
                        title="Pin this message"
                      >
                        <span>📌</span> Pin Message
                      </button>
                    )}

                    {/* Delete Selected button: visible when 1 or more messages are selected */}
                    {selectedMsgIds.length > 0 && (
                      <button
                        type="button"
                        onClick={triggerDeleteSelected}
                        className="flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold transition shadow-xs text-[11px]"
                        title="Delete selected messages"
                      >
                        <span>🗑️</span> Delete ({selectedMsgIds.length})
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsSelectionMode(false);
                        setSelectedMsgIds([]);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition text-[11px]"
                    >
                      ✕ Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Pinned Message Banner */}
              {selectedFriendId && pinnedMsgMap[selectedFriendId] && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex items-center justify-between text-xs text-amber-900 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-black text-amber-800">📌 Pinned Message:</span>
                    <span className="truncate max-w-md italic font-medium">
                      "{getPinnedMsgText(pinnedMsgMap[selectedFriendId])}"
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedFriendId) return;
                      setPinnedMsgMap((prev) => {
                        const copy = { ...prev };
                        delete copy[selectedFriendId];
                        return copy;
                      });
                    }}
                    className="text-amber-800 hover:text-amber-950 font-extrabold text-[11px] ml-2 shrink-0"
                    title="Unpin message"
                  >
                    ✕ Unpin
                  </button>
                </div>
              )}

              {/* Status Notice */}
              {status && (
                <div className="bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-800 border-b border-rose-200 flex items-center justify-between shrink-0">
                  <span>{status}</span>
                  <button onClick={() => setStatus(null)} className="text-rose-600 hover:text-rose-900 font-bold">✕</button>
                </div>
              )}

              {/* Chat Messages Log */}
              <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col">
                <div
                  id="chat-messages-container"
                  onScroll={handleScrollMessages}
                  className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-1.5"
                >
                  {!activeChat?.messages?.length ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-700 grid place-items-center text-2xl shadow-xs mb-3 border border-teal-200">
                        👋
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">Say Hello to {activePartner.fullName || activePartner.username}!</h3>
                      <p className="text-xs text-slate-500 max-w-xs mt-1">
                        Start your conversation by sending a message below.
                      </p>
                    </div>
                  ) : (
                    activeChat.messages.map((item, idx) => {
                      const dateLabel = getChatMessageDateLabel(item.createdAt);
                      const prevDateLabel = idx > 0 ? getChatMessageDateLabel(activeChat.messages[idx - 1].createdAt) : null;
                      const showDateDivider = Boolean(dateLabel && dateLabel !== prevDateLabel);

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

                      const msgId = String(item._id || item.createdAt);
                      const isSelectedMsg = selectedMsgIds.includes(msgId);

                      return (
                        <React.Fragment key={msgId + "-" + idx}>
                          {showDateDivider && (
                            <div className="w-full flex items-center justify-center my-4 py-1 select-none pointer-events-none">
                              <div className="h-[1px] flex-1 bg-slate-200 max-w-[80px] sm:max-w-[120px]" />
                              <span className="mx-3 rounded-full bg-white border border-slate-200 px-3.5 py-0.5 text-[10px] font-black text-teal-700 uppercase tracking-wider shadow-xs">
                                {dateLabel}
                              </span>
                              <div className="h-[1px] flex-1 bg-slate-200 max-w-[80px] sm:max-w-[120px]" />
                            </div>
                          )}
                          <div
                            onClick={() => isSelectionMode && toggleSelectMessage(msgId)}
                            className={`flex items-end gap-2 my-1 ${isOutgoing ? "justify-end" : "justify-start"} ${isSelectionMode ? "cursor-pointer p-1 rounded-xl hover:bg-slate-100 transition" : ""}`}
                          >
                            {isSelectionMode && (
                              <input
                                type="checkbox"
                                checked={isSelectedMsg}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleSelectMessage(msgId);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4 rounded text-teal-500 focus:ring-teal-500 cursor-pointer self-center shrink-0"
                              />
                            )}

                            {!isOutgoing && (
                              <UserAvatar
                                name={senderName}
                                photoUrl={isSelectedPartnerFriend ? (senderPhoto || activePartner?.profilePhotoUrl || activePartner?.photoUrl) : undefined}
                                size="sm"
                                className="ring-1 ring-slate-300 mb-0.5 shrink-0"
                              />
                            )}

                            <div className="group relative flex items-center max-w-[82%] sm:max-w-[75%]">
                              <div
                                className={`w-full rounded-2xl ${isSelectedMsg ? "ring-2 ring-teal-500" : ""} ${
                                  isOutgoing
                                    ? "bg-teal-600 text-white rounded-br-xs shadow-xs px-3.5 py-1.5"
                                    : "bg-white text-slate-900 border border-slate-200/90 rounded-bl-xs shadow-xs px-3.5 py-1.5"
                                }`}
                              >
                                <p className={`text-[11px] font-bold mb-0.5 ${isOutgoing ? 'text-teal-100' : 'text-teal-700'}`}>
                                  {senderName}
                                </p>
                                <div className="flex flex-col gap-1">
                                  {item.audioUrl ? (
                                    <AudioPlayer url={item.audioUrl} duration={item.audioDuration} isOutgoing={isOutgoing} />
                                  ) : (
                                    <span className={`text-xs sm:text-sm leading-snug whitespace-pre-wrap break-words font-normal ${isOutgoing ? 'text-white' : 'text-slate-800'} ${item.isDeletedForEveryone ? 'italic opacity-80' : ''}`}>
                                      {item.isDeletedForEveryone ? "🚫 " + item.text : item.text}
                                    </span>
                                  )}
                                  <span className={`text-[10px] ml-auto shrink-0 flex items-center gap-1 mt-0.5 ${isOutgoing ? 'text-teal-100' : 'text-slate-400'}`}>
                                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {isOutgoing && renderMessageTicks(item)}
                                  </span>
                                </div>
                              </div>

                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMsgMenuId((prev) => (prev === msgId ? null : msgId));
                                  }}
                                  className={`opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-200 font-bold text-xs ${isOutgoing ? 'order-first mr-1.5' : 'ml-1.5'}`}
                                  title="Message options"
                                >
                                  ⋮
                                </button>

                                {activeMsgMenuId === msgId && (
                                  <div className={`absolute bottom-6 z-50 w-36 rounded-xl bg-white p-1.5 shadow-2xl border border-slate-200 text-slate-800 space-y-1 animate-in fade-in duration-100 ${isOutgoing ? 'right-0' : 'left-0'}`}>
                                    {item.text && !item.isDeletedForEveryone && (
                                      <button
                                        type="button"
                                        onClick={() => handleCopyMessageText(item.text)}
                                        className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition text-left"
                                      >
                                        <span>📋</span> Copy Text
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMsgMenuId(null);
                                        setSelectedDeleteMsg(item);
                                      }}
                                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left"
                                    >
                                      <span>🗑️</span> Delete Msg
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {isOutgoing && (
                              <UserAvatar
                                name={currentUser?.fullName || currentUser?.username || 'You'}
                                photoUrl={currentUser?.profilePhotoUrl || currentUser?.photoUrl || senderPhoto}
                                size="sm"
                                className="ring-1 ring-teal-500/40 mb-0.5 shrink-0"
                              />
                            )}
                          </div>
                        </React.Fragment>
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
                    className="absolute bottom-4 right-6 z-20 flex items-center gap-1.5 rounded-full bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg hover:bg-teal-500 transition animate-bounce"
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

              {/* Message Input Box OR Unfriended Notice Banner */}
              {!isSelectedPartnerFriend ? (
                <div className="shrink-0 p-4 bg-slate-900 text-white border-t border-slate-800 text-center shadow-lg">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-xl mx-auto">
                    <div className="flex items-center gap-3 text-left">
                      <span className="text-xl shrink-0">🚫</span>
                      <div>
                        <p className="text-xs sm:text-sm font-extrabold text-amber-300">
                          You are no longer friends with {activePartner?.fullName || activePartner?.username || "this member"}.
                        </p>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Messaging is disabled. Send a friend request to resume chatting.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/user/${selectedFriendId}`)}
                      className="shrink-0 rounded-xl bg-teal-500 hover:bg-teal-400 px-3.5 py-2 text-xs font-black text-slate-950 shadow-md transition cursor-pointer"
                    >
                      👤 View Profile
                    </button>
                  </div>
                </div>
              ) : (
                <div className="shrink-0 p-3 bg-white border-t border-slate-200">
                  {isRecording ? (
                    <div className="flex items-center justify-between gap-3 bg-rose-50 border border-rose-200 p-2.5 rounded-xl animate-pulse">
                      <div className="flex items-center gap-2.5">
                        <span className="h-3 w-3 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-xs font-extrabold text-rose-800 uppercase tracking-wider">
                          Recording ({formatRecordingTime(recordingTime)})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={cancelRecording}
                          className="rounded-lg border border-rose-200 bg-white px-3 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                        >
                          🗑️ Cancel
                        </button>
                        <button
                          type="button"
                          onClick={sendVoiceNote}
                          disabled={uploadingVoice}
                          className="rounded-lg bg-teal-600 px-3.5 py-1 text-xs font-extrabold text-white shadow-md hover:bg-teal-500 transition"
                        >
                          {uploadingVoice ? "Uploading..." : "⬆️ Send Voice Note"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker((v) => !v)}
                        className="p-2 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition"
                        title="Emoji"
                      >
                        😊
                      </button>

                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        rows={1}
                        className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition min-h-[38px] max-h-[100px]"
                      />

                      {messageText.trim() ? (
                        <button
                          type="button"
                          onClick={handleSendMessage}
                          disabled={sending}
                          className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/30 transition hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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
                      ) : (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="inline-flex items-center justify-center rounded-xl bg-teal-600 p-2.5 text-white shadow-md shadow-teal-600/30 transition hover:bg-teal-500 hover:scale-105 active:scale-95 shrink-0"
                          title="Record Voice Note"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Unselected Hero View */
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-50 via-teal-50/40 to-slate-100 text-center text-slate-900">
              <div className="w-20 h-20 rounded-full bg-teal-100 text-teal-700 grid place-items-center text-3xl shadow-md border border-teal-200/80 mb-4 animate-bounce">
                💬
              </div>
              <h2 className="text-xl font-black text-slate-900">Your Chat Space</h2>
              <p className="text-xs font-semibold text-slate-600 max-w-sm mt-2 leading-relaxed">
                Select any friend from the sidebar to view their messages or start a new conversation.
              </p>

              {friends.length > 0 && (
                <div className="mt-6 w-full max-w-md bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-left">
                  <h4 className="text-xs font-extrabold text-teal-800 uppercase tracking-wider mb-3">Quick Start Chat</h4>
                  <div className="flex flex-wrap gap-2">
                    {friends.slice(0, 5).map((f) => (
                      <button
                        key={f._id}
                        type="button"
                        onClick={() => handleSelectFriend(f._id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-900 px-3.5 py-2 text-xs font-extrabold transition shadow-xs cursor-pointer"
                      >
                        <UserAvatar name={f.fullName || f.username} photoUrl={f.profilePhotoUrl} size="sm" />
                        <span className="text-slate-900 font-extrabold">{f.fullName || f.username}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="relative overflow-hidden w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-black text-slate-900">Delete Message</h3>
            <p className="mt-1 text-xs font-semibold text-slate-600">Choose how you would like to delete this message.</p>

            <div className="mt-4 space-y-2.5">
              {/* Delete for Me Button */}
              <button
                type="button"
                onClick={() => handleDeleteMessage("me")}
                className="w-full flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left hover:bg-slate-100 transition cursor-pointer"
              >
                <span className="text-xl">🗑️</span>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Delete for Me</h4>
                  <p className="text-[11px] font-semibold text-slate-500">Remove from your chat view</p>
                </div>
              </button>

              {/* Delete for Everyone Button */}
              {(() => {
                const currentUserId = String(currentUser?._id || "");
                const senderId = typeof selectedDeleteMsg.sender === "object" && selectedDeleteMsg.sender?._id
                  ? String(selectedDeleteMsg.sender._id)
                  : String(selectedDeleteMsg.sender || "");

                const isOutgoing = currentUserId && senderId
                  ? senderId === currentUserId
                  : selectedFriendId
                  ? senderId !== String(selectedFriendId)
                  : true;

                const createdTime = selectedDeleteMsg.createdAt ? new Date(selectedDeleteMsg.createdAt).getTime() : Date.now();
                const hoursDiff = Number.isNaN(createdTime) ? 0 : (Date.now() - createdTime) / (1000 * 60 * 60);

                const canDeleteEveryone = isOutgoing && (hoursDiff <= 24 || Number.isNaN(hoursDiff)) && !selectedDeleteMsg.isDeletedForEveryone;

                if (!canDeleteEveryone) return null;

                return (
                  <button
                    type="button"
                    onClick={() => handleDeleteMessage("everyone")}
                    className="w-full flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-left hover:bg-rose-100 transition cursor-pointer"
                  >
                    <span className="text-xl">🌐</span>
                    <div>
                      <h4 className="text-xs font-black text-rose-800">Delete for Everyone</h4>
                      <p className="text-[11px] font-semibold text-rose-600">Remove for both participants</p>
                    </div>
                  </button>
                );
              })()}
            </div>

            <button
              type="button"
              onClick={() => setSelectedDeleteMsg(null)}
              className="mt-4 w-full py-2.5 text-center text-xs font-black text-slate-600 rounded-xl bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="relative overflow-hidden w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-black text-slate-900">Delete {selectedMsgIds.length} Messages</h3>
            <p className="mt-1 text-xs font-semibold text-slate-600">Choose how you would like to delete the selected messages.</p>

            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                onClick={() => handleDeleteSelectedMessages("me")}
                className="w-full flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left hover:bg-slate-100 transition cursor-pointer"
              >
                <span className="text-xl">🗑️</span>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Delete for Me</h4>
                  <p className="text-[11px] font-semibold text-slate-500">Remove selected messages from your chat view</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteSelectedMessages("everyone")}
                className="w-full flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-left hover:bg-rose-100 transition cursor-pointer"
              >
                <span className="text-xl">🌐</span>
                <div>
                  <h4 className="text-xs font-black text-rose-800">Delete for Everyone</h4>
                  <p className="text-[11px] font-semibold text-rose-600">Remove your outgoing messages for both participants</p>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowBulkDeleteModal(false)}
              className="mt-4 w-full py-2.5 text-center text-xs font-black text-slate-600 rounded-xl bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Report User Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="relative overflow-hidden w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-rose-700 flex items-center gap-2">
                <span>🚩</span> Report User
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer">✕</button>
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              Report {activePartner?.fullName || activePartner?.username || "this user"} for inappropriate behavior or policy violations.
            </p>

            <div className="mt-4 space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700">Reason for report:</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
              >
                <option value="Spam or suspicious behavior" className="bg-white text-slate-900">Spam or suspicious behavior</option>
                <option value="Harassment or hate speech" className="bg-white text-slate-900">Harassment or hate speech</option>
                <option value="Inappropriate content or media" className="bg-white text-slate-900">Inappropriate content or media</option>
                <option value="Fake profile or impersonation" className="bg-white text-slate-900">Fake profile or impersonation</option>
                <option value="Other policy violation" className="bg-white text-slate-900">Other policy violation</option>
              </select>
            </div>

            <div className="mt-5 flex gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="flex-1 rounded-xl border border-slate-300 bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendReport}
                disabled={reporting}
                className="flex-1 rounded-xl active-green-btn btn-primary bg-rose-600 hover:bg-rose-700 text-white py-2.5 text-xs font-black uppercase tracking-wider shadow-md shadow-rose-600/30 transition disabled:opacity-50 cursor-pointer"
              >
                {reporting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
