// M-Pesa Daraja STK Push edge function.
// Required Supabase secrets:
//   DARAJA_CONSUMER_KEY, DARAJA_CONSUMER_SECRET, DARAJA_SHORTCODE,
//   DARAJA_PASSKEY, DARAJA_CALLBACK_URL
//   DARAJA_ENV  — "sandbox" (default) or "production"
//
// Sandbox base URL : https://sandbox.safaricom.co.ke
// Production base URL: https://api.safaricom.co.ke

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

    // Verify caller is an authenticated user
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;

    const { phone, paymentId } = await req.json();
    if (!phone || !paymentId) {
      return new Response(JSON.stringify({ error: 'phone and paymentId are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Confirm the payment row belongs to this user
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .select('user_id, amount')
      .eq('id', paymentId)
      .maybeSingle();
    if (payErr || !payment || payment.user_id !== userId) {
      return new Response(JSON.stringify({ error: 'Payment not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---- Daraja credentials ----
    const consumerKey    = Deno.env.get('DARAJA_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('DARAJA_CONSUMER_SECRET');
    const shortcode      = Deno.env.get('DARAJA_SHORTCODE');
    const passkey        = Deno.env.get('DARAJA_PASSKEY');
    const callbackUrl    = Deno.env.get('DARAJA_CALLBACK_URL');
    // Defaults to "sandbox" so existing sandbox keys work immediately.
    const darajaEnv      = (Deno.env.get('DARAJA_ENV') ?? 'sandbox').toLowerCase();
    const isSandbox      = darajaEnv !== 'production';

    if (!consumerKey || !consumerSecret || !shortcode || !passkey || !callbackUrl) {
      return new Response(JSON.stringify({
        error: 'M-Pesa credentials are not fully configured. Set DARAJA_CONSUMER_KEY, DARAJA_CONSUMER_SECRET, DARAJA_SHORTCODE, DARAJA_PASSKEY, DARAJA_CALLBACK_URL in Supabase secrets.',
      }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Pick the correct Safaricom base URL for sandbox vs production
    const BASE = isSandbox
      ? 'https://sandbox.safaricom.co.ke'
      : 'https://api.safaricom.co.ke';

    // ---- Step 1: Get OAuth access token ----
    const basicAuth = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenRes  = await fetch(
      `${BASE}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${basicAuth}` } },
    );

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      console.error(`Daraja OAuth failed (${tokenRes.status}): ${body}`);
      return new Response(JSON.stringify({
        error: `Failed to get M-Pesa access token (HTTP ${tokenRes.status}). Check your consumer key/secret.`,
      }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tokenBody = await tokenRes.json();
    const accessToken = tokenBody.access_token;
    if (!accessToken) {
      console.error('No access_token in Daraja response:', JSON.stringify(tokenBody));
      return new Response(JSON.stringify({ error: 'M-Pesa returned no access token. Check credentials.' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---- Step 2: Format phone number to 2547XXXXXXX ----
    let formatted = phone.replace(/\s+/g, '').replace(/^(\+)/, '');
    if (!formatted.startsWith('254')) {
      if (formatted.startsWith('0')) {
        formatted = '254' + formatted.slice(1);
      } else if (formatted.startsWith('7') || formatted.startsWith('1')) {
        formatted = '254' + formatted;
      }
    }

    // ---- Step 3: Build STK push payload ----
    // Timestamp must be YYYYMMDDHHmmss with no separators
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp =
      now.getFullYear().toString() +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds());

    const password = btoa(`${shortcode}${passkey}${timestamp}`);

    const stkRes = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(Number(payment.amount)),
        PartyA: formatted,
        PartyB: shortcode,
        PhoneNumber: formatted,
        CallBackURL: callbackUrl,
        AccountReference: 'ChatWazungu',
        TransactionDesc: 'Registration fee',
      }),
    });

    const stkBody = await stkRes.json();
    console.log('Daraja STK response:', JSON.stringify(stkBody));

    if (!stkRes.ok || stkBody.ResponseCode !== '0') {
      const errMsg =
        stkBody.errorMessage ||
        stkBody.ResultDesc ||
        stkBody.ResponseDescription ||
        `STK push rejected (code ${stkBody.ResponseCode ?? stkRes.status})`;
      return new Response(JSON.stringify({ error: errMsg }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      merchant_request_id: stkBody.MerchantRequestID,
      checkout_request_id: stkBody.CheckoutRequestID,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('mpesa-stk error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
