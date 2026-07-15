import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import API from "../api/axios.js";
import UserAvatar from "../components/UserAvatar.js";

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
  homeStatus?: "Owner" | "Rent";
  occupation?: "Employee" | "Business Man";
  businessName?: string;
  role?: string;
  jamaat?: string;
  profilePhotoUrl?: string;
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
    homeStatus: user.homeStatus || "Owner",
    occupation: user.occupation || "Employee",
    businessName: user.businessName || "",
    jamaat: user.jamaat || "",
  };
}

function labelRole(role?: string) {
  if (role === "super_admin") return "Super Admin";
  if (role === "jamaat_admin" || role === "moderator") return "Moderator";
  if (role === "admin") return "Admin";
  return "Member";
}

export default function PeopleProfile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [usernameMessage, setUsernameMessage] = useState("");

  const profileCompletion = useMemo(() => {
    const fields = ["fullName", "email", "mobile", "dob", "cnic"] as const;
    const filled = fields.filter((field) => String(form[field] || "").trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [form]);

  const loadProfile = async () => {
    try {
      setFetching(true);
      setError("");
      const response = await API.get<{ user: UserProfile }>("/auth/me");
      setUser(response.data.user);
      setForm(toForm(response.data.user));
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load profile.");
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
      setError("Please choose an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile photo must be 5MB or smaller.");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setError("");
    setStatus("");

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append("profilePhoto", file);
      const response = await API.post<{ user: UserProfile }>("/auth/me/photo", formData);
      setUser(response.data.user);
      setForm(toForm(response.data.user));
      setStatus("Profile photo updated.");
      window.dispatchEvent(new Event("community-profile-updated"));
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to upload profile photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setStatus("");

    if (!form.fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    const normalizedUsername = form.username?.trim().toLowerCase() || "";
    if (normalizedUsername) {
      if (usernameStatus === "checking") {
        setError("Please wait while we check username availability.");
        return;
      }

      if (usernameStatus === "invalid" || usernameStatus === "taken") {
        setError("Choose a valid, available username before saving.");
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
      setStatus("Profile updated.");
      window.dispatchEvent(new Event("community-profile-updated"));
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const photoUrl = previewUrl || user?.profilePhotoUrl || "";

  if (fetching) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <div className="h-48 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_55px_-42px_rgba(15,23,42,0.75)]">
        <div className="bg-slate-950 px-5 py-6 text-white sm:px-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative">
                <UserAvatar name={user?.fullName} photoUrl={photoUrl} size="xl" className="ring-4 ring-white/15" />
                <label className="absolute -bottom-2 -right-2 grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-white/20 bg-white text-slate-900 shadow-lg transition hover:bg-slate-100">
                  <span className="sr-only">Upload profile photo</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3M8 8l4-4m0 0 4 4m-4-4v12" />
                  </svg>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">{labelRole(user?.role)}</p>
                <h1 className="mt-2 truncate text-3xl font-black leading-tight sm:text-4xl">{user?.fullName || "Your Profile"}</h1>
                <p className="mt-2 truncate text-sm text-slate-300">@{user?.username || "member"}</p>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-4 text-left sm:min-w-56">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-300">Profile completion</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${profileCompletion}%` }} />
              </div>
              <p className="mt-2 text-sm font-bold">{profileCompletion}% complete</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="space-y-5">
            <div>
              <h2 className="page-title text-xl">Personal Details</h2>
              <p className="page-subtitle mt-1 text-sm">Keep your community record accurate.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="form-label">Full Name</label>
                <input name="fullName" value={form.fullName} onChange={handleChange} className="form-input" required />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">Username</label>
                <input name="username" value={form.username || ""} onChange={handleChange} className="form-input" placeholder="e.g. community_member" />
                <p className="mt-2 text-xs text-slate-500">Use lowercase letters, numbers, dots, underscores, or hyphens.</p>
                {form.username ? (
                  <p className={`mt-2 text-sm ${usernameStatus === "available" ? "text-emerald-600" : usernameStatus === "taken" || usernameStatus === "invalid" ? "text-rose-600" : "text-slate-500"}`}>
                    {usernameStatus === "checking"
                      ? "Checking availability..."
                      : usernameStatus === "available"
                        ? "Username available."
                        : usernameStatus === "taken"
                          ? "Username already taken."
                          : usernameStatus === "invalid"
                            ? "Please choose a valid username."
                            : usernameMessage}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="form-label">Email</label>
                <input name="email" type="email" value={form.email || ""} onChange={handleChange} className="form-input" />
              </div>
              <div>
                <label className="form-label">Mobile</label>
                <input name="mobile" value={form.mobile || ""} onChange={handleChange} className="form-input" />
              </div>
              <div>
                <label className="form-label">CNIC</label>
                <input name="cnic" value={form.cnic || ""} onChange={handleChange} className="form-input" />
              </div>
              <div>
                <label className="form-label">Date of Birth</label>
                <input name="dob" type="date" value={form.dob || ""} onChange={handleChange} className="form-input" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {(error || status || uploadingPhoto) && (
              <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                {error || (uploadingPhoto ? "Uploading profile photo..." : status)}
              </div>
            )}
            <button type="submit" disabled={saving} className="btn-primary rounded-xl px-5 py-3 text-sm font-bold transition disabled:opacity-60">
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
