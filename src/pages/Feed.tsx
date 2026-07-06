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

export default function Feed() {
  const getMediaUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${url}`;
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
  const [persistedPosts, setPersistedPosts] = useState<Post[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem("community-feed-posts");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [currentUserName, setCurrentUserName] = useState(() => {
    if (typeof window === "undefined") return "You";
    try {
      return window.localStorage.getItem("userName") || window.localStorage.getItem("fullName") || "You";
    } catch {
      return "You";
    }
  });

  const loadPosts = async () => {
    try {
      setFetching(true);
      setError("");
      const response = await API.get<Post[]>("/posts/all");
      const savedPosts = persistedPosts.length > 0 ? persistedPosts : [];
      const mergedPosts = response.data.map((post) => {
        const existing = savedPosts.find((item) => item._id === post._id);
        return {
          ...post,
          likes: existing?.likes ?? post.likes ?? 0,
          shares: existing?.shares ?? post.shares ?? 0,
          comments: existing?.comments ?? post.comments ?? 0,
          liked: existing?.liked ?? post.liked ?? false,
          commentsList: existing?.commentsList ?? post.commentsList ?? [],
        };
      });
      const finalPosts = [...mergedPosts, ...savedPosts.filter((saved) => !mergedPosts.some((post) => post._id === saved._id))];
      setPosts(finalPosts);
      setPersistedPosts(finalPosts);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("community-feed-posts", JSON.stringify(finalPosts));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load posts.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    const nextFiles = [...selectedFiles, ...files].slice(0, 5);
    const nextPreviewUrls = [...previewUrls, ...files.map((file) => URL.createObjectURL(file))].slice(0, 5);

    setSelectedFiles(nextFiles);
    setPreviewUrls(nextPreviewUrls);
    event.target.value = "";
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

  const updatePost = (postId: string, updater: (post: Post) => Post) => {
    setPosts((currentPosts) => {
      const updatedPosts = currentPosts.map((post) => (post._id === postId ? updater(post) : post));
      setPersistedPosts(updatedPosts);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("community-feed-posts", JSON.stringify(updatedPosts));
      }
      return updatedPosts;
    });
  };

  const handleLike = (postId: string) => {
    updatePost(postId, (post) => ({
      ...post,
      liked: !post.liked,
      likes: Math.max(0, (post.likes ?? 0) + (post.liked ? -1 : 1)),
    }));
  };

  const handleCommentToggle = (postId: string) => {
    setCommentOpenForPost((current) => ({ ...current, [postId]: !current[postId] }));
  };

  const handleCommentSubmit = (postId: string, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const draft = (commentDrafts[postId] || "").trim();
    if (!draft) return;

    updatePost(postId, (post) => ({
      ...post,
      comments: (post.comments ?? 0) + 1,
      commentsList: [
        ...(post.commentsList || []),
        { id: `${postId}-${Date.now()}`, text: draft, author: currentUserName || "You" },
      ],
    }));
    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
  };

  const handleReplySubmit = (postId: string, commentId: string, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const draft = (replyDrafts[`${postId}-${commentId}`] || "").trim();
    if (!draft) return;

    updatePost(postId, (post) => ({
      ...post,
      commentsList: (post.commentsList || []).map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              replies: [
                ...(comment.replies || []),
                {
                  id: `${commentId}-${Date.now()}`,
                  text: draft,
                  author: currentUserName || "You",
                  replyTo: comment.author,
                },
              ],
            }
          : comment
      ),
    }));

    setReplyDrafts((current) => ({ ...current, [`${postId}-${commentId}`]: "" }));
    setReplyOpenForComment((current) => ({ ...current, [`${postId}-${commentId}`]: false }));
    setReplyTarget((current) => ({ ...current, [`${postId}-${commentId}`]: "" }));
  };

  const handleShare = async (postId: string) => {
    updatePost(postId, (post) => ({ ...post, shares: (post.shares ?? 0) + 1 }));

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Community post",
          text: "Check out this post from the community feed",
          url: window.location.href,
        });
      } catch {
        // Ignore share cancellation
      }
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

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

      setPosts((existing) => {
        const nextPosts = [response.data, ...existing];
        setPersistedPosts(nextPosts);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("community-feed-posts", JSON.stringify(nextPosts));
        }
        return nextPosts;
      });
      setText("");
      setSelectedFiles([]);
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setPreviewUrls([]);
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-semibold text-gray-800">Create New Post</h1>
        <p className="text-sm text-gray-500 mt-1">Share text, photos, or videos with the community.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Share your update..."
            className="w-full rounded-lg border border-gray-300 p-4 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />

          <label className="inline-flex cursor-pointer items-center rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50">
            Add photo/video
            <input type="file" accept="image/*,video/*" multiple onChange={handleFileChange} className="hidden" />
          </label>

          {previewUrls.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {previewUrls.map((previewUrl, index) => {
                const file = selectedFiles[index];
                const isVideo = file?.type?.startsWith("video/");

                return (
                  <div key={previewUrl} className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-lg font-semibold text-white transition hover:bg-black/80"
                      aria-label={`Remove selected media ${index + 1}`}
                    >
                      ×
                    </button>
                    {isVideo ? (
                      <video controls src={previewUrl} className="h-48 w-full object-cover" />
                    ) : (
                      <img src={previewUrl} alt="Selected preview" className="h-48 w-full object-cover" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </form>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Community Feed</h2>
          {fetching && <span className="text-sm text-gray-500">Loading...</span>}
        </div>

        {posts.length === 0 && !fetching ? (
          <div className="mt-6 text-center text-gray-500">No posts yet. Be the first to share!</div>
        ) : (
          <div className="mt-6 space-y-4">
            {posts.map((post) => (
              <article key={post._id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-3 text-sm text-gray-500">
                  <span>By: {post.authorName}</span>
                  <span>{new Date(post.createdAt).toLocaleString()}</span>
                </div>
                {post.text ? <p className="mt-3 whitespace-pre-line text-gray-800">{post.text}</p> : null}
                {post.media && post.media.length > 0 ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {post.media.map((item, index) => {
                      const isVideo = (item.type || "").startsWith("video/");
                      return (
                        <div key={`${post._id}-${index}`} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                          {isVideo ? (
                            <video controls src={getMediaUrl(item.url)} className="h-48 w-full object-cover" />
                          ) : (
                            <img src={getMediaUrl(item.url)} alt="Post media" className="h-48 w-full object-cover" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                <div className="mt-4 border-t border-gray-200 pt-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => handleLike(post._id)}
                      className={`flex items-center gap-2 rounded-full px-3 py-2 transition ${post.liked ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 21s-6.4-4.35-8.2-8.16C2.5 10.14 3.5 7 6.3 6.1c1.7-.5 3.5.2 4.7 1.8 1.2-1.6 3-2.3 4.7-1.8 2.8.9 3.8 4.04 2.5 6.74C18.4 16.65 12 21 12 21Z" />
                      </svg>
                      <span>{post.likes ?? 0}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCommentToggle(post._id)}
                      className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-gray-600 transition hover:bg-gray-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m-7 4h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
                      </svg>
                      <span>{post.comments ?? 0}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShare(post._id)}
                      className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-gray-600 transition hover:bg-gray-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 14v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3M12 4v10m0 0 3-3m-3 3-3-3" />
                      </svg>
                      <span>{post.shares ?? 0}</span>
                    </button>
                  </div>

                  {commentOpenForPost[post._id] && (
                    <div className="mt-3 rounded-lg bg-white p-3">
                      {(post.commentsList || []).length > 0 && (
                        <div className="space-y-2">
                          {post.commentsList?.map((comment) => (
                            <div key={comment.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-gray-800">{comment.author}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const key = `${post._id}-${comment.id}`;
                                    setReplyOpenForComment((current) => ({ ...current, [key]: !current[key] }));
                                    setReplyTarget((current) => ({ ...current, [key]: comment.author }));
                                  }}
                                  className="text-xs font-medium text-blue-600 hover:underline"
                                >
                                  Reply
                                </button>
                              </div>
                              <p className="mt-1 text-sm text-gray-700">{comment.text}</p>

                              {(comment.replies || []).length > 0 && (
                                <div className="mt-2 space-y-2 border-l-2 border-blue-100 pl-3">
                                  {comment.replies?.map((reply) => (
                                    <div key={reply.id} className="rounded-md bg-white px-2 py-2 text-sm text-gray-700">
                                      <span className="font-semibold text-gray-800">{reply.author}</span>
                                      {reply.replyTo ? <span className="ml-1 text-gray-500">replying to {reply.replyTo}</span> : null}
                                      <p className="mt-1">{reply.text}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {replyOpenForComment[`${post._id}-${comment.id}`] && (
                                <form
                                  onSubmit={(event) => handleReplySubmit(post._id, comment.id, event)}
                                  className="mt-2 flex flex-col gap-2 sm:flex-row"
                                >
                                  <input
                                    value={replyDrafts[`${post._id}-${comment.id}`] || ""}
                                    onChange={(event) =>
                                      setReplyDrafts((current) => ({
                                        ...current,
                                        [`${post._id}-${comment.id}`]: event.target.value,
                                      }))
                                    }
                                    placeholder={`Reply to ${replyTarget[`${post._id}-${comment.id}`] || comment.author}...`}
                                    className="w-full rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
                                  />
                                  <button type="submit" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
                                    Reply
                                  </button>
                                </form>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <form onSubmit={(event) => handleCommentSubmit(post._id, event)} className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <input
                          value={commentDrafts[post._id] || ""}
                          onChange={(event) =>
                            setCommentDrafts((current) => ({ ...current, [post._id]: event.target.value }))
                          }
                          placeholder="Write a comment..."
                          className="w-full rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
                        />
                        <button type="submit" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
                          Comment
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
