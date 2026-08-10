import React, { useState } from "react";

interface UserAvatarProps {
  name?: string;
  photoUrl?: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 rounded-lg",
  md: "h-11 w-11 rounded-xl",
  lg: "h-16 w-16 rounded-2xl",
  xl: "h-24 w-24 sm:h-28 sm:w-28 rounded-3xl",
};

const iconSizes = {
  sm: "w-5 h-5",
  md: "w-7 h-7",
  lg: "w-10 h-10",
  xl: "w-16 h-16 sm:w-18 sm:h-18",
};

export default function UserAvatar({ name, photoUrl, src, size = "md", className = "" }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const iconSize = iconSizes[size] || iconSizes.md;
  const resolvedPhoto = photoUrl || src;

  if (resolvedPhoto && !imageError) {
    return (
      <img
        src={resolvedPhoto}
        alt={name ? `${name} profile` : "Profile"}
        onError={() => setImageError(true)}
        className={`${sizeClass} shrink-0 object-cover ring-1 ring-slate-200 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center bg-slate-200 text-slate-400 overflow-hidden ring-1 ring-slate-300/80 shadow-2xs ${className}`}
      aria-label={name || "User Profile"}
    >
      <svg className={`${iconSize} fill-slate-400/90 mt-1`} viewBox="0 0 24 24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  );
}
