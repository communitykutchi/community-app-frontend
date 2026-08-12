import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import API from "../api/axios";
import UserAvatar from "../components/UserAvatar";
import Toast from "../components/Toast";
import { PAKISTAN_CITIES } from "../utils/pakistanCities";

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

interface UserProfile {
  _id: string;
  fullName: string;
  username?: string;
  fatherName?: string;
  motherName?: string;
  familyMembers?: number;
  cast?: string;
  dob?: string;
  cnic?: string;
  mobile?: string;
  email?: string;
  country?: string;
  city?: string;
  homeStatus?: "Owner" | "Rent";
  occupation?: "Employee" | "Business Man";
  businessName?: string;
  role?: string;
  jamaat?: string;
  profilePhotoUrl?: string;
  coverPhotoUrl?: string;
}

type ProfileForm = Pick<
  UserProfile,
  | "fullName"
  | "fatherName"
  | "motherName"
  | "cast"
  | "dob"
  | "cnic"
  | "mobile"
  | "email"
  | "country"
  | "city"
  | "homeStatus"
  | "occupation"
  | "businessName"
  | "jamaat"
  | "username"
> & {
  familyMembers: string;
};

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

const emptyForm: ProfileForm = {
  fullName: "",
  username: "",
  fatherName: "",
  motherName: "",
  familyMembers: "",
  cast: "",
  dob: "",
  cnic: "",
  mobile: "",
  email: "",
  country: "Pakistan",
  city: "Karachi",
  homeStatus: "Owner",
  occupation: "Employee",
  businessName: "",
  jamaat: "",
};

function toForm(user: UserProfile): ProfileForm {
  return {
    fullName: user.fullName || "",
    username: user.username || "",
    fatherName: user.fatherName || "",
    motherName: user.motherName || "",
    familyMembers: user.familyMembers ? String(user.familyMembers) : "",
    cast: user.cast || "",
    dob: user.dob || "",
    cnic: user.cnic || "",
    mobile: user.mobile || "",
    email: user.email || "",
    country: "Pakistan",
    city: user.city || "Karachi",
    homeStatus: user.homeStatus || "Owner",
    occupation: user.occupation || "Employee",
    businessName: user.businessName || "",
    jamaat: user.jamaat || "",
  };
}

function labelRole(role?: string) {
  if (role === "super_admin") return "Super Admin 👑";
  if (role === "moderator") return "Moderator 🛡️";
  if (role === "admin") return "Admin 🛡️";
  return "Community Member 👤";
}

