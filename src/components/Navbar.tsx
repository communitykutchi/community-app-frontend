import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { AUTH_CHANGED_EVENT, clearAuthToken, getAuthToken } from '../auth/session';
import UserAvatar from './UserAvatar';
import { useTheme } from '../context/ThemeContext';

const NOTICE_ACTIVITY_EVENT = 'community-notice-activity';
const PROFILE_UPDATED_EVENT = 'community-profile-updated';

interface NavItem {
  to: string;
  label: string;
  unreadCount?: number;
  icon: React.ReactNode;
  isDropdown?: boolean;
}

interface CurrentUser {
  fullName?: string;
  role?: string;
  profilePhotoUrl?: string;
  jamaat?: string;
}

function capitalizeName(name?: string): string {
  if (!name) return 'Profile';
  return name
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeRole(role?: string) {
  return role;
}

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [friendsDropdownOpen, setFriendsDropdownOpen] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(() => getAuthToken());
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAuthToken()));
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadNoticeCount, setUnreadNoticeCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const formattedName = capitalizeName(currentUser?.fullName);

  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const friendsDropdownRef = useRef<HTMLDivElement>(null);
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/banned';
  // ... rest of effect hooks remain same


  useEffect(() => {
    if (!authToken) {
      setUnreadChatCount(0);
      return;
    }

    const fetchUnreadChatCount = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      API.get<{ unreadCount?: number }>('/friends/unread-chat-count')
        .then((response) => {
          setUnreadChatCount(Number(response.data?.unreadCount || 0));
        })
        .catch(() => {
          setUnreadChatCount(0);
        });
    };

    fetchUnreadChatCount();
    const timer = setInterval(fetchUnreadChatCount, 10000);
    return () => clearInterval(timer);
  }, [authToken, location.pathname]);

  useEffect(() => {
    setMobileOpen(false);
    setUserDropdownOpen(false);
    setFriendsDropdownOpen(false);
    setAuthToken(getAuthToken());
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncAuthToken = () => {
      setAuthToken(getAuthToken());
    };

    window.addEventListener(AUTH_CHANGED_EVENT, syncAuthToken);
    window.addEventListener('storage', syncAuthToken);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuthToken);
      window.removeEventListener('storage', syncAuthToken);
    };
  }, []);

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
      setIsAdmin(['super_admin', 'admin', 'moderator'].includes(role || ''));
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
          setIsAdmin(['super_admin', 'admin', 'moderator'].includes(role || ''));
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (friendsDropdownRef.current && !friendsDropdownRef.current.contains(e.target as Node)) {
        setFriendsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    clearAuthToken();
    setAuthToken(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUnreadNoticeCount(0);
    setCurrentUser(null);
    setMobileOpen(false);
    setUserDropdownOpen(false);
    setFriendsDropdownOpen(false);

    API.post('/users/presence', { status: 'inactive' }).catch(() => {});
    API.post('/auth/logout').catch(() => {});

    navigate('/login');
  }

  const isActive = (to: string) => location.pathname === to;

  // Clean SVG Icons
  const Icons = {
    Home: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    Feed: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6m-6 4h4" />
      </svg>
    ),
    Notices: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    Polls: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    Workers: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H5a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    ),
    Friends: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    Chat: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    Help: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    Admin: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  };

  const navItems: NavItem[] = isAuthRoute
    ? []
    : isAuthenticated
    ? [
        { to: '/', label: 'Home', icon: Icons.Home },
        { to: '/friends', label: 'Friends', icon: Icons.Friends, isDropdown: true, unreadCount: unreadChatCount },
        { to: '/feed', label: 'Feed', icon: Icons.Feed },
        { to: '/notices', label: 'Notices', icon: Icons.Notices, unreadCount: unreadNoticeCount },
        { to: '/polls', label: 'Polls', icon: Icons.Polls },
        { to: '/workers', label: 'Workers', icon: Icons.Workers },
        ...(currentUser?.role === 'super_admin'
          ? [{ to: '/super-admin', label: 'Super Admin', icon: Icons.Admin }]
          : isAdmin
          ? [{ to: '/admin', label: 'Admin', icon: Icons.Admin }]
          : []),
      ]
    : [
        { to: '/', label: 'Home', icon: Icons.Home },
        { to: '/notices', label: 'Notices', icon: Icons.Notices },
        { to: '/polls', label: 'Polls', icon: Icons.Polls },
        { to: '/workers', label: 'Workers', icon: Icons.Workers },
      ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/90 text-slate-900 dark:text-white backdrop-blur-md transition-all gpu-smooth py-1 sm:py-1.5 shadow-sm">
      <div className="mx-auto flex min-h-[60px] sm:min-h-[76px] max-w-7xl items-center justify-between px-3 py-2 sm:px-6 lg:px-8 gap-2">
        
        {/* Brand Section */}
        <Link to="/" className="flex items-center gap-2 sm:gap-3 transition hover:opacity-90 py-1 shrink min-w-0">
          <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 p-0.5 shadow-md shadow-teal-500/20">
            <div className="h-full w-full rounded-[10px] bg-slate-950 p-1 flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
              All Kutchi Community
            </h1>
            <p className="text-[9px] sm:text-[10px] text-emerald-500 font-medium tracking-wide mt-0.5 leading-none hidden xs:block truncate">
              Official Portal
            </p>
          </div>
        </Link>

        {/* Clean Center Navigation Items (Desktop) */}
        {navItems.length > 0 && (
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {navItems.map((item) => {
              if (item.isDropdown) {
                const isFriendsActive = location.pathname === '/friends' || location.pathname === '/chats';
                return (
                  <div className="relative" key={item.to} ref={friendsDropdownRef}>
                    <button
                      onClick={() => setFriendsDropdownOpen((s) => !s)}
                      className={`relative flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-xl transition-all duration-200 ${
                        isFriendsActive
                          ? 'text-teal-400 bg-teal-500/10'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <span className={isFriendsActive ? 'text-teal-400' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                      {unreadChatCount > 0 && (
                        <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
                          {unreadChatCount > 99 ? '99+' : unreadChatCount}
                        </span>
                      )}
                      <svg
                        className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                          friendsDropdownOpen ? 'rotate-180 text-teal-400' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {friendsDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/95 backdrop-blur-md p-1.5 text-xs shadow-2xl animate-in fade-in zoom-in-95 duration-150 z-50">
                        <Link
                          to="/friends"
                          onClick={() => setFriendsDropdownOpen(false)}
                          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all font-semibold ${
                            location.pathname === '/friends'
                              ? 'bg-teal-500/20 text-teal-400 font-extrabold'
                              : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                          }`}
                        >
                          <span className={location.pathname === '/friends' ? 'text-teal-400' : 'text-slate-400'}>{Icons.Friends}</span>
                          <span>Friends</span>
                        </Link>
                        <Link
                          to="/chats"
                          onClick={() => setFriendsDropdownOpen(false)}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 transition-all font-semibold ${
                            location.pathname === '/chats'
                              ? 'bg-teal-500/20 text-teal-400 font-extrabold'
                              : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={location.pathname === '/chats' ? 'text-teal-400' : 'text-slate-400'}>{Icons.Chat}</span>
                            <span>Chat</span>
                          </div>
                          {unreadChatCount > 0 && (
                            <span className="inline-flex items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
                              {unreadChatCount > 99 ? '99+' : unreadChatCount}
                            </span>
                          )}
                        </Link>
                      </div>
                    )}
                  </div>
                );
              }

              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-xl transition-all duration-200 ${
                    active
                      ? 'text-teal-400 bg-teal-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span className={`${active ? 'text-teal-400' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.unreadCount && item.unreadCount > 0 ? (
                    <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
                      {item.unreadCount > 99 ? '99+' : item.unreadCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right User Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isAuthenticated && !isAuthRoute ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen((s) => !s)}
                className="flex items-center gap-2.5 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 px-3.5 py-2 text-xs font-semibold transition-all duration-200 active:scale-95 shadow-sm shadow-teal-500/10"
              >
                <UserAvatar name={formattedName} photoUrl={currentUser?.profilePhotoUrl} size="sm" className="ring-1 ring-teal-500/40" />
                
                <div className="hidden sm:block text-left">
                  <p className="max-w-[110px] truncate text-xs font-bold text-white leading-tight">
                    {formattedName}
                  </p>
                  <p className="text-[9px] font-semibold text-teal-300 leading-tight capitalize">
                    {currentUser?.role?.replace('_', ' ') || 'Member'}
                  </p>
                </div>

                <svg
                  className={`h-3.5 w-3.5 text-teal-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180 text-emerald-300' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Seamless Theme Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/95 backdrop-blur-md p-1.5 text-xs shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                    <p className="font-semibold text-white truncate text-xs">{formattedName}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">Jamaat: {currentUser?.jamaat || 'General'}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800/60 hover:text-white transition-all font-medium"
                  >
                    <span className="text-slate-400">{Icons.Home}</span>
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/help"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800/60 hover:text-white transition-all font-medium"
                  >
                    <span className="text-slate-400">{Icons.Help}</span>
                    <span>Help & Guidance</span>
                  </Link>

                  {currentUser?.role === 'super_admin' ? (
                    <Link
                      to="/super-admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-amber-300 hover:bg-amber-950/40 hover:text-amber-200 transition-all font-medium my-0.5 border border-amber-500/20"
                    >
                      <span className="text-amber-400">{Icons.Admin}</span>
                      <span>Super Admin</span>
                    </Link>
                  ) : isAdmin ? (
                    <Link
                      to="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-teal-300 hover:bg-teal-950/40 hover:text-teal-200 transition-all font-medium my-0.5 border border-teal-500/20"
                    >
                      <span className="text-teal-400">{Icons.Admin}</span>
                      <span>Admin Control</span>
                    </Link>
                  ) : null}

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-all font-medium mt-1 border-t border-slate-800/80"
                  >
                    <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Link
                to="/login"
                className={`rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs transition whitespace-nowrap shrink-0 border ${
                  location.pathname === '/login'
                    ? 'nav-btn-active font-extrabold'
                    : 'nav-btn-inactive font-bold'
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className={`rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs transition whitespace-nowrap shrink-0 border ${
                  location.pathname === '/register' || location.pathname !== '/login'
                    ? 'nav-btn-active font-extrabold'
                    : 'nav-btn-inactive font-bold'
                }`}
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          {navItems.length > 0 && (
            <button
              onClick={() => setMobileOpen((s) => !s)}
              className="mobile-menu-btn rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200 transition hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white lg:hidden shadow-sm"
              aria-label="Toggle Menu"
            >
              {mobileOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 lg:hidden animate-in fade-in slide-in-from-top-2 shadow-2xl text-slate-900 dark:text-white">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              if (item.isDropdown) {
                return (
                  <React.Fragment key={item.to}>
                    <Link
                      to="/friends"
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                        location.pathname === '/friends'
                          ? 'bg-teal-500/15 text-teal-700 dark:text-teal-400 font-extrabold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={location.pathname === '/friends' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}>{Icons.Friends}</span>
                        <span>Friends</span>
                      </div>
                    </Link>
                    <Link
                      to="/chats"
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                        location.pathname === '/chats'
                          ? 'bg-teal-500/15 text-teal-700 dark:text-teal-400 font-extrabold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={location.pathname === '/chats' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}>{Icons.Chat}</span>
                        <span>Chat</span>
                      </div>
                      {unreadChatCount > 0 && (
                        <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-bold text-white">
                          {unreadChatCount > 99 ? '99+' : unreadChatCount}
                        </span>
                      )}
                    </Link>
                  </React.Fragment>
                );
              }

              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-teal-500/15 text-teal-700 dark:text-teal-400 font-extrabold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={active ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.unreadCount && item.unreadCount > 0 ? (
                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-bold text-white">
                      {item.unreadCount > 99 ? '99+' : item.unreadCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}

            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 py-2.5 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition"
                >
                  Sign Out Account
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
