import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios.js';

function normalizeRole(role?: string) {
	if (role === 'jamaat_admin') return 'moderator';
	return role;
}

export default function Navbar() {
	const [open, setOpen] = useState(false);
	const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('token'));
	const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('token')));
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
			if (cancelled) return;
			const role = normalizeRole(response.data?.user?.role);
			setIsAdmin(role === 'super_admin' || role === 'moderator' || role === 'admin');
		}).catch(() => {
			if (cancelled) return;
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

	const isActive = (to: string) => location.pathname === to;

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

	const desktopLinkClass = (to: string) =>
		`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isActive(to)
			? 'bg-slate-900 !text-white hover:!text-white'
			: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`;

	const mobileLinkClass = (to: string) =>
		`block w-full rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${isActive(to)
			? 'bg-slate-900 !text-white hover:!text-white'
			: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`;

	if (isAuthRoute) {
		return (
			<header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur">
				<div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
					<Link to="/" className="min-w-0 flex max-w-[62%] items-center gap-3 sm:max-w-none">
						<div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-sm font-black text-white">
							KH
						</div>
						<div className="min-w-0">
							<p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Community Portal</p>
							<p className="truncate text-xs font-bold leading-tight text-slate-900 sm:text-sm md:text-base">All Kutchi Community</p>
						</div>
					</Link>
					<div className="flex items-center gap-2">
						<Link
							to="/login"
							className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${isActive('/login') ? 'bg-slate-900 !text-white hover:!text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}
						>
							Login
						</Link>
						<Link
							to="/register"
							className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${isActive('/register') ? 'bg-slate-900 !text-white hover:!text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}
						>
							Register
						</Link>
					</div>
				</div>
			</header>
		);
	}

	return (
		<header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 text-slate-900 backdrop-blur">
			<div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
				<Link to="/" className="min-w-0 flex max-w-[72%] items-center gap-2 sm:max-w-none sm:gap-3">
					<div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-xs font-black text-white sm:h-9 sm:w-9 sm:text-sm">
						KH
					</div>
					<div>
						<p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-[10px]">Community Portal</p>
						<h1 className="truncate text-xs font-bold sm:text-sm md:text-base">All Kutchi Community</h1>
					</div>
				</Link>

				<div className="hidden items-center gap-3 md:flex">
					<nav className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
						{navItems.map((item) => (
							<Link key={item.to} to={item.to} className={desktopLinkClass(item.to)}>
								{item.label}
							</Link>
						))}
					</nav>
					{isAuthenticated ? (
						<button onClick={handleLogout} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900">
							Logout
						</button>
					) : null}
				</div>

				<button
					className="rounded-lg border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-100 md:hidden"
					aria-controls="mobile-menu"
					aria-expanded={open}
					onClick={() => setOpen((s) => !s)}
				>
					{open ? (
						<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					) : (
						<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					)}
				</button>
			</div>

			<div id="mobile-menu" className={`border-t border-slate-200 bg-white px-4 py-3 md:hidden ${open ? 'block' : 'hidden'}`}>
				<div className="mx-auto flex max-w-6xl flex-col gap-2">
					<p className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Navigation</p>
					{navItems.map((item) => (
						<Link key={item.to} to={item.to} className={mobileLinkClass(item.to)} onClick={() => setOpen(false)}>
							{item.label}
						</Link>
					))}
					{isAuthenticated ? (
						<button onClick={handleLogout} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900">
							Logout
						</button>
					) : null}
				</div>
			</div>
		</header>
	);
}

