// Shared application types

export type AppStatus = 'incomplete' | 'pending' | 'approved' | 'rejected';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled';
export type WithdrawalMethod = 'mpesa' | 'bank';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  status: AppStatus;
  created_at: string;
  updated_at: string;
}

export interface PersonalInfo {
  id: string;
  user_id: string;
  date_of_birth: string | null;
  gender: string | null;
  county: string | null;
  sub_county: string | null;
  languages: string[] | null;
  occupation: string | null;
  education: string | null;
  bio: string | null;
  profile_photo: string | null;
  created_at: string;
  updated_at: string;
}

export interface WithdrawalAccount {
  id: string;
  user_id: string;
  method: WithdrawalMethod;
  mpesa_number: string | null;
  bank_name: string | null;
  account_number: string | null;
  branch: string | null;
  account_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  phone: string;
  amount: number;
  currency: string;
  merchant_request_id: string | null;
  checkout_request_id: string | null;
  mpesa_receipt: string | null;
  transaction_date: string | null;
  status: PaymentStatus;
  failure_reason: string | null;
  created_at: string;
}

export interface ApplicationStatus {
  id: string;
  user_id: string;
  status: AppStatus;
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

// Registration draft stored in localStorage for autosave
export interface RegistrationDraft {
  personalInfo: Partial<PersonalInfo>;
  withdrawal: Partial<WithdrawalAccount>;
  step: number;
  updatedAt: string;
}

// Admin dashboard aggregate stats
export interface AdminStats {
  totalApplications: number;
  totalPayments: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  approvedUsers: number;
  rejectedUsers: number;
  pendingReview: number;
  revenue: number;
}

export interface AdminApplicant {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  status: AppStatus;
  created_at: string;
  payment_status: PaymentStatus | null;
  payment_amount: number | null;
  payment_date: string | null;
  mpesa_receipt: string | null;
  date_of_birth: string | null;
  gender: string | null;
  county: string | null;
  sub_county: string | null;
  languages: string[] | null;
  occupation: string | null;
  education: string | null;
  bio: string | null;
  profile_photo: string | null;
  withdrawal_method: WithdrawalMethod | null;
  mpesa_number: string | null;
  bank_name: string | null;
  account_number: string | null;
  branch: string | null;
  account_name: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
}
