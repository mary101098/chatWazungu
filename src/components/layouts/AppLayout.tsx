import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
import { LogOut, LayoutDashboard } from 'lucide-react';

export default function AppLayout() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size="sm" to={isAdmin ? '/admin' : '/app'} />
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-ink transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" /> Admin
              </Link>
            )}
            {profile && (
              <span className="hidden sm:block text-sm text-gray-500">
                {profile.full_name.split(' ')[0]}
              </span>
            )}
            <Button size="sm" variant="ghost" onClick={handleSignOut} leftIcon={<LogOut className="w-4 h-4" />}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
