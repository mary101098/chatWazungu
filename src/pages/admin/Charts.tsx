import { useMemo } from 'react';
import type { AdminStats } from '@/types';

// Simple bar chart of payment status distribution
export function PaymentChart({ stats }: { stats: AdminStats }) {
  const bars = useMemo(() => {
    const total = Math.max(stats.successfulPayments + stats.pendingPayments + stats.failedPayments, 1);
    return [
      { label: 'Successful', value: stats.successfulPayments, color: 'bg-primary-600', pct: (stats.successfulPayments / total) * 100 },
      { label: 'Pending', value: stats.pendingPayments, color: 'bg-accent-500', pct: (stats.pendingPayments / total) * 100 },
      { label: 'Failed', value: stats.failedPayments, color: 'bg-error-500', pct: (stats.failedPayments / total) * 100 },
    ];
  }, [stats]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
      <h3 className="font-bold text-ink mb-4">Payment breakdown</h3>
      <div className="space-y-4">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">{b.label}</span>
              <span className="font-semibold text-ink">{b.value}</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div className={`h-full rounded-full ${b.color} transition-all duration-700`} style={{ width: `${b.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple donut-style application status
export function ApplicationChart({ stats }: { stats: AdminStats }) {
  const total = Math.max(stats.approvedUsers + stats.rejectedUsers + stats.pendingReview, 1);
  const segments = [
    { label: 'Approved', value: stats.approvedUsers, color: '#16A34A' },
    { label: 'Pending', value: stats.pendingReview, color: '#F59E0B' },
    { label: 'Rejected', value: stats.rejectedUsers, color: '#EF4444' },
  ];

  // Build conic-gradient string
  let acc = 0;
  const stops = segments.map((s) => {
    const start = (acc / total) * 100;
    acc += s.value;
    const end = (acc / total) * 100;
    return `${s.color} ${start}% ${end}%`;
  });
  const gradient = `conic-gradient(${stops.join(', ')})`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
      <h3 className="font-bold text-ink mb-4">Application status</h3>
      <div className="flex items-center gap-6">
        <div className="relative w-28 h-28 shrink-0">
          <div className="w-28 h-28 rounded-full" style={{ background: total > 0 ? gradient : '#E5E7EB' }} />
          <div className="absolute inset-3 bg-white rounded-full flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-ink">{stats.approvedUsers + stats.rejectedUsers + stats.pendingReview}</span>
            <span className="text-xs text-gray-500">Total</span>
          </div>
        </div>
        <div className="space-y-2 flex-1">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
              <span className="text-gray-600 flex-1">{s.label}</span>
              <span className="font-semibold text-ink">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
