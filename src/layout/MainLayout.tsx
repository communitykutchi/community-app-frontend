import React, { ReactNode } from 'react';
import Navbar from '../components/Navbar.js';
import { useLocation } from 'react-router-dom';

type MainLayoutProps = {
  children: ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const isAuthVisualRoute = location.pathname === '/register' || location.pathname === '/login';
  const year = new Date().getFullYear();

  return (
    <div className="site-shell min-h-screen w-full flex flex-col">
      {/* Header: delegated to Navbar component */}
      <Navbar />

      {/* Main content: center page content horizontally and vertically when possible */}
      <main className={isAuthVisualRoute ? 'flex-1 w-full p-0 bg-transparent' : 'site-main flex-1 w-full p-6'}>
        {isAuthVisualRoute ? (
          children
        ) : (
          <div className="site-content w-full max-w-5xl mx-auto">
            {children}
          </div>
        )}
      </main>

      <footer className="w-full border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 px-4 py-4 text-sm text-slate-600 md:flex-row">
          <p className="font-medium text-slate-700">© {year} All Kutchi Community's Hub</p>
          <p className="text-xs tracking-wide text-slate-500">Community • Privacy • Support</p>
        </div>
      </footer>
    </div>
  );
}
