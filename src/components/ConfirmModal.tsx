import React, { useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onCancel();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: "🗑️",
      iconBg: "bg-red-50 text-red-600 border border-red-200",
      confirmBtn: "bg-red-600 hover:bg-red-500 text-white font-black shadow-lg shadow-red-600/30 active:bg-red-700",
    },
    warning: {
      icon: "⚠️",
      iconBg: "bg-amber-50 text-amber-600 border border-amber-200",
      confirmBtn: "bg-amber-600 hover:bg-amber-500 text-white font-black shadow-lg shadow-amber-600/30 active:bg-amber-700",
    },
    info: {
      icon: "ℹ️",
      iconBg: "bg-teal-50 text-teal-600 border border-teal-200",
      confirmBtn: "bg-teal-600 hover:bg-teal-500 text-white font-black shadow-lg shadow-teal-600/30 active:bg-teal-700",
    },
  }[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm transition-opacity duration-200 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 text-slate-900 shadow-2xl space-y-5 transition-all">
        {/* Top Header & Icon */}
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${variantStyles.iconBg}`}>
            {variantStyles.icon}
          </div>
          <div className="space-y-1 pt-0.5">
            <h3 className="text-lg font-black tracking-tight text-slate-900">
              {title}
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              Please confirm your action
            </p>
          </div>
        </div>

        {/* Message Body */}
        <div className="text-xs sm:text-sm font-medium leading-relaxed text-slate-600">
          {message}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider transition cursor-pointer active:scale-95 disabled:opacity-50 ${variantStyles.confirmBtn}`}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
