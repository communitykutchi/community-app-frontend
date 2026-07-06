import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios.js';

export default function Navbar() {
	const [open, setOpen] = useState(false);
	const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('token'));
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
			if (cancelled) return;
			const role = response.data?.user?.role;
			setIsAdmin(role === 'super_admin' || role === 'jamaat_admin' || role === 'admin');
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
		`rounded-md px-3 py-2 text-sm font-semibold transition ${isActive(to)
			? 'bg-slate-100 text-slate-900'
			: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`;

	const mobileLinkClass = (to: string) =>
		`block w-full rounded-md px-3 py-2 text-sm font-semibold transition ${isActive(to)
			? 'bg-slate-100 text-slate-900'
			: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`;

	return (
		<header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white text-slate-900">
			<div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-2">
				<div className="min-w-0 flex max-w-[72%] items-center gap-2 sm:max-w-none sm:gap-3">
					<div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 shadow-sm sm:h-8 sm:w-8" />
					<div>
						<p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-[10px]">Kutchi Hub</p>
						<h1 className="truncate text-xs font-bold sm:text-sm md:text-base">All Kutchi Community</h1>
					</div>
				</div>

				<nav className="hidden items-center gap-1 md:flex">
					{navItems.map((item) => (
						<Link key={item.to} to={item.to} className={desktopLinkClass(item.to)}>
							{item.label}
						</Link>
					))}
					{isAuthenticated ? (
						<button onClick={handleLogout} className="ml-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900">
							Logout
						</button>
					) : null}
				</nav>

				<button
					className="rounded-md border border-slate-300 p-2 text-slate-700 md:hidden"
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

			<div id="mobile-menu" className={`border-t border-slate-200 bg-white px-4 py-3 shadow-sm md:hidden ${open ? 'block' : 'hidden'}`}>
				<div className="mx-auto flex max-w-6xl flex-col gap-2">
					{navItems.map((item) => (
						<Link key={item.to} to={item.to} className={mobileLinkClass(item.to)} onClick={() => setOpen(false)}>
							{item.label}
						</Link>
					))}
					{isAuthenticated ? (
						<button onClick={handleLogout} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900">
							Logout
						</button>
					) : null}
				</div>
			</div>
		</header>
	);
}

