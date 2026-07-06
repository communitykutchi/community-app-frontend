import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Navbar from '../components/Navbar.js';
import { useLocation } from 'react-router-dom';
export default function MainLayout({ children }) {
    const location = useLocation();
    const isAuthVisualRoute = location.pathname === '/register' || location.pathname === '/login';
    const year = new Date().getFullYear();
    return (_jsxs("div", { className: "site-shell min-h-screen w-full flex flex-col", children: [_jsx(Navbar, {}), _jsx("main", { className: isAuthVisualRoute ? 'flex-1 w-full p-0 bg-transparent' : 'site-main flex-1 w-full p-6', children: isAuthVisualRoute ? (children) : (_jsx("div", { className: "site-content w-full max-w-5xl mx-auto", children: children })) }), _jsx("footer", { className: "w-full border-t border-slate-200 bg-white", children: _jsxs("div", { className: "mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 px-4 py-4 text-sm text-slate-600 md:flex-row", children: [_jsxs("p", { className: "font-medium text-slate-700", children: ["\u00A9 ", year, " All Kutchi Community's Hub"] }), _jsx("p", { className: "text-xs tracking-wide text-slate-500", children: "Community \u2022 Privacy \u2022 Support" })] }) })] }));
}
