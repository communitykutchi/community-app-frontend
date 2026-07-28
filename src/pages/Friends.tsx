import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios.js";
import UserAvatar from "../components/UserAvatar.js";
import { getPresenceStatus } from "../utils/presence.js";

interface UserItem {
  _id: string;
  fullName?: string;
  username?: string;
  email?: string;
  mobile?: string;
  profilePhotoUrl?: string;
  isOnline?: boolean;
  lastActive?: string;
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

  const sentRequestIds = useMemo(
    () => new Set(sentRequests.map((request) => request._id)),
    [sentRequests],
  );

  const hiddenIds = useMemo(
    () => new Set([...(friends || []).map((friend) => friend._id), ...(incomingRequests || []).map((request) => request._id)]),
    [friends, incomingRequests],
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
      const users = response.data.users || [];
      setResults(users.filter((user) => !hiddenIds.has(user._id)));
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
  }, [query, hiddenIds, sentRequestIds]);

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
      <div className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Friends</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Search community members, add friends, and manage requests.</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {(["search", "requests", "friends"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeTab === tab ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
            >
              {tab === "search" ? "Search" : tab === "requests" ? "Requests" : "Friends"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "search" ? (
        <div className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">Search community members</label>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Type a name, username, email, or phone"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
              <button
                type="button"
                onClick={handleSearchClick}
                disabled={searching}
                className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {message ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</div>
            ) : null}

            {query.trim().length > 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                {searching ? (
                  <p className="text-sm text-slate-500">Searching members...</p>
                ) : results.length === 0 ? (
                  <p className="text-sm text-slate-500">No matching members found.</p>
                ) : (
                  <div className="space-y-3">
                    {results.map((user) => (
                      <div key={user._id} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          {user.profilePhotoUrl ? (
                            <img
                              src={user.profilePhotoUrl}
                              alt={user.fullName || user.username || 'User avatar'}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                              {user.fullName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{user.fullName || user.username || 'Member'}</p>
                            <p className="text-sm text-slate-600">{user.username ? `@${user.username}` : user.email || user.mobile}</p>
                          </div>
                        </div>
                        {sentRequestIds.has(user._id) ? (
                          <button
                            type="button"
                            onClick={() => handleCancelRequest(user._id)}
                            className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                          >
                            Cancel Request
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendRequest(user._id)}
                            className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                          >
                            Send Request
                          </button>
                        )}
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
        <div className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-slate-900">Your friends</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Chat with or remove friends from your list.</p>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-slate-500">Loading friends...</p>
          ) : friends.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No friends yet. Search for members to add.</p>
          ) : (
            <div className="mt-6 space-y-3">
              {friends.map((friend) => {
                const friendPresence = getPresenceStatus(friend.isOnline, friend.lastActive);
                return (
                  <div key={friend._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <UserAvatar name={friend.fullName || friend.username} photoUrl={friend.profilePhotoUrl} size="md" className="ring-1 ring-slate-200" />
                          <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white ${friendPresence.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{friend.fullName || friend.username || 'Member'}</p>
                          <p className="text-xs text-slate-600">{friend.username ? `@${friend.username}` : friend.email || friend.mobile}</p>
                          <p className={`text-xs font-medium flex items-center gap-1 mt-0.5 ${friendPresence.isOnline ? 'text-emerald-600' : 'text-slate-500'}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${friendPresence.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                            {friendPresence.text}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/friends/${friend._id}/chat`)}
                          className="inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                        >
                          Chat
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUnfriend(friend._id)}
                          className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
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
    </section>
  );
}
