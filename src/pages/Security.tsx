import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import Toast from "../components/Toast";
import Loader from "../components/Loader";
import { persistAuthToken } from "../auth/session";

interface UserInfo {
  _id: string;
  fullName: string;
  username?: string;
  email?: string;
  mobile?: string;
  role?: string;
  jamaat?: string;
  lastActive?: string;
}

export default function Security() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [step, setStep] = useState<1 | 2>(1);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [verifyingCurrent, setVerifyingCurrent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Per-field error messages
  const [fieldErrors, setFieldErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; isVisible: boolean }>({
    message: "",
    type: "success",
    isVisible: false,
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type, isVisible: true });
  };

  useEffect(() => {
    API.get<{ user?: UserInfo }>("/auth/me")
      .then((res) => {
        if (res.data?.user) {
          setUser(res.data.user);
        }
      })
      .catch(() => {
        showToast("Unable to load profile security details.", "error");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleVerifyCurrentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim()) {
      setFieldErrors({ currentPassword: "Current password is required." });
      return;
    }

    setFieldErrors({});
    setVerifyingCurrent(true);
    try {
      let res: any;
      try {
        res = await API.post<{ success: boolean; message?: string }>("/auth/verify-password", {
          currentPassword: currentPassword.trim(),
        });
      } catch (endpointErr: any) {
        if (endpointErr.response?.status === 404) {
          try {
            res = await API.post<{ success: boolean; message?: string }>("/auth/change-password", {
              currentPassword: currentPassword.trim(),
              verifyOnly: true,
            });
          } catch (secondErr: any) {
            if (secondErr.response?.status === 400 && secondErr.response?.data?.message?.includes("new password")) {
              setStep(2);
              setFieldErrors({});
              return;
            }
            throw secondErr;
          }
        } else {
          throw endpointErr;
        }
      }

      if (res?.data?.success) {
        setStep(2);
        setFieldErrors({});
        showToast("Current password verified! Now enter your new password.", "success");
      } else {
        setFieldErrors({ currentPassword: res?.data?.message || "Incorrect current password." });
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message;
      if (err.response?.status === 400 && errMsg) {
        setFieldErrors({ currentPassword: errMsg });
      } else if (err.response?.status === 401) {
        showToast("Your session has expired. Please log in again.", "error");
      } else {
        setFieldErrors({ currentPassword: errMsg || "Incorrect current password. Please check and try again." });
      }
    } finally {
      setVerifyingCurrent(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: {
      newPassword?: string;
      confirmPassword?: string;
    } = {};

    if (!newPassword.trim()) {
      errors.newPassword = "New password is required.";
    } else if (newPassword.length < 6) {
      errors.newPassword = "New password must be at least 6 characters long.";
    } else if (currentPassword && newPassword === currentPassword) {
      errors.newPassword = "New password cannot be the same as your current password.";
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your new password.";
    } else if (newPassword && confirmPassword !== newPassword) {
      errors.confirmPassword = "Confirm password does not match new password.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const res = await API.post<{ success: boolean; message?: string; token?: string }>("/auth/change-password", {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });

      if (res.data?.token) {
        persistAuthToken(res.data.token);
      }

      showToast("Password updated successfully! Your active session is secured.", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStep(1);
      setFieldErrors({});
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Failed to update password.";
      const lowerMsg = errMsg.toLowerCase();

      if (lowerMsg.includes("current password") || lowerMsg.includes("incorrect")) {
        setStep(1);
        setFieldErrors({ currentPassword: "Incorrect current password. Please verify again." });
      } else if (lowerMsg.includes("new password") || lowerMsg.includes("at least 6")) {
        setFieldErrors({ newPassword: errMsg });
      } else {
        showToast(errMsg, "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center space-y-3">
        <Loader size="lg" />
        <p className="text-xs font-bold text-slate-500">Loading Security & Privacy settings...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 text-slate-900">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((t) => ({ ...t, isVisible: false }))}
      />

      {/* Security Hero Header */}
      <div className="page-hero-banner relative overflow-hidden rounded-3xl border border-teal-200/80 bg-gradient-to-br from-emerald-600 via-teal-600 to-teal-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-100 backdrop-blur-md border border-white/20">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Account Security Center</span>
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-black text-white tracking-tight">Security & Privacy</h1>
            <p className="mt-1 text-xs sm:text-sm text-emerald-100 max-w-xl">
              Manage your password, single-device session protection, and credentials safety.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 rounded-2xl bg-white/15 px-3 py-2 text-xs font-bold text-white border border-white/20 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
              Active Protection
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Password Update Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-100">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Change Account Password</h2>
                  <p className="text-xs text-slate-500">
                    {step === 1 ? "Step 1: First verify your current password." : "Step 2: Enter and confirm your new password."}
                  </p>
                </div>
              </div>

              {/* Step indicator pill */}
              <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600 border border-slate-200">
                <span className={`h-2 w-2 rounded-full ${step === 1 ? "bg-teal-600" : "bg-emerald-500"}`} />
                <span>Step {step} of 2</span>
              </div>
            </div>

            {/* STEP 1: VERIFY CURRENT PASSWORD */}
            {step === 1 && (
              <form onSubmit={handleVerifyCurrentPassword} className="space-y-4" noValidate>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Current Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        if (fieldErrors.currentPassword) {
                          setFieldErrors((prev) => ({ ...prev, currentPassword: undefined }));
                        }
                      }}
                      placeholder="Enter your current password to continue"
                      className={`w-full rounded-2xl border ${
                        fieldErrors.currentPassword
                          ? "border-rose-500 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-500/20"
                          : "border-slate-200 bg-slate-50 focus:border-teal-500 focus:bg-white focus:ring-teal-500/20"
                      } px-4 py-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:ring-2 transition pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((v) => !v)}
                      onMouseDown={(e) => e.preventDefault()}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-teal-600 hover:bg-slate-100 transition cursor-pointer select-none z-10"
                      aria-label={showCurrent ? "Hide password" : "Show password"}
                      title={showCurrent ? "Hide password" : "Show password"}
                    >
                      {showCurrent ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.5 12c1.5 4.5 5.7 7.5 10.5 7.5 1.6 0 3.1-.3 4.5-.9M6.6 6.6A10.45 10.45 0 0112 4.5c4.8 0 9 3 10.5 7.5a10.4 10.4 0 01-1.3 2.4M9.88 9.88a3 3 0 104.24 4.24M3.5 3.5l17 17" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {fieldErrors.currentPassword && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-rose-500 animate-in fade-in duration-200">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{fieldErrors.currentPassword}</span>
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={verifyingCurrent}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 py-3 text-xs font-extrabold text-white shadow-lg shadow-teal-500/25 hover:from-teal-400 hover:to-emerald-500 transition active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    {verifyingCurrent ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Verifying Current Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Continue</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: ENTER NEW PASSWORD & CONFIRM */}
            {step === 2 && (
              <form onSubmit={handleChangePassword} className="space-y-4" noValidate>
                {/* Verified Current Password Badge */}
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 p-3.5 text-xs text-emerald-900 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-600 text-white font-black text-xs shadow-sm">
                      ✓
                    </span>
                    <div>
                      <p className="font-extrabold text-emerald-950">Current Password Verified</p>
                      <p className="text-[11px] text-emerald-700">Identity confirmed. Now choose a new secure password.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setNewPassword("");
                      setConfirmPassword("");
                      setFieldErrors({});
                    }}
                    className="text-xs font-extrabold text-emerald-700 hover:text-emerald-950 underline cursor-pointer shrink-0"
                  >
                    Change
                  </button>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (fieldErrors.newPassword) {
                          setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
                        }
                        if (confirmPassword && e.target.value !== confirmPassword && fieldErrors.confirmPassword) {
                          setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                        }
                      }}
                      placeholder="Minimum 6 characters"
                      className={`w-full rounded-2xl border ${
                        fieldErrors.newPassword
                          ? "border-rose-500 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-500/20"
                          : "border-slate-200 bg-slate-50 focus:border-teal-500 focus:bg-white focus:ring-teal-500/20"
                      } px-4 py-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:ring-2 transition pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      onMouseDown={(e) => e.preventDefault()}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-teal-600 hover:bg-slate-100 transition cursor-pointer select-none z-10"
                      aria-label={showNew ? "Hide password" : "Show password"}
                      title={showNew ? "Hide password" : "Show password"}
                    >
                      {showNew ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.5 12c1.5 4.5 5.7 7.5 10.5 7.5 1.6 0 3.1-.3 4.5-.9M6.6 6.6A10.45 10.45 0 0112 4.5c4.8 0 9 3 10.5 7.5a10.4 10.4 0 01-1.3 2.4M9.88 9.88a3 3 0 104.24 4.24M3.5 3.5l17 17" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {fieldErrors.newPassword && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-rose-500 animate-in fade-in duration-200">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{fieldErrors.newPassword}</span>
                    </p>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword) {
                          setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                        }
                      }}
                      placeholder="Re-type new password"
                      className={`w-full rounded-2xl border ${
                        fieldErrors.confirmPassword
                          ? "border-rose-500 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-500/20"
                          : "border-slate-200 bg-slate-50 focus:border-teal-500 focus:bg-white focus:ring-teal-500/20"
                      } px-4 py-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:ring-2 transition pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      onMouseDown={(e) => e.preventDefault()}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-teal-600 hover:bg-slate-100 transition cursor-pointer select-none z-10"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                      title={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.5 12c1.5 4.5 5.7 7.5 10.5 7.5 1.6 0 3.1-.3 4.5-.9M6.6 6.6A10.45 10.45 0 0112 4.5c4.8 0 9 3 10.5 7.5a10.4 10.4 0 01-1.3 2.4M9.88 9.88a3 3 0 104.24 4.24M3.5 3.5l17 17" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-rose-500 animate-in fade-in duration-200">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{fieldErrors.confirmPassword}</span>
                    </p>
                  )}
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 py-3 text-xs font-extrabold text-white shadow-lg shadow-teal-500/25 hover:from-teal-400 hover:to-emerald-500 transition active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Update Password</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setNewPassword("");
                      setConfirmPassword("");
                      setFieldErrors({});
                    }}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Account Security & Session Overview */}
        <div className="space-y-6">
          {/* Active Session Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Current Active Session</h3>
                <p className="text-[11px] text-slate-500">Your device is verified and secured.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-semibold text-slate-500">Status:</span>
                <span className="font-extrabold text-emerald-600 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Active Device
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-semibold text-slate-500">Account:</span>
                <span className="font-bold text-slate-900 truncate max-w-[140px]">
                  {user?.fullName || "Member"}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-semibold text-slate-500">Username:</span>
                <span className="font-bold text-slate-900">
                  {user?.username ? `@${user.username}` : "Not set"}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-semibold text-slate-500">Mobile:</span>
                <span className="font-bold text-slate-900">{user?.mobile || "—"}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-semibold text-slate-500">Email:</span>
                <span className="font-bold text-slate-900 truncate max-w-[140px]">{user?.email || "—"}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-3.5 text-xs text-teal-800 space-y-1">
              <p className="font-black flex items-center gap-1.5">
                <span>🛡️</span>
                <span>Single-Device Protection</span>
              </p>
              <p className="text-[11px] text-teal-700 leading-relaxed">
                If your account is logged in on another device, this device will automatically log out and notify you instantly to prevent unauthorized access.
              </p>
            </div>
          </div>

          {/* Privacy & Safety Tips */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xl space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">Safety Guidelines</h3>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
              <li>Never share your OTP or password with anyone.</li>
              <li>Keep your mobile number updated in your profile.</li>
              <li>Use a password with a mix of letters and numbers.</li>
            </ul>

            <div className="pt-2 border-t border-slate-100">
              <Link
                to="/help"
                className="text-xs font-bold text-teal-600 hover:text-teal-700 transition flex items-center gap-1"
              >
                <span>Need help? Contact Community Support</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
