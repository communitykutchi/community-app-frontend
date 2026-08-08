import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import API from "../api/axios";
import UserAvatar from "../components/UserAvatar";
import Toast from "../components/Toast";
import { PAKISTAN_CITIES } from "../utils/pakistanCities";

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

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type, isVisible: true });
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
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* Cover Photo Header */}
        <div className="relative h-40 sm:h-48 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 overflow-hidden">
          <img
            src={coverPreviewUrl || user?.coverPhotoUrl || "/cover.png"}
            alt="Cover Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/30" />

          {/* Upload Cover Photo Button */}
          <label className="absolute top-4 right-4 z-10 flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/20 bg-slate-900/60 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-md hover:bg-slate-900/80 transition shadow-lg">
            <span>📷</span>
            <span>{uploadingCover ? "Uploading Cover..." : "Change Cover"}</span>
            <input type="file" accept="image/*" onChange={handleCoverPhotoChange} className="hidden" />
          </label>
        </div>

        {/* Profile Info Bar */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between -mt-12 sm:-mt-16 relative z-10">
            <div className="flex flex-wrap items-end gap-4">
              <div className="relative shrink-0">
                <UserAvatar name={user?.fullName} photoUrl={photoUrl} size="xl" className="ring-4 ring-white bg-white shadow-xl" />
                <label className="absolute -bottom-1 -right-1 grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-md transition hover:bg-slate-100 hover:scale-105 active:scale-95">
                  <span className="sr-only">Upload profile photo</span>
                  {uploadingPhoto ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
                      <circle cx="12" cy="13" r="3" />
                    </svg>
                  )}
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
              </div>

              <div className="min-w-0 pb-1">
                <span className="inline-block rounded-full bg-teal-50 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-teal-800 border border-teal-200">
                  {labelRole(user?.role)}
                </span>
                <h1 className="mt-1 truncate text-2xl sm:text-3xl font-extrabold text-slate-900">{user?.fullName || "Personal Details"}</h1>
                <p className="mt-0.5 truncate text-xs text-slate-500">@{user?.username || "member"} • {user?.mobile || user?.email || "No contact info"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:min-w-56 shrink-0 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700">
                <span>Profile Completion</span>
                <span className="text-teal-700 font-extrabold">{profileCompletion}%</span>
              </div>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-teal-600 transition-all duration-500" style={{ width: `${profileCompletion}%` }} />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">Fill all community fields to complete your profile.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Identity Information */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-teal-50 text-teal-700 font-extrabold text-base">
              👤
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Basic Account & Identity</h2>
              <p className="text-xs text-slate-500">Your core login, name, and contact details.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Full Name <span className="text-rose-500">*</span></label>
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
                  <div className="absolute right-3 top-3.5 h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                )}
                {usernameStatus === "available" && (
                  <span className="absolute right-3 top-3 text-emerald-600 font-bold text-sm">✓</span>
                )}
              </div>
              {form.username && (
                <p className={`mt-1.5 text-[11px] font-bold ${
                  usernameStatus === "available"
                    ? "text-emerald-600"
                    : usernameStatus === "taken" || usernameStatus === "invalid"
                    ? "text-rose-600"
                    : "text-slate-500"
                }`}>
                  {usernameMessage}
                </p>
              )}
            </div>

            <div>
              <label className="form-label">Email Address</label>
              <input
                name="email"
                type="email"
                value={form.email || ""}
                onChange={handleChange}
                placeholder="name@example.com"
                className="form-input"
              />
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
                className="form-input bg-slate-100 cursor-not-allowed font-semibold text-slate-700"
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
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
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
    </div>
  );
}
