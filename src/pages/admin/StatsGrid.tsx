import { Users, Wallet, CheckCircle2, Clock, XCircle, TrendingUp, DollarSign } from 'lucide-react';
import type { AdminStats } from '@/types';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: typeof Users;
  color: string;
  bg: string;
}

function StatCard({ label, value, icon: Icon, color, bg }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 hover:shadow-card-hover transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} ${color} mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-extrabold text-ink">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

export default function StatsGrid({ stats }: { stats: AdminStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total Applications" value={stats.totalApplications} icon={Users} color="text-primary-600" bg="bg-primary-50" />
      <StatCard label="Total Payments" value={stats.totalPayments} icon={Wallet} color="text-gray-700" bg="bg-gray-100" />
      <StatCard label="Successful" value={stats.successfulPayments} icon={CheckCircle2} color="text-primary-600" bg="bg-primary-50" />
      <StatCard label="Pending Payments" value={stats.pendingPayments} icon={Clock} color="text-accent-600" bg="bg-accent-50" />
      <StatCard label="Failed Payments" value={stats.failedPayments} icon={XCircle} color="text-error-600" bg="bg-error-50" />
      <StatCard label="Approved Users" value={stats.approvedUsers} icon={TrendingUp} color="text-primary-600" bg="bg-primary-50" />
      <StatCard label="Rejected Users" value={stats.rejectedUsers} icon={XCircle} color="text-error-600" bg="bg-error-50" />
      <StatCard label="Pending Review" value={stats.pendingReview} icon={Clock} color="text-accent-600" bg="bg-accent-50" />
    </div>
  );
}

export function RevenueCard({ revenue, count }: { revenue: number; count: number }) {
  return (
    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between mb-2">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <DollarSign className="w-5 h-5" />
        </div>
        <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">REVENUE</span>
      </div>
      <p className="text-3xl font-extrabold">KSh {revenue.toLocaleString()}</p>
      <p className="text-sm text-white/80 mt-1">From {count} successful payments</p>
    </div>
  );
}
