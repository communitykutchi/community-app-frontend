import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import API from "../api/axios.js";
import UserAvatar from "../components/UserAvatar.js";
const MAX_POST_LENGTH = 1200;
function normalizeRole(role) {
    if (role === "jamaat_admin")
        return "moderator";
    return role;
}
function formatPostDate(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime()))
        return "";
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
        }
        catch {
            return "https://community-app-backend-wrb0.onrender.com";
        }
    })();
    const getMediaUrl = (url) => {
        if (!url)
            return "";
        if (url.startsWith("http")) {
            try {
                const mediaUrl = new URL(url);
                if (mediaUrl.hostname === "localhost" || mediaUrl.hostname === "127.0.0.1") {
                    return `${apiOrigin}${mediaUrl.pathname}${mediaUrl.search}`;
                }
                return mediaUrl.toString();
            }
            catch {
                return url;
            }
        }
        return url.startsWith("/") ? `${apiOrigin}${url}` : `${apiOrigin}/${url}`;
    };
    const [text, setText] = useState("");
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState("");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [commentDrafts, setCommentDrafts] = useState({});
    const [commentOpenForPost, setCommentOpenForPost] = useState({});
    const [replyDrafts, setReplyDrafts] = useState({});
    const [replyOpenForComment, setReplyOpenForComment] = useState({});
    const [replyTarget, setReplyTarget] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    const [openPostMenu, setOpenPostMenu] = useState(null);
    const currentRole = normalizeRole(currentUser?.role);
    const canCreatePosts = currentRole === "super_admin" || currentRole === "moderator" || currentRole === "admin";
    const canModeratePosts = currentRole === "super_admin" || currentRole === "moderator" || currentRole === "admin";
    const isSuperAdmin = currentRole === "super_admin";
    const [viewMode, setViewMode] = useState("all");
    const postTextLength = text.trim().length;
    const visiblePosts = viewMode === "mine" && currentUser?.fullName
        ? posts.filter((post) => post.authorName === currentUser.fullName)
        : posts;
    const feedStats = posts.reduce((totals, post) => ({
        likes: totals.likes + (post.likes ?? 0),
        comments: totals.comments + (post.comments ?? 0),
        shares: totals.shares + (post.shares ?? 0),
    }), { likes: 0, comments: 0, shares: 0 });
    const loadPosts = async (showSpinner = true) => {
        try {
            if (showSpinner)
                setFetching(true);
            setError("");
            const response = await API.get("/posts/all");
            setPosts(response.data);
        }
        catch (err) {
            setError(err.response?.data?.message || "Unable to load posts.");
        }
        finally {
            if (showSpinner)
                setFetching(false);
        }
    };
    useEffect(() => {
        void loadPosts();
    }, []);
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
        API.get("/auth/me")
            .then((response) => {
            if (!cancelled)
                setCurrentUser(response.data.user || null);
        })
            .catch(() => {
            if (!cancelled)
                setCurrentUser(null);
        });
        const refreshProfile = () => {
            API.get("/auth/me")
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
    const handleFileChange = (event) => {
        const files = Array.from(event.target.files ?? []);
        if (files.length === 0)
            return;
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
    const handleRemoveFile = (index) => {
        setSelectedFiles((currentFiles) => currentFiles.filter((_, fileIndex) => fileIndex !== index));
        setPreviewUrls((currentPreviewUrls) => {
            const previewUrl = currentPreviewUrls[index];
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            return currentPreviewUrls.filter((_, fileIndex) => fileIndex !== index);
        });
    };
    const upsertPost = (updatedPost) => {
        setPosts((currentPosts) => currentPosts.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
    };
    const handleLike = async (postId) => {
        try {
            const response = await API.patch(`/posts/${postId}/like`);
            upsertPost(response.data);
        }
        catch (err) {
            setError(err.response?.data?.message || "Unable to update like.");
        }
    };
    const handleCommentToggle = (postId) => {
        setCommentOpenForPost((current) => ({ ...current, [postId]: !current[postId] }));
    };
    const handleCommentSubmit = async (postId, event) => {
        event.preventDefault();
        const draft = (commentDrafts[postId] || "").trim();
        if (!draft)
            return;
        try {
            const response = await API.post(`/posts/${postId}/comments`, { text: draft });
            upsertPost(response.data);
            setCommentDrafts((current) => ({ ...current, [postId]: "" }));
        }
        catch (err) {
            setError(err.response?.data?.message || "Unable to add comment.");
        }
    };
    const handleReplySubmit = async (postId, commentId, event) => {
        event.preventDefault();
        const replyKey = `${postId}-${commentId}`;
        const draft = (replyDrafts[replyKey] || "").trim();
        if (!draft)
            return;
        try {
            const response = await API.post(`/posts/${postId}/comments/${commentId}/replies`, { text: draft });
            upsertPost(response.data);
            setReplyDrafts((current) => ({ ...current, [replyKey]: "" }));
            setReplyOpenForComment((current) => ({ ...current, [replyKey]: false }));
            setReplyTarget((current) => ({ ...current, [replyKey]: "" }));
        }
        catch (err) {
            setError(err.response?.data?.message || "Unable to add reply.");
        }
    };
    const handleShare = async (postId) => {
        try {
            const response = await API.post(`/posts/${postId}/share`);
            upsertPost(response.data);
        }
        catch (err) {
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
            }
            catch {
                // Ignore share cancellation.
            }
        }
    };
    const handleDeletePost = async (postId) => {
        const confirmed = window.confirm("Delete this post?");
        if (!confirmed)
            return;
        try {
            setOpenPostMenu(null);
            await API.delete(`/posts/${postId}`);
            setPosts((currentPosts) => currentPosts.filter((post) => post._id !== postId));
        }
        catch (err) {
            setError(err.response?.data?.message || "Unable to delete post.");
        }
    };
    const handleSubmit = async (event) => {
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
            const response = await API.post("/posts/create", formData);
            setPosts((existing) => [response.data, ...existing]);
            setText("");
            handleClearFiles();
        }
        catch (err) {
            setError(err.response?.data?.message || "Unable to create post.");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "mx-auto w-full max-w-6xl space-y-6", children: [_jsxs("section", { className: "overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_18px_55px_-38px_rgba(15,23,42,0.75)]", children: [_jsx("div", { className: "border-b border-slate-200 bg-slate-950 px-5 py-5 text-white sm:px-6", children: _jsxs("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-blue-200", children: "Community Feed" }), _jsx("h1", { className: "mt-2 text-2xl font-black leading-tight sm:text-3xl", children: "Share updates with the community" }), _jsx("p", { className: "mt-2 max-w-2xl text-sm leading-6 text-slate-300", children: "Post announcements, moments, photos, videos, and short discussions in one clean place." })] }), _jsxs("div", { className: "grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/10 p-2 text-center backdrop-blur sm:min-w-80", children: [_jsxs("div", { className: "rounded-lg bg-white/10 px-3 py-2", children: [_jsx("p", { className: "text-lg font-black", children: posts.length }), _jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-300", children: "Posts" })] }), _jsxs("div", { className: "rounded-lg bg-white/10 px-3 py-2", children: [_jsx("p", { className: "text-lg font-black", children: feedStats.likes }), _jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-300", children: "Likes" })] }), _jsxs("div", { className: "rounded-lg bg-white/10 px-3 py-2", children: [_jsx("p", { className: "text-lg font-black", children: feedStats.comments }), _jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-300", children: "Comments" })] })] })] }) }), canCreatePosts ? (_jsx("form", { onSubmit: handleSubmit, className: "p-5 sm:p-6", children: _jsxs("div", { className: "flex gap-3", children: [_jsx(UserAvatar, { name: currentUser?.fullName || "Me", photoUrl: currentUser?.profilePhotoUrl, size: "md" }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]", children: [_jsx("textarea", { value: text, onChange: (event) => setText(event.target.value), rows: 4, maxLength: MAX_POST_LENGTH + 50, placeholder: "What would you like to share today?", className: "min-h-32 w-full resize-y border-0 bg-transparent p-4 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400" }), _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsxs("label", { className: "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 16l4.6-4.6a2 2 0 0 1 2.8 0L16 16m-2-2 1.6-1.6a2 2 0 0 1 2.8 0L20 14m-2-8h.01M5 20h14a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1Z" }) }), "Media", _jsx("input", { type: "file", accept: "image/*,video/*", multiple: true, onChange: handleFileChange, className: "hidden" })] }), selectedFiles.length > 0 ? (_jsx("button", { type: "button", onClick: handleClearFiles, className: "rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-200 hover:text-slate-800", children: "Clear media" })) : null] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("span", { className: `text-xs font-semibold ${postTextLength > MAX_POST_LENGTH ? "text-red-600" : "text-slate-400"}`, children: [postTextLength, "/", MAX_POST_LENGTH] }), _jsx("button", { type: "submit", disabled: loading, className: "btn-primary inline-flex min-w-24 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60", children: loading ? "Posting..." : "Post" })] })] })] }), previewUrls.length > 0 ? (_jsxs("div", { className: "mt-4", children: [_jsxs("div", { className: "mb-2 flex items-center justify-between gap-3", children: [_jsxs("p", { className: "text-xs font-bold uppercase tracking-[0.12em] text-slate-500", children: [selectedFiles.length, " media selected"] }), _jsx("p", { className: "text-xs text-slate-400", children: "Maximum 5 files" })] }), _jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: previewUrls.map((previewUrl, index) => {
                                                        const file = selectedFiles[index];
                                                        const isVideo = file?.type?.startsWith("video/");
                                                        return (_jsxs("div", { className: "relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100", children: [_jsx("button", { type: "button", onClick: () => handleRemoveFile(index), className: "absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-lg bg-slate-950/80 text-lg font-semibold leading-none text-white transition hover:bg-slate-950", "aria-label": `Remove selected media ${index + 1}`, children: "x" }), isVideo ? (_jsx("video", { controls: true, src: previewUrl, className: "aspect-video w-full object-cover" })) : (_jsx("img", { src: previewUrl, alt: "Selected preview", className: "aspect-video w-full object-cover" })), _jsx("div", { className: "border-t border-slate-200 bg-white px-3 py-2", children: _jsx("p", { className: "truncate text-xs font-semibold text-slate-600", children: file?.name || "Selected media" }) })] }, previewUrl));
                                                    }) })] })) : null, error ? (_jsx("div", { className: "mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700", children: error })) : null] })] }) })) : (_jsx("div", { className: "p-5 sm:p-6", children: _jsx("div", { className: "rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600", children: "Only super admins and moderators can create posts. Members can view posts, like, comment, and share them." }) }))] }), _jsxs("section", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "page-title text-xl", children: "Latest Posts" }), _jsx("p", { className: "page-subtitle mt-1 text-sm", children: "Recent activity from members and admins." })] }), canModeratePosts ? (_jsxs("div", { className: "inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm", children: [_jsx("button", { type: "button", onClick: () => setViewMode("all"), className: `rounded-md px-3 py-2 text-sm font-semibold transition ${viewMode === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`, children: "All posts" }), _jsx("button", { type: "button", onClick: () => setViewMode("mine"), className: `rounded-md px-3 py-2 text-sm font-semibold transition ${viewMode === "mine" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`, children: "My posts" })] })) : null, _jsxs("button", { type: "button", onClick: () => void loadPosts(), disabled: fetching, className: "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: `h-4 w-4 ${fetching ? "animate-spin" : ""}`, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M20 11a8 8 0 1 0-2.34 5.66M20 11V5m0 6h-6" }) }), fetching ? "Refreshing" : "Refresh"] })] }), fetching && posts.length === 0 ? (_jsx("div", { className: "space-y-3", children: [0, 1, 2].map((item) => (_jsx("div", { className: "rounded-xl border border-slate-200 bg-white p-5 shadow-sm", children: _jsxs("div", { className: "flex animate-pulse gap-3", children: [_jsx("div", { className: "h-11 w-11 rounded-xl bg-slate-200" }), _jsxs("div", { className: "flex-1 space-y-3", children: [_jsx("div", { className: "h-3 w-36 rounded bg-slate-200" }), _jsx("div", { className: "h-3 w-full rounded bg-slate-100" }), _jsx("div", { className: "h-3 w-2/3 rounded bg-slate-100" })] })] }) }, item))) })) : visiblePosts.length === 0 ? (_jsxs("div", { className: "rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm", children: [_jsx("div", { className: "mx-auto grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-700", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 12h14M12 5v14" }) }) }), _jsx("h3", { className: "mt-4 text-lg font-black text-slate-900", children: "No posts yet" }), _jsx("p", { className: "mt-1 text-sm text-slate-500", children: "Be the first to start the community conversation." })] })) : (_jsx("div", { className: "space-y-4", children: visiblePosts.map((post) => {
                            const comments = post.commentsList || [];
                            const totalEngagement = (post.likes ?? 0) + (post.comments ?? 0) + (post.shares ?? 0);
                            return (_jsxs("article", { className: "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_14px_35px_-30px_rgba(15,23,42,0.7)]", children: [_jsxs("div", { className: "p-5", children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex min-w-0 items-center gap-3", children: [_jsx(UserAvatar, { name: post.authorName, photoUrl: post.authorPhotoUrl, size: "md" }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "truncate text-sm font-black text-slate-900", children: post.authorName || "Community member" }), _jsx("p", { className: "text-xs font-medium text-slate-500", children: formatPostDate(post.createdAt) })] })] }), _jsxs("div", { className: "flex items-start gap-2", children: [_jsxs("div", { className: "rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500", children: [totalEngagement, " interactions"] }), post.canDelete && (isSuperAdmin || (canModeratePosts && post.authorName === currentUser?.fullName)) ? (_jsxs("div", { className: "relative", children: [_jsx("button", { type: "button", onClick: () => setOpenPostMenu((current) => (current === post._id ? null : post._id)), className: "grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900", "aria-label": "Post actions", "aria-haspopup": "menu", "aria-expanded": openPostMenu === post._id, children: _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 24 24", fill: "currentColor", children: [_jsx("circle", { cx: "12", cy: "5", r: "1.8" }), _jsx("circle", { cx: "12", cy: "12", r: "1.8" }), _jsx("circle", { cx: "12", cy: "19", r: "1.8" })] }) }), openPostMenu === post._id ? (_jsx("div", { className: "absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg", role: "menu", children: _jsx("button", { type: "button", onClick: () => handleDeletePost(post._id), className: "block w-full px-3 py-2 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50", role: "menuitem", children: "Delete post" }) })) : null] })) : null] })] }), post.text ? _jsx("p", { className: "mt-4 whitespace-pre-line text-[15px] leading-7 text-slate-800", children: post.text }) : null, post.media && post.media.length > 0 ? (_jsx("div", { className: `mt-4 grid gap-3 ${post.media.length === 1 ? "grid-cols-1" : "sm:grid-cols-2"}`, children: post.media.map((item, index) => {
                                                    const isVideo = (item.type || "").startsWith("video/");
                                                    const mediaUrl = getMediaUrl(item.url);
                                                    return (_jsx("div", { className: "overflow-hidden rounded-xl border border-slate-200 bg-slate-100", children: isVideo ? (_jsx("video", { controls: true, src: mediaUrl, className: "max-h-[420px] w-full bg-black object-contain" })) : (_jsx("img", { src: mediaUrl, alt: "Post media", className: "max-h-[420px] w-full object-cover" })) }, `${post._id}-${index}`));
                                                }) })) : null, _jsx("div", { className: "mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4", children: _jsxs("div", { className: "flex flex-wrap items-center gap-2 text-sm", children: [_jsxs("button", { type: "button", onClick: () => handleLike(post._id), className: `inline-flex items-center gap-2 rounded-lg px-3 py-2 font-bold transition ${post.liked ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`, children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", viewBox: "0 0 24 24", fill: post.liked ? "currentColor" : "none", stroke: "currentColor", strokeWidth: "1.8", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 21s-6.4-4.35-8.2-8.16C2.5 10.14 3.5 7 6.3 6.1c1.7-.5 3.5.2 4.7 1.8 1.2-1.6 3-2.3 4.7-1.8 2.8.9 3.8 4.04 2.5 6.74C18.4 16.65 12 21 12 21Z" }) }), "Like", _jsx("span", { className: "rounded-full bg-white px-1.5 py-0.5 text-xs", children: post.likes ?? 0 })] }), _jsxs("button", { type: "button", onClick: () => handleCommentToggle(post._id), className: `inline-flex items-center gap-2 rounded-lg px-3 py-2 font-bold transition ${commentOpenForPost[post._id] ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`, children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M8 10h8M8 14h5m-7 4h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" }) }), "Comment", _jsx("span", { className: "rounded-full bg-white/90 px-1.5 py-0.5 text-xs text-slate-700", children: post.comments ?? 0 })] }), _jsxs("button", { type: "button", onClick: () => handleShare(post._id), className: "inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 font-bold text-slate-600 transition hover:bg-slate-100", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M7 14v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3M12 4v10m0 0 3-3m-3 3-3-3" }) }), "Share", _jsx("span", { className: "rounded-full bg-white px-1.5 py-0.5 text-xs", children: post.shares ?? 0 })] })] }) })] }), commentOpenForPost[post._id] ? (_jsxs("div", { className: "border-t border-slate-100 bg-slate-50 p-5", children: [comments.length > 0 ? (_jsx("div", { className: "space-y-3", children: comments.map((comment) => {
                                                    const replyKey = `${post._id}-${comment.id}`;
                                                    return (_jsx("div", { className: "rounded-xl border border-slate-200 bg-white p-3", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(UserAvatar, { name: comment.author, photoUrl: comment.authorPhotoUrl, size: "sm" }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsx("span", { className: "text-sm font-black text-slate-900", children: comment.author }), _jsx("button", { type: "button", onClick: () => {
                                                                                        setReplyOpenForComment((current) => ({ ...current, [replyKey]: !current[replyKey] }));
                                                                                        setReplyTarget((current) => ({ ...current, [replyKey]: comment.author }));
                                                                                    }, className: "rounded-md px-2 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-50", children: "Reply" })] }), _jsx("p", { className: "mt-1 text-sm leading-6 text-slate-700", children: comment.text }), (comment.replies || []).length > 0 ? (_jsx("div", { className: "mt-3 space-y-2 border-l-2 border-blue-100 pl-3", children: comment.replies?.map((reply) => (_jsxs("div", { className: "flex gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700", children: [_jsx(UserAvatar, { name: reply.author, photoUrl: reply.authorPhotoUrl, size: "sm" }), _jsxs("div", { className: "min-w-0", children: [_jsx("span", { className: "font-black text-slate-900", children: reply.author }), reply.replyTo ? _jsxs("span", { className: "ml-1 text-slate-500", children: ["replying to ", reply.replyTo] }) : null, _jsx("p", { className: "mt-1 leading-6", children: reply.text })] })] }, reply.id))) })) : null, replyOpenForComment[replyKey] ? (_jsxs("form", { onSubmit: (event) => handleReplySubmit(post._id, comment.id, event), className: "mt-3 flex flex-col gap-2 sm:flex-row", children: [_jsx("input", { value: replyDrafts[replyKey] || "", onChange: (event) => setReplyDrafts((current) => ({
                                                                                        ...current,
                                                                                        [replyKey]: event.target.value,
                                                                                    })), placeholder: `Reply to ${replyTarget[replyKey] || comment.author}...`, className: "form-input rounded-lg px-4 py-2 text-sm" }), _jsx("button", { type: "submit", className: "btn-primary rounded-lg px-4 py-2 text-sm font-bold transition", children: "Reply" })] })) : null] })] }) }, comment.id));
                                                }) })) : (_jsx("p", { className: "rounded-xl border border-dashed border-slate-200 bg-white px-4 py-5 text-center text-sm text-slate-500", children: "No comments yet. Add the first one." })), _jsxs("form", { onSubmit: (event) => handleCommentSubmit(post._id, event), className: "mt-4 flex flex-col gap-2 sm:flex-row", children: [_jsx("input", { value: commentDrafts[post._id] || "", onChange: (event) => setCommentDrafts((current) => ({ ...current, [post._id]: event.target.value })), placeholder: "Write a thoughtful comment...", className: "form-input rounded-lg px-4 py-3 text-sm" }), _jsx("button", { type: "submit", className: "btn-primary rounded-lg px-5 py-3 text-sm font-bold transition", children: "Comment" })] })] })) : null] }, post._id));
                        }) }))] })] }));
}
