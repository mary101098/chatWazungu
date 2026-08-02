// M-Pesa Daraja callback edge function.
// Safaricom calls this URL after the user completes/cancels the STK push.
// Set DARAJA_CALLBACK_URL to this function's public URL.
// No JWT verification — Safaricom cannot send an auth token.

import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const body = await req.json();
    console.log('Daraja callback body:', JSON.stringify(body));

    const stk = body?.Body?.stkCallback;
    if (!stk) {
      return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: 'Invalid callback' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const merchantRequestId  = stk.MerchantRequestID as string;
    const checkoutRequestId  = stk.CheckoutRequestID as string;
    const resultCode         = stk.ResultCode;
    const resultDesc         = stk.ResultDesc as string;

    // Find the matching payment row
    const { data: payment } = await supabase
      .from('payments')
      .select('id, user_id')
      .or(
        `merchant_request_id.eq.${merchantRequestId},checkout_request_id.eq.${checkoutRequestId}`,
      )
      .maybeSingle();

    if (!payment) {
      console.warn('No payment found for MerchantRequestID:', merchantRequestId);
      // Still return 200 so Safaricom doesn't keep retrying
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'OK' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (resultCode === 0) {
      // Payment succeeded — extract receipt details from metadata
      const meta: { Name: string; Value: unknown }[] =
        stk.CallbackMetadata?.Item ?? [];

      const get = (name: string) => meta.find((i) => i.Name === name)?.Value;
      const receipt    = get('MpesaReceiptNumber') as string | undefined;
      const rawTxnDate = get('TransactionDate') as string | number | undefined;

      // TransactionDate from Daraja is YYYYMMDDHHmmss (14-digit string)
      let txnDate: string | null = null;
      if (rawTxnDate) {
        const s = String(rawTxnDate);
        if (s.length === 14) {
          txnDate = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}`;
        } else {
          txnDate = new Date(Number(rawTxnDate)).toISOString();
        }
      }

      await supabase.from('payments').update({
        status: 'success',
        mpesa_receipt: receipt ?? null,
        transaction_date: txnDate ?? new Date().toISOString(),
        failure_reason: null,
      }).eq('id', payment.id);

      // Log the email notification (actual sending wired up separately)
      await supabase.from('email_logs').insert({
        user_id: payment.user_id,
        email_type: 'payment_successful',
        status: 'queued',
      });

      console.log(`Payment ${payment.id} marked success. Receipt: ${receipt}`);
    } else {
      const status = resultDesc?.toLowerCase().includes('cancel') ? 'cancelled' : 'failed';
      await supabase.from('payments').update({
        status,
        failure_reason: resultDesc ?? null,
      }).eq('id', payment.id);

      console.log(`Payment ${payment.id} marked ${status}: ${resultDesc}`);
    }

    // Safaricom expects this exact success response
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('mpesa-callback error:', err);
    // Return 200 so Safaricom doesn't keep retrying on our internal errors
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Error handled' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
