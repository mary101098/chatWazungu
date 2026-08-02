import { supabase, REGISTRATION_FEE, CURRENCY } from '@/lib/supabase';
import type { Payment } from '@/types';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mpesa-stk`;

interface StkResponse {
  merchant_request_id?: string;
  checkout_request_id?: string;
  error?: string;
}

export async function initiateStkPush(phone: string, userId: string): Promise<Payment> {
  // Create a pending payment record first
  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      phone,
      amount: REGISTRATION_FEE,
      currency: CURRENCY,
      status: 'pending',
    })
    .select('*')
    .single();
  if (error) throw error;

  // Call the edge function to trigger Daraja STK push
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  };
  const session = (await supabase.auth.getSession()).data.session;
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ phone, paymentId: payment.id }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Payment request failed (${res.status})`);
  }
  const body = (await res.json()) as StkResponse;
  if (body.error) throw new Error(body.error);

  // Persist Daraja request IDs for callback matching
  if (body.merchant_request_id && body.checkout_request_id) {
    await supabase
      .from('payments')
      .update({
        merchant_request_id: body.merchant_request_id,
        checkout_request_id: body.checkout_request_id,
      })
      .eq('id', payment.id);
  }
  return payment as Payment;
}

export async function pollPaymentStatus(paymentId: string): Promise<Payment | null> {
  const { data } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .maybeSingle();
  return data as Payment | null;
}
