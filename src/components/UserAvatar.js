import { jsx as _jsx } from "react/jsx-runtime";
const sizeClasses = {
    sm: "h-8 w-8 text-xs rounded-lg",
    md: "h-11 w-11 text-sm rounded-xl",
    lg: "h-16 w-16 text-lg rounded-2xl",
    xl: "h-28 w-28 text-3xl rounded-3xl",
};
export function getInitials(name) {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0)
        return "U";
    return parts
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}
export default function UserAvatar({ name, photoUrl, size = "md", className = "" }) {
    const sizeClass = sizeClasses[size];
    if (photoUrl) {
        return (_jsx("img", { src: photoUrl, alt: name ? `${name} profile` : "Profile", className: `${sizeClass} shrink-0 object-cover ring-1 ring-slate-200 ${className}` }));
    }
    return (_jsx("div", { className: `${sizeClass} grid shrink-0 place-items-center bg-slate-900 font-black text-white ring-1 ring-slate-200 ${className}`, children: getInitials(name) }));
}
