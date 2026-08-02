import { Outlet } from 'react-router-dom';
import Logo from '@/components/ui/Logo';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-2 sm:gap-4">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-gray-600 hover:text-ink transition-colors hidden sm:block"
            >
              How it works
            </a>
            <a
              href="/login"
              className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Sign in
            </a>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Chat Wazungu. Registration portal for Kenyan applicants.</p>
          <p className="mt-1">Support: support@chatwazungu.com</p>
        </div>
      </footer>
    </div>
  );
}
