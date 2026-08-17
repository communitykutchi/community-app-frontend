import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { AUTH_CHANGED_EVENT, clearAuthToken, getAuthToken } from '../auth/session';
import UserAvatar from './UserAvatar';

const NOTICE_ACTIVITY_EVENT = 'community-notice-activity';
const PROFILE_UPDATED_EVENT = 'community-profile-updated';
export const FRIENDS_ACTIVITY_EVENT = 'community-friends-activity';

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [friendsDropdownOpen, setFriendsDropdownOpen] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(() => getAuthToken());
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAuthToken()));
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadNoticeCount, setUnreadNoticeCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);
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
      setFriendRequestsCount(0);
      return;
    }

    const fetchUnreadCounts = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      API.get<{ unreadCount?: number; unreadChatCount?: number; friendRequestsCount?: number }>('/friends/unread-chat-count')
        .then((response) => {
          const newChatCount = Number(response.data?.unreadChatCount ?? response.data?.unreadCount ?? 0);
          const newReqCount = Number(response.data?.friendRequestsCount || 0);
          setUnreadChatCount((prev) => (prev === newChatCount ? prev : newChatCount));
          setFriendRequestsCount((prev) => (prev === newReqCount ? prev : newReqCount));
        })
        .catch(() => {
          setUnreadChatCount(0);
          setFriendRequestsCount(0);
        });
    };

    fetchUnreadCounts();
    const timer = setInterval(fetchUnreadCounts, 20000);
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

    const fetchUnreadNoticeCount = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      API.get<{ unreadCount?: number }>('/notices/unread-count')
        .then((response) => {
          if (cancelled) return;
          setUnreadNoticeCount(Number(response.data?.unreadCount || 0));
        })
        .catch(() => {
          if (cancelled) return;
          setUnreadNoticeCount(0);
        });
    };

    fetchUnreadNoticeCount();
    const timer = setInterval(fetchUnreadNoticeCount, 20000);

    return () => {
      cancelled = true;
      clearInterval(timer);
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
    if (typeof window === 'undefined') return;

    const refreshFriendsCounts = () => {
      if (!authToken) {
        setUnreadChatCount(0);
        setFriendRequestsCount(0);
        return;
      }

      API.get<{ unreadCount?: number; unreadChatCount?: number; friendRequestsCount?: number }>('/friends/unread-chat-count')
        .then((response) => {
          const newChatCount = Number(response.data?.unreadChatCount ?? response.data?.unreadCount ?? 0);
          const newReqCount = Number(response.data?.friendRequestsCount || 0);
          setUnreadChatCount((prev) => (prev === newChatCount ? prev : newChatCount));
          setFriendRequestsCount((prev) => (prev === newReqCount ? prev : newReqCount));
        })
        .catch(() => {
          setUnreadChatCount(0);
          setFriendRequestsCount(0);
        });
    };

    window.addEventListener(FRIENDS_ACTIVITY_EVENT, refreshFriendsCounts);

    return () => {
      window.removeEventListener(FRIENDS_ACTIVITY_EVENT, refreshFriendsCounts);
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
    Security: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  };

  const navItems: NavItem[] = isAuthRoute
    ? []
    : isAuthenticated
    ? [
        { to: '/', label: 'Home', icon: Icons.Home },
        { to: '/friends', label: 'Friends', icon: Icons.Friends, isDropdown: true, unreadCount: friendRequestsCount },
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
    <header className="sticky top-0 z-50 w-full border-b border-emerald-200/80 bg-gradient-to-r from-emerald-50/95 via-teal-50/90 to-emerald-50/95 text-slate-900 py-1 sm:py-1.5 shadow-sm">
      <div className="mx-auto flex min-h-[60px] sm:min-h-[76px] max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8 gap-2">
        
        {/* Brand Section */}
        <Link to="/" className="flex items-center gap-2 sm:gap-3 transition hover:opacity-90 py-1 shrink min-w-0">
          <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 p-0.5 shadow-md shadow-teal-500/20">
            <div className="h-full w-full rounded-[10px] bg-white p-1 flex items-center justify-center border border-teal-100">
              <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight leading-tight truncate">
              All Kutchi Community
            </h1>
            <p className="text-[9px] sm:text-[10px] text-emerald-600 font-bold tracking-wide mt-0.5 leading-none hidden xs:block truncate">
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
                const totalDropdownBadge = friendRequestsCount > 0 ? friendRequestsCount : unreadChatCount;
                return (
                  <div className="relative" key={item.to} ref={friendsDropdownRef}>
                    <button
                      onClick={() => setFriendsDropdownOpen((s) => !s)}
                      className={`nav-item-btn relative flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer bg-transparent border border-transparent ${
                        isFriendsActive
                          ? 'text-teal-600 font-extrabold'
                          : 'text-slate-700 hover:text-teal-600'
                      }`}
                    >
                      <span className={isFriendsActive ? 'text-teal-600' : 'text-slate-500'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                      {friendRequestsCount > 0 ? (
                        <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none" title={`${friendRequestsCount} Friend Request${friendRequestsCount > 1 ? 's' : ''}`}>
                          {friendRequestsCount > 99 ? '99+' : friendRequestsCount}
                        </span>
                      ) : unreadChatCount > 0 ? (
                        <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-teal-600 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none" title={`${unreadChatCount} Unread Message${unreadChatCount > 1 ? 's' : ''}`}>
                          {unreadChatCount > 99 ? '99+' : unreadChatCount}
                        </span>
                      ) : null}
                      <svg
                        className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-200 ${
                          friendsDropdownOpen ? 'rotate-180 text-teal-600' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {friendsDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-1.5 text-xs shadow-xl animate-in fade-in zoom-in-95 duration-150 z-50">
                        <Link
                          to="/friends"
                          onClick={() => setFriendsDropdownOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all font-semibold bg-transparent ${
                            location.pathname === '/friends'
                              ? 'text-teal-600 font-bold'
                              : 'text-slate-700 hover:text-teal-600'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={location.pathname === '/friends' ? 'text-teal-600' : 'text-slate-500'}>{Icons.Friends}</span>
                            <span>Friends</span>
                          </div>
                          {friendRequestsCount > 0 && (
                            <span className="inline-flex items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
                              {friendRequestsCount > 99 ? '99+' : friendRequestsCount}
                            </span>
                          )}
                        </Link>
                        <Link
                          to="/chats"
                          onClick={() => setFriendsDropdownOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all font-semibold bg-transparent ${
                            location.pathname === '/chats'
                              ? 'text-teal-600 font-bold'
                              : 'text-slate-700 hover:text-teal-600'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={location.pathname === '/chats' ? 'text-teal-600' : 'text-slate-500'}>{Icons.Chat}</span>
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
                  className={`nav-item-btn relative flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 bg-transparent border border-transparent ${
                    active
                      ? 'text-teal-600 font-extrabold'
                      : 'text-slate-700 hover:text-teal-600'
                  }`}
                >
                  <span className={`${active ? 'text-teal-600' : 'text-slate-500'}`}>
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
                className="user-menu-btn group flex items-center gap-2.5 rounded-2xl bg-transparent hover:bg-slate-100/60 text-slate-800 px-2 sm:px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer border border-transparent shadow-none"
              >
                <div className="relative shrink-0">
                  <UserAvatar name={formattedName} photoUrl={currentUser?.profilePhotoUrl} size="sm" className="ring-2 ring-emerald-500/40 group-hover:ring-emerald-500/70 group-hover:scale-105 transition-all duration-200" />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                
                <div className="hidden sm:block text-left min-w-0">
                  <p className="max-w-[110px] truncate text-xs font-extrabold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors">
                    {formattedName}
                  </p>
                  <p className="text-[9px] font-extrabold text-emerald-600 leading-tight uppercase tracking-wider mt-0.5">
                    {currentUser?.role?.replace('_', ' ') || 'Member'}
                  </p>
                </div>

                <svg
                  className={`h-4 w-4 text-slate-500 group-hover:text-emerald-500 transition-all duration-200 ${userDropdownOpen ? 'rotate-180 text-emerald-500' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Elevated Profile Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-64 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 text-slate-900 backdrop-blur-xl p-2 text-xs shadow-xl animate-in fade-in zoom-in-95 duration-150 z-50">
                  {/* User Profile Summary Header */}
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-1.5">
                    <UserAvatar name={formattedName} photoUrl={currentUser?.profilePhotoUrl} size="md" className="ring-2 ring-emerald-500/40 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-slate-900 truncate text-xs leading-snug">{formattedName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-600 capitalize">
                          {currentUser?.role?.replace('_', ' ') || 'Member'}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate">Jamaat: {currentUser?.jamaat || 'General'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Existing Menu Options */}
                  <div className="space-y-0.5">
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-emerald-600 hover:bg-emerald-500/10 transition-all font-semibold"
                    >
                      <span className="text-slate-500 group-hover:text-emerald-500">{Icons.Home}</span>
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/security"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-emerald-600 hover:bg-emerald-500/10 transition-all font-semibold"
                    >
                      <span className="text-slate-500 group-hover:text-emerald-500">{Icons.Security}</span>
                      <span>Security & Password</span>
                    </Link>

                    <Link
                      to="/help"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-emerald-600 hover:bg-emerald-500/10 transition-all font-semibold"
                    >
                      <span className="text-slate-500">{Icons.Help}</span>
                      <span>Help & Guidance</span>
                    </Link>

                    {currentUser?.role === 'super_admin' ? (
                      <Link
                        to="/super-admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-600 hover:bg-amber-500/10 transition-all font-semibold"
                      >
                        <span className="text-amber-500">{Icons.Admin}</span>
                        <span>Super Admin</span>
                      </Link>
                    ) : isAdmin ? (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-emerald-600 hover:bg-emerald-500/10 transition-all font-semibold"
                      >
                        <span className="text-emerald-500">{Icons.Admin}</span>
                        <span>Admin Control</span>
                      </Link>
                    ) : null}

                    <div className="pt-1 mt-1 border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-500/10 transition-all font-semibold cursor-pointer"
                      >
                        <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Link
                to="/login"
                className={`rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs transition whitespace-nowrap shrink-0 border border-transparent bg-transparent ${
                  location.pathname === '/login'
                    ? 'text-teal-600 font-extrabold'
                    : 'text-slate-700 hover:text-teal-600 font-bold'
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className={`rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs transition whitespace-nowrap shrink-0 border border-transparent bg-transparent ${
                  location.pathname === '/register'
                    ? 'text-teal-600 font-extrabold'
                    : 'text-slate-700 hover:text-teal-600 font-bold'
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
              className="mobile-menu-btn relative rounded-xl border border-transparent bg-transparent p-2 text-slate-800 transition hover:text-teal-600 lg:hidden shadow-none cursor-pointer"
              aria-label="Toggle Menu"
            >
              {(unreadChatCount > 0 || friendRequestsCount > 0 || unreadNoticeCount > 0) && !mobileOpen && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 ring-2 ring-white" />
                </span>
              )}
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
        <div className="border-t border-emerald-200/80 bg-emerald-50/95 px-4 py-3 lg:hidden animate-in fade-in slide-in-from-top-2 shadow-2xl text-slate-900">
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
                          ? 'bg-teal-50 text-teal-700 font-extrabold'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={location.pathname === '/friends' ? 'text-teal-600' : 'text-slate-500'}>{Icons.Friends}</span>
                        <span>Friends</span>
                      </div>
                      {friendRequestsCount > 0 && (
                        <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-bold text-white">
                          {friendRequestsCount > 99 ? '99+' : friendRequestsCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/chats"
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                        location.pathname === '/chats'
                          ? 'bg-teal-50 text-teal-700 font-extrabold'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={location.pathname === '/chats' ? 'text-teal-600' : 'text-slate-500'}>{Icons.Chat}</span>
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
                      ? 'bg-teal-50 text-teal-700 font-extrabold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={active ? 'text-teal-600' : 'text-slate-500'}>{item.icon}</span>
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

            <div className="mt-2 pt-2 border-t border-slate-200 space-y-1.5">
              {isAuthenticated && (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    <span className="text-slate-500">{Icons.Home}</span>
                    <span>My Profile</span>
                  </Link>
                  <Link
                    to="/security"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    <span className="text-slate-500">{Icons.Security}</span>
                    <span>Security & Password</span>
                  </Link>
                  <Link
                    to="/help"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    <span className="text-slate-500">{Icons.Help}</span>
                    <span>Help & Guidance</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 border border-rose-200 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition mt-2 cursor-pointer"
                  >
                    Sign Out Account
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
