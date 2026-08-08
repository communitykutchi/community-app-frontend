import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import UserAvatar from "../components/UserAvatar";
import { getPresenceStatus } from "../utils/presence";

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
  const [message, setMessage] = useState<string | null>(null);
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
      setMessage(err.response?.data?.message || 'Unable to load friends.');
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
      setMessage(err.response?.data?.message || 'Unable to search users.');
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
      setMessage('Friend request accepted.');
      await loadFriends();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Unable to accept friend request.');
    }
  };

  const handleRejectRequest = async (requesterId: string) => {
    setMessage(null);
    try {
      await API.post(`/friends/request/${requesterId}/reject`);
      setMessage('Friend request rejected.');
      await loadFriends();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Unable to reject friend request.');
    }
  };

  const handleSendRequest = async (friendId: string) => {
    setMessage(null);
    try {
      await API.post(`/friends/request/${friendId}`);
      setMessage('Friend request sent.');
      const sentUser = results.find((item) => item._id === friendId);
      setSentRequests((prev) => [
        ...prev,
        sentUser || ({ _id: friendId } as UserItem),
      ]);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Unable to send friend request.');
    }
  };

  const handleCancelRequest = async (friendId: string) => {
    setMessage(null);
    try {
      await API.post(`/friends/request/${friendId}/cancel`);
      setMessage('Friend request canceled.');
      setSentRequests((prev) => prev.filter((request) => request._id !== friendId));
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Unable to cancel friend request.');
    }
  };

  const handleUnfriend = async (friendId: string) => {
    setMessage(null);
    try {
      await API.post(`/friends/unfriend/${friendId}`);
      setMessage('Friend removed.');
      await loadFriends();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Unable to unfriend.');
    }
  };

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-800 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 px-6 py-6 text-white">
          <div className="inline-flex items-center gap-2 mb-2 rounded-full bg-teal-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-300 border border-teal-500/30">
            <img src="/logo.png" alt="Logo" className="h-3.5 w-3.5 object-contain" />
            <span>COMMUNITY DIRECTORY</span>
          </div>
          <h1 className="text-2xl font-extrabold sm:text-3xl text-white">Community Friends & Members</h1>
          <p className="mt-1 text-xs text-slate-300 leading-relaxed">Search community members, add friends, manage pending requests, and start 1-on-1 chats.</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {(["search", "requests", "friends"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${activeTab === tab ? "bg-teal-600 text-white shadow-md shadow-teal-600/30" : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"}`}
              >
                {tab === "search" ? "🔍 Search Members" : tab === "requests" ? `📥 Requests (${incomingRequests.length})` : `👥 Friends (${friends.length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === "search" ? (
        <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-slate-950 via-blue-950/60 to-slate-950 p-6 sm:p-8 text-white shadow-xl">
          <div className="space-y-4">
            <label className="block text-sm font-black text-white">Search community members</label>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Type a name, username, email, or phone"
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white/15"
              />
              <button
                type="button"
                onClick={handleSearchClick}
                disabled={searching}
                className="rounded-2xl bg-teal-500 hover:bg-teal-400 px-5 py-3 text-sm font-black text-slate-950 transition shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {message ? (
              <div className="rounded-2xl border border-rose-500/40 bg-rose-950/60 px-4 py-3 text-sm text-rose-300 font-bold">{message}</div>
            ) : null}

            {query.trim().length > 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                {searching ? (
                  <p className="text-sm text-slate-300">Searching members...</p>
                ) : results.length === 0 ? (
                  <p className="text-sm text-slate-300">No matching members found.</p>
                ) : (
                  <div className="space-y-3">
                    {results.map((user) => (
                      <div key={user._id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-white/15 transition">
                        <div
                          onClick={() => navigate(`/user/${user._id}`)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          {user.profilePhotoUrl ? (
                            <img
                              src={user.profilePhotoUrl}
                              alt={user.fullName || user.username || 'User avatar'}
                              className="h-12 w-12 rounded-full object-cover group-hover:scale-105 transition ring-2 ring-teal-400/40"
                            />
                          ) : (
                            <div className="grid h-12 w-12 place-items-center rounded-full bg-teal-500/20 text-sm font-black text-teal-300 border border-teal-400/30 group-hover:scale-105 transition">
                              {user.fullName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-black text-white group-hover:text-teal-300 transition">{user.fullName || user.username || 'Member'}</p>
                            <p className="text-xs text-slate-300">{user.username ? `@${user.username}` : (user.email || "Community Member")}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/user/${user._id}`)}
                            className="rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/20 transition"
                          >
                            👤 Profile
                          </button>

                          {friendIds.has(user._id) ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/friends/${user._id}/chat`)}
                              className="rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950 transition"
                            >
                              💬 Chat
                            </button>
                          ) : incomingRequestIds.has(user._id) ? (
                            <button
                              type="button"
                              onClick={() => handleAcceptRequest(user._id)}
                              className="rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950 transition"
                            >
                              ✅ Accept Request
                            </button>
                          ) : sentRequestIds.has(user._id) ? (
                            <button
                              type="button"
                              onClick={() => handleCancelRequest(user._id)}
                              className="rounded-2xl border border-amber-400/40 bg-amber-500/20 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition"
                            >
                              ⏳ Request Sent
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSendRequest(user._id)}
                              className="rounded-2xl bg-teal-500 hover:bg-teal-400 px-4 py-2 text-xs font-black text-slate-950 transition"
                            >
                              ➕ Add Friend
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
              <h3 className="text-lg font-semibold text-slate-900">Incoming requests</h3>
              {incomingRequests.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No pending incoming requests.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {incomingRequests.map((requester) => (
                    <div key={requester._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{requester.fullName || requester.username || 'Member'}</p>
                          <p className="text-sm text-slate-600">{requester.username ? `@${requester.username}` : requester.email || requester.mobile}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleAcceptRequest(requester._id)}
                            className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectRequest(requester._id)}
                            className="rounded-2xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-300"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900">Outgoing requests</h3>
              {sentRequests.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No outgoing requests.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {sentRequests.map((request) => (
                    <div key={request._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{request.fullName || request.username || 'Member'}</p>
                          <p className="text-sm text-slate-600">{request.username ? `@${request.username}` : request.email || request.mobile}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCancelRequest(request._id)}
                          className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                        >
                          Cancel Request
                        </button>
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
        <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-slate-950 via-blue-950/60 to-slate-950 p-6 sm:p-8 text-white shadow-xl">
          <div>
            <h2 className="text-xl font-black text-white">Your friends</h2>
            <p className="mt-1 text-xs text-slate-300">Chat with or remove friends from your list.</p>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-slate-300">Loading friends...</p>
          ) : friends.length === 0 ? (
            <p className="mt-4 text-sm text-slate-300">No friends yet. Search for members to add.</p>
          ) : (
            <div className="mt-6 space-y-3">
              {friends.map((friend) => {
                const friendPresence = getPresenceStatus(friend.isOnline, friend.lastActive);
                return (
                  <div key={friend._id} className="rounded-2xl border border-white/10 bg-white/10 p-4 sm:p-5 hover:bg-white/15 transition backdrop-blur-md">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div
                        onClick={() => navigate(`/user/${friend._id}`)}
                        className="flex items-center gap-4 cursor-pointer group"
                      >
                        <div className="relative">
                          <UserAvatar name={friend.fullName || friend.username} photoUrl={friend.profilePhotoUrl} size="md" className="ring-2 ring-teal-400/40 group-hover:scale-105 transition" />
                          <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full ring-2 ring-slate-950 ${friendPresence.isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white group-hover:text-teal-300 transition">{friend.fullName || friend.username || 'Member'}</p>
                          <p className="text-xs text-slate-300">{friend.username ? `@${friend.username}` : friend.email || friend.mobile}</p>
                          <p className={`text-xs font-bold flex items-center gap-1.5 mt-1 ${friendPresence.isOnline ? 'text-emerald-300' : 'text-slate-400'}`}>
                            <span className={`h-2 w-2 rounded-full ${friendPresence.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                            {friendPresence.text}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/friends/${friend._id}/chat`)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950 transition shadow-md"
                        >
                          <span>💬 Chat</span>
                          {friend.unreadCount && friend.unreadCount > 0 ? (
                            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                              {friend.unreadCount > 99 ? '99+' : friend.unreadCount}
                            </span>
                          ) : null}
                        </button>
                        <button
                          type="button"
                          onClick={() => setUnfriendConfirmUser(friend)}
                          className="inline-flex items-center justify-center rounded-2xl bg-rose-600/90 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white transition"
                        >
                          Unfriend
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

      {unfriendConfirmUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Unfriend Confirmation</h3>
                <p className="text-xs font-medium text-slate-500">Remove friend from your network</p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-slate-600">
              Are you sure you want to unfriend <span className="font-bold text-slate-900">{unfriendConfirmUser.fullName || unfriendConfirmUser.username || "this friend"}</span>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUnfriendConfirmUser(null)}
                className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const friendId = unfriendConfirmUser._id;
                  setUnfriendConfirmUser(null);
                  handleUnfriend(friendId);
                }}
                className="rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-600/30 transition hover:bg-rose-700"
              >
                Unfriend
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
