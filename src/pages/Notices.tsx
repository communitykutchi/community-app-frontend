import { useEffect, useState, type FormEvent } from "react";
import API from "../api/axios.js";

interface Notice {
  id: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  pinned?: boolean;
  reactions: number;
  shares: number;
}

type Role = "super_admin" | "jamaat_admin" | "member" | "loading";

const starterNotices: Notice[] = [
  {
    id: "notice-1",
    title: "Community meeting this Sunday",
    body: "Please join us at 6:00 PM at the community hall for the weekly update and planning session.",
    author: "Admin",
    createdAt: "2026-07-04T09:00:00.000Z",
    pinned: true,
    reactions: 12,
    shares: 3,
  },
  {
    id: "notice-2",
    title: "Road closure notice",
    body: "The main road near the mosque will be temporarily closed on Friday morning for maintenance.",
    author: "Admin",
    createdAt: "2026-07-03T18:30:00.000Z",
    reactions: 8,
    shares: 1,
  },
];

function getStoredNotices(): Notice[] {
  if (typeof window === "undefined") return starterNotices;
  try {
    const stored = window.localStorage.getItem("community-notices");
    return stored ? JSON.parse(stored) : starterNotices;
  } catch {
    return starterNotices;
  }
}

export default function NoticesPage() {
  const [role, setRole] = useState<Role>("loading");
  const [notices, setNotices] = useState<Notice[]>(getStoredNotices);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [status, setStatus] = useState("");
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editPinned, setEditPinned] = useState(false);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const response = await API.get<{ success: boolean; user?: { role?: string } }>('/auth/me');
        if (response.data.success && response.data.user?.role) {
          const nextRole = response.data.user.role as Role;
          setRole(nextRole === 'super_admin' || nextRole === 'jamaat_admin' ? nextRole : 'member');
        } else {
          setRole('member');
        }
      } catch {
        setRole('member');
      }
    };

    void loadRole();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("community-notices", JSON.stringify(notices));
    }
  }, [notices]);

  const isAdminRole = role === "super_admin" || role === "jamaat_admin";

  const handlePost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !body.trim()) {
      setStatus("Please add both a title and a message before posting.");
      return;
    }

    const newNotice: Notice = {
      id: `notice-${Date.now()}`,
      title: title.trim(),
      body: body.trim(),
      author: "Admin",
      createdAt: new Date().toISOString(),
      pinned,
      reactions: 0,
      shares: 0,
    };

    setNotices((current) => [newNotice, ...current]);
    setTitle("");
    setBody("");
    setPinned(false);
    setStatus("Your notice has been published to the community feed.");
  };

  const handleReact = (noticeId: string) => {
    setNotices((current) => current.map((item) => (item.id === noticeId ? { ...item, reactions: item.reactions + 1 } : item)));
  };

  const handleTogglePin = (noticeId: string) => {
    setNotices((current) => current.map((item) => (item.id === noticeId ? { ...item, pinned: !item.pinned } : item)));
  };

  const handleDelete = (noticeId: string) => {
    setNotices((current) => current.filter((item) => item.id !== noticeId));
    setStatus("Notice deleted.");
  };

  const startEdit = (notice: Notice) => {
    setEditingNoticeId(notice.id);
    setEditTitle(notice.title);
    setEditBody(notice.body);
    setEditPinned(Boolean(notice.pinned));
  };

  const cancelEdit = () => {
    setEditingNoticeId(null);
    setEditTitle("");
    setEditBody("");
    setEditPinned(false);
  };

  const saveEdit = (noticeId: string) => {
    if (!editTitle.trim() || !editBody.trim()) {
      setStatus("Please add both a title and a message before saving.");
      return;
    }

    setNotices((current) => current.map((item) => (item.id === noticeId ? { ...item, title: editTitle.trim(), body: editBody.trim(), pinned: editPinned } : item)));
    cancelEdit();
    setStatus("Notice updated.");
  };

  const handleShare = async (notice: Notice) => {
    const text = `${notice.title}\n${notice.body}`;
    setNotices((current) => current.map((item) => (item.id === notice.id ? { ...item, shares: item.shares + 1 } : item)));

    if (navigator.share) {
      try {
        await navigator.share({
          title: notice.title,
          text,
          url: window.location.href,
        });
      } catch {
        // Ignore cancelled share actions.
      }
      return;
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setStatus("Notice copied to clipboard.");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-100">Community Notices & Alerts</p>
        <h1 className="mt-2 text-2xl font-semibold">This channel is for important updates</h1>
        <p className="mt-2 max-w-2xl text-sm text-blue-50">
          {isAdminRole
            ? "You can publish alerts and important announcements for the community."
            : "You are viewing in member mode. You can read updates, react to them, and share them with others."}
        </p>

        <div className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-2 text-sm font-semibold text-blue-50">
          {role === "loading" ? "Checking access..." : isAdminRole ? "Admin access" : "Member access"}
        </div>
      </div>

      {isAdminRole ? (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Post a new notice</h2>
              <p className="text-sm text-gray-500">Admins can publish updates for everyone in the community.</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">Admin only</span>
          </div>

          <form onSubmit={handlePost} className="mt-4 space-y-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Notice title"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={4}
              placeholder="Write the alert or announcement..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={pinned} onChange={() => setPinned((current) => !current)} />
              Pin this notice to the top
            </label>
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700">
              Publish notice
            </button>
          </form>

          {status ? <p className="mt-3 text-sm text-emerald-600">{status}</p> : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
          You are viewing in member mode. You can read updates, react to them, and share them with others.
        </div>
      )}

      <div className="space-y-3">
        {notices.map((notice) => (
          <article key={notice.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-800">{notice.title}</h3>
                  {notice.pinned ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Pinned</span> : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-700">{notice.body}</p>
              </div>
              <div className="text-sm text-gray-500">
                <p>{notice.author}</p>
                <p>{new Date(notice.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleReact(notice.id)}
                className="rounded-full bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
              >
                👍 React · {notice.reactions}
              </button>
              <button
                type="button"
                onClick={() => handleShare(notice)}
                className="rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
              >
                Share · {notice.shares}
              </button>
              {isAdminRole ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleTogglePin(notice.id)}
                    className="rounded-full bg-amber-100 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-200"
                  >
                    {notice.pinned ? "📌 Unpin" : "📌 Pin"}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(notice)}
                    className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-200"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(notice.id)}
                    className="rounded-full bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-200"
                  >
                    🗑️ Delete
                  </button>
                </>
              ) : null}
            </div>

            {isAdminRole && editingNoticeId === notice.id ? (
              <div className="mt-4 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <input
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700"
                  placeholder="Edit title"
                />
                <textarea
                  value={editBody}
                  onChange={(event) => setEditBody(event.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700"
                  placeholder="Edit message"
                />
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={editPinned} onChange={() => setEditPinned((current) => !current)} />
                  Pin this notice
                </label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => saveEdit(notice.id)} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">
                    Save
                  </button>
                  <button type="button" onClick={cancelEdit} className="rounded-lg bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-700">
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
