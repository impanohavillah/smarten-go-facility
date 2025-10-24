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

    const response = await fetch(`${FIREBASE_URL}/toilets/${toilet_id}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error(`Firebase update failed: ${response.statusText}`);
    }

    const data = await response.json();

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
