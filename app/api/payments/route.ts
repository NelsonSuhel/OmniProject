import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency, orderId, customer } = body;

    // Validate the input
    if (!amount || !currency || !orderId || !customer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Izipay API credentials from environment variables
    const username = process.env.IZIPAY_USERNAME;
    const password = process.env.IZIPAY_PASSWORD;
    const client_id = process.env.IZIPAY_CLIENT_ID;
    const client_secret = process.env.IZIPAY_CLIENT_SECRET;
    const merchant_code = process.env.IZIPAY_MERCHANT_CODE;
    const public_key = process.env.IZIPAY_PUBLIC_KEY;


    if (!username || !password || !client_id || !client_secret || !merchant_code || !public_key) {
      console.error('Missing Izipay API credentials in environment variables');
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    // 1. Get an authentication token from Izipay
    const authResponse = await fetch('https://api.izipay.pe/v1/security/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'password',
        username,
        password,
        client_id,
        client_secret,
      }),
    });

    const authData = await authResponse.json();
    if (!authResponse.ok) {
      console.error('Izipay auth error:', authData);
      return NextResponse.json({ error: 'Izipay authentication failed' }, { status: 500 });
    }
    const authToken = authData.access_token;

    // 2. Create a payment transaction to get the formToken
    const paymentResponse = await fetch('https://api.izipay.pe/v2/Payment/Form/Create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        "merchantCode": merchant_code,
        "payment": {
          "amount": amount,
          "currency": currency,
          "orderId": orderId,
          "customer": {
            "email": customer.email
          }
        }
      }),
    });

    const paymentData = await paymentResponse.json();

    if (paymentResponse.ok) {
      return NextResponse.json({
        formToken: paymentData.formToken,
        publicKey: public_key,
      });
    } else {
      console.error('Izipay payment error:', paymentData);
      return NextResponse.json({ error: paymentData.error || 'Failed to create payment transaction.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in /api/payments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}