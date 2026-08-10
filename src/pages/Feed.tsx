import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import API from "../api/axios";
import UserAvatar from "../components/UserAvatar";
import Toast from "../components/Toast";
import SEO from "../components/SEO";
import ConfirmModal from "../components/ConfirmModal";

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
  canDelete?: boolean;
}

interface CommentItem {
  id: string;
  text: string;
  author: string;
  authorPhotoUrl?: string;
  canDelete?: boolean;
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
  hasShared?: boolean;
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
  const [postSuccess, setPostSuccess] = useState("");
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
  const [repliesOpenForComment, setRepliesOpenForComment] = useState<Record<string, boolean>>({});
  const [replyTarget, setReplyTarget] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [openPostMenu, setOpenPostMenu] = useState<string | null>(null);
  const [postToDeleteConfirm, setPostToDeleteConfirm] = useState<Post | null>(null);
  const [openCommentMenu, setOpenCommentMenu] = useState<string | null>(null);
  const [itemToDeleteConfirm, setItemToDeleteConfirm] = useState<{
    postId: string;
    commentId: string;
    replyId?: string;
    isReply?: boolean;
    title: string;
    message: string;
  } | null>(null);
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
      const nextPosts = response.data || [];
      setPosts((currentPosts) => {
        if (currentPosts.length === nextPosts.length) {
          const isIdentical = currentPosts.every((post, index) => {
            const next = nextPosts[index];
            return (
              next &&
              post._id === next._id &&
              post.likes === next.likes &&
              post.comments === next.comments &&
              post.liked === next.liked &&
              post.text === next.text
            );
          });
          if (isIdentical) return currentPosts;
        }
        return nextPosts;
      });
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
      if (typeof document !== "undefined" && document.hidden) return;
      void loadPosts(false);
    }, 15000);

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

    const targetUser = replyTarget[replyKey] || "";

    setReplyDrafts((current) => ({ ...current, [replyKey]: "" }));
    setReplyOpenForComment((current) => ({ ...current, [replyKey]: false }));
    setRepliesOpenForComment((current) => ({ ...current, [replyKey]: true }));
    setReplyTarget((current) => ({ ...current, [replyKey]: "" }));
    showToast("Reply posted!", "success");

    try {
      const response = await API.post<Post>(`/posts/${postId}/comments/${commentId}/replies`, {
        text: draft,
        replyTo: targetUser,
      });
      upsertPost(response.data);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Unable to add reply.", "error");
    }
  };

  const handleShare = async (postId: string) => {
    const targetPost = posts.find((p) => p._id === postId);
    const alreadyShared = Boolean(targetPost?.hasShared);

    if (!alreadyShared) {
      setPosts((currentPosts) =>
        currentPosts.map((p) => (p._id === postId ? { ...p, shares: (p.shares || 0) + 1, hasShared: true } : p))
      );
    }

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

  const handleDeletePost = (postId: string) => {
    const post = posts.find((p) => p._id === postId);
    setOpenPostMenu(null);
    if (post) setPostToDeleteConfirm(post);
  };

  const confirmDeletePost = async () => {
    if (!postToDeleteConfirm) return;
    const postId = postToDeleteConfirm._id;
    const postBackup = postToDeleteConfirm;
    setPostToDeleteConfirm(null);

    setPosts((currentPosts) => currentPosts.filter((post) => post._id !== postId));
    showToast("Post deleted", "success");

    try {
      await API.delete(`/posts/${postId}`);
    } catch (err: any) {
      if (postBackup) {
        setPosts((currentPosts) => [postBackup, ...currentPosts]);
      }
      showToast(err.response?.data?.message || "Unable to delete post.", "error");
    }
  };

  const confirmDeleteItem = async () => {
    if (!itemToDeleteConfirm) return;
    const { postId, commentId, replyId, isReply } = itemToDeleteConfirm;
    setItemToDeleteConfirm(null);
    setOpenCommentMenu(null);

    if (isReply && replyId) {
      showToast("Reply deleted", "success");
      try {
        const res = await API.delete<Post>(`/posts/${postId}/comments/${commentId}/replies/${replyId}`);
        upsertPost(res.data);
      } catch (err: any) {
        showToast(err.response?.data?.message || "Unable to delete reply.", "error");
      }
    } else {
      showToast("Comment deleted", "success");
      try {
        const res = await API.delete<Post>(`/posts/${postId}/comments/${commentId}`);
        upsertPost(res.data);
      } catch (err: any) {
        showToast(err.response?.data?.message || "Unable to delete comment.", "error");
      }
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setPostSuccess("");

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
      setPostSuccess("Post created successfully!");
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <SEO pageKey="feed" />
      {/* 1. Main Top Hero Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 text-white shadow-xl p-6 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white border border-white/30 backdrop-blur-md">
              <img src="/logo.png" alt="Logo" className="h-4 w-4 object-contain brightness-200" />
              <span>COMMUNITY FEED</span>
            </div>
            <h1 className="mt-2.5 text-2xl sm:text-3xl font-black text-white tracking-tight">Community Feed & Updates</h1>
            <p className="mt-1.5 max-w-2xl text-xs sm:text-sm font-medium text-teal-50 leading-relaxed">Share announcements, moments, photos, videos, and discussions with community members.</p>
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 rounded-2xl border border-white/30 bg-white/20 p-1.5 sm:p-2.5 text-center backdrop-blur-md min-w-0 w-full lg:w-auto lg:min-w-[320px]">
            <div className="rounded-xl bg-white px-1 py-2 sm:p-3 shadow-sm min-w-0 flex flex-col items-center justify-center">
              <p className="text-base sm:text-lg font-black text-slate-900 truncate">{posts.length}</p>
              <p className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-tight sm:tracking-wider text-slate-500 mt-0.5 truncate w-full">Posts</p>
            </div>
            <div className="rounded-xl bg-white px-1 py-2 sm:p-3 shadow-sm min-w-0 flex flex-col items-center justify-center">
              <p className="text-base sm:text-lg font-black text-teal-600 truncate">{feedStats.likes}</p>
              <p className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-tight sm:tracking-wider text-slate-500 mt-0.5 truncate w-full">Likes</p>
            </div>
            <div className="rounded-xl bg-white px-1 py-2 sm:p-3 shadow-sm min-w-0 flex flex-col items-center justify-center">
              <p className="text-base sm:text-lg font-black text-amber-600 truncate">{feedStats.comments}</p>
              <p className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-tight sm:tracking-wider text-slate-500 mt-0.5 truncate w-full">Comments</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Distinct Create Post Section (Solid White Card) */}
      {canCreatePosts ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-lg shrink-0">✨</span>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
                <h2 className="text-xs sm:text-sm font-black text-slate-900">Create a New Post</h2>
                <span className="text-[11px] sm:text-xs text-slate-500 font-semibold">(Nayi Post Likhein)</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex gap-3">
              <UserAvatar name={currentUser?.fullName || "Me"} photoUrl={currentUser?.profilePhotoUrl} size="md" />
              <div className="min-w-0 flex-1">
                <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white transition focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20">
                  <textarea
                    value={text}
                    onChange={(event) => {
                      setText(event.target.value);
                      if (postSuccess) setPostSuccess("");
                      if (error) setError("");
                    }}
                    rows={3}
                    maxLength={MAX_POST_LENGTH + 50}
                    placeholder={t('placeholder_share')}
                    className="min-h-24 w-full resize-y border-0 bg-transparent p-4 text-xs leading-relaxed text-slate-900 outline-none placeholder:text-slate-500"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-t border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 bg-slate-50">
                    <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-teal-500 hover:bg-teal-50 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.6-4.6a2 2 0 0 1 2.8 0L16 16m-2-2 1.6-1.6a2 2 0 0 1 2.8 0L20 14m-2-8h.01M5 20h14a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1Z" />
                        </svg>
                        <span>Media</span>
                        <input type="file" accept="image/*,video/*" multiple onChange={handleFileChange} className="hidden" />
                      </label>
                      {selectedFiles.length > 0 ? (
                        <button
                          type="button"
                          onClick={handleClearFiles}
                          className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                        >
                          Clear ({selectedFiles.length})
                        </button>
                      ) : null}
                      <span className={`text-[11px] font-bold sm:hidden ml-auto ${postTextLength > MAX_POST_LENGTH ? "text-rose-600" : "text-slate-500"}`}>
                        {postTextLength}/{MAX_POST_LENGTH}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
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
                      <p className="text-xs text-slate-500">Maximum 5 files</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {previewUrls.map((previewUrl, index) => {
                        const file = selectedFiles[index];
                        const isVideo = file?.type?.startsWith("video/");

                        return (
                          <div key={previewUrl} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(index)}
                              className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-lg bg-white text-lg font-semibold leading-none text-white transition hover:bg-white border border-slate-200"
                              aria-label={`Remove selected media ${index + 1}`}
                            >
                              x
                            </button>
                            {isVideo ? (
                              <video controls src={previewUrl} className="aspect-video w-full object-cover" />
                            ) : (
                              <img src={previewUrl} alt="Selected preview" className="aspect-video w-full object-cover" />
                            )}
                            <div className="border-t border-slate-200 bg-white px-3 py-2">
                              <p className="truncate text-xs font-semibold text-slate-800">{file?.name || "Selected media"}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {postSuccess ? (
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">✅</span>
                      <span>{postSuccess}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPostSuccess("")}
                      className="text-emerald-700 hover:text-emerald-900 font-extrabold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ) : null}

                {error ? (
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">⚠️</span>
                      <span>{error}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setError("")}
                      className="text-rose-600 hover:text-rose-800 font-extrabold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </form>
        </section>
      ) : (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:p-6 shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-2xl border border-amber-400/30 shrink-0">
              📢
            </div>
            <div>
              <h3 className="text-base font-black text-amber-800">
                Posting will be available soon for members
              </h3>
              <p className="mt-1 text-xs text-amber-900 font-serif leading-relaxed">
                تمام ممبران کے لیے پوسٹ کرنے کا آپشن جلد دستیاب ہو گا۔ فی الحال آپ ایڈمن پوسٹس دیکھ سکتے ہیں، کمنٹ اور لائک کر سکتے ہیں۔
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">Latest Posts</h2>
            <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500">Recent activity from members and admins.</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {canModeratePosts ? (
              <div className="flex flex-1 sm:flex-none items-center rounded-xl border border-slate-300 bg-slate-100 p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setViewMode("all")}
                  className={`flex-1 sm:flex-initial rounded-lg px-3.5 py-2 text-xs sm:text-sm font-black transition cursor-pointer text-center ${
                    viewMode === "all"
                      ? "bg-teal-600 !text-white shadow-md shadow-teal-600/30"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All Posts
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("mine")}
                  className={`flex-1 sm:flex-initial rounded-lg px-3.5 py-2 text-xs sm:text-sm font-black transition cursor-pointer text-center ${
                    viewMode === "mine"
                      ? "bg-teal-600 !text-white shadow-md shadow-teal-600/30"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  My Posts
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void loadPosts()}
              disabled={fetching}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-extrabold text-slate-700 shadow-sm transition hover:border-teal-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${fetching ? "animate-spin text-teal-500" : "text-slate-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 11a8 8 0 1 0-2.34 5.66M20 11V5m0 6h-6" />
              </svg>
              <span>{fetching ? "Refreshing" : "Refresh"}</span>
            </button>
          </div>
        </div>

        {fetching && posts.length === 0 ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex animate-pulse gap-3">
                  <div className="h-11 w-11 rounded-xl bg-slate-200" />
                  <div className="flex-1 space-y-3">
                    <div className="h-3 w-36 rounded bg-slate-200" />
                    <div className="h-3 w-full rounded bg-slate-200" />
                    <div className="h-3 w-2/3 rounded bg-slate-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-xl">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-teal-500/20 text-teal-600 border border-teal-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5v14" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-black text-slate-900">No posts yet</h3>
            <p className="mt-1 text-sm text-slate-500">Be the first to start the community conversation.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visiblePosts.map((post) => {
              const comments = post.commentsList || [];
              const totalEngagement = (post.likes ?? 0) + (post.comments ?? 0) + (post.shares ?? 0);

              return (
                <article key={post._id} id={`post-${post._id}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl transition-all duration-300">
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex min-w-0 items-center gap-2.5 flex-1">
                        <UserAvatar name={post.authorName} photoUrl={post.authorPhotoUrl} size="md" className="shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-extrabold text-slate-950 leading-snug">{post.authorName || "Community member"}</p>
                          <p className="text-[11px] font-semibold text-slate-600 leading-tight truncate">
                            {formatPostDate(post.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="rounded-full bg-slate-100 border border-slate-300 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-bold text-slate-700">
                          {totalEngagement} <span className="hidden sm:inline">interactions</span>
                        </div>
                        {post.canDelete && (isSuperAdmin || (canModeratePosts && post.authorName === currentUser?.fullName)) ? (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenPostMenu((current) => (current === post._id ? null : post._id))}
                              className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
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
                              <div className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-2xl" role="menu">
                                <button
                                  type="button"
                                  onClick={() => handleDeletePost(post._id)}
                                  className="block w-full px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50 cursor-pointer"
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

                    {post.text ? <p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-slate-800 break-words [overflow-wrap:anywhere]">{post.text}</p> : null}

                    {post.media && post.media.length > 0 ? (
                      <div className={`mt-4 grid gap-3 ${post.media.length === 1 ? "grid-cols-1" : "sm:grid-cols-2"}`}>
                        {post.media.map((item, index) => {
                          const isVideo = (item.type || "").startsWith("video/");
                          const mediaUrl = getMediaUrl(item.url);

                          return (
                            <div key={`${post._id}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
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

                    <div className="mt-4 border-t border-slate-200 pt-3 sm:pt-4">
                      <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleLike(post._id)}
                          className={`inline-flex items-center justify-center gap-1 sm:gap-2 rounded-xl px-2 py-2 sm:px-3.5 font-extrabold text-xs transition cursor-pointer border ${
                            post.liked
                              ? "active-green-btn bg-teal-600 !text-white border-teal-600 shadow-md shadow-teal-600/30"
                              : "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill={post.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6.4-4.35-8.2-8.16C2.5 10.14 3.5 7 6.3 6.1c1.7-.5 3.5.2 4.7 1.8 1.2-1.6 3-2.3 4.7-1.8 2.8.9 3.8 4.04 2.5 6.74C18.4 16.65 12 21 12 21Z" />
                          </svg>
                          <span className="hidden sm:inline">Like</span>
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs font-black shrink-0 ${
                            post.liked ? "bg-white/20 !text-white" : "bg-slate-200 text-slate-800"
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
                              : "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m-7 4h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
                          </svg>
                          <span className="hidden sm:inline">Comment</span>
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs font-black shrink-0 ${
                            commentOpenForPost[post._id] ? "bg-white/20 !text-white" : "bg-slate-200 text-slate-800"
                          }`}>
                            {post.comments ?? 0}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShare(post._id)}
                          className="inline-flex items-center justify-center gap-1 sm:gap-2 rounded-xl bg-slate-100 border border-slate-300 px-2 py-2 sm:px-3.5 font-extrabold text-xs text-slate-800 transition hover:bg-slate-200 cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 100-5.999 3 3 0 000 5.999zm0 11.998a3 3 0 100-5.999 3 3 0 000 5.999z" />
                          </svg>
                          <span className="hidden sm:inline">Share</span>
                          <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] sm:text-xs font-black text-slate-800 shrink-0">
                            {post.shares ?? 0}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {commentOpenForPost[post._id] ? (
                    <div className="border-t border-slate-200 bg-slate-50/80 p-5">
                      {comments.length > 0 ? (
                        <div className="space-y-3">
                          {comments.map((comment, cIndex) => {
                            const commentId = comment.id || (comment as any)._id || `comment-${cIndex}`;
                            const replyKey = `${post._id}-${commentId}`;
                               return (
                                <div key={commentId} className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm min-w-0 w-full">
                                  <div className="flex items-start gap-2.5 sm:gap-3">
                                    <UserAvatar name={comment.author} photoUrl={comment.authorPhotoUrl} size="sm" className="shrink-0 mt-0.5" />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-2 min-w-0">
                                        <span className="text-xs sm:text-sm font-black text-slate-900 truncate">{comment.author}</span>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setReplyOpenForComment((current) => ({ ...current, [replyKey]: !current[replyKey] }));
                                              setReplyTarget((current) => ({ ...current, [replyKey]: comment.author }));
                                            }}
                                            className="rounded-md px-2 py-0.5 text-xs font-bold text-teal-700 transition hover:bg-teal-50 cursor-pointer"
                                          >
                                            Reply
                                          </button>
                                          {(comment.canDelete ?? (isSuperAdmin || (canModeratePosts && comment.author === currentUser?.fullName) || comment.author === currentUser?.fullName)) ? (
                                            <div className="relative">
                                              <button
                                                type="button"
                                                onClick={() => setOpenCommentMenu((current) => (current === commentId ? null : commentId))}
                                                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                                                title="Options"
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                                  <circle cx="12" cy="5" r="1.8" />
                                                  <circle cx="12" cy="12" r="1.8" />
                                                  <circle cx="12" cy="19" r="1.8" />
                                                </svg>
                                              </button>
                                              {openCommentMenu === commentId ? (
                                                <div className="absolute right-0 top-8 z-20 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      setOpenCommentMenu(null);
                                                      setItemToDeleteConfirm({
                                                        postId: post._id,
                                                        commentId: comment.id,
                                                        isReply: false,
                                                        title: "Delete Comment",
                                                        message: "Are you sure you want to delete this comment? This action cannot be undone.",
                                                      });
                                                    }}
                                                    className="block w-full px-3 py-1.5 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50 cursor-pointer"
                                                  >
                                                    Delete comment
                                                  </button>
                                                </div>
                                              ) : null}
                                            </div>
                                          ) : null}
                                        </div>
                                      </div>
                                      <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-800 break-words whitespace-pre-wrap">{comment.text}</p>

                                      {(comment.replies || []).length > 0 ? (
                                        <div className="mt-2.5 pt-1 pl-2 sm:pl-3.5 border-l-2 border-teal-500/40 space-y-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setRepliesOpenForComment((current) => ({
                                                ...current,
                                                [replyKey]: !current[replyKey],
                                              }))
                                            }
                                            className="inline-flex items-center gap-1.5 text-xs font-black text-teal-700 hover:text-teal-800 transition cursor-pointer py-1"
                                          >
                                            <span>
                                              {repliesOpenForComment[replyKey]
                                                ? "Hide replies ▲"
                                                : `Show ${comment.replies?.length} ${comment.replies?.length === 1 ? "reply" : "replies"} ▾`}
                                            </span>
                                          </button>

                                          {repliesOpenForComment[replyKey] ? (
                                            <div className="mt-2 space-y-2">
                                              {comment.replies?.map((reply, rIndex) => {
                                                const replyMenuKey = `reply-${commentId}-${reply.id || rIndex}`;
                                                return (
                                                  <div key={reply.id || (reply as any)._id || `reply-${rIndex}`} className="flex gap-2 rounded-xl bg-slate-100/90 border border-slate-200/90 p-2 sm:px-3 sm:py-2.5 text-xs sm:text-sm text-slate-800 min-w-0 w-full">
                                                    <UserAvatar name={reply.author} photoUrl={reply.authorPhotoUrl} size="sm" className="shrink-0 mt-0.5" />
                                                    <div className="min-w-0 flex-1">
                                                      <div className="flex items-center justify-between gap-1 min-w-0">
                                                        <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden whitespace-nowrap">
                                                          <span className="font-black text-slate-900 text-[10px] sm:text-xs shrink-0">{reply.author}</span>
                                                          {reply.replyTo ? (
                                                            <span className="text-[10px] sm:text-xs text-slate-500 font-semibold truncate shrink">
                                                              ↳ <strong className="text-teal-700 font-bold">{reply.replyTo}</strong>
                                                            </span>
                                                          ) : null}
                                                        </div>
                                                        <div className="flex items-center gap-0.5 shrink-0">
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              setReplyOpenForComment((current) => ({ ...current, [replyKey]: true }));
                                                              setReplyTarget((current) => ({ ...current, [replyKey]: reply.author }));
                                                            }}
                                                            className="rounded-md px-1.5 py-0.5 text-[10px] sm:text-xs font-bold text-teal-700 transition hover:bg-teal-200/60 cursor-pointer"
                                                          >
                                                            Reply
                                                          </button>
                                                          {(reply.canDelete ?? (isSuperAdmin || (canModeratePosts && reply.author === currentUser?.fullName) || reply.author === currentUser?.fullName)) ? (
                                                            <div className="relative">
                                                              <button
                                                                type="button"
                                                                onClick={() => setOpenCommentMenu((current) => (current === replyMenuKey ? null : replyMenuKey))}
                                                                className="grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
                                                                title="Options"
                                                              >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                                                                  <circle cx="12" cy="5" r="1.8" />
                                                                  <circle cx="12" cy="12" r="1.8" />
                                                                  <circle cx="12" cy="19" r="1.8" />
                                                                </svg>
                                                              </button>
                                                              {openCommentMenu === replyMenuKey ? (
                                                                <div className="absolute right-0 top-7 z-20 w-32 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                                                                  <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                      setOpenCommentMenu(null);
                                                                      setItemToDeleteConfirm({
                                                                        postId: post._id,
                                                                        commentId: comment.id,
                                                                        replyId: reply.id,
                                                                        isReply: true,
                                                                        title: "Delete Reply",
                                                                        message: "Are you sure you want to delete this reply? This action cannot be undone.",
                                                                      });
                                                                    }}
                                                                    className="block w-full px-3 py-1.5 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50 cursor-pointer"
                                                                  >
                                                                    Delete reply
                                                                  </button>
                                                                </div>
                                                              ) : null}
                                                            </div>
                                                          ) : null}
                                                        </div>
                                                      </div>
                                                      <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-800 break-words whitespace-pre-wrap font-normal">{reply.text}</p>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          ) : null}
                                        </div>
                                      ) : null}

                                      {replyOpenForComment[replyKey] ? (
                                        <form onSubmit={(event) => handleReplySubmit(post._id, comment.id, event)} className="mt-3 relative flex items-center">
                                          <input
                                            value={replyDrafts[replyKey] || ""}
                                            onChange={(event) =>
                                              setReplyDrafts((current) => ({
                                                ...current,
                                                [replyKey]: event.target.value,
                                              }))
                                            }
                                            placeholder={`Reply to ${replyTarget[replyKey] || comment.author}...`}
                                            className="w-full rounded-xl border border-slate-300 bg-white pl-3.5 pr-10 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
                                          />
                                          <button
                                            type="submit"
                                            disabled={!replyDrafts[replyKey]?.trim()}
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white shadow-xs hover:bg-teal-500 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                            title="Send Reply"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L18 12M12 6L18 12L12 18" />
                                            </svg>
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
                        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-sm font-bold text-slate-600">
                          No comments yet. Add the first one.
                        </p>
                      )}

                      <form onSubmit={(event) => handleCommentSubmit(post._id, event)} className="mt-4 relative flex items-center">
                        <input
                          value={commentDrafts[post._id] || ""}
                          onChange={(event) => setCommentDrafts((current) => ({ ...current, [post._id]: event.target.value }))}
                          placeholder="Write a thoughtful comment..."
                          className="w-full rounded-2xl border border-slate-300 bg-white pl-4 pr-12 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
                        />
                        <button
                          type="submit"
                          disabled={!commentDrafts[post._id]?.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/30 hover:bg-teal-500 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          title="Send Comment"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L18 12M12 6L18 12L12 18" />
                          </svg>
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

      <ConfirmModal
        isOpen={Boolean(postToDeleteConfirm)}
        title="Delete Community Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete Post"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeletePost}
        onCancel={() => setPostToDeleteConfirm(null)}
      />

      <ConfirmModal
        isOpen={Boolean(itemToDeleteConfirm)}
        title={itemToDeleteConfirm?.title || "Delete Item"}
        message={itemToDeleteConfirm?.message || "Are you sure you want to delete this item?"}
        confirmText={itemToDeleteConfirm?.isReply ? "Delete Reply" : "Delete Comment"}
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeleteItem}
        onCancel={() => setItemToDeleteConfirm(null)}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
