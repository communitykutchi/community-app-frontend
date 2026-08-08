import React, { useEffect, useState } from "react";
import API from "../api/axios";
import Loader from "../components/Loader";
import Toast from "../components/Toast";
import UserAvatar from "../components/UserAvatar";

export interface PollOption {
  _id: string;
  text: string;
  voteCount: number;
  percentage?: number;
}

export interface PollItem {
  _id: string;
  question: string;
  description?: string;
  category?: string;
  createdBy?: {
    _id: string;
    fullName?: string;
    profilePhotoUrl?: string;
  };
  options: PollOption[];
  totalVotes: number;
  userVotedOptionId?: string | null;
  expiresAt?: string;
  createdAt: string;
}

const CATEGORIES = ["All", "General", "Elections", "Events", "Community"];

function formatPollTimeRemaining(expiresAt?: string) {
  if (!expiresAt) return null;
  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();
  const diffMs = expiryTime - now;

  if (diffMs <= 0) {
    return "🔒 Expired";
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `⏳ ${diffMins}m left`;
    }
    return `⏳ ${diffHours}h left`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `⏳ ${diffDays} ${diffDays === 1 ? "day" : "days"} left`;
}

export default function Polls() {
  const [polls, setPolls] = useState<PollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // User role check
  const [userRole, setUserRole] = useState<string>("member");

  // Create Poll Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [durationDays, setDurationDays] = useState<number>(3);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPolls();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const res = await API.get<{ user?: { role?: string } }>("/auth/me");
      if (res.data?.user?.role) {
        setUserRole(res.data.user.role);
      }
    } catch {
      // Ignore
    }
  };

  const fetchPolls = async () => {
    try {
      const res = await API.get<{ success: boolean; polls: PollItem[] }>("/polls/all");
      if (res.data?.success && Array.isArray(res.data.polls)) {
        setPolls(res.data.polls);
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "Failed to load polls.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    // Optimistic UI update
    setPolls((prev) =>
      prev.map((poll) => {
        if (poll._id !== pollId) return poll;

        const isChangingVote = poll.userVotedOptionId !== null;
        let nextTotalVotes = poll.totalVotes;
        let newUserVotedId: string | null = optionId;

        if (poll.userVotedOptionId === optionId) {
          newUserVotedId = null;
          nextTotalVotes = Math.max(0, nextTotalVotes - 1);
        } else if (!isChangingVote) {
          nextTotalVotes += 1;
        }

        const nextOptions = poll.options.map((opt) => {
          let count = opt.voteCount;
          if (poll.userVotedOptionId === opt._id) {
            count = Math.max(0, count - 1);
          }
          if (newUserVotedId === opt._id) {
            count += 1;
          }
          return { ...opt, voteCount: count };
        });

        const updatedOptions = nextOptions.map((opt) => ({
          ...opt,
          percentage: nextTotalVotes > 0 ? Math.round((opt.voteCount / nextTotalVotes) * 100) : 0,
        }));

        return {
          ...poll,
          totalVotes: nextTotalVotes,
          userVotedOptionId: newUserVotedId,
          options: updatedOptions,
        };
      })
    );

    try {
      const res = await API.post<{ success: boolean; poll: PollItem }>(`/polls/${pollId}/vote`, { optionId });
      if (res.data?.success && res.data.poll) {
        setPolls((prev) => prev.map((p) => (p._id === pollId ? res.data.poll : p)));
      }
    } catch {
      fetchPolls();
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      return setToast({ message: "Please enter a poll question.", type: "error" });
    }

    const cleanOpts = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOpts.length < 2) {
      return setToast({ message: "Please enter at least 2 non-empty options.", type: "error" });
    }

    setSubmitting(true);
    try {
      const res = await API.post<{ success: boolean; poll: PollItem }>("/polls/create", {
        question,
        description,
        category,
        options: cleanOpts,
        durationDays,
      });

      if (res.data?.success) {
        setToast({ message: "Poll created successfully!", type: "success" });
        setShowCreateModal(false);
        setQuestion("");
        setDescription("");
        setOptions(["", ""]);
        fetchPolls();
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "Failed to create poll.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Poll Modal State
  const [pollToDelete, setPollToDelete] = useState<PollItem | null>(null);
  const [deletingPoll, setDeletingPoll] = useState(false);

  const confirmDeletePoll = async () => {
    if (!pollToDelete) return;
    setDeletingPoll(true);
    try {
      const res = await API.delete<{ success: boolean }>(`/polls/${pollToDelete._id}`);
      if (res.data?.success) {
        setToast({ message: "Poll deleted successfully.", type: "success" });
        setPolls((prev) => prev.filter((p) => p._id !== pollToDelete._id));
        setPollToDelete(null);
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "Failed to delete poll.", type: "error" });
    } finally {
      setDeletingPoll(false);
    }
  };

  const isManager = ["super_admin", "admin", "moderator"].includes((userRole || "").toLowerCase());

  const filteredPolls = polls.filter((p) => activeCategory === "All" || (p.category || "General") === activeCategory);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header Banner */}
      <div className="page-hero-banner relative overflow-hidden rounded-3xl border border-teal-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950/90 p-6 text-white shadow-2xl md:p-8">
        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-300 border border-teal-400/30 shadow-sm">
                🗳️ COMMUNITY VOICE
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white md:text-3xl">Community Polls & Voting</h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Cast your vote on active community decisions, elections, and events. View real-time percentages and participating statistics.
            </p>
          </div>

          {isManager && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-5 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-teal-500/25 hover:from-teal-400 hover:to-emerald-500 active:scale-95 transition cursor-pointer"
            >
              <span>➕</span> Create New Poll
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${
              activeCategory === cat
                ? "bg-teal-600 text-white shadow-lg shadow-teal-950/50 border border-teal-400/40"
                : "bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Polls Feed */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader />
        </div>
      ) : filteredPolls.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-12 text-center text-white shadow-xl">
          <span className="text-4xl">📊</span>
          <h3 className="mt-4 text-lg font-extrabold text-white">No Polls Available</h3>
          <p className="mt-1 text-xs text-slate-400">There are no active polls in this category right now.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {filteredPolls.map((poll) => {
            const timeStatus = formatPollTimeRemaining(poll.expiresAt);
            const isExpired = timeStatus?.includes("Expired");

            return (
              <div
                key={poll._id}
                className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-slate-950 via-purple-950/60 to-slate-950 p-6 sm:p-8 text-white shadow-xl transition-all duration-300 hover:shadow-purple-900/20"
              >
                <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={poll.createdBy?.fullName || "Jamaat Admin"} photoUrl={poll.createdBy?.profilePhotoUrl} size="md" className="ring-2 ring-purple-500/40" />
                    <div>
                      <h4 className="text-xs font-black text-white">{poll.createdBy?.fullName || "Jamaat Admin"}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-0.5">
                        <span className="font-bold text-purple-300 uppercase tracking-wider">{poll.category || "General"}</span>
                        <span>•</span>
                        <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {timeStatus && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                          isExpired ? "bg-rose-500/20 text-rose-300 border border-rose-400/30" : "bg-purple-500/20 text-purple-300 border border-purple-400/30"
                        }`}
                      >
                        {timeStatus}
                      </span>
                    )}

                    {isManager && (
                      <button
                        onClick={() => setPollToDelete(poll)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-950/60 hover:text-rose-300 transition"
                        title="Delete Poll"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                {/* Poll Question */}
                <h3 className="mt-4 text-base font-black text-white md:text-lg">{poll.question}</h3>
                {poll.description ? <p className="mt-1 text-xs text-slate-300 leading-relaxed">{poll.description}</p> : null}

                {/* Poll Options */}
                <div className="mt-5 space-y-3">
                  {poll.options.map((opt) => {
                    const isSelected = poll.userVotedOptionId === opt._id;
                    const pct = poll.totalVotes > 0 ? Math.round((opt.voteCount / poll.totalVotes) * 100) : 0;

                    return (
                      <div
                        key={opt._id}
                        onClick={() => !isExpired && handleVote(poll._id, opt._id)}
                        className={`relative overflow-hidden rounded-2xl border p-4 transition ${
                          isExpired ? "cursor-not-allowed opacity-85" : "cursor-pointer active:scale-[0.99]"
                        } ${
                          isSelected
                            ? "border-purple-400 bg-purple-500/25 ring-2 ring-purple-400/30 text-white"
                            : "border-white/10 bg-white/5 hover:border-purple-400/40 hover:bg-white/10 text-slate-200"
                        }`}
                      >
                        {/* Progress Fill Bar */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${
                            isSelected ? "bg-purple-600/40" : "bg-white/10"
                          }`}
                          style={{ width: `${pct}%` }}
                        />

                        <div className="relative flex items-center justify-between gap-3 text-xs font-black">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                                isSelected ? "border-purple-400 bg-purple-500 text-white" : "border-slate-500 bg-slate-900 text-slate-400"
                              }`}
                            >
                              {isSelected ? "✓" : ""}
                            </div>
                            <span className="text-white">{opt.text}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-purple-200">({opt.voteCount} votes)</span>
                            <span className="font-black text-amber-300 text-sm">{pct}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-300 border-t border-white/10 pt-3">
                  <span>{poll.totalVotes} total votes</span>
                  {poll.userVotedOptionId ? <span className="text-purple-300 font-black">✓ You voted</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Poll Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="relative overflow-hidden w-full max-w-lg rounded-3xl border border-teal-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950/95 p-6 sm:p-8 text-white shadow-2xl">
            <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>🗳️</span>
                <span>Create Community Poll</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-teal-300 mb-1">Poll Question</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Should we organize a Jamaat Sports Day next month?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 px-4 py-2.5 text-sm font-semibold text-white placeholder-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-teal-300 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Add additional details or guidelines..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 px-4 py-2 text-sm font-semibold text-white placeholder-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-teal-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-white focus:border-teal-400 focus:outline-none transition"
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c} className="bg-slate-900 text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-teal-300 mb-1">Duration</label>
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-white focus:border-teal-400 focus:outline-none transition"
                  >
                    <option value={1} className="bg-slate-900 text-white">1 Day</option>
                    <option value={3} className="bg-slate-900 text-white">3 Days</option>
                    <option value={7} className="bg-slate-900 text-white">1 Week</option>
                    <option value={14} className="bg-slate-900 text-white">2 Weeks</option>
                    <option value={30} className="bg-slate-900 text-white">1 Month</option>
                  </select>
                </div>
              </div>

              {/* Poll Options Inputs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-teal-300">Poll Options</label>
                  {options.length < 6 && (
                    <button
                      type="button"
                      onClick={() => setOptions([...options, ""])}
                      className="text-xs font-black text-teal-300 hover:text-teal-200 transition"
                    >
                      + Add Option
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...options];
                          updated[idx] = e.target.value;
                          setOptions(updated);
                        }}
                        className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 px-3.5 py-2 text-sm font-semibold text-white placeholder-slate-400 focus:border-teal-400 focus:outline-none transition"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                          className="rounded-lg p-2 text-rose-400 hover:bg-rose-950/60 hover:text-rose-300 transition"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-teal-500/25 hover:from-teal-400 hover:to-emerald-500 active:scale-95 disabled:opacity-50 transition"
                >
                  {submitting ? "Publishing..." : "Publish Poll"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Poll Confirmation Modal */}
      {pollToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="relative overflow-hidden w-full max-w-md rounded-3xl border border-rose-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/95 p-6 sm:p-7 text-white shadow-2xl space-y-4">
            <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-rose-500/10 blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 text-rose-400">
              <span className="text-3xl">🗑️</span>
              <div>
                <h3 className="text-lg font-black text-white">Delete Community Poll</h3>
                <p className="text-xs text-rose-300">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete this poll? All votes and statistics will be removed.
            </p>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs font-bold text-white space-y-1">
              <p className="text-amber-300">Question:</p>
              <p className="text-slate-200 line-clamp-2">"{pollToDelete.question}"</p>
              <p className="text-[11px] text-slate-400 font-normal pt-1">
                Category: {pollToDelete.category || "General"} • {pollToDelete.totalVotes} total votes
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPollToDelete(null)}
                disabled={deletingPoll}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeletePoll}
                disabled={deletingPoll}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 active:scale-95 disabled:opacity-50 transition cursor-pointer"
              >
                {deletingPoll ? "Deleting..." : "Delete Poll"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
