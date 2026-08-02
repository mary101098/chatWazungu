import { useState } from 'react';
import { X, Mail, Phone, Calendar, MapPin, Briefcase, GraduationCap, Languages, Wallet, FileText, CheckCircle2, XCircle } from 'lucide-react';
import type { AdminApplicant } from '@/types';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';

interface Props {
  applicant: AdminApplicant;
  onClose: () => void;
  onDecide: (status: 'approved' | 'rejected', notes: string) => Promise<void>;
}

function Field({ label, value, icon }: { label: string; value: string | null | undefined; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      {icon && <div className="text-gray-400 mt-0.5">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-ink break-words">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function ApplicantDetailModal({ applicant, onClose, onDecide }: Props) {
  const [notes, setNotes] = useState(applicant.review_notes ?? '');
  const [acting, setActing] = useState(false);

  const decide = async (status: 'approved' | 'rejected') => {
    setActing(true);
    try {
      await onDecide(status, notes);
    } finally {
      setActing(false);
    }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      approved: 'bg-primary-50 text-primary-700 border-primary-100',
      rejected: 'bg-error-50 text-error-700 border-error-100',
      pending: 'bg-accent-50 text-accent-700 border-accent-100',
      incomplete: 'bg-gray-100 text-gray-600 border-gray-200',
      success: 'bg-primary-50 text-primary-700 border-primary-100',
      failed: 'bg-error-50 text-error-700 border-error-100',
      cancelled: 'bg-error-50 text-error-700 border-error-100',
    };
    return `px-2.5 py-1 rounded-full text-xs font-semibold border ${map[s] ?? map.incomplete}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto scroll-thin animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {applicant.profile_photo ? (
              <img src={applicant.profile_photo} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                {applicant.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="font-bold text-ink">{applicant.full_name}</h2>
              <p className="text-xs text-gray-500">{applicant.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <span className={statusBadge(applicant.status)}>Application: {applicant.status}</span>
            {applicant.payment_status && (
              <span className={statusBadge(applicant.payment_status)}>Payment: {applicant.payment_status}</span>
            )}
          </div>

          {/* Contact */}
          <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Contact</h3>
            <Field label="Email" value={applicant.email} icon={<Mail className="w-4 h-4" />} />
            <Field label="Phone" value={applicant.phone} icon={<Phone className="w-4 h-4" />} />
            <Field label="Registered" value={new Date(applicant.created_at).toLocaleString()} icon={<Calendar className="w-4 h-4" />} />
          </div>

          {/* Personal */}
          <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Personal information</h3>
            <Field label="Date of birth" value={applicant.date_of_birth} icon={<Calendar className="w-4 h-4" />} />
            <Field label="Gender" value={applicant.gender} />
            <Field label="County" value={applicant.county} icon={<MapPin className="w-4 h-4" />} />
            <Field label="Sub county" value={applicant.sub_county} />
            <Field label="Languages" value={applicant.languages?.join(', ')} icon={<Languages className="w-4 h-4" />} />
            <Field label="Occupation" value={applicant.occupation} icon={<Briefcase className="w-4 h-4" />} />
            <Field label="Education" value={applicant.education} icon={<GraduationCap className="w-4 h-4" />} />
            <Field label="Bio" value={applicant.bio} icon={<FileText className="w-4 h-4" />} />
          </div>

          {/* Withdrawal */}
          <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Withdrawal account</h3>
            <Field label="Method" value={applicant.withdrawal_method === 'mpesa' ? 'M-Pesa' : applicant.withdrawal_method === 'bank' ? 'Bank' : null} icon={<Wallet className="w-4 h-4" />} />
            {applicant.withdrawal_method === 'mpesa' ? (
              <>
                <Field label="M-Pesa number" value={applicant.mpesa_number} />
                <Field label="Account name" value={applicant.account_name} />
              </>
            ) : (
              <>
                <Field label="Bank" value={applicant.bank_name} />
                <Field label="Account number" value={applicant.account_number} />
                <Field label="Branch" value={applicant.branch} />
                <Field label="Account name" value={applicant.account_name} />
              </>
            )}
          </div>

          {/* Payment */}
          <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Payment</h3>
            <Field label="Amount" value={applicant.payment_amount ? `KSh ${applicant.payment_amount}` : null} icon={<Wallet className="w-4 h-4" />} />
            <Field label="Receipt" value={applicant.mpesa_receipt} />
            <Field label="Date" value={applicant.payment_date ? new Date(applicant.payment_date).toLocaleString() : null} />
          </div>

          {/* Review */}
          <div>
            <h3 className="text-sm font-semibold text-ink mb-2">Review notes</h3>
            <Textarea
              placeholder="Add notes about this application (visible to other admins)…"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {applicant.review_notes && applicant.review_notes !== notes && (
            <p className="text-xs text-gray-500">Previous notes: {applicant.review_notes}</p>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white pt-2">
            <Button
              variant="danger"
              fullWidth
              loading={acting}
              leftIcon={<XCircle className="w-5 h-5" />}
              onClick={() => decide('rejected')}
            >
              Reject
            </Button>
            <Button
              fullWidth
              loading={acting}
              leftIcon={<CheckCircle2 className="w-5 h-5" />}
              onClick={() => decide('approved')}
            >
              Approve
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