export default function PeopleProfile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [jamaatOptions, setJamaatOptions] = useState<string[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; isVisible: boolean }>({
    message: "",
    type: "success",
    isVisible: false,
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [usernameMessage, setUsernameMessage] = useState("");

  // Email Change & OTP Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailStep, setEmailStep] = useState<1 | 2>(1);
  const [newEmailInput, setNewEmailInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type, isVisible: true });
  };

  const handleOpenEmailModal = () => {
    setNewEmailInput("");
    setOtpInput("");
    setEmailStep(1);
    setShowEmailModal(true);
  };

  const handleSendEmailOtp = async (e: FormEvent) => {
    e.preventDefault();
    const targetEmail = newEmailInput.trim().toLowerCase();
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      showToast("Please enter a valid new email address.", "error");
      return;
    }
    if (targetEmail === user?.email?.toLowerCase()) {
      showToast("New email cannot be the same as your current email.", "error");
      return;
    }

    try {
      setSendingOtp(true);
      await API.post("/auth/otp/send", { email: targetEmail, purpose: "change_email" });
      showToast("Verification OTP sent to your new email address!", "success");
      setEmailStep(2);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Unable to send verification OTP.", "error");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyAndUpdateEmail = async (e: FormEvent) => {
    e.preventDefault();
    const targetEmail = newEmailInput.trim().toLowerCase();
    const code = otpInput.trim();
    if (!code || code.length < 4) {
      showToast("Please enter the 6-digit OTP verification code.", "error");
      return;
    }

    try {
      setVerifyingEmail(true);
      const res = await API.put<{ user: UserProfile }>("/auth/me/email", { newEmail: targetEmail, otp: code });
      if (res.data?.user) {
        setUser(res.data.user);
        setForm(toForm(res.data.user));
      }
      showToast("Email address updated and verified successfully!", "success");
      setShowEmailModal(false);
      window.dispatchEvent(new Event("community-profile-updated"));
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to verify OTP or update email.", "error");
    } finally {
      setVerifyingEmail(false);
    }
  };

  const profileCompletion = useMemo(() => {
    const fields = ["fullName", "username", "email", "mobile", "cnic", "dob"] as const;
    const filled = fields.filter((field) => String(form[field] || "").trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [form]);

  const loadProfile = async () => {
    try {
      setFetching(true);
      const [profileRes, groupsRes] = await Promise.all([
        API.get<{ user: UserProfile }>("/auth/me"),
        API.get<{ groups: Array<{ name: string }> }>("/auth/groups").catch(() => null),
      ]);

      setUser(profileRes.data.user);
      setForm(toForm(profileRes.data.user));

      if (groupsRes?.data?.groups) {
        setJamaatOptions(groupsRes.data.groups.map((g) => g.name));
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Unable to load profile data.", "error");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const usernameValue = form.username?.trim().toLowerCase() || "";

    if (!usernameValue) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    const sameAsCurrent = user?.username?.toLowerCase() === usernameValue;
    if (sameAsCurrent) {
      setUsernameStatus("available");
      setUsernameMessage("");
      return;
    }

    if (usernameValue.length < 3 || usernameValue.length > 30 || !/^[a-z0-9._-]+$/.test(usernameValue)) {
      setUsernameStatus("invalid");
      setUsernameMessage("Use 3-30 lowercase letters, numbers, dots, underscores, or hyphens.");
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setUsernameStatus("checking");
        setUsernameMessage("Checking availability...");
        const response = await API.get<{ success: boolean; available: boolean; message?: string }>('/auth/check-username', {
          params: { username: usernameValue },
        });

        if (response.data.available) {
          setUsernameStatus("available");
          setUsernameMessage("Username available.");
        } else {
          setUsernameStatus("taken");
          setUsernameMessage(response.data.message || "Username is already taken.");
        }
      } catch (err: any) {
        setUsernameStatus("invalid");
        setUsernameMessage(err.response?.data?.message || "Unable to validate username.");
      }
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [form.username, user?.username]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please choose a valid image file.", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Profile photo must be 5MB or smaller.", "error");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append("profilePhoto", file);
      const response = await API.post<{ user: UserProfile }>("/auth/me/photo", formData);
      setUser(response.data.user);
      setForm(toForm(response.data.user));
      showToast("Profile photo updated successfully!", "success");
      window.dispatchEvent(new Event("community-profile-updated"));
    } catch (err: any) {
      showToast(err.response?.data?.message || "Unable to upload profile photo.", "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCoverPhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please choose a valid image file.", "error");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast("Cover photo must be 8MB or smaller.", "error");
      return;
    }

    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setCoverPreviewUrl(URL.createObjectURL(file));

    try {
      setUploadingCover(true);
      const formData = new FormData();
      formData.append("profilePhoto", file);
      const response = await API.post<{ user: UserProfile }>("/auth/me/cover", formData);
      setUser(response.data.user);
      setForm(toForm(response.data.user));
      showToast("Cover banner photo updated successfully!", "success");
      window.dispatchEvent(new Event("community-profile-updated"));
    } catch (err: any) {
      showToast(err.response?.data?.message || "Unable to upload cover photo.", "error");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.fullName.trim()) {
      showToast("Full name is required.", "error");
      return;
    }

    const normalizedUsername = form.username?.trim().toLowerCase() || "";
    if (normalizedUsername) {
      if (usernameStatus === "checking") {
        showToast("Please wait while we check username availability.", "error");
        return;
      }

      if (usernameStatus === "invalid" || usernameStatus === "taken") {
        showToast("Choose a valid, available username before saving.", "error");
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        username: normalizedUsername,
        fullName: form.fullName.trim(),
        familyMembers: form.familyMembers ? Number(form.familyMembers) : undefined,
      };
      const response = await API.put<{ user: UserProfile }>("/auth/me", payload);
      setUser(response.data.user);
      setForm(toForm(response.data.user));
      showToast("Personal details updated successfully!", "success");
      window.dispatchEvent(new Event("community-profile-updated"));
    } catch (err: any) {
      showToast(err.response?.data?.message || "Unable to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const photoUrl = previewUrl || user?.profilePhotoUrl || "";

  if (fetching) {
    return (
      <div className="mx-auto w-full max-w-5xl py-12 text-center space-y-4">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        <p className="text-xs font-bold text-slate-500">Loading Personal Profile Form...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast((t) => ({ ...t, isVisible: false }))} />

      {/* Profile Banner Card */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-xl">
        {/* Cover Photo Header */}
        <div className="cover-banner relative h-36 sm:h-52 md:h-64 overflow-hidden bg-white">
          <img
            src={getMediaUrl(coverPreviewUrl || user?.coverPhotoUrl)}
            alt="Cover Banner"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/cover.png";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-black/30 pointer-events-none" />
          {/* Upload Cover Photo Button */}
          <label className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-extrabold text-slate-900 shadow-lg hover:bg-slate-50 active:scale-95 transition">
            <span>📷</span>
            <span>{uploadingCover ? "Uploading..." : user?.coverPhotoUrl ? "Change Cover Photo" : "Add Cover Photo"}</span>
            <input type="file" accept="image/*" onChange={handleCoverPhotoChange} className="hidden" />
          </label>
        </div>

        {/* Profile Info Bar with Dynamic Ambient Gradient */}
        <div className="relative px-4 py-4 sm:px-6 sm:pb-6 sm:pt-0 bg-gradient-to-b from-slate-100/90 via-white to-white border-t border-slate-200/50">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-16 relative z-10">
            {/* Avatar Row */}
            <div className="relative inline-flex shrink-0">
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-3xl overflow-hidden ring-4 ring-white shadow-2xl bg-transparent">
                <UserAvatar name={user?.fullName} photoUrl={photoUrl} size="xl" className="h-full w-full object-cover" />
                <label className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 grid h-7 w-7 sm:h-8 sm:w-8 cursor-pointer place-items-center rounded-full border border-slate-200/90 bg-white/95 text-slate-800 shadow-md backdrop-blur-md transition hover:bg-white hover:scale-105 active:scale-95 z-20">
                  <span className="sr-only">Upload profile photo</span>
                  {uploadingPhoto ? (
                    <div className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
                      <circle cx="12" cy="13" r="3" />
                    </svg>
                  )}
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Name, Details & Profile Completion Row */}
          <div className="mt-3 sm:mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight break-words max-w-full">{user?.fullName || "Personal Details"}</h1>
                <span className="inline-block shrink-0 rounded-full bg-teal-500/20 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-teal-700 border border-teal-500/30">
                  {labelRole(user?.role)}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-600 break-words">@{user?.username || "member"} • {user?.mobile || user?.email || "No contact info"}</p>
            </div>

            {/* Profile Completion Box */}
            <div className="w-full md:w-auto md:min-w-64 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 sm:p-4 shrink-0 shadow-sm space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-wider text-slate-900">
                <span>Profile Completion</span>
                <span className="rounded-full bg-teal-600 px-2.5 py-0.5 text-xs font-black text-white shadow-2xs">
                  {profileCompletion}%
                </span>
              </div>
              <div className="progress-bar-track h-2.5 sm:h-3 overflow-hidden rounded-full p-0.5 shadow-inner bg-slate-200">
                <div
                  className="progress-bar-fill h-full rounded-full transition-all duration-500 bg-gradient-to-r from-teal-500 to-emerald-600"
                  style={{ width: `${Math.max(profileCompletion, 5)}%` }}
                />
              </div>
              <p className="text-[11px] font-bold text-slate-500">Fill all community fields to complete profile.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Identity Information */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-teal-50 text-teal-700 font-extrabold text-base border border-teal-200">
              👤
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Basic Account & Identity</h2>
              <p className="text-xs font-semibold text-slate-500">Your core login, name, and contact details.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Full Name <span className="text-rose-400">*</span></label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter your full name..."
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Username</label>
              <div className="relative">
                <input
                  name="username"
                  value={form.username || ""}
                  onChange={handleChange}
                  placeholder="e.g. jameel_ahmed"
                  className="form-input pr-10"
                />
                {usernameStatus === "checking" && (
                  <div className="absolute right-3 top-3.5 h-4 w-4 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
                )}
                {usernameStatus === "available" && (
                  <span className="absolute right-3 top-3 text-emerald-400 font-bold text-sm">✓</span>
                )}
              </div>
              {form.username && (
                <p className={`mt-1.5 text-[11px] font-bold ${
                  usernameStatus === "available"
                    ? "text-emerald-400"
                    : usernameStatus === "taken" || usernameStatus === "invalid"
                    ? "text-rose-400"
                    : "text-slate-500"
                }`}>
                  {usernameMessage}
                </p>
              )}
            </div>

            <div>
              <label className="form-label">Email Address</label>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full">
                <input
                  name="email"
                  type="email"
                  value={form.email || ""}
                  readOnly
                  placeholder="name@example.com"
                  className="form-input flex-1 min-w-0 text-xs sm:text-sm bg-white cursor-not-allowed font-semibold text-slate-700 truncate border-slate-200"
                />
                <button
                  type="button"
                  onClick={handleOpenEmailModal}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 sm:py-2.5 text-xs font-extrabold text-white shadow-md shadow-teal-900/40 hover:bg-teal-500 transition active:scale-95 shrink-0 whitespace-nowrap"
                >
                  <span>✏️</span>
                  <span>Change Email</span>
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">Email is locked for security. Click 'Change Email' to verify a new email via OTP.</p>
            </div>

            <div>
              <label className="form-label">Mobile Phone Number</label>
              <input
                name="mobile"
                value={form.mobile || ""}
                onChange={handleChange}
                placeholder="03001234567"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">CNIC Number</label>
              <input
                name="cnic"
                value={form.cnic || ""}
                onChange={handleChange}
                placeholder="42101-1234567-1"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Date of Birth</label>
              <input
                name="dob"
                type="date"
                value={form.dob || ""}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Country</label>
              <input
                name="country"
                value="Pakistan"
                readOnly
                className="form-input bg-white cursor-not-allowed font-semibold text-slate-500 border-slate-200"
              />
            </div>

            <div>
              <label className="form-label">City</label>
              <select
                name="city"
                value={form.city || "Karachi"}
                onChange={handleChange}
                className="form-input font-medium"
              >
                {PAKISTAN_CITIES.map((c) => (
                  <option key={c} value={c} className="bg-white text-slate-900 font-semibold">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-semibold text-slate-500">
              Ensure all details are correct before saving.
            </p>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full sm:w-auto min-w-48 py-3 text-xs font-extrabold uppercase tracking-wider"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving Changes...
                </span>
              ) : (
                "Save Personal Details ✓"
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Email Change & OTP Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative overflow-hidden w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">✉️</span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {emailStep === 1 ? "Verify New Email Address" : "Enter Verification Code"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {emailStep === 1 ? (
              <form onSubmit={handleSendEmailOtp} className="space-y-4">
                <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                  Enter your new email address below. We will send a 6-digit OTP code to verify ownership before updating your account.
                </p>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">Current Email</label>
                  <input
                    type="email"
                    value={user?.email || "Not specified"}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-xs sm:text-sm font-semibold text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                    New Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    placeholder="e.g. newemail@example.com"
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingOtp || !newEmailInput.trim()}
                    className="rounded-xl active-green-btn btn-primary bg-teal-600 !text-white px-5 py-2.5 text-xs font-black uppercase tracking-wider shadow-md shadow-teal-600/30 hover:bg-teal-700 transition disabled:opacity-50 cursor-pointer"
                  >
                    {sendingOtp ? "Sending OTP..." : "Send Verification OTP 📩"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyAndUpdateEmail} className="space-y-4">
                <div className="rounded-2xl bg-teal-50 border border-teal-200 p-3.5 text-xs font-semibold text-teal-900 leading-relaxed">
                  🔐 We sent a 6-digit OTP code to <strong className="font-extrabold text-teal-950">{newEmailInput}</strong>. Please check your inbox or spam folder.
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                    6-Digit Verification OTP Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-center text-lg font-mono font-extrabold tracking-widest text-slate-900 placeholder-slate-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setEmailStep(1)}
                    className="font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  >
                    ← Change Email Address
                  </button>
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={sendingOtp}
                    className="font-extrabold text-teal-600 hover:text-teal-700 transition cursor-pointer"
                  >
                    Resend OTP Code
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={verifyingEmail || otpInput.length < 4}
                    className="rounded-xl active-green-btn btn-primary bg-teal-600 !text-white px-5 py-2.5 text-xs font-black uppercase tracking-wider shadow-md shadow-teal-600/30 hover:bg-teal-700 transition disabled:opacity-50 cursor-pointer"
                  >
                    {verifyingEmail ? "Verifying..." : "Verify & Update Email ✓"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
