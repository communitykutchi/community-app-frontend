import { ReactNode } from 'react';
import Navbar from '../components/Navbar';
import { useLocation } from 'react-router-dom';
import { usePresence } from '../hooks/usePresence';

type MainLayoutProps = {
  children: ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  usePresence();
  const location = useLocation();
  const isAuthVisualRoute = location.pathname === '/register' || location.pathname === '/login' || location.pathname === '/banned';
  const year = new Date().getFullYear();

  return (
    <div className="app-shell flex min-h-screen w-full flex-col text-slate-900 selection:bg-teal-600 selection:text-white">
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

      <footer className="mt-12 w-full border-t border-slate-800/80 bg-slate-950/90 text-white backdrop-blur-sm gpu-smooth">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-xs md:flex-row md:px-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Kutchi Community Logo" className="h-6 w-6 object-contain" />
            <p className="font-bold text-white">© {year} All Kutchi Community Portal</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-300">
            <a href="mailto:info@kutchicommunity.com" className="hover:text-teal-400 transition">✉️ info@kutchicommunity.com</a>
            <span>•</span>
            <a href="mailto:support@kutchicommunity.com" className="hover:text-teal-400 transition">❓ support@kutchicommunity.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
