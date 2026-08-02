import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Pencil, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRegistrationDraft } from '@/hooks/useRegistrationDraft';
import { supabase } from '@/lib/supabase';
import type { PersonalInfo, WithdrawalAccount } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface ReviewData {
  personal: PersonalInfo | null;
  withdrawal: WithdrawalAccount | null;
}

export default function ReviewPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { draft } = useRegistrationDraft();
  const [data, setData] = useState<ReviewData>({ personal: null, withdrawal: null });
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const [p, w] = await Promise.all([
        supabase.from('personal_info').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('withdrawal_accounts').select('*').eq('user_id', user.id).maybeSingle(),
      ]);
      setData({
        personal: p.data as PersonalInfo | null,
        withdrawal: w.data as WithdrawalAccount | null,
      });
      setLoading(false);
    })();
  }, [user]);

  const onSubmit = async () => {
    if (!confirmed) {
      toast('Please confirm the information is correct', 'error');
      return;
    }
    if (!user) return;
    setSubmitting(true);
    try {
      // Mark profile as ready for payment
      await supabase.from('profiles').update({ status: 'pending' }).eq('id', user.id);
      // Clear local draft
      draft.personalInfo = {};
      toast('Information confirmed. Proceed to payment.', 'success');
      navigate('/register/payment');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not continue', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="space-y-3">
          <div className="skeleton h-8 w-40" />
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-24 w-full" />
        </div>
      </Card>
    );
  }

  const pi = data.personal;
  const wa = data.withdrawal;

  const Row = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-ink text-right">{value || '—'}</span>
    </div>
  );

  return (
    <Card>
      <CardHeader
        title="Review your information"
        subtitle="Please check everything is correct before paying your registration fee."
        icon={<FileText className="w-5 h-5" />}
      />

      <div className="space-y-4">
        {/* Account */}
        <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-ink">Account details</h3>
            <button onClick={() => navigate('/register/personal-info')} className="text-primary-600 hover:text-primary-700">
              <Pencil className="w-4 h-4" />
            </button>
          </div>
          <Row label="Full name" value={profile?.full_name} />
          <Row label="Email" value={profile?.email} />
          <Row label="Phone" value={profile?.phone} />
        </div>

        {/* Personal */}
        <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-ink">Personal information</h3>
            <button onClick={() => navigate('/register/personal-info')} className="text-primary-600 hover:text-primary-700">
              <Pencil className="w-4 h-4" />
            </button>
          </div>
          <Row label="Date of birth" value={pi?.date_of_birth} />
          <Row label="Gender" value={pi?.gender} />
          <Row label="County" value={pi?.county} />
          <Row label="Sub county" value={pi?.sub_county} />
          <Row label="Languages" value={pi?.languages?.join(', ')} />
          <Row label="Occupation" value={pi?.occupation} />
          <Row label="Education" value={pi?.education} />
          <Row label="Bio" value={pi?.bio} />
        </div>

        {/* Withdrawal */}
        <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-ink">Withdrawal account</h3>
            <button onClick={() => navigate('/register/withdrawal')} className="text-primary-600 hover:text-primary-700">
              <Pencil className="w-4 h-4" />
            </button>
          </div>
          <Row label="Method" value={wa?.method === 'mpesa' ? 'M-Pesa' : 'Bank'} />
          {wa?.method === 'mpesa' ? (
            <>
              <Row label="Phone number" value={wa.mpesa_number} />
              <Row label="Account name" value={wa.account_name} />
            </>
          ) : (
            <>
              <Row label="Bank" value={wa?.bank_name} />
              <Row label="Account number" value={wa?.account_number} />
              <Row label="Branch" value={wa?.branch} />
              <Row label="Account name" value={wa?.account_name} />
            </>
          )}
        </div>

        {/* Declaration */}
        <div className="rounded-xl border-2 border-primary-100 bg-primary-50/40 p-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <div>
              <span className="text-sm font-semibold text-ink">
                I confirm that the information provided is correct and complete.
              </span>
              <p className="text-xs text-gray-500 mt-1">
                I understand that providing false information may lead to
                disqualification and forfeiture of the registration fee.
              </p>
            </div>
          </label>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          <ShieldCheck className="w-4 h-4 text-primary-600 shrink-0" />
          <span>Your data is encrypted and securely stored. We never share your information.</span>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/register/withdrawal')} className="flex-1">
            Back
          </Button>
          <Button onClick={onSubmit} fullWidth loading={submitting} className="flex-1" rightIcon={<CheckCircle2 className="w-5 h-5" />}>
            Continue to payment
          </Button>
        </div>
      </div>
    </Card>
  );
}
