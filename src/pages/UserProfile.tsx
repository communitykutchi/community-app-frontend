import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import UserAvatar from "../components/UserAvatar";
import Loader from "../components/Loader";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

const configuredApiBase = import.meta.env.VITE_API_URL || "https://backend.kutchicommunity.com";
const apiOrigin = (() => {
  try {
    const fallbackOrigin = typeof window !== "undefined" && window.location?.origin ? window.location.origin : "https://backend.kutchicommunity.com";
    return new URL(configuredApiBase, fallbackOrigin).origin;
  } catch {
    return "https://backend.kutchicommunity.com";
  }
})();

const getMediaUrl = (url?: string) => {
  if (!url) return "/cover.png";
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;
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

interface UserProfileData {
  _id: string;
  fullName: string;
  username: string;
  email?: string;
  mobile?: string;
  country?: string;
  city?: string;
  dob?: string;
  profilePhotoUrl?: string;
  coverPhotoUrl?: string;
  role?: string;
  isOnline?: boolean;
  lastActive?: string;
  createdAt?: string;
  friendsCount?: number;
  mutualFriendsCount?: number;
}

interface MutualFriendItem {
  _id: string;
  fullName: string;
  username: string;
  profilePhotoUrl?: string;
  role?: string;
  isOnline?: boolean;
}

interface PostItem {
  _id: string;
  authorName?: string;
  authorPhotoUrl?: string;
  title?: string;
  content: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  media?: { url: string; type: "image" | "video" }[];
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  createdAt: string;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [friendStatus, setFriendStatus] = useState<string>("none");
  const [mutualFriends, setMutualFriends] = useState<MutualFriendItem[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "mutual_friends" | "posts">("overview");

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [showFriendsDropdown, setShowFriendsDropdown] = useState(false);
  const [showMoreOptionsDropdown, setShowMoreOptionsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreOptionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFriendsDropdown(false);
      }
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(event.target as Node)) {
        setShowMoreOptionsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserProfile(userId);
    }
  }, [userId]);

  const fetchUserProfile = async (id: string) => {
    setLoading(true);
    try {
      const res = await API.get<{
        success: boolean;
        profile: UserProfileData;
        friendStatus: string;
        mutualFriends: MutualFriendItem[];
        posts: PostItem[];
      }>(`/users/profile/${id}`);

      if (res.data.success) {
        setProfile(res.data.profile);
        setFriendStatus(res.data.friendStatus);
        setMutualFriends(res.data.mutualFriends || []);
        setPosts(res.data.posts || []);
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "User profile not found.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      const res = await API.post(`/friends/request/${profile._id}`);
      if (res.data?.success !== false) {
        setFriendStatus("request_sent");
        setToast({ message: "Friend request sent!", type: "success" });
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "Unable to send request.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      const res = await API.post(`/friends/request/${profile._id}/accept`);
      if (res.data?.success !== false) {
        setFriendStatus("friends");
        setToast({ message: "Friend request accepted!", type: "success" });
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "Unable to accept request.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      const res = await API.post(`/friends/request/${profile._id}/cancel`);
      if (res.data?.success !== false) {
        setFriendStatus("none");
        setToast({ message: "Friend request cancelled.", type: "success" });
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "Unable to cancel request.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const confirmUnfriend = async () => {
    if (!profile) return;
    setShowUnfriendConfirm(false);

    setActionLoading(true);
    try {
      const res = await API.post(`/friends/unfriend/${profile._id}`);
      if (res.data?.success !== false) {
        setFriendStatus("none");
        setToast({ message: "Removed from friends.", type: "success" });
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "Unable to unfriend.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportReason.trim() || !profile) return;
    setSubmittingReport(true);
    try {
      const res = await API.post("/auth/reports", {
        targetId: profile._id,
        targetType: "user",
        reason: reportReason.trim(),
      });
      if (res.data.success) {
        setToast({ message: "Report submitted to Super Admin for review.", type: "success" });
        setShowReportModal(false);
        setReportReason("");
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "Unable to submit report.", type: "error" });
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="text-4xl mb-3">👤</div>
        <h2 className="text-xl font-bold text-slate-800">User Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">The profile you are looking for does not exist or has been removed.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-500 transition cursor-pointer"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  const roleLabel =
    profile.role === "super_admin"
      ? "👑 Super Admin"
      : profile.role === "admin"
      ? "🛡️ Admin"
      : "👤 Community Member";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} isVisible={true} onClose={() => setToast(null)} />}

      {/* Top Banner & Profile Header Card */}
      <div className="rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-xl relative z-10">
        {/* Cover Background */}
        <div className="cover-banner relative h-36 sm:h-52 md:h-64 bg-white overflow-hidden rounded-t-3xl">
          <img
            src={getMediaUrl(profile.coverPhotoUrl)}
            alt="Cover Banner"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/cover.png";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-black/30 pointer-events-none" />
          <button
            onClick={() => navigate(-1)}
            className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 sm:px-3.5 sm:py-1.5 text-[11px] sm:text-xs font-extrabold text-slate-900 shadow-md hover:bg-slate-100 transition cursor-pointer"
          >
            ← Back
          </button>
          <span className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 inline-flex max-w-[150px] sm:max-w-none items-center rounded-full bg-teal-500/20 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-teal-300 border border-teal-500/30 backdrop-blur-md truncate">
            ALL KUTCHI COMMUNITY
          </span>
        </div>

        {/* Profile Identity Bar */}
        <div className="relative px-4 py-4 sm:px-6 sm:pb-6 sm:pt-0 bg-gradient-to-b from-slate-100/90 via-white to-white border-t border-slate-200/50">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-16 relative z-10">
            {/* Avatar with Online Ring */}
            <div className="relative inline-block shrink-0">
              <UserAvatar
                src={profile.profilePhotoUrl}
                name={profile.fullName}
                size="xl"
                className="rounded-3xl border-4 border-white shadow-2xl bg-white object-cover"
              />
              <span
                className={`absolute bottom-2 right-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 border-white shadow-md ${
                  profile.isOnline ? "bg-emerald-500 ring-2 ring-emerald-300" : "bg-slate-300"
                }`}
                title={profile.isOnline ? "Active Now" : "Offline"}
              />
            </div>
          </div>

          {/* Name & Details Header (Uper Aayega) */}
          <div className="mt-3 sm:mt-4 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight break-words max-w-full">
                {profile.fullName}
              </h1>
              <span className="inline-block shrink-0 rounded-full bg-slate-100 px-3 py-0.5 text-[11px] font-extrabold text-slate-700 border border-slate-200">
                {roleLabel}
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-600 break-words">
              @{profile.username} • {profile.friendsCount || 0} Friends • {profile.mutualFriendsCount || 0} Mutual Friends
            </p>

            <p className="text-xs text-slate-500 flex items-center gap-2 pt-1">
              <span className={`inline-block h-2 w-2 rounded-full ${profile.isOnline ? "bg-emerald-500" : "bg-slate-400"}`} />
              {profile.isOnline
                ? "Active Now in Community"
                : profile.lastActive
                ? `Last seen ${new Date(profile.lastActive).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`
                : "Offline"}
            </p>
          </div>

          {/* Action Buttons Toolbar / Patti (Symmetrical 16px padding on both left & right) */}
          <div className="flex items-center justify-between gap-2 pt-3.5 border-t border-slate-100 mt-4 w-full">
            {friendStatus === "self" ? (
              <Link
                to="/profile"
                className="w-full rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold px-4 py-2.5 text-xs shadow-md shadow-teal-600/30 transition cursor-pointer text-center justify-center inline-flex items-center"
              >
                ✏️ Edit Profile
              </Link>
            ) : (
              <>
                {/* 1. Add Friend / Status Button (flex-1 for equal left half) */}
                {friendStatus === "friends" && (
                  <div className="relative inline-block text-left flex-1 min-w-0" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowFriendsDropdown((prev) => !prev)}
                      disabled={actionLoading}
                      className="w-full justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-2 sm:px-3.5 py-2.5 text-xs font-extrabold text-emerald-800 shadow-xs hover:bg-emerald-100 transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <span>✓ Friends</span>
                      <svg
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${showFriendsDropdown ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showFriendsDropdown && (
                      <div className="absolute left-0 mt-2 w-48 sm:w-52 origin-top-left rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setShowFriendsDropdown(false);
                            setShowUnfriendConfirm(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-extrabold text-rose-600 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                        >
                          <span className="shrink-0 text-base">👤❌</span>
                          <span>Unfriend</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowFriendsDropdown(false);
                            setShowReportModal(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-extrabold text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                        >
                          <span className="shrink-0 text-base">🚩</span>
                          <span>Report Profile</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {friendStatus === "request_sent" && (
                  <button
                    onClick={handleCancelRequest}
                    disabled={actionLoading}
                    title="Click to cancel friend request"
                    className="flex-1 min-w-0 justify-center inline-flex items-center rounded-xl border border-amber-300 bg-amber-50 px-2 sm:px-3.5 py-2.5 text-xs font-extrabold text-amber-900 hover:bg-amber-100 transition whitespace-nowrap cursor-pointer"
                  >
                    ⏳ Request Sent
                  </button>
                )}

                {friendStatus === "request_received" && (
                  <button
                    onClick={handleAcceptRequest}
                    disabled={actionLoading}
                    className="flex-1 min-w-0 justify-center inline-flex items-center rounded-xl bg-emerald-600 px-2 sm:px-3.5 py-2.5 text-xs font-extrabold text-white shadow-xs hover:bg-emerald-500 transition whitespace-nowrap cursor-pointer"
                  >
                    ✅ Accept Request
                  </button>
                )}

                {friendStatus === "none" && (
                  <button
                    onClick={handleSendFriendRequest}
                    disabled={actionLoading}
                    className="flex-1 min-w-0 justify-center inline-flex items-center rounded-xl bg-teal-600 px-2 sm:px-3.5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-teal-600/20 hover:bg-teal-500 transition whitespace-nowrap cursor-pointer"
                  >
                    ➕ Add Friend
                  </button>
                )}

                {/* 2. Message Button (Shown ONLY when confirmed friends) */}
                {friendStatus === "friends" && (
                  <button
                    onClick={() => navigate(`/friends/${profile._id}/chat`)}
                    className="flex-1 min-w-0 justify-center inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-2 sm:px-3.5 py-2.5 text-xs shadow-md shadow-emerald-600/30 transition cursor-pointer whitespace-nowrap"
                  >
                    💬 Message
                  </button>
                )}

                {/* 3. 3-Dots (⋮) Options Button (shrink-0 fixed width) */}
                <div className="relative inline-block text-left shrink-0" ref={moreOptionsRef}>
                  <button
                    type="button"
                    onClick={() => setShowMoreOptionsDropdown((prev) => !prev)}
                    className="h-9 w-9 sm:h-10 sm:w-10 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-black text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    title="More Options"
                  >
                    ⋮
                  </button>

                  {showMoreOptionsDropdown && (
                    <div className="absolute right-0 mt-2 w-48 sm:w-52 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreOptionsDropdown(false);
                          setShowReportModal(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-extrabold text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                      >
                        <span className="shrink-0 text-base">🚩</span>
                        <span>Report Profile</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Section 1: Overview Details */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <span>👤</span> Basic Identity
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Full Name</span>
            <p className="font-bold text-slate-800 text-sm">{profile.fullName}</p>
          </div>

          <div>
            <span className="text-slate-500 font-medium">Username</span>
            <p className="font-mono font-bold text-teal-700">@{profile.username}</p>
          </div>

          <div>
            <span className="text-slate-500 font-medium">Location</span>
            <p className="font-bold text-slate-800">📍 {profile.city || "Karachi"}, 🇵🇰 {profile.country || "Pakistan"}</p>
          </div>

          {profile.dob && (
            <div>
              <span className="text-slate-500 font-medium">Date of Birth</span>
              <p className="font-bold text-slate-800">🎂 {profile.dob}</p>
            </div>
          )}

          <div>
            <span className="text-slate-500 font-medium">Member Joined</span>
            <p className="font-bold text-slate-800">
              📅 {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { dateStyle: "long" }) : "Member"}
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Mutual Friends */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
          <span className="flex items-center gap-2">👥 Mutual Friends ({profile.mutualFriendsCount || mutualFriends.length})</span>
          <span className="text-xs font-semibold text-slate-500 text-none">{mutualFriends.length} in common</span>
        </h3>

        {mutualFriends.length === 0 ? (
          <p className="text-xs text-slate-500 font-semibold py-2">No mutual friends with {profile.fullName} yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {mutualFriends.map((friend) => (
              <div
                key={friend._id}
                onClick={() => navigate(`/user/${friend._id}`)}
                className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 shadow-sm hover:bg-slate-100 hover:shadow-md transition cursor-pointer group"
              >
                <div className="relative">
                  <UserAvatar name={friend.fullName || friend.username} photoUrl={friend.profilePhotoUrl} size="md" className="ring-1 ring-slate-200 group-hover:scale-105 transition" />
                  <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white ${friend.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-teal-700 transition">{friend.fullName || friend.username || 'Member'}</p>
                  <p className="text-xs text-slate-500 truncate">@{friend.username}</p>
                </div>
                <span className="text-xs font-bold text-teal-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shrink-0">
                  View →
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: User Posts Feed */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
          <span className="flex items-center gap-2">📰 Community Posts ({posts.length})</span>
        </h3>

        {posts.length === 0 ? (
          <p className="text-xs text-slate-500 font-semibold py-2">No public posts created by {profile.fullName} yet.</p>
        ) : (
          <div className="space-y-4 pt-1">
            {posts.map((post) => (
              <div key={post._id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-3.5 shadow-xs">
                {/* Feed Style Author Header */}
                <div className="flex min-w-0 items-center gap-3 pb-2 border-b border-slate-200/60">
                  <UserAvatar name={post.authorName || profile.fullName} photoUrl={post.authorPhotoUrl || profile.profilePhotoUrl} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-slate-900">{post.authorName || profile.fullName}</p>
                    <p className="text-[11px] font-semibold text-slate-500">
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Recently"}
                    </p>
                  </div>
                </div>

                {post.title && <h4 className="text-base font-extrabold text-slate-900">{post.title}</h4>}
                <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">{post.content || (post as any).text}</p>

                {post.mediaUrl && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-96 bg-white">
                    {post.mediaType === "video" || post.mediaUrl.endsWith(".mp4") ? (
                      <video src={post.mediaUrl} controls className="w-full h-full object-contain" />
                    ) : (
                      <img src={post.mediaUrl} alt="Post media" className="w-full h-full object-cover" />
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                  <span>❤️ {post.likesCount || 0} Likes • 💬 {post.commentsCount || 0} Comments</span>
                  <Link to={`/feed?postId=${post._id}`} className="font-extrabold text-teal-700 hover:text-teal-800">
                    View Post in Feed →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report User Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">Report User Profile</h3>
            <p className="text-xs text-slate-500">
              Submit a report to Super Admin if this account violates community guidelines.
            </p>

            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the reason for reporting this profile..."
              rows={4}
              className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={submittingReport || !reportReason.trim()}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-500 disabled:opacity-50"
              >
                {submittingReport ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unfriend Confirm Modal */}
      <ConfirmModal
        isOpen={showUnfriendConfirm}
        title="Unfriend Confirmation"
        message={
          profile ? (
            <span>
              Are you sure you want to unfriend{" "}
              <strong className="text-slate-900">{profile.fullName}</strong>? They will be removed from your friends list.
            </span>
          ) : ""
        }
        confirmText="Unfriend"
        cancelText="Cancel"
        variant="danger"
        loading={actionLoading}
        onConfirm={confirmUnfriend}
        onCancel={() => setShowUnfriendConfirm(false)}
      />
    </div>
  );
}
