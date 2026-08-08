import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import UserAvatar from "../components/UserAvatar";
import Loader from "../components/Loader";
import Toast from "../components/Toast";

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

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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
      const res = await API.post(`/friends/request/send/${profile._id}`);
      if (res.data.success) {
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
      const res = await API.post(`/friends/request/accept/${profile._id}`);
      if (res.data.success) {
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
      const res = await API.post(`/friends/request/cancel/${profile._id}`);
      if (res.data.success) {
        setFriendStatus("none");
        setToast({ message: "Friend request cancelled.", type: "success" });
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "Unable to cancel request.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfriend = async () => {
    if (!profile) return;
    if (!window.confirm(`Are you sure you want to unfriend ${profile.fullName}?`)) return;

    setActionLoading(true);
    try {
      const res = await API.delete(`/friends/${profile._id}`);
      if (res.data.success) {
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
          className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
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
      : profile.role === "moderator"
      ? "🛡️ Moderator"
      : "👤 Community Member";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top Banner & Profile Header Card */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
        {/* Cover Background */}
        <div className="h-36 sm:h-48 bg-gradient-to-r from-slate-900 via-teal-900 to-slate-900 relative overflow-hidden">
          <img src={profile.coverPhotoUrl || "/cover.png"} alt="Cover Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-900/20" />
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-slate-900/60 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-md hover:bg-slate-900/80 transition"
          >
            ← Back
          </button>
          <span className="absolute top-4 right-4 z-10 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-teal-300 border border-teal-500/30 backdrop-blur-md">
            ALL KUTCHI COMMUNITY
          </span>
        </div>

        {/* Profile Identity Bar */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-16 sm:-mt-20">
            {/* Avatar with Online Ring */}
            <div className="relative inline-block">
              <UserAvatar
                src={profile.profilePhotoUrl}
                name={profile.fullName}
                size="xl"
                className="rounded-3xl border-4 border-white shadow-xl bg-white object-cover"
              />
              <span
                className={`absolute bottom-2 right-2 h-5 w-5 rounded-full border-2 border-white shadow-md ${
                  profile.isOnline ? "bg-emerald-500 ring-2 ring-emerald-300" : "bg-slate-300"
                }`}
                title={profile.isOnline ? "Active Now" : "Offline"}
              />
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
              {friendStatus === "self" ? (
                <Link
                  to="/profile"
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
                >
                  ✏️ Edit Profile
                </Link>
              ) : (
                <>
                  {friendStatus === "friends" && (
                    <button
                      onClick={handleUnfriend}
                      disabled={actionLoading}
                      className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-extrabold text-emerald-800 shadow-sm hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition"
                    >
                      ✓ Friends (Unfriend)
                    </button>
                  )}

                  {friendStatus === "request_sent" && (
                    <button
                      onClick={handleCancelRequest}
                      disabled={actionLoading}
                      className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
                    >
                      ⏳ Request Sent (Cancel)
                    </button>
                  )}

                  {friendStatus === "request_received" && (
                    <button
                      onClick={handleAcceptRequest}
                      disabled={actionLoading}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition"
                    >
                      ✅ Accept Request
                    </button>
                  )}

                  {friendStatus === "none" && (
                    <button
                      onClick={handleSendFriendRequest}
                      disabled={actionLoading}
                      className="rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-500 transition"
                    >
                      ➕ Add Friend
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/friends/${profile._id}/chat`)}
                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition flex items-center gap-1.5"
                  >
                    💬 Message
                  </button>

                  <button
                    onClick={() => setShowReportModal(true)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition"
                    title="Report Profile"
                  >
                    🚩
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Name & Details Header */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {profile.fullName}
              </h1>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700 border border-slate-200">
                {roleLabel}
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-500">
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
        </div>

      </div>

      {/* Section 1: Overview Details */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <span>👤</span> Basic Identity
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 text-xs">
          <div>
            <span className="text-slate-400 font-medium">Full Name</span>
            <p className="font-bold text-slate-800 text-sm">{profile.fullName}</p>
          </div>

          <div>
            <span className="text-slate-400 font-medium">Username</span>
            <p className="font-mono font-bold text-teal-700">@{profile.username}</p>
          </div>

          <div>
            <span className="text-slate-400 font-medium">Location</span>
            <p className="font-bold text-slate-800">📍 {profile.city || "Karachi"}, 🇵🇰 {profile.country || "Pakistan"}</p>
          </div>

          {profile.dob && (
            <div>
              <span className="text-slate-400 font-medium">Date of Birth</span>
              <p className="font-bold text-slate-800">🎂 {profile.dob}</p>
            </div>
          )}

          <div>
            <span className="text-slate-400 font-medium">Member Joined</span>
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
                    <p className="text-[11px] font-semibold text-slate-400">
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Recently"}
                    </p>
                  </div>
                </div>

                {post.title && <h4 className="text-base font-extrabold text-slate-900">{post.title}</h4>}
                <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">{post.content || (post as any).text}</p>

                {post.mediaUrl && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-96 bg-slate-900">
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
    </div>
  );
}
