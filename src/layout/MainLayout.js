import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import Navbar from '../components/Navbar.js';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios.js';
export default function MainLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const isAuthVisualRoute = location.pathname === '/register' || location.pathname === '/login';
    const year = new Date().getFullYear();
    useEffect(() => {
        if (isAuthVisualRoute) {
            return;
        }
        const token = localStorage.getItem('token');
        if (!token) {
            return;
        }
        const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
        let timeoutId = null;
        const clearTimer = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        };
        const logoutForInactivity = () => {
            localStorage.removeItem('token');
            delete API.defaults.headers.common.Authorization;
            navigate('/login', { replace: true });
        };
        const resetTimer = () => {
            if (!localStorage.getItem('token')) {
                clearTimer();
                return;
            }
            clearTimer();
            timeoutId = setTimeout(logoutForInactivity, INACTIVITY_LIMIT_MS);
        };
        const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        activityEvents.forEach((eventName) => {
            window.addEventListener(eventName, resetTimer, { passive: true });
        });
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                resetTimer();
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        resetTimer();
        return () => {
            clearTimer();
            activityEvents.forEach((eventName) => {
                window.removeEventListener(eventName, resetTimer);
            });
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [isAuthVisualRoute, navigate]);
    return (_jsxs("div", { className: "app-shell flex min-h-screen w-full flex-col", children: [_jsx(Navbar, {}), _jsx("main", { className: isAuthVisualRoute ? 'w-full flex-1 px-0 py-0' : 'w-full flex-1 px-4 py-6 sm:px-6 lg:px-8', children: isAuthVisualRoute ? (children) : (_jsx("div", { className: "site-content mx-auto w-full max-w-6xl", children: children })) }), _jsx("footer", { className: "mt-6 w-full border-t border-slate-200/80 bg-white/90", children: _jsxs("div", { className: "mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-sm text-slate-600 md:flex-row md:px-6", children: [_jsxs("p", { className: "font-semibold text-slate-700", children: ["\u00A9 ", year, " All Kutchi Community Hub"] }), _jsx("p", { className: "text-xs tracking-wide text-slate-500", children: "Simple. Fast. Reliable." })] }) })] }));
}
