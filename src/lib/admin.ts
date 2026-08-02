import { supabase } from '@/lib/supabase';
import type { AdminStats, AdminApplicant } from '@/types';

export async function fetchAdminStats(): Promise<AdminStats> {
  const [profiles, payments, apps] = await Promise.all([
    supabase.from('profiles').select('status'),
    supabase.from('payments').select('amount, status, created_at'),
    supabase.from('application_status').select('status'),
  ]);

  const profileRows = profiles.data ?? [];
  const paymentRows = payments.data ?? [];
  const appRows = apps.data ?? [];

  const successful = paymentRows.filter((p) => p.status === 'success');
  const revenue = successful.reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    totalApplications: profileRows.length,
    totalPayments: paymentRows.length,
    successfulPayments: successful.length,
    pendingPayments: paymentRows.filter((p) => p.status === 'pending').length,
    failedPayments: paymentRows.filter((p) => p.status === 'failed' || p.status === 'cancelled').length,
    approvedUsers: appRows.filter((a) => a.status === 'approved').length,
    rejectedUsers: appRows.filter((a) => a.status === 'rejected').length,
    pendingReview: appRows.filter((a) => a.status === 'pending').length,
    revenue,
  };
}

export interface FetchApplicantsParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface FetchApplicantsResult {
  applicants: AdminApplicant[];
  total: number;
}

export async function fetchApplicants(params: FetchApplicantsParams): Promise<FetchApplicantsResult> {
  const { search = '', status = 'all', page = 1, pageSize = 10 } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('profiles')
    .select(`
      id, email, full_name, phone, status, created_at,
      personal_info(date_of_birth, gender, county, sub_county, languages, occupation, education, bio, profile_photo),
      withdrawal_accounts(method, mpesa_number, bank_name, account_number, branch, account_name),
      application_status(status, review_notes, reviewed_at),
      payments(amount, status, transaction_date, mpesa_receipt)
    `, { count: 'exact' });

  if (status !== 'all') {
    query = query.eq('status', status);
  }
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }
  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  // Flatten the nested joins into AdminApplicant shape
  const applicants: AdminApplicant[] = (data ?? []).map((row: any) => {
    const payment = row.payments?.[0];
    return {
      user_id: row.id,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      status: row.status,
      created_at: row.created_at,
      payment_status: payment?.status ?? null,
      payment_amount: payment?.amount ?? null,
      payment_date: payment?.transaction_date ?? null,
      mpesa_receipt: payment?.mpesa_receipt ?? null,
      date_of_birth: row.personal_info?.[0]?.date_of_birth ?? null,
      gender: row.personal_info?.[0]?.gender ?? null,
      county: row.personal_info?.[0]?.county ?? null,
      sub_county: row.personal_info?.[0]?.sub_county ?? null,
      languages: row.personal_info?.[0]?.languages ?? null,
      occupation: row.personal_info?.[0]?.occupation ?? null,
      education: row.personal_info?.[0]?.education ?? null,
      bio: row.personal_info?.[0]?.bio ?? null,
      profile_photo: row.personal_info?.[0]?.profile_photo ?? null,
      withdrawal_method: row.withdrawal_accounts?.[0]?.method ?? null,
      mpesa_number: row.withdrawal_accounts?.[0]?.mpesa_number ?? null,
      bank_name: row.withdrawal_accounts?.[0]?.bank_name ?? null,
      account_number: row.withdrawal_accounts?.[0]?.account_number ?? null,
      branch: row.withdrawal_accounts?.[0]?.branch ?? null,
      account_name: row.withdrawal_accounts?.[0]?.account_name ?? null,
      review_notes: row.application_status?.[0]?.review_notes ?? null,
      reviewed_at: row.application_status?.[0]?.reviewed_at ?? null,
    };
  });

  return { applicants, total: count ?? 0 };
}

export async function updateApplicationStatus(
  userId: string,
  status: 'approved' | 'rejected' | 'pending',
  reviewNotes: string,
  reviewerId: string,
): Promise<void> {
  const { data: existing } = await supabase
    .from('application_status')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('application_status')
      .update({
        status,
        review_notes: reviewNotes,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('application_status')
      .insert({
        user_id: userId,
        status,
        review_notes: reviewNotes,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      });
    if (error) throw error;
  }

  // Sync profile status
  await supabase.from('profiles').update({ status }).eq('id', userId);
}
