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
  const year = new Date().getFullYear();

  return (
    <div className="app-shell flex min-h-screen w-full flex-col text-slate-900 selection:bg-teal-600 selection:text-white bg-slate-50">
      <Navbar />

      <main className="w-full flex-1 px-4 py-5 sm:px-6 lg:px-8 flex flex-col items-center">
        <div className="site-content mx-auto w-full max-w-6xl">
          {children}
        </div>
      </main>

      <footer className="mt-8 sm:mt-12 w-full border-t border-slate-200 bg-white text-slate-700 py-5 sm:py-6 shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 sm:gap-4 px-4 text-center sm:text-left sm:flex-row">
          <div className="flex items-center justify-center gap-2.5">
            <img src="/logo.png" alt="Kutchi Community Logo" className="h-6 w-6 object-contain shrink-0" />
            <p className="text-xs font-bold text-slate-800">
              © {year} All Kutchi Community Portal
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-5 text-[11px] font-bold text-slate-600">
            <a href="mailto:info@kutchicommunity.com" className="inline-flex items-center gap-1.5 hover:text-teal-600 transition whitespace-nowrap">
              <span>✉️</span>
              <span>info@kutchicommunity.com</span>
            </a>
            <span className="hidden sm:inline text-slate-700">•</span>
            <a href="mailto:support@kutchicommunity.com" className="inline-flex items-center gap-1.5 hover:text-teal-600 transition whitespace-nowrap">
              <span>❓</span>
              <span>support@kutchicommunity.com</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
