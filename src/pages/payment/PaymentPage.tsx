import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Phone, ShieldCheck, Loader2, CheckCircle2, XCircle, RotateCw, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { initiateStkPush, pollPaymentStatus } from '@/lib/payment';
import { supabase, REGISTRATION_FEE } from '@/lib/supabase';
import type { Payment } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

type Stage = 'idle' | 'processing' | 'success' | 'failed';

export default function PaymentPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [stage, setStage] = useState<Stage>('idle');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check for existing successful payment on mount
  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setPayment(data as Payment);
        setStage('success');
      }
    })();
  }, [user]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startPolling = (paymentId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      const latest = await pollPaymentStatus(paymentId);
      if (!latest) return;
      if (latest.status === 'success') {
        if (pollRef.current) clearInterval(pollRef.current);
        setPayment(latest);
        setStage('success');
        toast('Payment received successfully!', 'success');
      } else if (latest.status === 'failed' || latest.status === 'cancelled') {
        if (pollRef.current) clearInterval(pollRef.current);
        setPayment(latest);
        setError(latest.failure_reason || 'Payment was not completed.');
        setStage('failed');
      } else if (attempts > 60) {
        // ~2 min timeout
        if (pollRef.current) clearInterval(pollRef.current);
        setError('Payment confirmation timed out. Please try again.');
        setStage('failed');
      }
    }, 2000);
  };

  const onPay = async () => {
    if (!user) return;
    if (!phone || phone.length < 10) {
      toast('Please enter a valid M-Pesa phone number', 'error');
      return;
    }
    setError('');
    setStage('processing');
    try {
      const p = await initiateStkPush(phone, user.id);
      setPayment(p);
      startPolling(p.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not start payment';
      setError(msg);
      setStage('failed');
      toast(msg, 'error');
    }
  };

  const retry = () => {
    setStage('idle');
    setError('');
    setPayment(null);
  };

  // ---- Success stage ----
  if (stage === 'success') {
    return (
      <Card>
        <div className="text-center py-6 animate-scale-in">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-primary-100 animate-pulse-ring" />
            <div className="relative w-24 h-24 rounded-full bg-primary-600 text-white flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-ink">Payment Received</h1>
          <p className="text-gray-500 mt-2">Your registration fee has been paid successfully.</p>

          <div className="mt-6 rounded-xl bg-[#FAFAFA] border border-gray-100 p-5 text-left max-w-sm mx-auto">
            <div className="flex justify-between py-1.5 text-sm">
              <span className="text-gray-500">Amount</span>
              <span className="font-semibold text-ink">KSh {REGISTRATION_FEE}</span>
            </div>
            {payment?.mpesa_receipt && (
              <div className="flex justify-between py-1.5 text-sm">
                <span className="text-gray-500">M-Pesa receipt</span>
                <span className="font-semibold text-ink">{payment.mpesa_receipt}</span>
              </div>
            )}
            <div className="flex justify-between py-1.5 text-sm">
              <span className="text-gray-500">Date</span>
              <span className="font-semibold text-ink">
                {payment?.transaction_date ? new Date(payment.transaction_date).toLocaleDateString() : new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500 bg-accent-50 rounded-lg p-3 max-w-sm mx-auto">
            <ShieldCheck className="w-4 h-4 text-accent-600 shrink-0" />
            <span>This fee is fully refundable as per our policy.</span>
          </div>

          <Button size="lg" fullWidth className="mt-6 max-w-sm mx-auto" rightIcon={<ArrowRight className="w-5 h-5" />} onClick={() => navigate('/app')}>
            Continue to dashboard
          </Button>
        </div>
      </Card>
    );
  }

  // ---- Processing stage ----
  if (stage === 'processing') {
    return (
      <Card>
        <div className="text-center py-8 animate-scale-in">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-primary-100 animate-pulse-ring" />
            <div className="relative w-24 h-24 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-ink">Check your phone</h1>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            We've sent an M-Pesa payment request to <strong>{phone}</strong>.
            Enter your M-Pesa PIN to complete the payment.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-full px-4 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
            Waiting for payment confirmation…
          </div>
        </div>
      </Card>
    );
  }

  // ---- Failed stage ----
  if (stage === 'failed') {
    return (
      <Card>
        <div className="text-center py-6 animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-error-50 text-error-600 flex items-center justify-center mx-auto mb-5">
            <XCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-extrabold text-ink">Payment not completed</h1>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            {error || 'The payment could not be completed. Please try again.'}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" variant="outline" onClick={() => navigate('/app')}>
              Back to dashboard
            </Button>
            <Button size="lg" leftIcon={<RotateCw className="w-5 h-5" />} onClick={retry}>
              Try again
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // ---- Idle stage ----
  return (
    <Card>
      <CardHeader
        title="Pay registration fee"
        subtitle="Complete your registration with a one-time refundable fee."
        icon={<Wallet className="w-5 h-5" />}
      />

      <div className="rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 border border-primary-100 p-6 text-center mb-6">
        <p className="text-sm text-gray-600">Registration fee</p>
        <p className="text-4xl font-extrabold text-ink mt-1">KSh {REGISTRATION_FEE}</p>
        <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-accent-100 text-accent-700 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" /> REFUNDABLE
        </span>
      </div>

      <div className="flex items-start gap-2.5 text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mb-6">
        <ShieldCheck className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
        <span>
          This fee is fully refundable. It will be returned to you if your
          application is not approved, or when you leave the programme.
        </span>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onPay(); }} className="space-y-5">
        <Input
          label="M-Pesa phone number"
          type="tel"
          placeholder="0712345678"
          leftIcon={<Phone className="w-5 h-5" />}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          hint="You'll receive a payment prompt on this phone."
        />
        <Button type="submit" fullWidth size="xl" leftIcon={<Wallet className="w-5 h-5" />}>
          Pay KSh {REGISTRATION_FEE} via M-Pesa
        </Button>
        <p className="text-center text-xs text-gray-400">
          By clicking pay, you agree to receive an M-Pesa STK Push prompt.
        </p>
      </form>
    </Card>
  );
}
