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
    const desktopLinkClass = (to) => `rounded-md px-3 py-2 text-sm font-semibold transition ${isActive(to)
        ? 'bg-slate-100 text-slate-900'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`;
    const mobileLinkClass = (to) => `block w-full rounded-md px-3 py-2 text-sm font-semibold transition ${isActive(to)
        ? 'bg-slate-100 text-slate-900'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`;
    return (_jsxs("header", { className: "sticky top-0 z-40 w-full border-b border-slate-200 bg-white text-slate-900", children: [_jsxs("div", { className: "mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-2", children: [_jsxs("div", { className: "min-w-0 flex max-w-[72%] items-center gap-2 sm:max-w-none sm:gap-3", children: [_jsx("div", { className: "h-7 w-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 shadow-sm sm:h-8 sm:w-8" }), _jsxs("div", { children: [_jsx("p", { className: "text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-[10px]", children: "Kutchi Hub" }), _jsx("h1", { className: "truncate text-xs font-bold sm:text-sm md:text-base", children: "All Kutchi Community" })] })] }), _jsxs("nav", { className: "hidden items-center gap-1 md:flex", children: [navItems.map((item) => (_jsx(Link, { to: item.to, className: desktopLinkClass(item.to), children: item.label }, item.to))), isAuthenticated ? (_jsx("button", { onClick: handleLogout, className: "ml-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900", children: "Logout" })) : null] }), _jsx("button", { className: "rounded-md border border-slate-300 p-2 text-slate-700 md:hidden", "aria-controls": "mobile-menu", "aria-expanded": open, onClick: () => setOpen((s) => !s), children: open ? (_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) })) : (_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }) })) })] }), _jsx("div", { id: "mobile-menu", className: `border-t border-slate-200 bg-white px-4 py-3 shadow-sm md:hidden ${open ? 'block' : 'hidden'}`, children: _jsxs("div", { className: "mx-auto flex max-w-6xl flex-col gap-2", children: [navItems.map((item) => (_jsx(Link, { to: item.to, className: mobileLinkClass(item.to), onClick: () => setOpen(false), children: item.label }, item.to))), isAuthenticated ? (_jsx("button", { onClick: handleLogout, className: "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900", children: "Logout" })) : null] }) })] }));
}
