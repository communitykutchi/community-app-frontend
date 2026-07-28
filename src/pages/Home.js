import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
const homeTranslations = {
    communityPortal: 'Community Portal',
    welcomeTitle: 'Welcome to your All Kutchi Community Hub',
    welcomeSubtitle: 'This platform keeps you connected to community updates, notices, and members.',
    openFeed: 'Open Feed',
    viewNotices: 'View Notices',
    quickActionsTitle: 'Quick actions',
    quickActionsDesc: 'Use these important sections to improve your community experience.',
    whyThisSpace: 'Why this space matters',
    highlight_1: 'Real-time community updates',
    highlight_2: 'Fast access to notices and announcements',
    highlight_3: 'Simple profile management',
    highlight_4: 'Shared space for members and moderators',
    tipTitle: 'Tip',
    tipDesc: 'Check notices daily and keep sharing updates on the feed.',
    ca_feed_title: 'Community Feed',
    ca_feed_description: 'Follow posts, photos, and updates in one place.',
    ca_notices_title: 'Notices',
    ca_notices_description: 'See important announcements and obituaries quickly.',
    ca_friends_title: 'Friends',
    ca_friends_description: 'Search members, add friends, and start conversations.',
    ca_profile_title: 'Profile',
    ca_profile_description: 'Update your details and keep your community profile complete.',
};
const t = (key) => homeTranslations[key] || key;
export default function Home() {
    const quickActions = [
        {
            title: t('ca_feed_title'),
            description: t('ca_feed_description'),
            to: "/feed",
        },
        {
            title: t('ca_friends_title'),
            description: t('ca_friends_description'),
            to: "/friends",
        },
        {
            title: t('ca_notices_title'),
            description: t('ca_notices_description'),
            to: "/notices",
        },
        {
            title: t('ca_profile_title'),
            description: t('ca_profile_description'),
            to: "/profile",
        },
    ];
    const highlights = [
        t('highlight_1'),
        t('highlight_2'),
        t('highlight_3'),
        t('highlight_4'),
    ];
    return (_jsxs("section", { className: "w-full space-y-6", children: [_jsxs("div", { className: "overflow-hidden rounded-[1.5rem] border border-emerald-200 bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-700 p-8 text-white shadow-[0_24px_60px_-30px_rgba(5,150,105,0.55)] sm:p-10", children: [_jsx("p", { className: "inline-flex rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100", children: t('communityPortal') }), _jsx("h1", { className: "mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-4xl", children: t('welcomeTitle') }), _jsx("p", { className: "mt-4 max-w-3xl text-base leading-7 text-emerald-50", children: t('welcomeSubtitle') }), _jsxs("div", { className: "mt-6 flex flex-wrap gap-3", children: [_jsx(Link, { to: "/feed", className: "rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100", children: t('openFeed') }), _jsx(Link, { to: "/notices", className: "rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20", children: t('viewNotices') })] })] }), _jsxs("div", { className: "grid gap-4 lg:grid-cols-[1.1fr_0.9fr]", children: [_jsxs("div", { className: "rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-sm", children: [_jsx("h2", { className: "text-xl font-black text-slate-900", children: t('quickActionsTitle') }), _jsx("p", { className: "mt-2 text-sm leading-6 text-slate-600", children: t('quickActionsDesc') }), _jsx("div", { className: "mt-5 space-y-3", children: quickActions.map((item) => (_jsxs(Link, { to: item.to, className: "flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-slate-900", children: item.title }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: item.description })] }), _jsx("span", { className: "ml-4 text-lg font-semibold text-blue-700", children: "\u2192" })] }, item.title))) })] }), _jsxs("div", { className: "rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-sm", children: [_jsx("h2", { className: "text-xl font-black text-slate-900", children: t('whyThisSpace') }), _jsx("ul", { className: "mt-4 space-y-3 text-sm leading-6 text-slate-600", children: highlights.map((item) => (_jsxs("li", { className: "flex gap-2", children: [_jsx("span", { className: "mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" }), _jsx("span", { children: item })] }, item))) }), _jsxs("div", { className: "mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4", children: [_jsx("p", { className: "text-sm font-semibold text-blue-800", children: t('tipTitle') }), _jsx("p", { className: "mt-1 text-sm leading-6 text-blue-700", children: t('tipDesc') })] })] })] })] }));
}
