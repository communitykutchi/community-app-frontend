import React, { ReactNode, useEffect } from 'react';
import Navbar from '../components/Navbar.js';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios.js';

type MainLayoutProps = {
  children: ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
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
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

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

    const activityEvents: Array<keyof WindowEventMap> = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
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

  return (
    <div className="app-shell min-h-screen w-full">
      <Navbar />

      <main className={isAuthVisualRoute ? 'w-full px-0 py-0' : 'w-full px-4 py-6 sm:px-6 lg:px-8'}>
        {isAuthVisualRoute ? (
          children
        ) : (
          <div className="site-content mx-auto w-full max-w-6xl">
            {children}
          </div>
        )}
      </main>

      <footer className="mt-6 w-full border-t border-slate-200/80 bg-white/90">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-sm text-slate-600 md:flex-row md:px-6">
          <p className="font-semibold text-slate-700">© {year} All Kutchi Community Hub</p>
          <p className="text-xs tracking-wide text-slate-500">Simple. Fast. Reliable.</p>
        </div>
      </footer>
    </div>
  );
}
