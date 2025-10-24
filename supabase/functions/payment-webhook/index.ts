import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([
        {
          toilet_id,
          amount,
          payment_method,
          payment_reference,
          status: 'completed',
        },
      ])
      .select()
      .single();

    if (paymentError) {
      console.error('Payment record creation failed:', paymentError);
      throw paymentError;
    }

    console.log('Payment record created:', payment.id);

    // Open the door (make toilet available and paid)
    const { error: updateError } = await supabase
      .from('toilets')
      .update({
        is_paid: true,
        last_payment_time: new Date().toISOString(),
        status: 'available' as const,
        is_occupied: false,
        manual_open_enabled: false, // Disable manual control during paid session
      })
      .eq('id', toilet_id);

    if (updateError) {
      console.error('Toilet update failed:', updateError);
      throw updateError;
    }

    console.log('Door opened for toilet:', toilet_id);

    // Create access log for entry
    const { error: logError } = await supabase
      .from('access_logs')
      .insert([
        {
          toilet_id,
          payment_id: payment.id,
          entry_time: new Date().toISOString(),
        },
      ]);

    if (logError) {
      console.error('Access log creation failed:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Payment verified and door opened',
        payment_id: payment.id
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
