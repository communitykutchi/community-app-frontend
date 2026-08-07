import React from "react";

export default function Loader({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  }[size];

  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full border-teal-600 border-t-transparent ${sizeClasses}`} />
    </div>
  );
}
