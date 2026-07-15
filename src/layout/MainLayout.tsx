import { ReactNode } from 'react';
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
    <div className="app-shell flex min-h-screen w-full flex-col">
      <Navbar />

      <main className={isAuthVisualRoute ? 'w-full flex-1 px-0 py-0' : 'w-full flex-1 px-4 py-6 sm:px-6 lg:px-8'}>
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
