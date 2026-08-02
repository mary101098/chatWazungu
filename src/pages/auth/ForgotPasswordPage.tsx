import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Logo from '@/components/ui/Logo';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setSent(true);
      toast('Password reset link sent. Check your email.', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not send reset link';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-scale-in">
        <div className="mb-6 text-center">
          <Logo size="lg" to="/" />
        </div>
        <Card>
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-ink transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </Link>
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-extrabold text-ink">Check your email</h1>
              <p className="text-sm text-gray-500 mt-2">
                We've sent a password reset link to <strong>{email}</strong>.
                Follow the link to reset your password.
              </p>
              <Link to="/login" className="inline-block mt-6">
                <Button variant="outline">Back to sign in</Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-ink">Forgot password</h1>
              <p className="text-sm text-gray-500 mt-1">
                Enter your email and we'll send you a reset link.
              </p>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="jane@example.com"
                  leftIcon={<Mail className="w-5 h-5" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" fullWidth size="lg" loading={loading}>
                  Send reset link
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
