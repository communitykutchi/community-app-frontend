import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import API from "../api/axios.js";
import UserAvatar from "../components/UserAvatar.js";
import { getPresenceStatus } from "../utils/presence.js";

interface ChatMessage {
  _id?: string;
  sender: { _id: string; fullName?: string; username?: string; profilePhotoUrl?: string; photoUrl?: string };
  text: string;
  isDelivered?: boolean;
  isRead?: boolean;
  createdAt: string;
}

interface ChatData {
  _id: string;
  participants: Array<{
    _id: string;
    fullName?: string;
    username?: string;
    profilePhotoUrl?: string;
    photoUrl?: string;
    isOnline?: boolean;
    lastActive?: string;
  }>;
  messages: ChatMessage[];
}

export default function Chat() {
  const { friendId } = useParams();
  const navigate = useNavigate();
  
  const [chat, setChat] = useState<ChatData | null>(null);
  const [currentUser, setCurrentUser] = useState<{ _id: string; fullName?: string; username?: string; profilePhotoUrl?: string; photoUrl?: string } | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
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

  const loadChat = async () => {
    if (!friendId) return;

    try {
      const response = await API.get<{ success: boolean; chat: ChatData }>(`/friends/chats/${encodeURIComponent(friendId)}`);
      setChat(response.data.chat);
    } catch (err: any) {
      setStatus(err.response?.data?.message || "Unable to open chat.");
    }
  };

  useEffect(() => {
    loadChat();

    // Auto refresh active chat every 3s
    const timer = setInterval(() => {
      loadChat();
    }, 3000);

    return () => clearInterval(timer);
  }, [friendId]);

  // Auto scroll to bottom
  useEffect(() => {
    const el = document.getElementById("chat-messages-container-full");
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [chat?.messages]);

  const sendMessage = async () => {
    if (!chat || !message.trim() || sending) return;
    setSending(true);
    setStatus(null);

    try {
      const response = await API.post<{ success: boolean; chat: ChatData }>(
        `/friends/chats/${chat._id}/messages`,
        { text: message.trim() }
      );
      setChat(response.data.chat);
      setMessage("");
      setShowEmojiPicker(false);
    } catch (err: any) {
      setStatus(err.response?.data?.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  const renderMessageTicks = (message: ChatMessage) => {
    if (message.isRead) {
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M1 10l4 4L14 3" />
        </svg>
      );
    }

    if (message.isDelivered) {
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M1 10l4 4L14 3" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
  };

  const partner = chat?.participants.find((participant) => participant._id === friendId) ||
                  chat?.participants.find((participant) => participant._id !== friendId);

  const partnerPresence = getPresenceStatus(partner?.isOnline, partner?.lastActive);

  const emojis = ["😊", "😂", "❤️", "👍", "🔥", "🎉", "👋", "🙌", "😍", "✨", "🙏", "😎"];

  return (
    <section className="mx-auto min-h-[calc(100vh-5rem)] max-w-5xl px-3 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col rounded-3xl bg-white shadow-2xl shadow-slate-200/80 border border-slate-200 overflow-hidden h-[calc(100vh-7rem)] min-h-[600px]">
        {/* Professional Header */}
        <header className="flex items-center justify-between border-b border-slate-100 bg-slate-950 px-6 py-4 text-white">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="rounded-xl bg-white/10 p-2 text-white transition hover:bg-white/20"
              title="Go Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="relative">
              <UserAvatar
                name={partner?.fullName || partner?.username || 'Friend'}
                photoUrl={partner?.profilePhotoUrl || partner?.photoUrl}
                size="md"
                className={partnerPresence.isOnline ? "ring-2 ring-emerald-400" : "ring-2 ring-slate-600"}
              />
              <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full ring-2 ring-slate-950 ${partnerPresence.isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`} />
            </div>

            <div>
              <h2 className="text-base font-black text-white leading-tight">
                {partner?.fullName || partner?.username || 'Friend'}
              </h2>
              <p className={`text-xs font-semibold flex items-center gap-1.5 mt-0.5 ${partnerPresence.isOnline ? 'text-emerald-400' : 'text-emerald-200'}`}>
                <span className={`h-2 w-2 rounded-full ${partnerPresence.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-300'}`}></span>
                {partnerPresence.text} {partner?.username ? `• @${partner.username}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
          </div>
        </header>

        {/* Status Error Alert */}
        {status ? (
          <div className="bg-rose-50 px-5 py-2.5 text-xs font-semibold text-rose-700 border-b border-rose-200 flex justify-between items-center">
            <span>{status}</span>
            <button onClick={() => setStatus(null)} className="text-rose-500 hover:text-rose-800">✕</button>
          </div>
        ) : null}

        {/* Chat Messages Body */}
        <main
          id="chat-messages-container-full"
          className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-100 via-slate-50 to-emerald-50/20 p-4 sm:p-6 space-y-3"
        >
          {chat?.messages?.length ? (
            chat.messages.map((item, index) => {
              const senderId = typeof item.sender === "object" && item.sender?._id 
                ? String(item.sender._id) 
                : String(item.sender || "");
              const isOutgoing = currentUser?._id 
                ? senderId === String(currentUser._id) 
                : (friendId ? senderId !== String(friendId) : false);

              const senderName = isOutgoing
                ? "You"
                : typeof item.sender === "object"
                ? item.sender.fullName || item.sender.username || partner?.fullName || "Friend"
                : partner?.fullName || partner?.username || "Friend";

              const senderPhoto = typeof item.sender === "object"
                ? item.sender.profilePhotoUrl || item.sender.photoUrl
                : undefined;

              return (
                <div key={index} className={`flex items-end gap-2 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                  {!isOutgoing && (
                    <UserAvatar
                      name={senderName}
                      photoUrl={senderPhoto || partner?.profilePhotoUrl || partner?.photoUrl}
                      size="sm"
                      className="ring-1 ring-slate-300 mb-0.5 shrink-0"
                    />
                  )}

                  <div className={`max-w-[82%] sm:max-w-[75%] rounded-2xl ${
                    isOutgoing 
                      ? 'bg-emerald-600 text-white rounded-br-xs shadow-sm px-3.5 py-1.5' 
                      : 'bg-white text-slate-900 border border-slate-200/90 rounded-bl-xs shadow-sm px-3.5 py-1.5'
                  }`}>
                    <p className={`text-[11px] font-bold mb-0.5 ${isOutgoing ? 'text-emerald-100' : 'text-emerald-700'}`}>
                      {senderName}
                    </p>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="text-xs sm:text-sm leading-snug whitespace-pre-wrap break-words font-normal">
                        {item.text}
                      </span>
                      <span className={`text-[10px] ml-auto shrink-0 flex items-center gap-1 mt-0.5 ${isOutgoing ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isOutgoing && renderMessageTicks(item)}
                      </span>
                    </div>
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
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center text-3xl shadow-inner mb-4">
                💬
              </div>
              <h3 className="text-base font-bold text-slate-800">No messages yet</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                Start the conversation with {partner?.fullName || partner?.username || 'your friend'}!
              </p>
            </div>
          )}
        </main>

        {/* Emoji Quick Drawer */}
        {showEmojiPicker && (
          <div className="bg-white border-t border-slate-200 px-6 py-2 flex flex-wrap gap-2 shadow-inner">
            {emojis.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => addEmoji(e)}
                className="text-xl hover:scale-125 transition p-1"
              >
                {e}
              </button>
            ))}
          </div>
        )}

        {/* Footer Input Controls */}
        <footer className="border-t border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((v) => !v)}
              className="p-2.5 rounded-2xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
              title="Add Emoji"
            >
              😊
            </button>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Type your message... (Press Enter to send)"
              className="flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 min-h-[44px] max-h-[120px]"
            />

            <button
              type="button"
              onClick={sendMessage}
              disabled={sending || !message.trim()}
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-lg transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}
