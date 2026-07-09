import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import API from "../api/axios.js";
import UserAvatar from "../components/UserAvatar.js";
const emptyForm = {
    fullName: "",
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
function toForm(user) {
    return {
        fullName: user.fullName || "",
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
function labelRole(role) {
    if (role === "super_admin")
        return "Super Admin";
    if (role === "jamaat_admin")
        return "Jamaat Admin";
    if (role === "admin")
        return "Admin";
    return "Member";
}
export default function PeopleProfile() {
    const [user, setUser] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [fetching, setFetching] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");
    const [previewUrl, setPreviewUrl] = useState("");
    const profileCompletion = useMemo(() => {
        const fields = ["fullName", "email", "mobile", "jamaat", "cast", "dob", "cnic"];
        const filled = fields.filter((field) => String(form[field] || "").trim()).length;
        return Math.round((filled / fields.length) * 100);
    }, [form]);
    const loadProfile = async () => {
        try {
            setFetching(true);
            setError("");
            const response = await API.get("/auth/me");
            setUser(response.data.user);
            setForm(toForm(response.data.user));
        }
        catch (err) {
            setError(err.response?.data?.message || "Unable to load profile.");
        }
        finally {
            setFetching(false);
        }
    };
    useEffect(() => {
        void loadProfile();
    }, []);
    useEffect(() => {
        return () => {
            if (previewUrl)
                URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);
    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };
    const handlePhotoChange = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file)
            return;
        if (!file.type.startsWith("image/")) {
            setError("Please choose an image file.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("Profile photo must be 5MB or smaller.");
            return;
        }
        if (previewUrl)
            URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));
        setError("");
        setStatus("");
        try {
            setUploadingPhoto(true);
            const formData = new FormData();
            formData.append("profilePhoto", file);
            const response = await API.post("/auth/me/photo", formData);
            setUser(response.data.user);
            setForm(toForm(response.data.user));
            setStatus("Profile photo updated.");
            window.dispatchEvent(new Event("community-profile-updated"));
        }
        catch (err) {
            setError(err.response?.data?.message || "Unable to upload profile photo.");
        }
        finally {
            setUploadingPhoto(false);
        }
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setStatus("");
        if (!form.fullName.trim()) {
            setError("Full name is required.");
            return;
        }
        try {
            setSaving(true);
            const payload = {
                ...form,
                fullName: form.fullName.trim(),
                familyMembers: form.familyMembers ? Number(form.familyMembers) : undefined,
            };
            const response = await API.put("/auth/me", payload);
            setUser(response.data.user);
            setForm(toForm(response.data.user));
            setStatus("Profile updated.");
            window.dispatchEvent(new Event("community-profile-updated"));
        }
        catch (err) {
            setError(err.response?.data?.message || "Unable to update profile.");
        }
        finally {
            setSaving(false);
        }
    };
    const photoUrl = previewUrl || user?.profilePhotoUrl || "";
    if (fetching) {
        return (_jsxs("div", { className: "mx-auto w-full max-w-6xl space-y-4", children: [_jsx("div", { className: "h-48 animate-pulse rounded-xl border border-slate-200 bg-white" }), _jsx("div", { className: "h-80 animate-pulse rounded-xl border border-slate-200 bg-white" })] }));
    }
    return (_jsx("div", { className: "mx-auto w-full max-w-6xl space-y-6", children: _jsxs("section", { className: "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_55px_-42px_rgba(15,23,42,0.75)]", children: [_jsx("div", { className: "bg-slate-950 px-5 py-6 text-white sm:px-6", children: _jsxs("div", { className: "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between", children: [_jsxs("div", { className: "flex min-w-0 items-center gap-4", children: [_jsxs("div", { className: "relative", children: [_jsx(UserAvatar, { name: user?.fullName, photoUrl: photoUrl, size: "xl", className: "ring-4 ring-white/15" }), _jsxs("label", { className: "absolute -bottom-2 -right-2 grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-white/20 bg-white text-slate-900 shadow-lg transition hover:bg-slate-100", children: [_jsx("span", { className: "sr-only", children: "Upload profile photo" }), _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3M8 8l4-4m0 0 4 4m-4-4v12" }) }), _jsx("input", { type: "file", accept: "image/*", onChange: handlePhotoChange, className: "hidden" })] })] }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-blue-200", children: labelRole(user?.role) }), _jsx("h1", { className: "mt-2 truncate text-3xl font-black leading-tight sm:text-4xl", children: user?.fullName || "Your Profile" }), _jsxs("p", { className: "mt-2 truncate text-sm text-slate-300", children: ["@", user?.username || "member", " ", user?.jamaat ? `- ${user.jamaat}` : ""] })] })] }), _jsxs("div", { className: "rounded-xl border border-white/10 bg-white/10 p-4 text-left sm:min-w-56", children: [_jsx("p", { className: "text-xs font-bold uppercase tracking-[0.14em] text-slate-300", children: "Profile completion" }), _jsx("div", { className: "mt-3 h-2 overflow-hidden rounded-full bg-white/15", children: _jsx("div", { className: "h-full rounded-full bg-emerald-400", style: { width: `${profileCompletion}%` } }) }), _jsxs("p", { className: "mt-2 text-sm font-bold", children: [profileCompletion, "% complete"] })] })] }) }), _jsxs("form", { onSubmit: handleSubmit, className: "grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.8fr]", children: [_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { children: [_jsx("h2", { className: "page-title text-xl", children: "Personal Details" }), _jsx("p", { className: "page-subtitle mt-1 text-sm", children: "Keep your community record accurate." })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { className: "form-label", children: "Full Name" }), _jsx("input", { name: "fullName", value: form.fullName, onChange: handleChange, className: "form-input", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "form-label", children: "Father Name" }), _jsx("input", { name: "fatherName", value: form.fatherName || "", onChange: handleChange, className: "form-input" })] }), _jsxs("div", { children: [_jsx("label", { className: "form-label", children: "Mother Name" }), _jsx("input", { name: "motherName", value: form.motherName || "", onChange: handleChange, className: "form-input" })] }), _jsxs("div", { children: [_jsx("label", { className: "form-label", children: "Email" }), _jsx("input", { name: "email", type: "email", value: form.email || "", onChange: handleChange, className: "form-input" })] }), _jsxs("div", { children: [_jsx("label", { className: "form-label", children: "Mobile" }), _jsx("input", { name: "mobile", value: form.mobile || "", onChange: handleChange, className: "form-input" })] }), _jsxs("div", { children: [_jsx("label", { className: "form-label", children: "CNIC" }), _jsx("input", { name: "cnic", value: form.cnic || "", onChange: handleChange, className: "form-input" })] }), _jsxs("div", { children: [_jsx("label", { className: "form-label", children: "Date of Birth" }), _jsx("input", { name: "dob", type: "date", value: form.dob || "", onChange: handleChange, className: "form-input" })] })] })] }), _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { children: [_jsx("h2", { className: "page-title text-xl", children: "Community Details" }), _jsx("p", { className: "page-subtitle mt-1 text-sm", children: "These details help admins organize members." })] }), _jsxs("div", { className: "grid gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "form-label", children: "Jamaat / Group" }), _jsx("input", { name: "jamaat", value: form.jamaat || "", onChange: handleChange, className: "form-input" })] }), _jsxs("div", { children: [_jsx("label", { className: "form-label", children: "Cast" }), _jsx("input", { name: "cast", value: form.cast || "", onChange: handleChange, className: "form-input" })] }), _jsxs("div", { children: [_jsx("label", { className: "form-label", children: "Family Members" }), _jsx("input", { name: "familyMembers", type: "number", min: "0", value: form.familyMembers, onChange: handleChange, className: "form-input" })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { className: "form-label", children: "Home Status" }), _jsxs("select", { name: "homeStatus", value: form.homeStatus, onChange: handleChange, className: "form-input", children: [_jsx("option", { value: "Owner", children: "Owner" }), _jsx("option", { value: "Rent", children: "Rent" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "form-label", children: "Occupation" }), _jsxs("select", { name: "occupation", value: form.occupation, onChange: handleChange, className: "form-input", children: [_jsx("option", { value: "Employee", children: "Employee" }), _jsx("option", { value: "Business Man", children: "Business Man" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "form-label", children: "Business Name" }), _jsx("input", { name: "businessName", value: form.businessName || "", onChange: handleChange, className: "form-input" })] })] })] }), _jsxs("div", { className: "lg:col-span-2", children: [(error || status || uploadingPhoto) && (_jsx("div", { className: `mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`, children: error || (uploadingPhoto ? "Uploading profile photo..." : status) })), _jsx("button", { type: "submit", disabled: saving, className: "btn-primary rounded-xl px-5 py-3 text-sm font-bold transition disabled:opacity-60", children: saving ? "Saving..." : "Save Profile" })] })] })] }) }));
}
