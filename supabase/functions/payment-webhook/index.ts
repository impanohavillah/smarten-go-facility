const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIREBASE_URL = 'https://smartengo-f6a29-default-rtdb.firebaseio.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      toilet_id, 
      amount, 
      payment_method, 
      payment_reference 
    } = await req.json();

    console.log('Payment webhook received:', { toilet_id, amount, payment_method, payment_reference });

    // Validate required fields
    if (!toilet_id || !amount || !payment_method || !payment_reference) {
      throw new Error('toilet_id, amount, payment_method, and payment_reference are required');
    }

    // Validate payment amount (must be exactly 200 Frw)
    if (amount !== 200) {
      console.log(`Payment rejected: amount ${amount} does not match required 200 Frw`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Payment amount must be 200 Frw. Received: ${amount} Frw` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Validate payment method
    if (!['momo', 'rfid_card'].includes(payment_method)) {
      throw new Error('payment_method must be "momo" or "rfid_card"');
    }

    // Create payment record in Firebase
    const paymentData = {
      toilet_id,
      amount,
      payment_method,
      payment_reference,
      status: 'completed',
      created_at: new Date().toISOString()
    };

    const paymentResponse = await fetch(`${FIREBASE_URL}/payments.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });

    if (!paymentResponse.ok) {
      throw new Error('Failed to create payment record');
    }

    const paymentResult = await paymentResponse.json();
    const paymentId = paymentResult.name; // Firebase returns {name: "generated_id"}

    console.log('Payment record created:', paymentId);

    // Open the door (make toilet available and paid)
    const toiletUpdates = {
      is_paid: true,
      last_payment_time: new Date().toISOString(),
      status: 'available',
      is_occupied: false,
      manual_open_enabled: false, // Disable manual control during paid session
    };

    const toiletResponse = await fetch(`${FIREBASE_URL}/toilets/${toilet_id}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toiletUpdates)
    });

    if (!toiletResponse.ok) {
      throw new Error('Failed to update toilet status');
    }

    console.log('Door opened for toilet:', toilet_id);

    // Create access log for entry
    const accessLogData = {
      toilet_id,
      payment_id: paymentId,
      entry_time: new Date().toISOString(),
      exit_time: null,
      duration_minutes: null,
      security_alert: false,
      alert_reason: null
    };

    const logResponse = await fetch(`${FIREBASE_URL}/access_logs.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accessLogData)
    });

    if (!logResponse.ok) {
      console.error('Access log creation failed');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Payment verified and door opened',
        payment_id: paymentId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Payment webhook error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
