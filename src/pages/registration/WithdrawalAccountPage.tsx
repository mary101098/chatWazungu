import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Smartphone, Landmark, Phone, User, Building2, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRegistrationDraft } from '@/hooks/useRegistrationDraft';
import { supabase } from '@/lib/supabase';
import { BANKS } from '@/lib/constants';
import type { WithdrawalMethod } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import Input, { Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function WithdrawalAccountPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { draft, save } = useRegistrationDraft();
  const [method, setMethod] = useState<WithdrawalMethod>(draft.withdrawal.method ?? 'mpesa');
  const [mpesaNumber, setMpesaNumber] = useState(draft.withdrawal.mpesa_number ?? profile?.phone ?? '');
  const [accountName, setAccountName] = useState(draft.withdrawal.account_name ?? profile?.full_name ?? '');
  const [bankName, setBankName] = useState(draft.withdrawal.bank_name ?? '');
  const [accountNumber, setAccountNumber] = useState(draft.withdrawal.account_number ?? '');
  const [branch, setBranch] = useState(draft.withdrawal.branch ?? '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from('withdrawal_accounts')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setMethod(data.method);
        setMpesaNumber(data.mpesa_number ?? mpesaNumber);
        setAccountName(data.account_name ?? accountName);
        setBankName(data.bank_name ?? '');
        setAccountNumber(data.account_number ?? '');
        setBranch(data.branch ?? '');
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (method === 'mpesa') {
      if (!mpesaNumber || !accountName) {
        toast('Please fill in all M-Pesa fields', 'error');
        return;
      }
    } else {
      if (!bankName || !accountNumber || !accountName || !branch) {
        toast('Please fill in all bank fields', 'error');
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        method,
        mpesa_number: method === 'mpesa' ? mpesaNumber : null,
        bank_name: method === 'bank' ? bankName : null,
        account_number: method === 'bank' ? accountNumber : null,
        branch: method === 'bank' ? branch : null,
        account_name: accountName,
      };
      const { data: existing } = await supabase
        .from('withdrawal_accounts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (existing) {
        await supabase.from('withdrawal_accounts').update(payload).eq('user_id', user.id);
      } else {
        await supabase.from('withdrawal_accounts').insert(payload);
      }
      save({ withdrawal: payload });
      toast('Withdrawal account saved', 'success');
      navigate('/register/review');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="space-y-4">
          <div className="skeleton h-8 w-56" />
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-12 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Withdrawal account"
        subtitle="Where should we send your earnings? You can change this later."
        icon={<Wallet className="w-5 h-5" />}
      />
      <form onSubmit={onSubmit} className="space-y-5">
        {/* Method selector */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Preferred withdrawal method <span className="text-error-600">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMethod('mpesa')}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                method === 'mpesa'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${method === 'mpesa' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-ink">M-Pesa</div>
                <div className="text-xs text-gray-500">Send to phone number</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMethod('bank')}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                method === 'bank'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${method === 'bank' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-ink">Bank</div>
                <div className="text-xs text-gray-500">Bank transfer</div>
              </div>
            </button>
          </div>
        </div>

        {method === 'mpesa' ? (
          <div className="space-y-4 animate-fade-in">
            <Input
              label="M-Pesa phone number"
              type="tel"
              placeholder="0712345678"
              leftIcon={<Phone className="w-5 h-5" />}
              value={mpesaNumber}
              onChange={(e) => setMpesaNumber(e.target.value)}
              required
            />
            <Input
              label="Account name"
              placeholder="Jane Wanjiku"
              leftIcon={<User className="w-5 h-5" />}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
            />
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <Select
              label="Bank name"
              placeholder="Select bank"
              options={BANKS.map((b) => ({ value: b, label: b }))}
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              required
            />
            <Input
              label="Account number"
              placeholder="01234567890"
              leftIcon={<Building2 className="w-5 h-5" />}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
            />
            <Input
              label="Branch"
              placeholder="e.g. Moi Avenue"
              leftIcon={<MapPin className="w-5 h-5" />}
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              required
            />
            <Input
              label="Account name"
              placeholder="Jane Wanjiku"
              leftIcon={<User className="w-5 h-5" />}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
            />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/register/personal-info')} className="flex-1">
            Back
          </Button>
          <Button type="submit" fullWidth loading={saving} className="flex-1">
            Continue
          </Button>
        </div>
      </form>
    </Card>
  );
}
