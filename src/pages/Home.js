import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
const quickActions = [
    {
        title: "Community Feed",
        description: "Posts, photos, aur updates ko aik jagah par follow karein.",
        to: "/feed",
    },
    {
        title: "Notices",
        description: "Important announcements aur mayyat notifications ko jaldi dekhein.",
        to: "/notices",
    },
    {
        title: "Profile",
        description: "Apni details update karen aur community profile complete rakhein.",
        to: "/profile",
    },
];
const highlights = [
    "Real-time community updates",
    "Fast access to notices and announcements",
    "Simple profile management",
    "Shared space for members and moderators",
];
export default function Home() {
    return (_jsxs("section", { className: "w-full space-y-6", children: [_jsxs("div", { className: "overflow-hidden rounded-[1.5rem] border border-emerald-200 bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-700 p-8 text-white shadow-[0_24px_60px_-30px_rgba(5,150,105,0.55)] sm:p-10", children: [_jsx("p", { className: "inline-flex rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100", children: "Community Portal" }), _jsx("h1", { className: "mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-4xl", children: "Welcome to your All Kutchi Community Hub" }), _jsx("p", { className: "mt-4 max-w-3xl text-base leading-7 text-emerald-50", children: "Yeh platform aapko community updates, notices, aur members ke sath rabta mein rakhta hai. Aik hi jagah se announcements dekhen, posts share karein, aur apni jamaat activities ko track karein." }), _jsxs("div", { className: "mt-6 flex flex-wrap gap-3", children: [_jsx(Link, { to: "/feed", className: "rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100", children: "Open Feed" }), _jsx(Link, { to: "/notices", className: "rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20", children: "View Notices" })] })] }), _jsxs("div", { className: "grid gap-4 lg:grid-cols-[1.1fr_0.9fr]", children: [_jsxs("div", { className: "rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-sm", children: [_jsx("h2", { className: "text-xl font-black text-slate-900", children: "Quick actions" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-slate-600", children: "Apni community experience ko agay barhane ke liye ye important sections use karein." }), _jsx("div", { className: "mt-5 space-y-3", children: quickActions.map((item) => (_jsxs(Link, { to: item.to, className: "flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-slate-900", children: item.title }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: item.description })] }), _jsx("span", { className: "ml-4 text-lg font-semibold text-blue-700", children: "\u2192" })] }, item.title))) })] }), _jsxs("div", { className: "rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-sm", children: [_jsx("h2", { className: "text-xl font-black text-slate-900", children: "Why this space matters" }), _jsx("ul", { className: "mt-4 space-y-3 text-sm leading-6 text-slate-600", children: highlights.map((item) => (_jsxs("li", { className: "flex gap-2", children: [_jsx("span", { className: "mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" }), _jsx("span", { children: item })] }, item))) }), _jsxs("div", { className: "mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4", children: [_jsx("p", { className: "text-sm font-semibold text-blue-800", children: "Tip" }), _jsx("p", { className: "mt-1 text-sm leading-6 text-blue-700", children: "Rozana notices check karein aur feed par naye updates share karte rahein." })] })] })] })] }));
}
