import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ProgressBar from '@/components/ui/ProgressBar';
import Button from '@/components/ui/Button';

const STEPS = [
  { label: 'Account' },
  { label: 'Personal' },
  { label: 'Withdrawal' },
  { label: 'Review' },
  { label: 'Payment' },
];

const STEP_INDEX: Record<string, number> = {
  '/register/personal-info': 1,
  '/register/withdrawal': 2,
  '/register/review': 3,
  '/register/payment': 4,
};

export default function RegistrationLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const current = STEP_INDEX[location.pathname] ?? 1;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-ink transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="mb-8">
          <ProgressBar steps={STEPS} current={current} />
        </div>
        <div className="page-enter">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
