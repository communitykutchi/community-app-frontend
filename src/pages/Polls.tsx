import React, { useEffect, useState } from "react";
import API from "../api/axios";
import Loader from "../components/Loader";
import Toast from "../components/Toast";
import UserAvatar from "../components/UserAvatar";
import SEO from "../components/SEO";
import ConfirmModal from "../components/ConfirmModal";

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
      const res = await API.get<{ user?: { _id?: string; role?: string } }>("/auth/me");
      if (res.data?.user) {
        setUserRole(res.data.user.role || "member");
        setCurrentUserId(res.data.user._id || null);
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

  const isManager = ["super_admin", "admin", "jamaat_admin", "jamaatadmin", "moderator"].includes((userRole || "").toLowerCase());

  const filteredPolls = polls.filter((p) => activeCategory === "All" || (p.category || "General") === activeCategory);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <SEO pageKey="polls" />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 text-white shadow-xl p-5 sm:p-8">
        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5 sm:gap-6">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-white border border-white/30 backdrop-blur-md">
                <span>🗳️</span>
                <span className="truncate">COMMUNITY VOICE</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight break-words">Community Polls & Voting</h1>
            <p className="text-xs sm:text-sm font-medium text-teal-50 max-w-xl leading-relaxed">
              Cast your vote on active community decisions, elections, and events. View real-time percentages and participating statistics.
            </p>
          </div>

          {isManager && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white text-teal-900 px-3.5 py-2 text-xs font-bold shadow-md hover:bg-teal-50 active:scale-95 transition cursor-pointer shrink-0 w-auto self-start whitespace-nowrap"
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
            className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition whitespace-nowrap cursor-pointer ${
              activeCategory === cat
                ? "active-green-btn bg-teal-600 !text-white shadow-md shadow-teal-600/30"
                : "bg-white text-slate-700 border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 hover:text-slate-900"
            }`}
          >
            <span className={activeCategory === cat ? "!text-white font-extrabold" : ""}>{cat}</span>
          </button>
        ))}
      </div>

      {/* Polls Feed */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader />
        </div>
      ) : filteredPolls.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-800 shadow-lg">
          <span className="text-4xl">📊</span>
          <h3 className="mt-4 text-lg font-black text-slate-900">No Polls Available</h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">There are no active polls in this category right now.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {filteredPolls.map((poll) => {
            const timeStatus = formatPollTimeRemaining(poll.expiresAt);
            const isExpired = timeStatus?.includes("Expired");

            return (
              <div
                key={poll._id}
                className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-slate-900 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-teal-200"
              >
                <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-teal-50 blur-2xl pointer-events-none" />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar name={poll.createdBy?.fullName || "Jamaat Admin"} photoUrl={poll.createdBy?.profilePhotoUrl} size="md" className="shrink-0 ring-2 ring-teal-500/20" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">{poll.createdBy?.fullName || "Jamaat Admin"}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-semibold flex-wrap">
                        <span className="rounded-full bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shrink-0">
                          {poll.category || "General"}
                        </span>
                        <span className="shrink-0">•</span>
                        <span className="shrink-0">{new Date(poll.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-2.5 sm:pt-0 border-t border-slate-100 sm:border-0 shrink-0 w-full sm:w-auto">
                    {timeStatus && (
                      <span
                        className={`rounded-full px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider whitespace-nowrap ${
                          isExpired
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs"
                        }`}
                      >
                        {timeStatus}
                      </span>
                    )}

                    {(isManager || (currentUserId && poll.createdBy?._id === currentUserId)) && (
                      <button
                        type="button"
                        onClick={() => setPollToDelete(poll)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1 text-xs font-bold transition cursor-pointer active:scale-95 shrink-0"
                        title="Delete Poll"
                      >
                        <span>🗑️</span>
                        <span className="text-[11px] font-extrabold sm:hidden">Delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Poll Question */}
                <h3 className="mt-4 text-base font-black text-slate-900 md:text-lg tracking-tight">{poll.question}</h3>
                {poll.description ? <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">{poll.description}</p> : null}

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
                          isExpired ? "cursor-not-allowed opacity-80" : "cursor-pointer active:scale-[0.99]"
                        } ${
                          isSelected
                            ? "border-teal-500 bg-teal-50/80 ring-2 ring-teal-500/30 text-teal-950 shadow-xs"
                            : "border-slate-200 bg-slate-50/60 hover:border-teal-300 hover:bg-teal-50/30 text-slate-800"
                        }`}
                      >
                        {/* Progress Fill Bar */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${
                            isSelected ? "bg-teal-500/20" : "bg-slate-200/50"
                          }`}
                          style={{ width: `${pct}%` }}
                        />

                        <div className="relative flex items-center justify-between gap-2 text-xs sm:text-sm font-bold min-w-0 w-full">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${
                                isSelected ? "border-teal-600 bg-teal-600 text-white" : "border-slate-300 bg-white text-slate-400"
                              }`}
                            >
                              {isSelected ? "✓" : ""}
                            </div>
                            <span className={`break-words min-w-0 flex-1 leading-snug ${isSelected ? "text-teal-950 font-black" : "text-slate-900 font-bold"}`}>{opt.text}</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-1 text-right">
                            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 whitespace-nowrap">({opt.voteCount} {opt.voteCount === 1 ? "vote" : "votes"})</span>
                            <span className="font-black text-teal-700 text-xs sm:text-sm">{pct}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between text-xs font-extrabold text-slate-500 border-t border-slate-100 pt-3">
                  <span>{poll.totalVotes} {poll.totalVotes === 1 ? "total vote" : "total votes"}</span>
                  {poll.userVotedOptionId ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-black text-teal-900 border border-teal-300 shadow-xs">
                      <span className="text-teal-700">✓</span>
                      <span>You Voted</span>
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Poll Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="relative overflow-hidden w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>🗳️</span>
                <span>Create Community Poll</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">Poll Question</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Should we organize a Jamaat Sports Day next month?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Add additional details or guidelines..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none transition"
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c} className="bg-white text-slate-900">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">Duration</label>
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none transition"
                  >
                    <option value={1} className="bg-white text-slate-900">1 Day</option>
                    <option value={3} className="bg-white text-slate-900">3 Days</option>
                    <option value={7} className="bg-white text-slate-900">1 Week</option>
                    <option value={14} className="bg-white text-slate-900">2 Weeks</option>
                    <option value={30} className="bg-white text-slate-900">1 Month</option>
                  </select>
                </div>
              </div>

              {/* Poll Options Inputs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">Poll Options</label>
                  {options.length < 6 && (
                    <button
                      type="button"
                      onClick={() => setOptions([...options, ""])}
                      className="text-xs font-black text-teal-600 hover:text-teal-700 transition cursor-pointer"
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
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none transition"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                          className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl active-green-btn btn-primary bg-teal-600 !text-white px-6 py-2.5 text-xs font-black uppercase tracking-wider shadow-lg shadow-teal-600/30 hover:bg-teal-700 active:scale-95 disabled:opacity-50 transition cursor-pointer"
                >
                  {submitting ? "Publishing..." : "Publish Poll"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Poll Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(pollToDelete)}
        title="Delete Community Poll"
        message={
          pollToDelete ? (
            <span>
              Are you sure you want to delete the poll{" "}
              <strong className="text-slate-900">"{pollToDelete.question}"</strong>? All votes and statistics will be permanently removed.
            </span>
          ) : ""
        }
        confirmText="Delete Poll"
        cancelText="Cancel"
        variant="danger"
        loading={deletingPoll}
        onConfirm={confirmDeletePoll}
        onCancel={() => setPollToDelete(null)}
      />
    </div>
  );
}
