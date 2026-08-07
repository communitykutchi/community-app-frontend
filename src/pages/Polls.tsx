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

  const handleDeletePoll = async (pollId: string) => {
    if (!window.confirm("Are you sure you want to delete this poll?")) return;
    try {
      const res = await API.delete<{ success: boolean }>(`/polls/${pollId}`);
      if (res.data?.success) {
        setToast({ message: "Poll deleted successfully.", type: "success" });
        setPolls((prev) => prev.filter((p) => p._id !== pollId));
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "Failed to delete poll.", type: "error" });
    }
  };

  const isManager = ["super_admin", "admin", "moderator"].includes((userRole || "").toLowerCase());

  const filteredPolls = polls.filter((p) => activeCategory === "All" || (p.category || "General") === activeCategory);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-400 border border-teal-500/30">
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
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/30 hover:bg-teal-500 transition active:scale-95"
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
                ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
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
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <span className="text-4xl">📊</span>
          <h3 className="mt-4 text-lg font-bold text-slate-900">No Polls Available</h3>
          <p className="mt-1 text-xs text-slate-500">There are no active polls in this category right now.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {filteredPolls.map((poll) => {
            const timeStatus = formatPollTimeRemaining(poll.expiresAt);
            const isExpired = timeStatus?.includes("Expired");

            return (
              <div
                key={poll._id}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={poll.createdBy?.fullName || "Jamaat Admin"} photoUrl={poll.createdBy?.profilePhotoUrl} size="md" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{poll.createdBy?.fullName || "Jamaat Admin"}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-teal-600">{poll.category || "General"}</span>
                        <span>•</span>
                        <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {timeStatus && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          isExpired ? "bg-red-50 text-red-600 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {timeStatus}
                      </span>
                    )}

                    {isManager && (
                      <button
                        onClick={() => handleDeletePoll(poll._id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                        title="Delete Poll"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                {/* Poll Question */}
                <h3 className="mt-4 text-base font-extrabold text-slate-900 md:text-lg">{poll.question}</h3>
                {poll.description ? <p className="mt-1 text-xs text-slate-600">{poll.description}</p> : null}

                {/* Poll Options */}
                <div className="mt-5 space-y-3">
                  {poll.options.map((opt) => {
                    const isSelected = poll.userVotedOptionId === opt._id;
                    const pct = poll.totalVotes > 0 ? Math.round((opt.voteCount / poll.totalVotes) * 100) : 0;

                    return (
                      <div
                        key={opt._id}
                        onClick={() => !isExpired && handleVote(poll._id, opt._id)}
                        className={`relative overflow-hidden rounded-xl border p-4 transition ${
                          isExpired ? "cursor-not-allowed opacity-85" : "cursor-pointer active:scale-[0.99]"
                        } ${
                          isSelected
                            ? "border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20"
                            : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {/* Progress Fill Bar */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${
                            isSelected ? "bg-teal-200/50" : "bg-slate-200/60"
                          }`}
                          style={{ width: `${pct}%` }}
                        />

                        <div className="relative flex items-center justify-between gap-3 text-xs font-bold text-slate-800">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                                isSelected ? "border-teal-600 bg-teal-600 text-white" : "border-slate-400 bg-white"
                              }`}
                            >
                              {isSelected ? "✓" : ""}
                            </div>
                            <span>{opt.text}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-slate-500">({opt.voteCount} votes)</span>
                            <span className="font-extrabold text-slate-900">{pct}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500 border-t border-slate-100 pt-3">
                  <span>{poll.totalVotes} total votes</span>
                  {poll.userVotedOptionId ? <span className="text-teal-600 font-bold">✓ You voted</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Poll Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl md:p-8 animate-in fade-in zoom-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Create Community Poll</h3>
              <button onClick={() => setShowCreateModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Poll Question</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Should we organize a Jamaat Sports Day next month?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Add additional details or guidelines..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 focus:border-teal-500"
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Duration</label>
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 focus:border-teal-500"
                  >
                    <option value={1}>1 Day</option>
                    <option value={3}>3 Days</option>
                    <option value={7}>1 Week</option>
                    <option value={14}>2 Weeks</option>
                    <option value={30}>1 Month</option>
                  </select>
                </div>
              </div>

              {/* Poll Options Inputs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Poll Options</label>
                  {options.length < 6 && (
                    <button
                      type="button"
                      onClick={() => setOptions([...options, ""])}
                      className="text-xs font-bold text-teal-600 hover:text-teal-700"
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
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-500"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/30 hover:bg-teal-500 disabled:opacity-50"
                >
                  {submitting ? "Publishing..." : "Publish Poll"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
