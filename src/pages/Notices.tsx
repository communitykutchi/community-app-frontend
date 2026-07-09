import { useEffect, useMemo, useState, type FormEvent } from "react";
import API from "../api/axios.js";

const NOTICE_ACTIVITY_EVENT = "community-notice-activity";

interface MayyatDetails {
  deceasedName: string;
  relationName: string;
  age: string;
  jamaat: string;
  passedAwayAt: string;
  funeralPrayerAt: string;
  funeralPrayerPlace: string;
  burialPlace: string;
  notes: string;
}

interface Notice {
  id: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  type?: "notice" | "mayyat";
  mayyatDetails?: MayyatDetails;
  pinned?: boolean;
  reactions: number;
  reactionCounts?: Partial<Record<ReactionKind, number>>;
  shares: number;
  userReaction?: ReactionKind;
  hasShared?: boolean;
}

type Role = "super_admin" | "moderator" | "member" | "loading";
type ReactionKind = "heart" | "thumbs_up" | "correct" | "wrong";

interface AuthUser {
  role?: string;
}

function normalizeRole(role?: string): Role | undefined {
  if (role === "jamaat_admin") return "moderator";
  return role as Role | undefined;
}

const emptyMayyatDetails: MayyatDetails = {
  deceasedName: "",
  relationName: "",
  age: "",
  jamaat: "",
  passedAwayAt: "",
  funeralPrayerAt: "",
  funeralPrayerPlace: "",
  burialPlace: "",
  notes: "",
};

function buildMayyatBody(details: MayyatDetails): string {
  return [
    `Name: ${details.deceasedName.trim()}`,
    details.relationName.trim() ? `Relation: ${details.relationName.trim()}` : "",
    details.age.trim() ? `Age: ${details.age.trim()}` : "",
    details.jamaat.trim() ? `Jamaat: ${details.jamaat.trim()}` : "",
    details.passedAwayAt.trim() ? `Passed away: ${details.passedAwayAt.trim()}` : "",
    `Namaz-e-Janaza: ${details.funeralPrayerAt.trim()}`,
    `Janaza place: ${details.funeralPrayerPlace.trim()}`,
    details.burialPlace.trim() ? `Tadfeen/Qabrastan: ${details.burialPlace.trim()}` : "",
    details.notes.trim() ? `Notes: ${details.notes.trim()}` : "",
  ].filter(Boolean).join("\n");
}

function getReactionLabel(reaction: ReactionKind) {
  if (reaction === "heart") return "Heart";
  if (reaction === "thumbs_up") return "Thumbs up";
  if (reaction === "correct") return "Correct";
  return "Wrong";
}

function getReactionEmoji(reaction: ReactionKind) {
  if (reaction === "heart") return "❤️";
  if (reaction === "thumbs_up") return "👍";
  if (reaction === "correct") return "✅";
  return "❌";
}

function getNormalizedReactionCounts(notice: Notice): Record<ReactionKind, number> {
  return {
    heart: notice.reactionCounts?.heart ?? 0,
    thumbs_up: notice.reactionCounts?.thumbs_up ?? 0,
    correct: notice.reactionCounts?.correct ?? 0,
    wrong: notice.reactionCounts?.wrong ?? 0,
  };
}

const reactionOptions: ReactionKind[] = ["heart", "thumbs_up", "correct", "wrong"];

