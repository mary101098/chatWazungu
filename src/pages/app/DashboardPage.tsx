import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, Loader2, Mail, ArrowRight, RotateCw, UserCheck, Wallet, FileText, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase, SUPPORT_EMAIL } from '@/lib/supabase';
import type { ApplicationStatus, Payment } from '@/types';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [appStatus, setAppStatus] = useState<ApplicationStatus | null>(null);
  const [latestPayment, setLatestPayment] = useState<Payment | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const [s, p] = await Promise.all([
        supabase.from('application_status').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      setAppStatus(s.data as ApplicationStatus | null);
      setLatestPayment(p.data as Payment | null);
      setDataLoading(false);
    })();
  }, [user]);

  if (loading || dataLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="space-y-4">
          <div className="skeleton h-10 w-64" />
          <div className="skeleton h-40 w-full" />
          <div className="skeleton h-40 w-full" />
        </div>
      </div>
    );
  }

  const paid = latestPayment?.status === 'success';
  const status = appStatus?.status ?? 'pending';

  // If not paid yet, send them to payment
  if (!paid && profile?.status !== 'approved') {
    // Check if profile is incomplete (no personal info / withdrawal)
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-accent-50 text-accent-600 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-ink">Complete your registration</h1>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto">
              You haven't completed your registration yet. Continue to finish
              your profile and pay the registration fee.
            </p>
            <Button size="lg" className="mt-6" rightIcon={<ArrowRight className="w-5 h-5" />} onClick={() => navigate('/register/personal-info')}>
              Continue registration
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink">
          Hello, {profile?.full_name.split(' ')[0] ?? 'there'}
        </h1>
        <p className="text-gray-500 mt-1">Here's your application status.</p>
      </div>

      {status === 'pending' && <PendingView payment={latestPayment} />}
      {status === 'approved' && <ApprovedView name={profile?.full_name ?? ''} />}
      {status === 'rejected' && (
        <RejectedView
          reason={appStatus?.review_notes}
          onApplyAgain={() => {
            toast('You can re-apply without paying again.', 'info');
            navigate('/register/personal-info');
          }}
        />
      )}
    </div>
  );
}

function Timeline({ steps }: { steps: { label: string; desc: string; state: 'done' | 'active' | 'todo' }[] }) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                step.state === 'done'
                  ? 'bg-primary-600 text-white'
                  : step.state === 'active'
                    ? 'bg-accent-500 text-white ring-4 ring-accent-100'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {step.state === 'done' ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-0.5 flex-1 min-h-[2rem] my-1 ${step.state === 'done' ? 'bg-primary-300' : 'bg-gray-200'}`} />
            )}
          </div>
          <div className="pb-6 flex-1">
            <h3 className={`font-semibold ${step.state === 'todo' ? 'text-gray-400' : 'text-ink'}`}>{step.label}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PendingView({ payment }: { payment: Payment | null }) {
  return (
    <>
      <Card className="mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-ink">Application under review</h2>
            <p className="text-sm text-gray-500">We're reviewing your registration.</p>
          </div>
        </div>
        <Timeline
          steps={[
            { label: 'Account created', desc: 'Your account is set up.', state: 'done' },
            { label: 'Payment received', desc: `KSh ${payment?.amount ?? 150} via M-Pesa${payment?.mpesa_receipt ? ` · ${payment.mpesa_receipt}` : ''}.`, state: 'done' },
            { label: 'Under review', desc: 'Our team is reviewing your application.', state: 'active' },
            { label: 'Decision', desc: 'You will be notified by email.', state: 'todo' },
          ]}
        />
      </Card>
      <Card>
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-ink font-medium">We will notify you via email once your application has been reviewed.</p>
            <p className="text-xs text-gray-500 mt-1">This usually takes 1–3 business days.</p>
          </div>
        </div>
      </Card>
    </>
  );
}

function ApprovedView({ name }: { name: string }) {
  return (
    <>
      <Card className="mb-4">
        <div className="text-center py-4">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full bg-primary-100 animate-pulse-ring" />
            <div className="relative w-20 h-20 rounded-full bg-primary-600 text-white flex items-center justify-center">
              <UserCheck className="w-10 h-10" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-ink">Congratulations, {name.split(' ')[0]}!</h2>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            Your application has been approved. Welcome to Chat Wazungu.
          </p>
        </div>
        <Timeline
          steps={[
            { label: 'Account created', desc: 'Your account is set up.', state: 'done' },
            { label: 'Payment received', desc: 'Registration fee paid.', state: 'done' },
            { label: 'Under review', desc: 'Application reviewed.', state: 'done' },
            { label: 'Approved', desc: 'You are now a registered member.', state: 'done' },
          ]}
        />
      </Card>
      <Card>
        <h3 className="font-bold text-ink mb-3">Next steps</h3>
        <div className="space-y-3">
          {[
            { icon: MessageCircle, text: 'You will receive an email with instructions on how to access the chat platform.' },
            { icon: FileText, text: 'Keep your profile information up to date for the best matching.' },
            { icon: Mail, text: `Need help? Contact us at ${SUPPORT_EMAIL}` },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#FAFAFA]">
              <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4" />
              </div>
              <p className="text-sm text-ink">{item.text}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function RejectedView({ reason, onApplyAgain }: { reason?: string | null; onApplyAgain: () => void }) {
  return (
    <Card>
      <div className="text-center py-4">
        <div className="w-20 h-20 rounded-full bg-error-50 text-error-600 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-ink">Application not approved</h2>
        <p className="text-gray-500 mt-2 max-w-sm mx-auto">
          We're sorry, but your application was not approved at this time. This
          is not the end — you can apply again.
        </p>
      </div>
      {reason && (
        <div className="rounded-xl bg-error-50 border border-error-100 p-4 mb-4">
          <p className="text-xs font-semibold text-error-700 uppercase tracking-wide mb-1">Reason</p>
          <p className="text-sm text-ink">{reason}</p>
        </div>
      )}
      <div className="rounded-xl bg-accent-50 border border-accent-100 p-4 mb-6">
        <p className="text-sm text-ink">
          Good news: you won't need to pay the registration fee again. Your
          previous payment is still valid.
        </p>
      </div>
      <Button size="lg" fullWidth leftIcon={<RotateCw className="w-5 h-5" />} onClick={onApplyAgain}>
        Apply again
      </Button>
    </Card>
  );
}
