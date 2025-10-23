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

    const { toilet_id, sensor_status } = await req.json();

    if (!toilet_id || !sensor_status) {
      throw new Error('toilet_id and sensor_status are required');
    }

    // Validate sensor_status
    if (!['occupied', 'available'].includes(sensor_status)) {
      throw new Error('sensor_status must be "occupied" or "available"');
    }

    const updates = sensor_status === 'occupied'
      ? { 
          is_occupied: true, 
          occupied_since: new Date().toISOString(), 
          status: 'occupied' 
        }
      : { 
          is_occupied: false, 
          occupied_since: null, 
          is_paid: false, 
          status: 'available' 
        };

    const { data, error } = await supabase
      .from('toilets')
      .update(updates)
      .eq('id', toilet_id)
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
