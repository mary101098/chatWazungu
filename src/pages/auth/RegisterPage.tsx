import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Logo from '@/components/ui/Logo';

const schema = z.object({
  full_name: z.string().min(3, 'Please enter your full name (at least 3 characters)'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .min(10, 'Please enter a valid phone number')
    .regex(/^(?:\+?254|0)?7\d{8}$/, 'Enter a valid Kenyan number, e.g. 0712345678'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  terms: z.literal(true, { message: 'You must accept the terms to continue' }),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

type FormData = z.infer<typeof schema>;

function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

export default function RegisterPage() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { terms: false as unknown as true },
  });

  const pw = watch('password') ?? '';
  const strength = passwordStrength(pw);
  const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-error-500', 'bg-error-500', 'bg-accent-500', 'bg-primary-500', 'bg-primary-600'];

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await signUp(data.email, data.password, data.full_name, data.phone);
      toast('Account created successfully. Continue with your profile.', 'success');
      navigate('/register/personal-info');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not create account';
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
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-ink transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
          <h1 className="text-2xl font-extrabold text-ink">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Start your registration in less than 2 minutes.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <Input
              label="Full name"
              placeholder="Jane Wanjiku"
              leftIcon={<User className="w-5 h-5" />}
              required
              {...register('full_name')}
              error={errors.full_name?.message}
            />
            <Input
              label="Email address"
              type="email"
              placeholder="jane@example.com"
              leftIcon={<Mail className="w-5 h-5" />}
              required
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Phone number (M-Pesa)"
              type="tel"
              placeholder="0712345678"
              leftIcon={<Phone className="w-5 h-5" />}
              required
              hint="We'll use this number for M-Pesa payments."
              {...register('phone')}
              error={errors.phone?.message}
            />
            <div>
              <Input
                label="Password"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                leftIcon={<Lock className="w-5 h-5" />}
                rightIcon={
                  <button type="button" onClick={() => setShowPw(!showPw)} aria-label="Toggle password visibility">
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
                required
                {...register('password')}
                error={errors.password?.message}
              />
              {pw.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${i < strength ? strengthColors[strength] : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{strengthLabels[strength]}</p>
                </div>
              )}
            </div>
            <Input
              label="Confirm password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} aria-label="Toggle password visibility">
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
              required
              {...register('confirm_password')}
              error={errors.confirm_password?.message}
            />
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                {...register('terms')}
              />
              <span className="text-sm text-gray-600">
                I agree to the <a href="#" className="text-primary-600 font-medium hover:underline">Terms</a> and{' '}
                <a href="#" className="text-primary-600 font-medium hover:underline">Privacy Policy</a>.
              </span>
            </label>
            {errors.terms && <p className="text-sm text-error-600 -mt-2">{errors.terms.message}</p>}

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary-600 hover:underline">Sign in</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
