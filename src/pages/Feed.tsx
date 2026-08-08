import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import API from "../api/axios";
import UserAvatar from "../components/UserAvatar";
import Toast from "../components/Toast";

const feedTranslations: Record<string, string> = {
  feed_title: 'Community Feed',
  feed_subtitle: 'Post announcements, moments, photos, videos, and short discussions in one clean place.',
  posts: 'Posts',
  likes: 'Likes',
  comments: 'Comments',
  placeholder_share: 'What would you like to share today?',
};

const t = (key: string) => feedTranslations[key] || key;

interface MediaItem {
  url: string;
  type?: string;
}

interface ReplyItem {
  id: string;
  text: string;
  author: string;
  authorPhotoUrl?: string;
  replyTo?: string;
}

interface CommentItem {
  id: string;
  text: string;
  author: string;
  authorPhotoUrl?: string;
  replies?: ReplyItem[];
}

interface Post {
  _id: string;
  authorName: string;
  authorPhotoUrl?: string;
  text: string;
  media?: MediaItem[];
  createdAt: string;
  likes?: number;
  comments?: number;
  shares?: number;
  liked?: boolean;
  canDelete?: boolean;
  commentsList?: CommentItem[];
}

const MAX_POST_LENGTH = 1200;

interface CurrentUser {
  fullName?: string;
  profilePhotoUrl?: string;
  role?: string;
}

function normalizeRole(role?: string) {
  const normalized = (role || "").trim().toLowerCase();
  if (["admin", "moderator", "super_admin"].includes(normalized)) {
    return normalized;
  }
  return "member";
}

function formatPostDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function Feed() {
  const configuredApiBase = import.meta.env.VITE_API_URL || "https://backend.kutchicommunity.com";
  const apiOrigin = (() => {
    try {
      const fallbackOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
      return new URL(configuredApiBase, fallbackOrigin).origin;
    } catch {
      return "https://backend.kutchicommunity.com";
    }
  })();

  const getMediaUrl = (url: string) => {
    if (!url) return "";

    if (url.startsWith("http")) {
      try {
        const mediaUrl = new URL(url);

        if (mediaUrl.hostname === "localhost" || mediaUrl.hostname === "127.0.0.1") {
          return `${apiOrigin}${mediaUrl.pathname}${mediaUrl.search}`;
        }

        return mediaUrl.toString();
      } catch {
        return url;
      }
    }

    return url.startsWith("/") ? `${apiOrigin}${url}` : `${apiOrigin}/${url}`;
  };

  const [text, setText] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info"; isVisible: boolean }>({
    message: "",
    type: "success",
    isVisible: false,
  });

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type, isVisible: true });
  };
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentOpenForPost, setCommentOpenForPost] = useState<Record<string, boolean>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyOpenForComment, setReplyOpenForComment] = useState<Record<string, boolean>>({});
  const [replyTarget, setReplyTarget] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [openPostMenu, setOpenPostMenu] = useState<string | null>(null);
  const hasScrolledToTargetRef = useRef(false);

  const currentRole = normalizeRole(currentUser?.role);
  const canModeratePosts = currentRole === "super_admin" || currentRole === "moderator" || currentRole === "admin";
  const canCreatePosts = canModeratePosts;
  const isSuperAdmin = currentRole === "super_admin";
  const [viewMode, setViewMode] = useState<"all" | "mine">("all");
  const postTextLength = text.trim().length;
  const visiblePosts = viewMode === "mine" && currentUser?.fullName
    ? posts.filter((post) => post.authorName === currentUser.fullName)
    : posts;

  const feedStats = posts.reduce(
    (totals, post) => ({
      likes: totals.likes + (post.likes ?? 0),
      comments: totals.comments + (post.comments ?? 0),
      shares: totals.shares + (post.shares ?? 0),
    }),
    { likes: 0, comments: 0, shares: 0 }
  );

  const loadPosts = async (showSpinner = true) => {
    try {
      if (showSpinner) setFetching(true);
      setError("");
      const response = await API.get<Post[]>("/posts/all");
      setPosts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load posts.");
    } finally {
      if (showSpinner) setFetching(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  useEffect(() => {
    if (!fetching && posts.length > 0 && !hasScrolledToTargetRef.current) {
      const urlParams = new URLSearchParams(window.location.search);
      const targetPostId = urlParams.get("postId") || window.location.hash.replace("#post-", "");
      if (targetPostId) {
        hasScrolledToTargetRef.current = true;
        setTimeout(() => {
          const el = document.getElementById(`post-${targetPostId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ring-4", "ring-teal-500", "ring-offset-2");
            setTimeout(() => {
              el.classList.remove("ring-4", "ring-teal-500", "ring-offset-2");
            }, 3500);
          }
          if (window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }, 100);
      }
    }
  }, [fetching, posts]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadPosts(false);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    API.get<{ user?: CurrentUser }>("/auth/me")
      .then((response) => {
        if (!cancelled) setCurrentUser(response.data.user || null);
      })
      .catch(() => {
        if (!cancelled) setCurrentUser(null);
      });

    const refreshProfile = () => {
      API.get<{ user?: CurrentUser }>("/auth/me")
        .then((response) => setCurrentUser(response.data.user || null))
        .catch(() => setCurrentUser(null));
    };

    window.addEventListener("community-profile-updated", refreshProfile);

    return () => {
      cancelled = true;
      window.removeEventListener("community-profile-updated", refreshProfile);
    };
  }, []);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const slotsLeft = Math.max(0, 5 - selectedFiles.length);
    const filesToAdd = files.slice(0, slotsLeft);

    if (filesToAdd.length === 0) {
      setError("You can attach up to 5 media files.");
      event.target.value = "";
      return;
    }

    setSelectedFiles((current) => [...current, ...filesToAdd]);
    setPreviewUrls((current) => [...current, ...filesToAdd.map((file) => URL.createObjectURL(file))]);
    setError(files.length > filesToAdd.length ? "Only the first 5 media files were selected." : "");
    event.target.value = "";
  };

  const handleClearFiles = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((currentFiles) => currentFiles.filter((_, fileIndex) => fileIndex !== index));
    setPreviewUrls((currentPreviewUrls) => {
      const previewUrl = currentPreviewUrls[index];
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      return currentPreviewUrls.filter((_, fileIndex) => fileIndex !== index);
    });
  };

  const upsertPost = (updatedPost: Post) => {
    setPosts((currentPosts) => currentPosts.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
  };

  const handleLike = (postId: string) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post._id !== postId) return post;
        const willLike = !post.liked;
        const newLikes = willLike ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 1) - 1);
        return { ...post, liked: willLike, likes: newLikes };
      })
    );

    API.patch<Post>(`/posts/${postId}/like`)
      .then((response) => {
        if (response.data) upsertPost(response.data);
      })
      .catch((err: any) => {
        setPosts((currentPosts) =>
          currentPosts.map((post) => {
            if (post._id !== postId) return post;
            const willLike = !post.liked;
            const newLikes = willLike ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 1) - 1);
            return { ...post, liked: willLike, likes: newLikes };
          })
        );
        showToast(err.response?.data?.message || "Unable to update like.", "error");
      });
  };

  const handleCommentToggle = (postId: string) => {
    setCommentOpenForPost((current) => ({ ...current, [postId]: !current[postId] }));
  };

  const handleCommentSubmit = async (postId: string, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const draft = (commentDrafts[postId] || "").trim();
    if (!draft) return;

    setCommentDrafts((current) => ({ ...current, [postId]: "" }));

    const tempComment: CommentItem = {
      id: "temp-comment-" + Date.now(),
      text: draft,
      author: currentUser?.fullName || "You",
      authorPhotoUrl: currentUser?.profilePhotoUrl,
    };

    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post._id !== postId) return post;
        return {
          ...post,
          comments: (post.comments || 0) + 1,
          commentsList: [...(post.commentsList || []), tempComment],
        };
      })
    );
    showToast("Comment posted!", "success");

    try {
      const response = await API.post<Post>(`/posts/${postId}/comments`, { text: draft });
      upsertPost(response.data);
    } catch (err: any) {
      setPosts((currentPosts) =>
        currentPosts.map((post) => {
          if (post._id !== postId) return post;
          return {
            ...post,
            comments: Math.max(0, (post.comments || 1) - 1),
            commentsList: (post.commentsList || []).filter((c) => c.id !== tempComment.id),
          };
        })
      );
      showToast(err.response?.data?.message || "Unable to add comment.", "error");
    }
  };

  const handleReplySubmit = async (postId: string, commentId: string, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const replyKey = `${postId}-${commentId}`;
    const draft = (replyDrafts[replyKey] || "").trim();
    if (!draft) return;

    setReplyDrafts((current) => ({ ...current, [replyKey]: "" }));
    setReplyOpenForComment((current) => ({ ...current, [replyKey]: false }));
    setReplyTarget((current) => ({ ...current, [replyKey]: "" }));
    showToast("Reply posted!", "success");

    try {
      const response = await API.post<Post>(`/posts/${postId}/comments/${commentId}/replies`, { text: draft });
      upsertPost(response.data);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Unable to add reply.", "error");
    }
  };

  const handleShare = async (postId: string) => {
    setPosts((currentPosts) =>
      currentPosts.map((p) => (p._id === postId ? { ...p, shares: (p.shares || 0) + 1 } : p))
    );

    const shareUrl = `${window.location.origin}/feed#${postId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Community Post",
          text: "Check out this post from the community feed",
          url: shareUrl,
        });
        showToast("Post shared!", "success");
      } catch {
        // User closed native share sheet
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Post link copied to clipboard!", "success");
      } catch {
        showToast("Link copied!", "success");
      }
    }

    API.post<Post>(`/posts/${postId}/share`)
      .then((res) => {
        if (res.data) upsertPost(res.data);
      })
      .catch(() => {});
  };

  const handleDeletePost = async (postId: string) => {
    const postToDelete = posts.find((p) => p._id === postId);
    setOpenPostMenu(null);
    setPosts((currentPosts) => currentPosts.filter((post) => post._id !== postId));
    showToast("Post deleted", "success");

    try {
      await API.delete(`/posts/${postId}`);
    } catch (err: any) {
      if (postToDelete) {
        setPosts((currentPosts) => [postToDelete, ...currentPosts]);
      }
      showToast(err.response?.data?.message || "Unable to delete post.", "error");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (postTextLength > MAX_POST_LENGTH) {
      setError(`Post is too long. Please keep it under ${MAX_POST_LENGTH} characters.`);
      return;
    }

    if (!canCreatePosts) {
      setError("Only super admins and moderators can create posts.");
      return;
    }

    if (!text.trim() && selectedFiles.length === 0) {
      setError("Please enter text or choose a photo/video to post.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();

      if (text.trim()) {
        formData.append("text", text.trim());
      }

      selectedFiles.forEach((file) => {
        formData.append("media", file);
      });

      const response = await API.post<Post>("/posts/create", formData);
      setPosts((existing) => [response.data, ...existing]);
      setText("");
      handleClearFiles();
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* 1. Main Top Hero Header Banner (Colorful Green & Black Gradient) */}
      <section className="page-hero-banner relative overflow-hidden rounded-3xl border border-teal-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950/90 text-white shadow-2xl p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-300 border border-teal-500/30">
              <img src="/logo.png" alt="Logo" className="h-3.5 w-3.5 object-contain" />
              <span>COMMUNITY FEED</span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">Community Feed & Updates</h1>
            <p className="mt-1 max-w-2xl text-xs text-slate-300 leading-relaxed">Share announcements, moments, photos, videos, and discussions with community members.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-2 text-center backdrop-blur sm:min-w-80">
            <div className="rounded-xl bg-slate-900 px-3 py-2">
              <p className="text-base font-extrabold text-white">{posts.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Posts</p>
            </div>
            <div className="rounded-xl bg-slate-900 px-3 py-2">
              <p className="text-base font-extrabold text-teal-400">{feedStats.likes}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Likes</p>
            </div>
            <div className="rounded-xl bg-slate-900 px-3 py-2">
              <p className="text-base font-extrabold text-amber-400">{feedStats.comments}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Comments</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Distinct Create Post Section (Solid White Card) */}
      {canCreatePosts ? (
        <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Create a New Post</h2>
              <span className="text-xs text-slate-500 font-medium">(Nayi Post Likhein)</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex gap-3">
              <UserAvatar name={currentUser?.fullName || "Me"} photoUrl={currentUser?.profilePhotoUrl} size="md" />
              <div className="min-w-0 flex-1">
                <div className="overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-950/90 transition focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20">
                  <textarea
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    rows={3}
                    maxLength={MAX_POST_LENGTH + 50}
                    placeholder={t('placeholder_share')}
                    className="min-h-24 w-full resize-y border-0 bg-transparent p-4 text-xs leading-relaxed text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-t border-slate-200 dark:border-slate-800 px-3 py-2.5 sm:px-4 sm:py-3 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-slate-800 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-600 dark:text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.6-4.6a2 2 0 0 1 2.8 0L16 16m-2-2 1.6-1.6a2 2 0 0 1 2.8 0L20 14m-2-8h.01M5 20h14a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1Z" />
                        </svg>
                        <span>Media</span>
                        <input type="file" accept="image/*,video/*" multiple onChange={handleFileChange} className="hidden" />
                      </label>
                      {selectedFiles.length > 0 ? (
                        <button
                          type="button"
                          onClick={handleClearFiles}
                          className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        >
                          Clear ({selectedFiles.length})
                        </button>
                      ) : null}
                      <span className={`text-[11px] font-bold sm:hidden ml-auto ${postTextLength > MAX_POST_LENGTH ? "text-rose-600" : "text-slate-500"}`}>
                        {postTextLength}/{MAX_POST_LENGTH}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800/60">
                      <span className={`hidden sm:inline text-xs font-bold ${postTextLength > MAX_POST_LENGTH ? "text-rose-600" : "text-slate-500"}`}>
                        {postTextLength}/{MAX_POST_LENGTH}
                      </span>
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-teal-600 hover:bg-teal-500 !text-white inline-flex w-full sm:w-auto min-w-20 items-center justify-center rounded-xl px-4 py-2 sm:py-2.5 text-xs font-extrabold transition shadow-md shadow-teal-600/30 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                      >
                        <span className="!text-white font-extrabold">{loading ? "Posting..." : "Post"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {previewUrls.length > 0 ? (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                        {selectedFiles.length} media selected
                      </p>
                      <p className="text-xs text-slate-400">Maximum 5 files</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {previewUrls.map((previewUrl, index) => {
                        const file = selectedFiles[index];
                        const isVideo = file?.type?.startsWith("video/");

                        return (
                          <div key={previewUrl} className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(index)}
                              className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-lg bg-slate-900/90 text-lg font-semibold leading-none text-white transition hover:bg-slate-900 border border-slate-700"
                              aria-label={`Remove selected media ${index + 1}`}
                            >
                              x
                            </button>
                            {isVideo ? (
                              <video controls src={previewUrl} className="aspect-video w-full object-cover" />
                            ) : (
                              <img src={previewUrl} alt="Selected preview" className="aspect-video w-full object-cover" />
                            )}
                            <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2">
                              <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-300">{file?.name || "Selected media"}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {error ? (
                  <div className="mt-4 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-xs font-bold text-rose-700 dark:text-rose-300">
                    {error}
                  </div>
                ) : null}
              </div>
            </div>
          </form>
        </section>
      ) : (
        <section className="rounded-3xl border border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-slate-900/90 p-5 sm:p-6 shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-2xl border border-amber-400/30 shrink-0">
              📢
            </div>
            <div>
              <h3 className="text-base font-black text-amber-800 dark:text-amber-300">
                Posting will be available soon for members
              </h3>
              <p className="mt-1 text-xs text-amber-900 dark:text-slate-300 font-serif leading-relaxed">
                تمام ممبران کے لیے پوسٹ کرنے کا آپشن جلد دستیاب ہو گا۔ فی الحال آپ ایڈمن پوسٹس دیکھ سکتے ہیں، کمنٹ اور لائک کر سکتے ہیں۔
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Latest Posts</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Recent activity from members and admins.</p>
          </div>
          {canModeratePosts ? (
            <div className="inline-flex rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode("all")}
                className={`rounded-lg px-3.5 py-2 text-xs sm:text-sm font-extrabold transition ${
                  viewMode === "all"
                    ? "bg-teal-600 !text-white shadow-md shadow-teal-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                All posts
              </button>
              <button
                type="button"
                onClick={() => setViewMode("mine")}
                className={`rounded-lg px-3.5 py-2 text-xs sm:text-sm font-extrabold transition ${
                  viewMode === "mine"
                    ? "bg-teal-600 !text-white shadow-md shadow-teal-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                My posts
              </button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => void loadPosts()}
            disabled={fetching}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${fetching ? "animate-spin text-teal-500" : "text-slate-400"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 11a8 8 0 1 0-2.34 5.66M20 11V5m0 6h-6" />
            </svg>
            {fetching ? "Refreshing" : "Refresh"}
          </button>
        </div>

        {fetching && posts.length === 0 ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm">
                <div className="flex animate-pulse gap-3">
                  <div className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-slate-800" />
                  <div className="flex-1 space-y-3">
                    <div className="h-3 w-36 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 px-6 py-12 text-center shadow-xl">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5v14" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">No posts yet</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Be the first to start the community conversation.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visiblePosts.map((post) => {
              const comments = post.commentsList || [];
              const totalEngagement = (post.likes ?? 0) + (post.comments ?? 0) + (post.shares ?? 0);

              return (
                <article key={post._id} id={`post-${post._id}`} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white shadow-xl transition-all duration-300">
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex min-w-0 items-center gap-2.5 flex-1">
                        <UserAvatar name={post.authorName} photoUrl={post.authorPhotoUrl} size="md" className="shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-extrabold text-slate-950 dark:text-white leading-snug">{post.authorName || "Community member"}</p>
                          <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 leading-tight truncate">
                            {formatPostDate(post.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-400">
                          {totalEngagement} <span className="hidden sm:inline">interactions</span>
                        </div>
                        {post.canDelete && (isSuperAdmin || (canModeratePosts && post.authorName === currentUser?.fullName)) ? (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenPostMenu((current) => (current === post._id ? null : post._id))}
                              className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                              aria-label="Post actions"
                              aria-haspopup="menu"
                              aria-expanded={openPostMenu === post._id}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="5" r="1.8" />
                                <circle cx="12" cy="12" r="1.8" />
                                <circle cx="12" cy="19" r="1.8" />
                              </svg>
                            </button>
                            {openPostMenu === post._id ? (
                              <div className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1 shadow-2xl" role="menu">
                                <button
                                  type="button"
                                  onClick={() => handleDeletePost(post._id)}
                                  className="block w-full px-3 py-2 text-left text-sm font-semibold text-rose-600 dark:text-rose-400 transition hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                  role="menuitem"
                                >
                                  Delete post
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {post.text ? <p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-slate-800 dark:text-slate-200 break-words [overflow-wrap:anywhere]">{post.text}</p> : null}

                    {post.media && post.media.length > 0 ? (
                      <div className={`mt-4 grid gap-3 ${post.media.length === 1 ? "grid-cols-1" : "sm:grid-cols-2"}`}>
                        {post.media.map((item, index) => {
                          const isVideo = (item.type || "").startsWith("video/");
                          const mediaUrl = getMediaUrl(item.url);

                          return (
                            <div key={`${post._id}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                              {isVideo ? (
                                <video controls src={mediaUrl} className="max-h-[420px] w-full bg-black object-contain" />
                              ) : (
                                <img src={mediaUrl} alt="Post media" className="max-h-[420px] w-full object-cover" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                    <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3 sm:pt-4">
                      <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleLike(post._id)}
                          className={`inline-flex items-center justify-center gap-1 sm:gap-2 rounded-xl px-2 py-2 sm:px-3.5 font-extrabold text-xs transition cursor-pointer border ${
                            post.liked
                              ? "active-green-btn bg-teal-600 !text-white border-teal-600 shadow-md shadow-teal-600/30"
                              : "bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill={post.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6.4-4.35-8.2-8.16C2.5 10.14 3.5 7 6.3 6.1c1.7-.5 3.5.2 4.7 1.8 1.2-1.6 3-2.3 4.7-1.8 2.8.9 3.8 4.04 2.5 6.74C18.4 16.65 12 21 12 21Z" />
                          </svg>
                          <span className="hidden sm:inline">Like</span>
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs font-black shrink-0 ${
                            post.liked ? "bg-white/20 !text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                          }`}>
                            {post.likes ?? 0}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCommentToggle(post._id)}
                          className={`inline-flex items-center justify-center gap-1 sm:gap-2 rounded-xl px-2 py-2 sm:px-3.5 font-extrabold text-xs transition cursor-pointer border ${
                            commentOpenForPost[post._id]
                              ? "active-green-btn bg-teal-600 !text-white border-teal-600 shadow-md shadow-teal-600/30"
                              : "bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m-7 4h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
                          </svg>
                          <span className="hidden sm:inline">Comment</span>
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs font-black shrink-0 ${
                            commentOpenForPost[post._id] ? "bg-white/20 !text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                          }`}>
                            {post.comments ?? 0}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShare(post._id)}
                          className="inline-flex items-center justify-center gap-1 sm:gap-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 px-2 py-2 sm:px-3.5 font-extrabold text-xs text-slate-800 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 100-5.999 3 3 0 000 5.999zm0 11.998a3 3 0 100-5.999 3 3 0 000 5.999z" />
                          </svg>
                          <span className="hidden sm:inline">Share</span>
                          <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] sm:text-xs font-black text-slate-800 dark:text-slate-200 shrink-0">
                            {post.shares ?? 0}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {commentOpenForPost[post._id] ? (
                    <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/90 p-5">
                      {comments.length > 0 ? (
                        <div className="space-y-3">
                          {comments.map((comment, cIndex) => {
                            const commentId = comment.id || (comment as any)._id || `comment-${cIndex}`;
                            const replyKey = `${post._id}-${commentId}`;

                            return (
                              <div key={commentId} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-sm">
                                <div className="flex items-start gap-3">
                                  <UserAvatar name={comment.author} photoUrl={comment.authorPhotoUrl} size="sm" />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <span className="text-sm font-black text-slate-900 dark:text-white">{comment.author}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReplyOpenForComment((current) => ({ ...current, [replyKey]: !current[replyKey] }));
                                          setReplyTarget((current) => ({ ...current, [replyKey]: comment.author }));
                                        }}
                                        className="rounded-md px-2 py-1 text-xs font-bold text-teal-700 dark:text-teal-400 transition hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer"
                                      >
                                        Reply
                                      </button>
                                    </div>
                                    <p className="mt-1 text-sm leading-6 text-slate-800 dark:text-slate-300">{comment.text}</p>

                                    {(comment.replies || []).length > 0 ? (
                                      <div className="mt-3 space-y-2 border-l-2 border-teal-500/30 pl-3">
                                        {comment.replies?.map((reply, rIndex) => (
                                          <div key={reply.id || (reply as any)._id || `reply-${rIndex}`} className="flex gap-2 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-300">
                                            <UserAvatar name={reply.author} photoUrl={reply.authorPhotoUrl} size="sm" />
                                            <div className="min-w-0">
                                              <span className="font-black text-slate-900 dark:text-white">{reply.author}</span>
                                              {reply.replyTo ? <span className="ml-1 text-slate-500 dark:text-slate-400">replying to {reply.replyTo}</span> : null}
                                              <p className="mt-1 leading-6 text-slate-800 dark:text-slate-300">{reply.text}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : null}

                                    {replyOpenForComment[replyKey] ? (
                                      <form onSubmit={(event) => handleReplySubmit(post._id, comment.id, event)} className="mt-3 flex flex-col gap-2 sm:flex-row">
                                        <input
                                          value={replyDrafts[replyKey] || ""}
                                          onChange={(event) =>
                                            setReplyDrafts((current) => ({
                                              ...current,
                                              [replyKey]: event.target.value,
                                            }))
                                          }
                                          placeholder={`Reply to ${replyTarget[replyKey] || comment.author}...`}
                                          className="form-input rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 transition"
                                        />
                                        <button type="submit" className="btn-primary rounded-xl px-4 py-2 text-sm font-bold transition cursor-pointer">
                                          Reply
                                        </button>
                                      </form>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-5 text-center text-sm font-bold text-slate-600 dark:text-slate-400">
                          No comments yet. Add the first one.
                        </p>
                      )}

                      <form onSubmit={(event) => handleCommentSubmit(post._id, event)} className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <input
                          value={commentDrafts[post._id] || ""}
                          onChange={(event) => setCommentDrafts((current) => ({ ...current, [post._id]: event.target.value }))}
                          placeholder="Write a thoughtful comment..."
                          className="form-input rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 transition"
                        />
                        <button type="submit" className="btn-primary rounded-xl px-5 py-3 text-sm font-bold transition cursor-pointer">
                          Comment
                        </button>
                      </form>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
