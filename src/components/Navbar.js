import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios.js';
export default function Navbar() {
    const [open, setOpen] = useState(false);
    const [authToken, setAuthToken] = useState(() => localStorage.getItem('token'));
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
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
            return;
        }
        let cancelled = false;
        API.get('/auth/me').then((response) => {
            if (cancelled)
                return;
            const role = response.data?.user?.role;
            setIsAdmin(role === 'super_admin' || role === 'jamaat_admin' || role === 'admin');
        }).catch(() => {
            if (cancelled)
                return;
            setIsAdmin(false);
        });
        return () => {
            cancelled = true;
        };
    }, [authToken]);
    function handleLogout() {
        localStorage.removeItem('token');
        setAuthToken(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setOpen(false);
        navigate('/login');
    }
    const isActive = (to) => location.pathname === to;
    const navItems = isAuthenticated
        ? [
            { to: '/', label: 'Home' },
            { to: '/feed', label: 'Feed' },
            { to: '/notices', label: 'Notices' },
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
    if (isAuthRoute) {
        return (_jsx("header", { className: "sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur", children: _jsxs("div", { className: "mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6", children: [_jsxs(Link, { to: "/", className: "min-w-0 flex max-w-[62%] items-center gap-3 sm:max-w-none", children: [_jsx("div", { className: "grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-sm font-black text-white", children: "KH" }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500", children: "Community Portal" }), _jsx("p", { className: "truncate text-xs font-bold leading-tight text-slate-900 sm:text-sm md:text-base", children: "All Kutchi Community" })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Link, { to: "/login", className: `rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${isActive('/login') ? 'bg-slate-900 !text-white hover:!text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`, children: "Login" }), _jsx(Link, { to: "/register", className: `rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${isActive('/register') ? 'bg-slate-900 !text-white hover:!text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`, children: "Register" })] })] }) }));
    }
    return (_jsxs("header", { className: "sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 text-slate-900 backdrop-blur", children: [_jsxs("div", { className: "mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6", children: [_jsxs(Link, { to: "/", className: "min-w-0 flex max-w-[72%] items-center gap-2 sm:max-w-none sm:gap-3", children: [_jsx("div", { className: "grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-xs font-black text-white sm:h-9 sm:w-9 sm:text-sm", children: "KH" }), _jsxs("div", { children: [_jsx("p", { className: "text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-[10px]", children: "Community Portal" }), _jsx("h1", { className: "truncate text-xs font-bold sm:text-sm md:text-base", children: "All Kutchi Community" })] })] }), _jsxs("div", { className: "hidden items-center gap-3 md:flex", children: [_jsx("nav", { className: "flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1", children: navItems.map((item) => (_jsx(Link, { to: item.to, className: desktopLinkClass(item.to), children: item.label }, item.to))) }), isAuthenticated ? (_jsx("button", { onClick: handleLogout, className: "rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900", children: "Logout" })) : null] }), _jsx("button", { className: "rounded-lg border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-100 md:hidden", "aria-controls": "mobile-menu", "aria-expanded": open, onClick: () => setOpen((s) => !s), children: open ? (_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) })) : (_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }) })) })] }), _jsx("div", { id: "mobile-menu", className: `border-t border-slate-200 bg-white px-4 py-3 md:hidden ${open ? 'block' : 'hidden'}`, children: _jsxs("div", { className: "mx-auto flex max-w-6xl flex-col gap-2", children: [_jsx("p", { className: "px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500", children: "Navigation" }), navItems.map((item) => (_jsx(Link, { to: item.to, className: mobileLinkClass(item.to), onClick: () => setOpen(false), children: item.label }, item.to))), isAuthenticated ? (_jsx("button", { onClick: handleLogout, className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900", children: "Logout" })) : null] }) })] }));
}