export default function NoticesPage() {
  const [role, setRole] = useState<Role>("loading");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoadingNotices, setIsLoadingNotices] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [noticeType, setNoticeType] = useState<"notice" | "mayyat">("notice");
  const [mayyatDetails, setMayyatDetails] = useState<MayyatDetails>(emptyMayyatDetails);
  const [pinned, setPinned] = useState(false);
  const [status, setStatus] = useState("");
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editNoticeType, setEditNoticeType] = useState<"notice" | "mayyat">("notice");
  const [editPinned, setEditPinned] = useState(false);

  const isAdminRole = role === "super_admin" || role === "moderator";
  const roleResolved = role !== "loading";

  const dispatchNoticeActivity = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(NOTICE_ACTIVITY_EVENT));
    }
  };

  const markNoticesReadForCurrentUser = async () => {
    try {
      await API.post("/notices/mark-read");
    } catch {
      // Keep the page usable even if the badge refresh cannot be persisted.
    } finally {
      dispatchNoticeActivity();
    }
  };

  const loadNotices = async () => {
    setIsLoadingNotices(true);
    try {
      const response = await API.get<{ success: boolean; notices: Notice[] }>("/notices/all");
      setNotices(Array.isArray(response.data?.notices) ? response.data.notices : []);
    } catch {
      setStatus("Unable to load notices right now.");
      setNotices([]);
    } finally {
      setIsLoadingNotices(false);
    }
  };

  useEffect(() => {
    const loadRole = async () => {
      try {
        const response = await API.get<{ success: boolean; user?: AuthUser }>("/auth/me");
        if (response.data.success && response.data.user?.role) {
          const nextRole = normalizeRole(response.data.user.role);
          setRole(nextRole === "super_admin" || nextRole === "moderator" ? nextRole : "member");
        } else {
          setRole("member");
        }
      } catch {
        setRole("member");
      }
    };

    void loadRole();
    void loadNotices();
  }, []);

  useEffect(() => {
    if (!roleResolved) return;

    void markNoticesReadForCurrentUser();
  }, [roleResolved]);

  const updateMayyatDetails = (field: keyof MayyatDetails, value: string) => {
    setMayyatDetails((current) => ({ ...current, [field]: value }));
  };

  const upsertNotice = (updatedNotice: Notice) => {
    setNotices((current) => {
      const index = current.findIndex((item) => item.id === updatedNotice.id);
      if (index === -1) return [updatedNotice, ...current];
      const cloned = [...current];
      cloned[index] = updatedNotice;
      return cloned;
    });
  };

  const handlePost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (noticeType === "mayyat") {
      if (!mayyatDetails.deceasedName.trim() || !mayyatDetails.funeralPrayerAt.trim() || !mayyatDetails.funeralPrayerPlace.trim()) {
        setStatus("Please add name, namaz-e-janaza time, and janaza place.");
        return;
      }
    } else if (!title.trim() || !body.trim()) {
      setStatus("Please add both a title and a message before posting.");
      return;
    }

    try {
      const mayyatBody = noticeType === "mayyat" ? buildMayyatBody(mayyatDetails) : "";
      const payload = {
        title: noticeType === "mayyat" ? `Mayyat: ${mayyatDetails.deceasedName.trim()}` : title.trim(),
        body: noticeType === "mayyat" ? mayyatBody : body.trim(),
        type: noticeType,
        mayyatDetails: noticeType === "mayyat" ? { ...mayyatDetails } : undefined,
        pinned,
      };

      const response = await API.post<{ success: boolean; notice: Notice }>("/notices/create", payload);
      if (response.data?.notice) {
        upsertNotice(response.data.notice);
      }

      setTitle("");
      setBody("");
      setNoticeType("notice");
      setMayyatDetails(emptyMayyatDetails);
      setPinned(false);
      setStatus(noticeType === "mayyat" ? "Mayyat notification has been published." : "Your notice has been published to the community feed.");
      await markNoticesReadForCurrentUser();
    } catch {
      setStatus("Unable to publish notice right now.");
    }
  };

  const handleReact = async (noticeId: string, reaction: ReactionKind) => {
    try {
      const response = await API.patch<{ success: boolean; notice: Notice }>(`/notices/${noticeId}/react`, { reaction });
      if (response.data?.notice) {
        upsertNotice(response.data.notice);
      }
    } catch {
      setStatus("Unable to save your reaction right now.");
    }
  };

  const handleTogglePin = async (notice: Notice) => {
    try {
      const response = await API.patch<{ success: boolean; notice: Notice }>(`/notices/${notice.id}/pin`, { pinned: !notice.pinned });
      if (response.data?.notice) {
        upsertNotice(response.data.notice);
      }
    } catch {
      setStatus("Unable to update pin right now.");
    }
  };

  const handleDelete = async (noticeId: string) => {
    try {
      await API.delete(`/notices/${noticeId}`);
      setNotices((current) => current.filter((item) => item.id !== noticeId));
      setStatus("Notice deleted.");
      dispatchNoticeActivity();
    } catch {
      setStatus("Unable to delete notice right now.");
    }
  };

  const startEdit = (notice: Notice) => {
    setEditingNoticeId(notice.id);
    setEditTitle(notice.title);
    setEditBody(notice.body);
    setEditNoticeType(notice.type ?? "notice");
    setEditPinned(Boolean(notice.pinned));
  };

  const cancelEdit = () => {
    setEditingNoticeId(null);
    setEditTitle("");
    setEditBody("");
    setEditNoticeType("notice");
    setEditPinned(false);
  };

  const saveEdit = async (noticeId: string) => {
    if (!editTitle.trim() || !editBody.trim()) {
      setStatus("Please add both a title and a message before saving.");
      return;
    }

    try {
      const response = await API.put<{ success: boolean; notice: Notice }>(`/notices/${noticeId}`, {
        title: editTitle.trim(),
        body: editBody.trim(),
        type: editNoticeType,
        pinned: editPinned,
      });

      if (response.data?.notice) {
        upsertNotice(response.data.notice);
      }

      cancelEdit();
      setStatus(editNoticeType === "mayyat" ? "Mayyat notification updated." : "Notice updated.");
    } catch {
      setStatus("Unable to update notice right now.");
    }
  };

  const handleShare = async (notice: Notice) => {
    try {
      const response = await API.post<{ success: boolean; notice: Notice }>(`/notices/${notice.id}/share`);
      if (response.data?.notice) {
        upsertNotice(response.data.notice);
      }

      const text = `${notice.type === "mayyat" ? "Mayyat Notification: " : ""}${notice.title}\n${notice.body}`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: notice.title,
            text,
            url: window.location.href,
          });
        } catch {
          // Ignore cancelled share action.
        }
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setStatus("Notice copied to clipboard.");
      }
    } catch {
      setStatus("Unable to share right now.");
    }
  };

  const noticeList = useMemo(() => notices, [notices]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="page-card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">Community Notices & Alerts</p>
        <h1 className="page-title mt-2 text-2xl">This channel is for important updates</h1>
        <p className="page-subtitle mt-2 max-w-2xl text-sm">
          {!roleResolved
            ? "Checking your access level for notices..."
            : isAdminRole
            ? "You can publish alerts and important announcements for the community."
            : "You are viewing in member mode. You can read updates, react to them, and share them with others."}
        </p>

        <div className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
          {role === "loading" ? "Checking access..." : isAdminRole ? "Admin access" : "Member access"}
        </div>
      </div>

      {!roleResolved ? (
        <div className="page-card p-4 text-sm text-slate-600">Checking access...</div>
      ) : isAdminRole ? (
        <div className="page-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="page-title text-xl">Post a notice or mayyat notification</h2>
              <p className="page-subtitle text-sm">Only super admins and moderators can publish updates for everyone in the community.</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">Admin only</span>
          </div>

          <form onSubmit={handlePost} className="mt-4 space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setNoticeType("notice")}
                className={`rounded-lg border px-4 py-3 text-left text-sm font-semibold transition ${
                  noticeType === "notice"
                    ? "border-blue-600 bg-blue-50 text-blue-800"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200"
                }`}
              >
                Regular notice
              </button>
              <button
                type="button"
                onClick={() => setNoticeType("mayyat")}
                className={`rounded-lg border px-4 py-3 text-left text-sm font-semibold transition ${
                  noticeType === "mayyat"
                    ? "border-slate-800 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                }`}
              >
                Mayyat notification
              </button>
            </div>
            {noticeType === "mayyat" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={mayyatDetails.deceasedName}
                  onChange={(event) => updateMayyatDetails("deceasedName", event.target.value)}
                  placeholder="Marhoom/marhooma ka naam"
                  className="form-input px-4 py-3"
                />
                <input
                  value={mayyatDetails.relationName}
                  onChange={(event) => updateMayyatDetails("relationName", event.target.value)}
                  placeholder="Walid/shohar ya family reference"
                  className="form-input px-4 py-3"
                />
                <input
                  value={mayyatDetails.age}
                  onChange={(event) => updateMayyatDetails("age", event.target.value)}
                  placeholder="Age"
                  className="form-input px-4 py-3"
                />
                <input
                  value={mayyatDetails.jamaat}
                  onChange={(event) => updateMayyatDetails("jamaat", event.target.value)}
                  placeholder="Jamaat / area"
                  className="form-input px-4 py-3"
                />
                <input
                  value={mayyatDetails.passedAwayAt}
                  onChange={(event) => updateMayyatDetails("passedAwayAt", event.target.value)}
                  placeholder="Inteqal date/time"
                  className="form-input px-4 py-3"
                />
                <input
                  value={mayyatDetails.funeralPrayerAt}
                  onChange={(event) => updateMayyatDetails("funeralPrayerAt", event.target.value)}
                  placeholder="Namaz-e-janaza date/time"
                  className="form-input px-4 py-3"
                />
                <input
                  value={mayyatDetails.funeralPrayerPlace}
                  onChange={(event) => updateMayyatDetails("funeralPrayerPlace", event.target.value)}
                  placeholder="Janaza place / masjid"
                  className="form-input px-4 py-3 sm:col-span-2"
                />
                <input
                  value={mayyatDetails.burialPlace}
                  onChange={(event) => updateMayyatDetails("burialPlace", event.target.value)}
                  placeholder="Tadfeen / qabrastan"
                  className="form-input px-4 py-3 sm:col-span-2"
                />
                <textarea
                  value={mayyatDetails.notes}
                  onChange={(event) => updateMayyatDetails("notes", event.target.value)}
                  rows={3}
                  placeholder="Extra notes / dua request"
                  className="form-input px-4 py-3 sm:col-span-2"
                />
              </div>
            ) : (
              <>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Notice title"
                  className="form-input px-4 py-3"
                />
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={4}
                  placeholder="Write the alert or announcement..."
                  className="form-input px-4 py-3"
                />
              </>
            )}
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={pinned} onChange={() => setPinned((current) => !current)} />
              Pin this notice to the top
            </label>
            <button type="submit" className="btn-primary rounded-lg px-4 py-2 font-semibold transition">
              {noticeType === "mayyat" ? "Publish mayyat notification" : "Publish notice"}
            </button>
          </form>

          {status ? <p className="mt-3 text-sm text-emerald-600">{status}</p> : null}
        </div>
      ) : (
        <div className="page-card p-4 text-sm text-slate-600">
          You are viewing in member mode. You can read updates, react to them, and share them with others.
        </div>
      )}

      <div className="space-y-3">
        {isLoadingNotices ? (
          <div className="page-card p-4 text-sm text-slate-600">Loading notices...</div>
        ) : noticeList.length === 0 ? (
          <div className="page-card p-4 text-sm text-slate-600">No notices available yet.</div>
        ) : null}

        {noticeList.map((notice) => {
          const isMayyat = notice.type === "mayyat";
          const mayyatRows = notice.mayyatDetails
            ? [
                ["Name", notice.mayyatDetails.deceasedName],
                ["Relation", notice.mayyatDetails.relationName],
                ["Age", notice.mayyatDetails.age],
                ["Jamaat", notice.mayyatDetails.jamaat],
                ["Inteqal", notice.mayyatDetails.passedAwayAt],
                ["Namaz-e-Janaza", notice.mayyatDetails.funeralPrayerAt],
                ["Janaza Place", notice.mayyatDetails.funeralPrayerPlace],
                ["Tadfeen/Qabrastan", notice.mayyatDetails.burialPlace],
                ["Notes", notice.mayyatDetails.notes],
              ].filter(([, value]) => String(value || "").trim())
            : [];
          const selectedReaction = notice.userReaction;
          const hasShared = Boolean(notice.hasShared);
          const reactionCounts = getNormalizedReactionCounts(notice);
          const visibleReactionCounts = reactionOptions.filter((reaction) => reactionCounts[reaction] > 0);

          return (
            <article
              key={notice.id}
              className={`page-card p-5 ${
                isMayyat ? "border-2 border-slate-800 bg-slate-50 shadow-[0_12px_35px_rgba(15,23,42,0.12)]" : ""
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {isMayyat ? (
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                        Mayyat Notification
                      </span>
                    ) : null}
                    <h3 className={`text-lg font-semibold ${isMayyat ? "text-slate-950" : "text-slate-800"}`}>{notice.title}</h3>
                    {notice.pinned ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Pinned</span> : null}
                  </div>
                  {isMayyat && mayyatRows.length > 0 ? (
                    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                      {mayyatRows.map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</dt>
                          <dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className={`mt-2 whitespace-pre-line text-sm leading-6 ${isMayyat ? "font-medium text-slate-900" : "text-slate-700"}`}>{notice.body}</p>
                  )}
                </div>
                <div className="text-sm text-slate-500">
                  <p>{notice.author}</p>
                  <p>{new Date(notice.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
                {!isMayyat ? (
                  <>
                    {reactionOptions.map((reaction) => (
                      <button
                        key={reaction}
                        type="button"
                        onClick={() => handleReact(notice.id, reaction)}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                          selectedReaction === reaction
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50"
                        }`}
                      >
                        <span className="text-base leading-none">{getReactionEmoji(reaction)}</span>
                        <span>{getReactionLabel(reaction)}</span>
                      </button>
                    ))}
                    {visibleReactionCounts.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2 px-1 text-sm font-medium text-slate-600">
                        {visibleReactionCounts.map((reaction) => (
                          <span key={reaction} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            <span>{getReactionEmoji(reaction)}</span>
                            <span>{reactionCounts[reaction]}</span>
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleShare(notice)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    hasShared ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-7M12 4v10m0-10 4 4m-4-4-4 4" />
                  </svg>
                  {hasShared ? "Shared" : "Share"} - {notice.shares}
                </button>
                {roleResolved && isAdminRole && !isMayyat ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleTogglePin(notice)}
                      className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m15 4 5 5-3 1-4 4v4l-2 2-2-6-6-2 2-2h4l4-4 1-3Z" />
                      </svg>
                      {notice.pinned ? "Unpin" : "Pin"}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(notice)}
                      className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14 7 3 3" />
                      </svg>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(notice.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V5h6v2" />
                      </svg>
                      Delete
                    </button>
                  </>
                ) : null}
              </div>

              {roleResolved && isAdminRole && editingNoticeId === notice.id ? (
                <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setEditNoticeType("notice")}
                      className={`rounded-lg border px-3 py-2 text-left text-sm font-semibold transition ${
                        editNoticeType === "notice"
                          ? "border-blue-600 bg-blue-50 text-blue-800"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-200"
                      }`}
                    >
                      Regular notice
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditNoticeType("mayyat")}
                      className={`rounded-lg border px-3 py-2 text-left text-sm font-semibold transition ${
                        editNoticeType === "mayyat"
                          ? "border-slate-800 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                      }`}
                    >
                      Mayyat notification
                    </button>
                  </div>
                  <input
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                    className="form-input px-3 py-2"
                    placeholder="Edit title"
                  />
                  <textarea
                    value={editBody}
                    onChange={(event) => setEditBody(event.target.value)}
                    rows={3}
                    className="form-input px-3 py-2"
                    placeholder="Edit message"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={editPinned} onChange={() => setEditPinned((current) => !current)} />
                    Pin this notice
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => saveEdit(notice.id)} className="btn-primary rounded-lg px-3 py-2 text-sm font-semibold">
                      Save
                    </button>
                    <button type="button" onClick={cancelEdit} className="btn-secondary rounded-lg px-3 py-2 text-sm font-semibold">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
