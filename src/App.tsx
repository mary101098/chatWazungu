import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { RequireAuth, RequireAdmin } from '@/components/RouteGuards';

import PublicLayout from '@/components/layouts/PublicLayout';
import AppLayout from '@/components/layouts/AppLayout';
import RegistrationLayout from '@/components/layouts/RegistrationLayout';

import LandingPage from '@/pages/public/LandingPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import LoginPage from '@/pages/auth/LoginPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import PersonalInfoPage from '@/pages/registration/PersonalInfoPage';
import WithdrawalAccountPage from '@/pages/registration/WithdrawalAccountPage';
import ReviewPage from '@/pages/registration/ReviewPage';
import PaymentPage from '@/pages/payment/PaymentPage';
import DashboardPage from '@/pages/app/DashboardPage';
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
            </Route>

            {/* Auth (no layout) */}
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Registration flow (auth required) */}
            <Route
              element={
                <RequireAuth>
                  <RegistrationLayout />
                </RequireAuth>
              }
            >
              <Route path="/register/personal-info" element={<PersonalInfoPage />} />
              <Route path="/register/withdrawal" element={<WithdrawalAccountPage />} />
              <Route path="/register/review" element={<ReviewPage />} />
              <Route path="/register/payment" element={<PaymentPage />} />
            </Route>

            {/* App (auth required) */}
            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route path="/app" element={<DashboardPage />} />
            </Route>

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              element={
                <RequireAdmin>
                  <AdminDashboardPage />
                </RequireAdmin>
              }
            >
              <Route path="/admin" element={<AdminDashboardPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
