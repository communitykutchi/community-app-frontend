import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import API from "../api/axios.js";

interface MediaItem {
  url: string;
  type?: string;
}

interface ReplyItem {
  id: string;
  text: string;
  author: string;
  replyTo?: string;
}

interface CommentItem {
  id: string;
  text: string;
  author: string;
  replies?: ReplyItem[];
}

interface Post {
  _id: string;
  authorName: string;
  text: string;
  media?: MediaItem[];
  createdAt: string;
  likes?: number;
  comments?: number;
  shares?: number;
  liked?: boolean;
  commentsList?: CommentItem[];
}

const MAX_POST_LENGTH = 1200;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
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
  const configuredApiBase = import.meta.env.VITE_API_URL || "https://community-app-backend-wrb0.onrender.com";
  const apiOrigin = (() => {
    try {
      const fallbackOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
      return new URL(configuredApiBase, fallbackOrigin).origin;
    } catch {
      return "https://community-app-backend-wrb0.onrender.com";
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentOpenForPost, setCommentOpenForPost] = useState<Record<string, boolean>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyOpenForComment, setReplyOpenForComment] = useState<Record<string, boolean>>({});
  const [replyTarget, setReplyTarget] = useState<Record<string, string>>({});

  const postTextLength = text.trim().length;
  const feedStats = posts.reduce(
    (totals, post) => ({
      likes: totals.likes + (post.likes ?? 0),
      comments: totals.comments + (post.comments ?? 0),
      shares: totals.shares + (post.shares ?? 0),
    }),
    { likes: 0, comments: 0, shares: 0 }
  );

  const loadPosts = async () => {
    try {
      setFetching(true);
      setError("");
      const response = await API.get<Post[]>("/posts/all");
      setPosts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load posts.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    void loadPosts();
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

  const handleLike = async (postId: string) => {
    try {
      const response = await API.patch<Post>(`/posts/${postId}/like`);
      upsertPost(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to update like.");
    }
  };

  const handleCommentToggle = (postId: string) => {
    setCommentOpenForPost((current) => ({ ...current, [postId]: !current[postId] }));
  };

  const handleCommentSubmit = async (postId: string, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const draft = (commentDrafts[postId] || "").trim();
    if (!draft) return;

    try {
      const response = await API.post<Post>(`/posts/${postId}/comments`, { text: draft });
      upsertPost(response.data);
      setCommentDrafts((current) => ({ ...current, [postId]: "" }));
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to add comment.");
    }
  };

  const handleReplySubmit = async (postId: string, commentId: string, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const replyKey = `${postId}-${commentId}`;
    const draft = (replyDrafts[replyKey] || "").trim();
    if (!draft) return;

    try {
      const response = await API.post<Post>(`/posts/${postId}/comments/${commentId}/replies`, { text: draft });
      upsertPost(response.data);
      setReplyDrafts((current) => ({ ...current, [replyKey]: "" }));
      setReplyOpenForComment((current) => ({ ...current, [replyKey]: false }));
      setReplyTarget((current) => ({ ...current, [replyKey]: "" }));
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to add reply.");
    }
  };

  const handleShare = async (postId: string) => {
    try {
      const response = await API.post<Post>(`/posts/${postId}/share`);
      upsertPost(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to share post.");
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Community post",
          text: "Check out this post from the community feed",
          url: window.location.href,
        });
      } catch {
        // Ignore share cancellation.
      }
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (postTextLength > MAX_POST_LENGTH) {
      setError(`Post is too long. Please keep it under ${MAX_POST_LENGTH} characters.`);
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
      <section className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_18px_55px_-38px_rgba(15,23,42,0.75)]">
        <div className="border-b border-slate-200 bg-slate-950 px-5 py-5 text-white sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Community Feed</p>
              <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Share updates with the community</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Post announcements, moments, photos, videos, and short discussions in one clean place.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/10 p-2 text-center backdrop-blur sm:min-w-80">
              <div className="rounded-lg bg-white/10 px-3 py-2">
                <p className="text-lg font-black">{posts.length}</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-300">Posts</p>
              </div>
              <div className="rounded-lg bg-white/10 px-3 py-2">
                <p className="text-lg font-black">{feedStats.likes}</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-300">Likes</p>
              </div>
              <div className="rounded-lg bg-white/10 px-3 py-2">
                <p className="text-lg font-black">{feedStats.comments}</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-300">Comments</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6">
          <div className="flex gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-sm font-black text-blue-700">
              ME
            </div>
            <div className="min-w-0 flex-1">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]">
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  rows={4}
                  maxLength={MAX_POST_LENGTH + 50}
                  placeholder="What would you like to share today?"
                  className="min-h-32 w-full resize-y border-0 bg-transparent p-4 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400"
                />
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.6-4.6a2 2 0 0 1 2.8 0L16 16m-2-2 1.6-1.6a2 2 0 0 1 2.8 0L20 14m-2-8h.01M5 20h14a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1Z" />
                      </svg>
                      Media
                      <input type="file" accept="image/*,video/*" multiple onChange={handleFileChange} className="hidden" />
                    </label>
                    {selectedFiles.length > 0 ? (
                      <button
                        type="button"
                        onClick={handleClearFiles}
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
                      >
                        Clear media
                      </button>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold ${postTextLength > MAX_POST_LENGTH ? "text-red-600" : "text-slate-400"}`}>
                      {postTextLength}/{MAX_POST_LENGTH}
                    </span>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary inline-flex min-w-24 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? "Posting..." : "Post"}
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
                        <div key={previewUrl} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-lg bg-slate-950/80 text-lg font-semibold leading-none text-white transition hover:bg-slate-950"
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
                            <p className="truncate text-xs font-semibold text-slate-600">{file?.name || "Selected media"}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}
            </div>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="page-title text-xl">Latest Posts</h2>
            <p className="page-subtitle mt-1 text-sm">Recent activity from members and admins.</p>
          </div>
          <button
            type="button"
            onClick={loadPosts}
            disabled={fetching}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 11a8 8 0 1 0-2.34 5.66M20 11V5m0 6h-6" />
            </svg>
            {fetching ? "Refreshing" : "Refresh"}
          </button>
        </div>

        {fetching && posts.length === 0 ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex animate-pulse gap-3">
                  <div className="h-11 w-11 rounded-xl bg-slate-200" />
                  <div className="flex-1 space-y-3">
                    <div className="h-3 w-36 rounded bg-slate-200" />
                    <div className="h-3 w-full rounded bg-slate-100" />
                    <div className="h-3 w-2/3 rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5v14" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-black text-slate-900">No posts yet</h3>
            <p className="mt-1 text-sm text-slate-500">Be the first to start the community conversation.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const comments = post.commentsList || [];
              const totalEngagement = (post.likes ?? 0) + (post.comments ?? 0) + (post.shares ?? 0);

              return (
                <article key={post._id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_14px_35px_-30px_rgba(15,23,42,0.7)]">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-900 text-sm font-black text-white">
                          {getInitials(post.authorName)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-900">{post.authorName || "Community member"}</p>
                          <p className="text-xs font-medium text-slate-500">{formatPostDate(post.createdAt)}</p>
                        </div>
                      </div>
                      <div className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
                        {totalEngagement} interactions
                      </div>
                    </div>

                    {post.text ? <p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-slate-800">{post.text}</p> : null}

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

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <button
                          type="button"
                          onClick={() => handleLike(post._id)}
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 font-bold transition ${
                            post.liked ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill={post.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6.4-4.35-8.2-8.16C2.5 10.14 3.5 7 6.3 6.1c1.7-.5 3.5.2 4.7 1.8 1.2-1.6 3-2.3 4.7-1.8 2.8.9 3.8 4.04 2.5 6.74C18.4 16.65 12 21 12 21Z" />
                          </svg>
                          Like
                          <span className="rounded-full bg-white px-1.5 py-0.5 text-xs">{post.likes ?? 0}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCommentToggle(post._id)}
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 font-bold transition ${
                            commentOpenForPost[post._id] ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m-7 4h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
                          </svg>
                          Comment
                          <span className="rounded-full bg-white/90 px-1.5 py-0.5 text-xs text-slate-700">{post.comments ?? 0}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShare(post._id)}
                          className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 font-bold text-slate-600 transition hover:bg-slate-100"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 14v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3M12 4v10m0 0 3-3m-3 3-3-3" />
                          </svg>
                          Share
                          <span className="rounded-full bg-white px-1.5 py-0.5 text-xs">{post.shares ?? 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {commentOpenForPost[post._id] ? (
                    <div className="border-t border-slate-100 bg-slate-50 p-5">
                      {comments.length > 0 ? (
                        <div className="space-y-3">
                          {comments.map((comment) => {
                            const replyKey = `${post._id}-${comment.id}`;

                            return (
                              <div key={comment.id} className="rounded-xl border border-slate-200 bg-white p-3">
                                <div className="flex items-start gap-3">
                                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-xs font-black text-blue-700">
                                    {getInitials(comment.author)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <span className="text-sm font-black text-slate-900">{comment.author}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReplyOpenForComment((current) => ({ ...current, [replyKey]: !current[replyKey] }));
                                          setReplyTarget((current) => ({ ...current, [replyKey]: comment.author }));
                                        }}
                                        className="rounded-md px-2 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
                                      >
                                        Reply
                                      </button>
                                    </div>
                                    <p className="mt-1 text-sm leading-6 text-slate-700">{comment.text}</p>

                                    {(comment.replies || []).length > 0 ? (
                                      <div className="mt-3 space-y-2 border-l-2 border-blue-100 pl-3">
                                        {comment.replies?.map((reply) => (
                                          <div key={reply.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                            <span className="font-black text-slate-900">{reply.author}</span>
                                            {reply.replyTo ? <span className="ml-1 text-slate-500">replying to {reply.replyTo}</span> : null}
                                            <p className="mt-1 leading-6">{reply.text}</p>
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
                                          className="form-input rounded-lg px-4 py-2 text-sm"
                                        />
                                        <button type="submit" className="btn-primary rounded-lg px-4 py-2 text-sm font-bold transition">
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
                        <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-5 text-center text-sm text-slate-500">
                          No comments yet. Add the first one.
                        </p>
                      )}

                      <form onSubmit={(event) => handleCommentSubmit(post._id, event)} className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <input
                          value={commentDrafts[post._id] || ""}
                          onChange={(event) => setCommentDrafts((current) => ({ ...current, [post._id]: event.target.value }))}
                          placeholder="Write a thoughtful comment..."
                          className="form-input rounded-lg px-4 py-3 text-sm"
                        />
                        <button type="submit" className="btn-primary rounded-lg px-5 py-3 text-sm font-bold transition">
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
    </div>
  );
}
