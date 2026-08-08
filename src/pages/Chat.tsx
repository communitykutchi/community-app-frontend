import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import API from "../api/axios";
import UserAvatar from "../components/UserAvatar";
import { getPresenceStatus, getChatMessageDateLabel } from "../utils/presence";

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

const getSupportedAudioMimeType = () => {
  if (typeof MediaRecorder === "undefined") return "";
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/aac",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
};

function AudioPlayer({ url, duration, isOutgoing }: { url: string; duration?: number; isOutgoing?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getAudioSrc = (srcUrl: string) => {
    if (!srcUrl) return "";
    if (srcUrl.startsWith("http://") || srcUrl.startsWith("https://") || srcUrl.startsWith("blob:")) {
      return srcUrl;
    }
    const baseURL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";
    const cleanBase = baseURL.replace(/\/api\/?$/, "").replace(/\/$/, "");
    return srcUrl.startsWith("/") ? `${cleanBase}${srcUrl}` : `${cleanBase}/${srcUrl}`;
  };

  const fullAudioSrc = getAudioSrc(url);

  useEffect(() => {
    if (duration && duration > 0) {
      setAudioDuration(duration);
    }
  }, [duration]);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setHasError(false);
      setIsLoading(true);
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err: any) {
        console.error("Audio playback failed:", err);
        setIsPlaying(false);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0 && !audioDuration) {
        setAudioDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-2xl min-w-[210px] sm:min-w-[240px] my-1 ${
        isOutgoing ? "bg-emerald-700/90 text-white" : "bg-slate-100 text-slate-900 border border-slate-200"
      }`}
    >
      <audio
        ref={audioRef}
        src={fullAudioSrc}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={(e) => {
          console.error("Audio element error:", e);
          setIsPlaying(false);
          setHasError(true);
        }}
      />

      <button
        type="button"
        onClick={togglePlay}
        title={hasError ? "Audio load failed. Click to retry." : isPlaying ? "Pause" : "Play"}
        className={`h-9 w-9 shrink-0 grid place-items-center rounded-full font-bold shadow-md transition ${
          hasError
            ? "bg-rose-500 text-white"
            : isOutgoing
            ? "bg-white text-emerald-800 hover:bg-emerald-50"
            : "bg-emerald-600 text-white hover:bg-emerald-700"
        }`}
      >
        {isLoading ? "⏳" : hasError ? "⚠️" : isPlaying ? "⏸" : "▶"}
      </button>

      <div className="flex-1 space-y-1.5 min-w-0">
        <div
          className="h-2 w-full rounded-full bg-black/10 overflow-hidden cursor-pointer relative"
          onClick={(e) => {
            if (!audioRef.current || !audioDuration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            const seekTime = pos * audioDuration;
            audioRef.current.currentTime = seekTime;
            setCurrentTime(seekTime);
          }}
        >
          <div
            className={`h-full rounded-full transition-all ${isOutgoing ? "bg-white" : "bg-emerald-600"}`}
            style={{ width: `${audioDuration ? Math.min(100, Math.max(0, (currentTime / audioDuration) * 100)) : 0}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono opacity-80">
          <span>{formatTime(currentTime)}</span>
          <span>{hasError ? "Error loading audio" : `🎙️ Voice Note • ${formatTime(audioDuration)}`}</span>
        </div>
      </div>
    </div>
  );
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
  const [isMinimized, setIsMinimized] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

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

    const timer = setInterval(() => {
      loadChat();
    }, 3000);

    return () => clearInterval(timer);
  }, [friendId]);

  useEffect(() => {
    const el = document.getElementById("chat-messages-container-full");
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [chat?.messages]);

  const startRecording = async () => {
    try {
      setStatus(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime = getSupportedAudioMimeType();
      const options = preferredMime ? { mimeType: preferredMime } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setStatus("Microphone permission denied or not supported on this browser.");
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current.stop();
    }
    clearInterval(timerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  const sendVoiceNote = async () => {
    if (!mediaRecorderRef.current || !chat) return;

    setUploadingVoice(true);
    const duration = Math.max(1, recordingTime);

    mediaRecorderRef.current.onstop = async () => {
      clearInterval(timerRef.current);
      setIsRecording(false);
      setRecordingTime(0);

      const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      if (audioBlob.size === 0) {
        setUploadingVoice(false);
        return;
      }

      const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : mimeType.includes("wav") ? "wav" : "webm";
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
          await API.post(`/friends/chats/${chat._id}/messages`, {
            audioUrl,
            audioDuration: duration,
            mediaType: "audio",
          });
          await loadChat();
        }
      } catch (err: any) {
        setStatus(err.response?.data?.message || "Failed to send voice message.");
      } finally {
        setUploadingVoice(false);
      }
    };

    mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    mediaRecorderRef.current.stop();
  };

  const sendMessage = async () => {
    if (!chat || !message.trim()) return;
    const textToSend = message.trim();
    setMessage("");
    setShowEmojiPicker(false);
    setStatus(null);

    const tempId = "temp-" + Date.now();
    const tempMsg: ChatMessage = {
      _id: tempId,
      sender: currentUser ? { _id: currentUser._id, fullName: currentUser.fullName, username: currentUser.username } : { _id: "" },
      text: textToSend,
      createdAt: new Date().toISOString(),
      isDelivered: false,
      isRead: false,
    };

    setChat((prev) => (prev ? { ...prev, messages: [...prev.messages, tempMsg] } : prev));

    try {
      const response = await API.post<{ success: boolean; chat: ChatData }>(
        `/friends/chats/${chat._id}/messages`,
        { text: textToSend }
      );
      setChat(response.data.chat);
    } catch (err: any) {
      setStatus(err.response?.data?.message || "Unable to send message.");
      setChat((prev) => (prev ? { ...prev, messages: prev.messages.filter((m) => m._id !== tempId) } : prev));
    }
  };

  const renderMessageTicks = (msg: ChatMessage) => {
    if (msg.isRead) {
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M1 10l4 4L14 3" />
        </svg>
      );
    }

    if (msg.isDelivered) {
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

  const partner = chat?.participants.find((p) => p._id !== currentUser?._id) ||
                  chat?.participants.find((participant) => participant._id === friendId) ||
                  chat?.participants[0];

  const partnerEffectiveLastActive = (() => {
    if (!partner) return null;
    let maxTime = partner.lastActive ? new Date(partner.lastActive).getTime() : 0;
    if (isNaN(maxTime)) maxTime = 0;

    if (chat?.messages) {
      for (const msg of chat.messages) {
        const senderId = msg.sender?._id ? String(msg.sender._id) : String(msg.sender || "");
        if (senderId === String(partner._id) && msg.createdAt) {
          const msgTime = new Date(msg.createdAt).getTime();
          if (!isNaN(msgTime) && msgTime > maxTime) {
            maxTime = msgTime;
          }
        }
      }
    }

    return maxTime > 0 ? new Date(maxTime).toISOString() : partner.lastActive;
  })();

  const partnerPresence = getPresenceStatus(partner?.isOnline, partnerEffectiveLastActive);

  const emojis = ["😊", "😂", "❤️", "👍", "🔥", "🎉", "👋", "🙌", "😍", "✨", "🙏", "😎"];

  const formatRecordingTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-3 cursor-pointer group hover:scale-105 transition"
        title={`Open Chat with ${partner?.fullName || partner?.username || 'Friend'}`}
      >
        <div className="relative shadow-2xl rounded-full">
          <UserAvatar
            name={partner?.fullName || partner?.username || 'Friend'}
            photoUrl={partner?.profilePhotoUrl || partner?.photoUrl}
            size="lg"
            className="ring-4 ring-emerald-500 shadow-2xl bg-white group-hover:scale-105 transition"
          />
          <span className={`absolute bottom-0 right-0 h-4 w-4 rounded-full ring-2 ring-white ${partnerPresence.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-black text-white shadow-2xl group-hover:bg-slate-800 transition border border-slate-700">
          <span>💬</span>
          <span className="truncate max-w-[120px]">{partner?.fullName || partner?.username || 'Chat'}</span>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider ml-1">▲ Open</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-3 sm:right-6 z-50 w-[94vw] sm:w-[380px] h-[520px] max-h-[85vh] bg-white rounded-t-3xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden">
      {/* Facebook Style Chat Header */}
      <header className="flex items-center justify-between border-b border-slate-100 bg-slate-950 px-4 py-3 text-white shrink-0">
        <div
          onClick={() => partner && navigate(`/user/${partner._id}`)}
          className="flex items-center gap-2.5 cursor-pointer group min-w-0"
        >
          <div className="relative shrink-0">
            <UserAvatar
              name={partner?.fullName || partner?.username || 'Friend'}
              photoUrl={partner?.profilePhotoUrl || partner?.photoUrl}
              size="sm"
              className={`${partnerPresence.isOnline ? "ring-2 ring-emerald-400" : "ring-2 ring-slate-600"} group-hover:scale-105 transition`}
            />
            <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-slate-950 ${partnerPresence.isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`} />
          </div>

          <div className="min-w-0">
            <h2 className="text-xs font-extrabold text-white leading-tight truncate group-hover:text-teal-400 transition">
              {partner?.fullName || partner?.username || 'Friend'}
            </h2>
            <p className={`text-[10px] font-semibold truncate ${partnerPresence.isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
              {partnerPresence.isOnline ? 'Active Now' : 'Offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="rounded-lg bg-white/10 p-1.5 text-slate-300 hover:bg-white/20 hover:text-white transition"
            title="Minimize Chat"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg bg-white/10 p-1.5 text-slate-300 hover:bg-rose-600 hover:text-white transition"
            title="Close Chat"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
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
          className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-100 via-slate-50 to-emerald-50/20 p-4 sm:p-6 space-y-1.5"
        >
          {chat?.messages?.length ? (
            chat.messages.map((item, index) => {
              const dateLabel = getChatMessageDateLabel(item.createdAt);
              const prevDateLabel = index > 0 ? getChatMessageDateLabel(chat.messages[index - 1].createdAt) : null;
              const showDateDivider = Boolean(dateLabel && dateLabel !== prevDateLabel);

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
                <React.Fragment key={(item._id || item.createdAt) + "-" + index}>
                  {showDateDivider && (
                    <div className="w-full flex items-center justify-center my-4 py-1 select-none pointer-events-none">
                      <div className="h-[1px] flex-1 bg-slate-300/60 max-w-[60px] sm:max-w-[100px]" />
                      <span className="mx-2.5 rounded-full bg-slate-200/90 border border-slate-300/80 px-3.5 py-0.5 text-[10px] font-black text-slate-700 uppercase tracking-wider shadow-2xs">
                        {dateLabel}
                      </span>
                      <div className="h-[1px] flex-1 bg-slate-300/60 max-w-[60px] sm:max-w-[100px]" />
                    </div>
                  )}
                  <div className={`flex items-end gap-2 my-1 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                    {!isOutgoing && (
                      <UserAvatar
                        name={senderName}
                        photoUrl={senderPhoto || partner?.profilePhotoUrl || partner?.photoUrl}
                        size="sm"
                        className="ring-1 ring-slate-300 mb-0.5 shrink-0"
                      />
                    )}

                    <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl ${
                      isOutgoing 
                        ? 'bg-emerald-600 text-white rounded-br-xs shadow-sm px-3.5 py-2' 
                        : 'bg-white text-slate-900 border border-slate-200/90 rounded-bl-xs shadow-sm px-3.5 py-2'
                    }`}>
                      <p className={`text-[11px] font-bold mb-1 ${isOutgoing ? 'text-emerald-100' : 'text-emerald-700'}`}>
                        {senderName}
                      </p>

                      {item.audioUrl ? (
                        <AudioPlayer url={item.audioUrl} duration={item.audioDuration} isOutgoing={isOutgoing} />
                      ) : (
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <span className="text-xs sm:text-sm leading-snug whitespace-pre-wrap break-words font-normal">
                            {item.text}
                          </span>
                        </div>
                      )}

                      <div className={`text-[10px] ml-auto shrink-0 flex items-center justify-end gap-1 mt-1 ${isOutgoing ? 'text-emerald-100' : 'text-slate-400'}`}>
                        <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isOutgoing && renderMessageTicks(item)}
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
                </React.Fragment>
              );
            })
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center text-3xl shadow-inner mb-4">
                💬
              </div>
              <h3 className="text-base font-bold text-slate-800">No messages yet</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                Start the conversation or send a voice message to {partner?.fullName || partner?.username || 'your friend'}!
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

        {/* Footer Input & Voice Controls */}
        <footer className="border-t border-slate-200 bg-white p-4">
          {isRecording ? (
            <div className="flex items-center justify-between gap-3 bg-rose-50 border border-rose-200 p-3 rounded-2xl animate-pulse">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-rose-600 animate-ping" />
                <span className="text-xs font-extrabold text-rose-800 uppercase tracking-wider">
                  Recording Voice Note ({formatRecordingTime(recordingTime)})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                >
                  🗑️ Cancel
                </button>
                <button
                  type="button"
                  onClick={sendVoiceNote}
                  disabled={uploadingVoice}
                  className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-extrabold text-white shadow-md hover:bg-emerald-500 transition"
                >
                  {uploadingVoice ? "Uploading..." : "⬆️ Send Voice Note"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowEmojiPicker((v) => !v)}
                className="p-2.5 rounded-2xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                title="Add Emoji"
              >
                😊
              </button>

              <button
                type="button"
                onClick={startRecording}
                className="p-2.5 rounded-2xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Record Voice Note"
              >
                🎙️
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
          )}
        </footer>
      </div>
    );
}
