import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { fetchAdminStats, fetchApplicants, updateApplicationStatus } from '@/lib/admin';
import type { AdminStats, AdminApplicant } from '@/types';
import StatsGrid, { RevenueCard } from './StatsGrid';
import { PaymentChart, ApplicationChart } from './Charts';
import ApplicantDetailModal from './ApplicantDetailModal';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Search, Download, ChevronLeft, ChevronRight, Eye, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'incomplete', label: 'Incomplete' },
];

const PAGE_SIZE = 8;

function statusBadge(status: string) {
  const map: Record<string, string> = {
    approved: 'bg-primary-50 text-primary-700 border-primary-100',
    rejected: 'bg-error-50 text-error-700 border-error-100',
    pending: 'bg-accent-50 text-accent-700 border-accent-100',
    incomplete: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return `px-2.5 py-1 rounded-full text-xs font-semibold border ${map[status] ?? map.incomplete}`;
}

function paymentBadge(status: string | null) {
  if (!status) return <span className="text-xs text-gray-400">No payment</span>;
  const map: Record<string, string> = {
    success: 'bg-primary-50 text-primary-700',
    pending: 'bg-accent-50 text-accent-700',
    failed: 'bg-error-50 text-error-700',
    cancelled: 'bg-error-50 text-error-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

export default function AdminDashboardPage() {
  const { user, admin } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [applicants, setApplicants] = useState<AdminApplicant[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminApplicant | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([
        fetchAdminStats(),
        fetchApplicants({ search, status: statusFilter, page, pageSize: PAGE_SIZE }),
      ]);
      setStats(s);
      setApplicants(a.applicants);
      setTotal(a.total);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, toast]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search
    return () => clearTimeout(t);
  }, [load]);

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  const exportCsv = () => {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Payment', 'Amount', 'Receipt', 'County', 'Occupation', 'Registered'];
    const rows = applicants.map((a) => [
      a.full_name, a.email, a.phone, a.status, a.payment_status ?? '',
      a.payment_amount ?? '', a.mpesa_receipt ?? '', a.county ?? '', a.occupation ?? '',
      new Date(a.created_at).toISOString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `applicants-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast('CSV exported', 'success');
  };

  const onDecide = async (status: 'approved' | 'rejected', notes: string) => {
    if (!user || !selected) return;
    try {
      await updateApplicationStatus(selected.user_id, status, notes, user.id);
      toast(`Application ${status}`, 'success');
      setSelected(null);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not update status', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Admin header */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base">Admin Portal</h1>
              <p className="text-xs text-white/60 hidden sm:block">Chat Wazungu — Registration management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/80 hidden sm:block">{admin?.name ?? 'Admin'}</span>
            <span className="px-2 py-0.5 rounded-full bg-primary-600 text-xs font-semibold">{admin?.role ?? 'admin'}</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        {stats ? (
          <>
            <StatsGrid stats={stats} />
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1">
                <RevenueCard revenue={stats.revenue} count={stats.successfulPayments} />
              </div>
              <div className="lg:col-span-1">
                <PaymentChart stats={stats} />
              </div>
              <div className="lg:col-span-1">
                <ApplicationChart stats={stats} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
        )}

        {/* Applicants table */}
        <Card padded={false} className="overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-ink">Applicants</h2>
              <p className="text-sm text-gray-500">{total} total · showing {applicants.length}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name, email, phone…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="h-10 pl-9 pr-4 rounded-xl border border-gray-300 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                />
              </div>
              <Button size="sm" variant="outline" leftIcon={<Download className="w-4 h-4" />} onClick={exportCsv}>
                Export CSV
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-5 py-3 border-b border-gray-100 flex gap-2 overflow-x-auto scroll-thin">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => { setStatusFilter(f.value); setPage(1); }}
                className={`px-3.5 h-8 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  statusFilter === f.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 w-full" />)}
            </div>
          ) : applicants.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p>No applicants found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto scroll-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                      <th className="px-5 py-3 font-semibold">Applicant</th>
                      <th className="px-5 py-3 font-semibold hidden md:table-cell">Phone</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold hidden lg:table-cell">Payment</th>
                      <th className="px-5 py-3 font-semibold hidden lg:table-cell">Registered</th>
                      <th className="px-5 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicants.map((a) => (
                      <tr key={a.user_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            {a.profile_photo ? (
                              <img src={a.profile_photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                                {a.full_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-ink truncate">{a.full_name}</p>
                              <p className="text-xs text-gray-500 truncate">{a.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell text-gray-600">{a.phone}</td>
                        <td className="px-5 py-3"><span className={statusBadge(a.status)}>{a.status}</span></td>
                        <td className="px-5 py-3 hidden lg:table-cell">{paymentBadge(a.payment_status)}</td>
                        <td className="px-5 py-3 hidden lg:table-cell text-gray-600 text-xs">
                          {new Date(a.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelected(a)}
                              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-ink transition-colors"
                              aria-label="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {selected && (
        <ApplicantDetailModal
          applicant={selected}
          onClose={() => setSelected(null)}
          onDecide={onDecide}
        />
      )}
    </div>
  );
}
