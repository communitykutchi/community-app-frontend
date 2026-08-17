import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SESSION_EXPIRED_EVENT, resetSessionExpiredState } from "../auth/session";

export default function SessionExpiredModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleSessionExpired = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      const msg =
        customEvent.detail?.message ||
        "Your account was logged in on another device. You have been logged out automatically.";

      // Do not show modal if already on login/register page
      if (
        location.pathname === "/login" ||
        location.pathname === "/register" ||
        location.pathname === "/banned"
      ) {
        return;
      }

      setMessage(msg);
      setIsOpen(true);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [location.pathname]);

  const handleGoToLogin = () => {
    setIsOpen(false);
    resetSessionExpiredState();
    navigate("/login", { replace: true });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 text-slate-900 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
        {/* Soft Background Accent */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Icon */}
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 shadow-inner">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9l3 3m0 0l-3 3m3-3H9"
            />
          </svg>
        </div>

        {/* Header Content */}
        <div className="space-y-1.5">
          <h3
            id="session-expired-title"
            className="text-xl font-black tracking-tight text-slate-900"
          >
            Session Terminated
          </h3>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
            Account Logged In On Another Device
          </p>
        </div>

        {/* Message */}
        <p className="text-sm font-medium leading-relaxed text-slate-600 px-1">
          {message}
        </p>

        {/* Security Notice Pill */}
        <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 border border-slate-200/60 p-3 text-xs font-bold text-slate-500">
          <svg className="w-4 h-4 text-teal-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <span>Single-device session security is active.</span>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleGoToLogin}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-black text-sm py-3 px-6 shadow-lg shadow-teal-700/25 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Log In Again</span>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
