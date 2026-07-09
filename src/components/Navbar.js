import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios.js';
import UserAvatar from './UserAvatar.js';
const NOTICE_ACTIVITY_EVENT = 'community-notice-activity';
const PROFILE_UPDATED_EVENT = 'community-profile-updated';
function normalizeRole(role) {
    if (role === 'jamaat_admin')
        return 'moderator';
    return role;
}
export default function Navbar() {
    const [open, setOpen] = useState(false);
    const [authToken, setAuthToken] = useState(() => localStorage.getItem('token'));
    const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('token')));
    const [isAdmin, setIsAdmin] = useState(false);
    const [unreadNoticeCount, setUnreadNoticeCount] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';
    useEffect(() => {
        setOpen(false);
        setAuthToken(localStorage.getItem('token'));
    }, [location.pathname]);
    useEffect(() => {
        setIsAuthenticated(Boolean(authToken));
        if (!authToken) {
            setIsAdmin(false);
            setUnreadNoticeCount(0);
            setCurrentUser(null);
            return;
        }
        let cancelled = false;
        API.get('/auth/me').then((response) => {
            if (cancelled)
                return;
            const role = normalizeRole(response.data?.user?.role);
            setCurrentUser(response.data?.user || null);
            setIsAdmin(role === 'super_admin' || role === 'moderator' || role === 'admin');
        }).catch(() => {
            if (cancelled)
                return;
            setIsAdmin(false);
            setCurrentUser(null);
        });
        return () => {
            cancelled = true;
        };
    }, [authToken]);
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        const refreshProfile = () => {
            if (!authToken)
                return;
            API.get('/auth/me')
                .then((response) => {
                const role = normalizeRole(response.data?.user?.role);
                setCurrentUser(response.data?.user || null);
                setIsAdmin(role === 'super_admin' || role === 'moderator' || role === 'admin');
            })
                .catch(() => {
                setCurrentUser(null);
            });
        };
        window.addEventListener(PROFILE_UPDATED_EVENT, refreshProfile);
        return () => {
            window.removeEventListener(PROFILE_UPDATED_EVENT, refreshProfile);
        };
    }, [authToken]);
    useEffect(() => {
        let cancelled = false;
        if (!authToken) {
            setUnreadNoticeCount(0);
            return;
        }
        API.get('/notices/unread-count')
            .then((response) => {
            if (cancelled)
                return;
            setUnreadNoticeCount(Number(response.data?.unreadCount || 0));
        })
            .catch(() => {
            if (cancelled)
                return;
            setUnreadNoticeCount(0);
        });
        return () => {
            cancelled = true;
        };
    }, [authToken, location.pathname]);
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        const refreshUnreadCount = () => {
            if (!authToken) {
                setUnreadNoticeCount(0);
                return;
            }
            API.get('/notices/unread-count')
                .then((response) => {
                setUnreadNoticeCount(Number(response.data?.unreadCount || 0));
            })
                .catch(() => {
                setUnreadNoticeCount(0);
            });
        };
        window.addEventListener(NOTICE_ACTIVITY_EVENT, refreshUnreadCount);
        return () => {
            window.removeEventListener(NOTICE_ACTIVITY_EVENT, refreshUnreadCount);
        };
    }, [authToken]);
    function handleLogout() {
        localStorage.removeItem('token');
        setAuthToken(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setUnreadNoticeCount(0);
        setCurrentUser(null);
        setOpen(false);
        navigate('/login');
    }
    const isActive = (to) => location.pathname === to;
    const navItems = isAuthenticated
        ? [
            { to: '/', label: 'Home' },
            { to: '/feed', label: 'Feed' },
            { to: '/notices', label: 'Notices', unreadCount: unreadNoticeCount },
            { to: '/profile', label: 'Profile' },
            ...(isAdmin ? [{ to: '/admin/users', label: 'Admin' }] : []),
        ]
        : [
            { to: '/login', label: 'Login' },
            { to: '/register', label: 'Register' },
        ];
    const desktopLinkClass = (to) => `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isActive(to)
        ? 'bg-slate-900 !text-white hover:!text-white'
        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`;
    const mobileLinkClass = (to) => `block w-full rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${isActive(to)
        ? 'bg-slate-900 !text-white hover:!text-white'
        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`;
    const renderNavLabel = (item) => (_jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsx("span", { children: item.label }), item.unreadCount && item.unreadCount > 0 ? (_jsx("span", { className: "inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white", children: item.unreadCount > 99 ? '99+' : item.unreadCount })) : null] }));
    if (isAuthRoute) {
        return (_jsx("header", { className: "sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur", children: _jsxs("div", { className: "mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6", children: [_jsxs(Link, { to: "/", className: "min-w-0 flex max-w-[62%] items-center gap-3 sm:max-w-none", children: [_jsx("div", { className: "grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-sm font-black text-white", children: "KH" }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500", children: "Community Portal" }), _jsx("p", { className: "truncate text-xs font-bold leading-tight text-slate-900 sm:text-sm md:text-base", children: "All Kutchi Community" })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Link, { to: "/login", className: `rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${isActive('/login') ? 'bg-slate-900 !text-white hover:!text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`, children: "Login" }), _jsx(Link, { to: "/register", className: `rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${isActive('/register') ? 'bg-slate-900 !text-white hover:!text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`, children: "Register" })] })] }) }));
    }
    return (_jsxs("header", { className: "sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 text-slate-900 backdrop-blur", children: [_jsxs("div", { className: "mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6", children: [_jsxs(Link, { to: "/", className: "min-w-0 flex max-w-[72%] items-center gap-2 sm:max-w-none sm:gap-3", children: [_jsx("div", { className: "grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-xs font-black text-white sm:h-9 sm:w-9 sm:text-sm", children: "KH" }), _jsxs("div", { children: [_jsx("p", { className: "text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-[10px]", children: "Community Portal" }), _jsx("h1", { className: "truncate text-xs font-bold sm:text-sm md:text-base", children: "All Kutchi Community" })] })] }), _jsxs("div", { className: "hidden items-center gap-3 md:flex", children: [_jsx("nav", { className: "flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1", children: navItems.map((item) => (_jsx(Link, { to: item.to, className: desktopLinkClass(item.to), children: renderNavLabel(item) }, item.to))) }), _jsxs(Link, { to: "/profile", className: "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50", children: [_jsx(UserAvatar, { name: currentUser?.fullName, photoUrl: currentUser?.profilePhotoUrl, size: "sm" }), _jsx("span", { className: "max-w-28 truncate", children: currentUser?.fullName || 'Profile' })] }), isAuthenticated ? (_jsx("button", { onClick: handleLogout, className: "rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900", children: "Logout" })) : null] }), _jsx("button", { className: "rounded-lg border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-100 md:hidden", "aria-controls": "mobile-menu", "aria-expanded": open, onClick: () => setOpen((s) => !s), children: open ? (_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) })) : (_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }) })) })] }), _jsx("div", { id: "mobile-menu", className: `border-t border-slate-200 bg-white px-4 py-3 md:hidden ${open ? 'block' : 'hidden'}`, children: _jsxs("div", { className: "mx-auto flex max-w-6xl flex-col gap-2", children: [_jsx("p", { className: "px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500", children: "Navigation" }), navItems.map((item) => (_jsx(Link, { to: item.to, className: mobileLinkClass(item.to), onClick: () => setOpen(false), children: renderNavLabel(item) }, item.to))), _jsxs(Link, { to: "/profile", onClick: () => setOpen(false), className: "mt-1 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3", children: [_jsx(UserAvatar, { name: currentUser?.fullName, photoUrl: currentUser?.profilePhotoUrl, size: "sm" }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "truncate text-sm font-bold text-slate-900", children: currentUser?.fullName || 'Profile' }), _jsx("p", { className: "text-xs font-semibold text-slate-500", children: "View profile" })] })] }), isAuthenticated ? (_jsx("button", { onClick: handleLogout, className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900", children: "Logout" })) : null] }) })] }));
}
