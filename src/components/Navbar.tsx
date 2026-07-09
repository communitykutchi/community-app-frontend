import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios.js';
import UserAvatar from './UserAvatar.js';

const NOTICE_ACTIVITY_EVENT = 'community-notice-activity';
const PROFILE_UPDATED_EVENT = 'community-profile-updated';

interface NavItem {
	to: string;
	label: string;
	unreadCount?: number;
}

interface CurrentUser {
	fullName?: string;
	role?: string;
	profilePhotoUrl?: string;
}

function normalizeRole(role?: string) {
	if (role === 'jamaat_admin') return 'moderator';
	return role;
}

export default function Navbar() {
	const [open, setOpen] = useState(false);
	const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('token'));
	const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('token')));
	const [isAdmin, setIsAdmin] = useState(false);
	const [unreadNoticeCount, setUnreadNoticeCount] = useState(0);
	const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
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

		API.get<{ user?: CurrentUser }>('/auth/me').then((response) => {
			if (cancelled) return;
			const role = normalizeRole(response.data?.user?.role);
			setCurrentUser(response.data?.user || null);
			setIsAdmin(role === 'super_admin' || role === 'moderator' || role === 'admin');
		}).catch(() => {
			if (cancelled) return;
			setIsAdmin(false);
			setCurrentUser(null);
		});

		return () => {
			cancelled = true;
		};
	}, [authToken]);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const refreshProfile = () => {
			if (!authToken) return;
			API.get<{ user?: CurrentUser }>('/auth/me')
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

		API.get<{ unreadCount?: number }>('/notices/unread-count')
			.then((response) => {
				if (cancelled) return;
				setUnreadNoticeCount(Number(response.data?.unreadCount || 0));
			})
			.catch(() => {
				if (cancelled) return;
				setUnreadNoticeCount(0);
			});

		return () => {
			cancelled = true;
		};
	}, [authToken, location.pathname]);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const refreshUnreadCount = () => {
			if (!authToken) {
				setUnreadNoticeCount(0);
				return;
			}

			API.get<{ unreadCount?: number }>('/notices/unread-count')
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

	const isActive = (to: string) => location.pathname === to;

	const navItems: NavItem[] = isAuthenticated
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

	const desktopLinkClass = (to: string) =>
		`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isActive(to)
			? 'bg-slate-900 !text-white hover:!text-white'
			: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`;

	const mobileLinkClass = (to: string) =>
		`block w-full rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${isActive(to)
			? 'bg-slate-900 !text-white hover:!text-white'
			: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`;

	const renderNavLabel = (item: NavItem) => (
		<span className="inline-flex items-center gap-2">
			<span>{item.label}</span>
			{item.unreadCount && item.unreadCount > 0 ? (
				<span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
					{item.unreadCount > 99 ? '99+' : item.unreadCount}
				</span>
			) : null}
		</span>
	);

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
								{renderNavLabel(item)}
							</Link>
						))}
					</nav>
					<Link to="/profile" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
						<UserAvatar name={currentUser?.fullName} photoUrl={currentUser?.profilePhotoUrl} size="sm" />
						<span className="max-w-28 truncate">{currentUser?.fullName || 'Profile'}</span>
					</Link>
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
							{renderNavLabel(item)}
						</Link>
					))}
					<Link to="/profile" onClick={() => setOpen(false)} className="mt-1 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
						<UserAvatar name={currentUser?.fullName} photoUrl={currentUser?.profilePhotoUrl} size="sm" />
						<div className="min-w-0">
							<p className="truncate text-sm font-bold text-slate-900">{currentUser?.fullName || 'Profile'}</p>
							<p className="text-xs font-semibold text-slate-500">View profile</p>
						</div>
					</Link>
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

