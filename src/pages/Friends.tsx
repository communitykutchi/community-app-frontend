import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import UserAvatar from "../components/UserAvatar";
import { getPresenceStatus } from "../utils/presence";
import ConfirmModal from "../components/ConfirmModal";

interface UserItem {
  _id: string;
  fullName?: string;
  username?: string;
  email?: string;
  mobile?: string;
  profilePhotoUrl?: string;
  isOnline?: boolean;
  lastActive?: string;
  unreadCount?: number;
}

export default function Friends() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<UserItem[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<UserItem[]>([]);
  const [sentRequests, setSentRequests] = useState<UserItem[]>([]);

  const [activeTab, setActiveTab] = useState<"search" | "requests" | "friends">("search");
  const [unfriendConfirmUser, setUnfriendConfirmUser] = useState<UserItem | null>(null);

  const sentRequestIds = useMemo(
    () => new Set(sentRequests.map((request) => request._id)),
    [sentRequests],
  );

  const friendIds = useMemo(
    () => new Set((friends || []).map((friend) => friend._id)),
    [friends],
  );

  const incomingRequestIds = useMemo(
    () => new Set((incomingRequests || []).map((request) => request._id)),
    [incomingRequests],
  );

  const loadFriends = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await API.get<{ success: boolean; friends: UserItem[]; incomingRequests: UserItem[]; sentRequests: UserItem[] }>('/friends/me');
      setFriends(response.data.friends || []);
      setIncomingRequests(response.data.incomingRequests || []);
      setSentRequests(response.data.sentRequests || []);
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Unable to load friends.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  const runSearch = async (searchText: string) => {
    const trimmed = searchText.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    setSearching(true);
    setMessage(null);

    try {
      const response = await API.get<{ success: boolean; users: UserItem[] }>(`/friends/search?q=${encodeURIComponent(trimmed)}`);
      setResults(response.data.users || []);
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Unable to search users.', isError: true });
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      runSearch(query);
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSearchClick = () => {
    runSearch(query);
  };

  const handleAcceptRequest = async (requesterId: string) => {
    setMessage(null);
    try {
      await API.post(`/friends/request/${requesterId}/accept`);
      setMessage({ text: 'Friend request accepted.', isError: false });
      await loadFriends();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Unable to accept friend request.', isError: true });
    }
  };

  const handleRejectRequest = async (requesterId: string) => {
    setMessage(null);
    try {
      await API.post(`/friends/request/${requesterId}/reject`);
      setMessage({ text: 'Friend request rejected.', isError: false });
      await loadFriends();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Unable to reject friend request.', isError: true });
    }
  };

  const handleSendRequest = async (friendId: string) => {
    setMessage(null);
    try {
      await API.post(`/friends/request/${friendId}`);
      setMessage({ text: 'Friend request sent.', isError: false });
      const sentUser = results.find((item) => item._id === friendId);
      setSentRequests((prev) => [
        ...prev,
        sentUser || ({ _id: friendId } as UserItem),
      ]);
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Unable to send friend request.', isError: true });
    }
  };

  const handleCancelRequest = async (friendId: string) => {
    setMessage(null);
    try {
      await API.post(`/friends/request/${friendId}/cancel`);
      setMessage({ text: 'Friend request canceled.', isError: false });
      setSentRequests((prev) => prev.filter((request) => request._id !== friendId));
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Unable to cancel friend request.', isError: true });
    }
  };

  const handleUnfriend = async (friendId: string) => {
    setMessage(null);
    try {
      await API.post(`/friends/unfriend/${friendId}`);
      setMessage({ text: 'Friend removed.', isError: false });
      await loadFriends();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Unable to unfriend.', isError: true });
    }
  };

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 text-white shadow-xl p-6 sm:p-7 flex flex-col items-start justify-start text-left">
        <div className="inline-flex items-center gap-2 mb-2 rounded-full bg-white/20 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white border border-white/30 backdrop-blur-md">
          <img src="/logo.png" alt="Logo" className="h-4 w-4 object-contain brightness-200" />
          <span>COMMUNITY DIRECTORY</span>
        </div>
        <h1 className="text-2xl font-black sm:text-3xl text-white tracking-tight text-left">Community Friends & Members</h1>
        <p className="mt-1.5 text-xs sm:text-sm font-medium text-teal-50 leading-relaxed max-w-2xl text-left">Search community members, add friends, manage pending requests, and start 1-on-1 chats.</p>

        <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 p-1.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 w-full sm:w-fit">
          {(["search", "requests", "friends"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`w-full sm:w-auto inline-flex items-center justify-center text-center rounded-xl px-4 py-2.5 text-xs font-black transition-all cursor-pointer ${
                  isActive
                    ? "bg-white text-teal-900 border border-white shadow-md font-extrabold"
                    : "bg-transparent text-white hover:bg-white/20 hover:text-white"
                }`}
              >
                {tab === "search"
                  ? "🔍 Search Members"
                  : tab === "requests"
                  ? `📥 Requests (${incomingRequests.length})`
                  : `👥 Friends (${friends.length})`}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "search" ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="space-y-4">
            <label className="block text-sm font-black text-slate-900">Search community members</label>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Type a name, username, email, or phone"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
              />
              <button
                type="button"
                onClick={handleSearchClick}
                disabled={searching}
                className="rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black px-5 py-3 text-sm shadow-md shadow-teal-600/25 transition disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                Search
              </button>
            </div>

            {message ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm font-extrabold shadow-xs transition-all animate-in fade-in duration-200 flex items-center justify-between gap-2 ${
                  message.isError
                    ? "border-rose-200 bg-rose-50 text-rose-800"
                    : "border-emerald-200 bg-emerald-50 text-emerald-900"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span>{message.isError ? "⚠️" : "✅"}</span>
                  <span className="truncate">{message.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMessage(null)}
                  className="text-xs opacity-60 hover:opacity-100 transition cursor-pointer shrink-0"
                >
                  ✕
                </button>
              </div>
            ) : null}

            {query.trim().length > 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4">
                {searching ? (
                  <p className="text-xs sm:text-sm text-slate-600 font-semibold p-2">Searching members...</p>
                ) : results.length === 0 ? (
                  <p className="text-xs sm:text-sm text-slate-600 font-semibold p-2">No matching members found.</p>
                ) : (
                  <div className="space-y-3">
                    {results.map((user) => (
                      <div
                        key={user._id}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 sm:flex-row sm:items-center sm:justify-between hover:border-slate-300 transition shadow-2xs"
                      >
                        <div
                          onClick={() => navigate(`/user/${user._id}`)}
                          className="flex items-center gap-3 cursor-pointer group min-w-0 flex-1"
                        >
                          <UserAvatar
                            name={user.fullName || user.username}
                            photoUrl={user.profilePhotoUrl}
                            size="md"
                            className="shrink-0 ring-2 ring-teal-500/40 group-hover:scale-105 transition"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-teal-700 transition">
                              {user.fullName || user.username || "Member"}
                            </p>
                            <p className="text-[11px] sm:text-xs text-slate-600 font-semibold truncate">
                              {user.username ? `@${user.username}` : user.email || "Community Member"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2.5 sm:pt-0 border-t border-slate-100 sm:border-0 shrink-0 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => navigate(`/user/${user._id}`)}
                            className="flex-1 min-w-0 sm:flex-none inline-flex items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
                          >
                            👤 Profile
                          </button>

                          {friendIds.has(user._id) ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/friends/${user._id}/chat`)}
                              className="flex-1 min-w-0 sm:flex-none inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs transition shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
                            >
                              💬 Chat
                            </button>
                          ) : incomingRequestIds.has(user._id) ? (
                            <button
                              type="button"
                              onClick={() => handleAcceptRequest(user._id)}
                              className="flex-1 min-w-0 sm:flex-none inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs transition shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
                            >
                              ✅ Accept
                            </button>
                          ) : sentRequestIds.has(user._id) ? (
                            <button
                              type="button"
                              onClick={() => handleCancelRequest(user._id)}
                              title="Click to cancel friend request"
                              className="flex-1 min-w-0 sm:flex-none inline-flex items-center justify-center rounded-xl border border-amber-300 bg-amber-50 text-amber-900 font-extrabold px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
                            >
                              <span>⏳</span>
                              <span className="hidden sm:inline ml-1">Request Sent</span>
                              <span className="sm:hidden ml-1">Sent</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSendRequest(user._id)}
                              className="flex-1 min-w-0 sm:flex-none inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs transition shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
                            >
                              <span>➕</span>
                              <span className="hidden sm:inline ml-1">Add Friend</span>
                              <span className="sm:hidden ml-1">Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeTab === "requests" ? (
        <div className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">Friend requests</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">See all incoming and outgoing friend requests in one place.</p>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">Incoming requests</h3>
              {incomingRequests.length === 0 ? (
                <p className="mt-2 text-xs sm:text-sm text-slate-500 font-semibold">No pending incoming requests.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {incomingRequests.map((requester) => (
                    <div key={requester._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4 shadow-2xs">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div
                          onClick={() => navigate(`/user/${requester._id}`)}
                          className="flex items-center gap-3 cursor-pointer group min-w-0 flex-1"
                        >
                          <UserAvatar name={requester.fullName || requester.username} photoUrl={requester.profilePhotoUrl} size="md" className="shrink-0 ring-2 ring-emerald-500/40" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-emerald-700 transition">{requester.fullName || requester.username || 'Member'}</p>
                            <p className="text-[11px] sm:text-xs text-slate-600 font-semibold truncate">{requester.username ? `@${requester.username}` : requester.email || requester.mobile}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2.5 sm:pt-0 border-t border-slate-200/80 sm:border-0 shrink-0 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => navigate(`/user/${requester._id}`)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold px-3 py-2 text-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
                          >
                            👤 Profile
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAcceptRequest(requester._id)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3 py-2 text-xs transition shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
                          >
                            ✅ Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectRequest(requester._id)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-900 font-extrabold px-3 py-2 text-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">Outgoing requests</h3>
              {sentRequests.length === 0 ? (
                <p className="mt-2 text-xs sm:text-sm text-slate-500 font-semibold">No outgoing requests.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {sentRequests.map((request) => (
                    <div key={request._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4 shadow-2xs">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div
                          onClick={() => navigate(`/user/${request._id}`)}
                          className="flex items-center gap-3 cursor-pointer group min-w-0 flex-1"
                        >
                          <UserAvatar name={request.fullName || request.username} photoUrl={request.profilePhotoUrl} size="md" className="shrink-0 ring-2 ring-teal-500/40" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-teal-700 transition">{request.fullName || request.username || 'Member'}</p>
                            <p className="text-[11px] sm:text-xs text-slate-600 font-semibold truncate">{request.username ? `@${request.username}` : request.email || request.mobile}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2.5 sm:pt-0 border-t border-slate-200/80 sm:border-0 shrink-0 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => navigate(`/user/${request._id}`)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold px-3 py-2 text-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
                          >
                            👤 Profile
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelRequest(request._id)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-3 py-2 text-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
                          >
                            Cancel Request
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "friends" ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-slate-900">Your friends</h2>
            <p className="mt-1 text-xs font-bold text-slate-600">Connect, chat, or view member profiles.</p>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-slate-600 font-semibold">Loading friends...</p>
          ) : friends.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600 font-semibold">No friends yet. Search for members to add.</p>
          ) : (
            <div className="mt-6 space-y-3">
              {friends.map((friend) => {
                const friendPresence = getPresenceStatus(friend.isOnline, friend.lastActive);
                return (
                  <div key={friend._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:p-5 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-2xs">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div
                        onClick={() => navigate(`/user/${friend._id}`)}
                        className="flex items-center gap-3.5 cursor-pointer group min-w-0 flex-1"
                      >
                        <div className="relative shrink-0">
                          <UserAvatar name={friend.fullName || friend.username} photoUrl={friend.profilePhotoUrl} size="md" className="ring-2 ring-emerald-500 group-hover:scale-105 transition" />
                          <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full ring-2 ring-white ${friendPresence.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-700 transition truncate">{friend.fullName || friend.username || 'Member'}</p>
                          <p className="text-[11px] sm:text-xs text-slate-600 font-medium truncate">{friend.username ? `@${friend.username}` : friend.email || friend.mobile}</p>
                          <p className={`text-[11px] sm:text-xs font-extrabold flex items-center gap-1.5 mt-1 ${friendPresence.isOnline ? 'text-emerald-700' : 'text-slate-500'}`}>
                            <span className={`h-2 w-2 rounded-full ${friendPresence.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                            {friendPresence.text}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2.5 sm:pt-0 border-t border-slate-200/80 sm:border-0 shrink-0 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => navigate(`/user/${friend._id}`)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold px-3 py-2 text-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                        >
                          👤 Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/friends/${friend._id}/chat`)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3 py-2 text-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                        >
                          <span>💬 Chat</span>
                          {friend.unreadCount && friend.unreadCount > 0 ? (
                            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                              {friend.unreadCount > 99 ? '99+' : friend.unreadCount}
                            </span>
                          ) : null}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      <ConfirmModal
        isOpen={Boolean(unfriendConfirmUser)}
        title="Unfriend Confirmation"
        message={
          unfriendConfirmUser ? (
            <span>
              Are you sure you want to unfriend{" "}
              <strong className="text-slate-900">
                {unfriendConfirmUser.fullName || unfriendConfirmUser.username || "this friend"}
              </strong>
              ? They will be removed from your friends list.
            </span>
          ) : ""
        }
        confirmText="Unfriend"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (unfriendConfirmUser) {
            const friendId = unfriendConfirmUser._id;
            setUnfriendConfirmUser(null);
            handleUnfriend(friendId);
          }
        }}
        onCancel={() => setUnfriendConfirmUser(null)}
      />
    </section>
  );
}
