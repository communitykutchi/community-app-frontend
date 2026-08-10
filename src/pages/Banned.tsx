import React from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthToken } from "../auth/session";

interface BannedProps {
  banDuration?: string;
  bannedUntil?: string;
  message?: string;
}

export default function Banned({ banDuration, bannedUntil, message }: BannedProps) {
  const navigate = useNavigate();

  const handleBackToLogin = () => {
    clearAuthToken();
    navigate("/login");
  };

  const formattedUntil = bannedUntil
    ? new Date(bannedUntil).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 bg-white text-white">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-red-500/40 bg-white p-6 sm:p-8 shadow-2xl shadow-red-500/10 text-center animate-in fade-in zoom-in">
        {/* Shield Icon Box */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-red-500/50 bg-red-950/60 shadow-lg shadow-red-500/20">
          <span className="text-4xl">🛡️</span>
        </div>

        <h1 className="mt-5 text-2xl font-black tracking-wide text-white">Account Suspended</h1>

        <div className="mt-3 inline-block rounded-full bg-red-900/60 px-4 py-1 text-xs font-black uppercase tracking-wider text-red-300 border border-red-700/50">
          ⚠️ Rules Violation Detected
        </div>

        {/* Reason Box */}
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-700 font-medium">
          {message ||
            "Aapka account community rules aur guidelines violation ki waja se suspend kar diya gaya hai. Jab tak ban duration khatam nahi hoti, access restricted rahega."}
        </div>

        {/* Ban Details Card */}
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-500">Ban Period:</span>
            <span className="font-extrabold uppercase text-red-400">{(banDuration || "permanent").toUpperCase()} BAN</span>
          </div>

          <div className="my-2 h-[1px] bg-slate-50" />

          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-500">Unban Status:</span>
            <span className={`font-bold ${formattedUntil ? "text-amber-300" : "text-red-400"}`}>
              {formattedUntil ? `Unban Date: ${formattedUntil}` : "Permanent Lifetime Ban"}
            </span>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-slate-500 leading-normal">
          Agar aapko lagta hai ye galti se hua hai, to community super admin se rabta karein.
        </p>

        <button
          onClick={handleBackToLogin}
          className="mt-6 w-full rounded-2xl bg-teal-600 py-3.5 text-sm font-black text-white shadow-lg shadow-teal-600/30 hover:bg-teal-500 transition active:scale-95"
        >
          ← Back to Login
        </button>
      </div>
    </div>
  );
}
