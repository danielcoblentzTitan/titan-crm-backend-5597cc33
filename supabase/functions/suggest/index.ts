import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MapboxFeature {
  id: string;
  place_name: string;
  center: [number, number];
  context?: Array<{
    id: string;
    text: string;
  }>;
}

interface MapboxResponse {
  features: MapboxFeature[];
}

interface AddressSuggestion {
  id: string;
  label: string;
  lat: number;
  lon: number;
  county: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Address suggestion request received');
    
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }), 
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { q } = await req.json().catch(() => ({}));
    
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      console.log('Invalid or too short query:', q);
      return new Response(
        JSON.stringify({ suggestions: [] }), 
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mapboxToken = Deno.env.get('MAPBOX_TOKEN');
    if (!mapboxToken) {
      console.error('MAPBOX_TOKEN not found in environment');
      return new Response(
        JSON.stringify({ error: 'Mapbox token not configured' }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('Making request to Mapbox for query:', q);

    // Build Mapbox request
    const params = new URLSearchParams({
      autocomplete: 'true',
      limit: '5',
      country: 'US',
      types: 'address,place,postcode',
      access_token: mapboxToken,
    });

    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?${params.toString()}`;
    
    const response = await fetch(mapboxUrl);
    
    if (!response.ok) {
      console.error('Mapbox API error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ suggestions: [] }), 
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data: MapboxResponse = await response.json();
    console.log('Mapbox response received with', data.features?.length || 0, 'features');

    // Process suggestions and extract county information
    const suggestions: AddressSuggestion[] = (data.features || []).map((feature) => {
      let countyName: string | null = null;

      // Try to extract county from Mapbox context
      if (Array.isArray(feature.context)) {
        const countyItem = feature.context.find((contextItem) =>
          contextItem.id.startsWith('district') || contextItem.id.startsWith('region')
        );
        if (countyItem?.text) {
          countyName = countyItem.text;
        }
      }

      // Fallback: try to extract county from place_name
      if (!countyName && feature.place_name) {
        const parts = feature.place_name.split(',');
        const countyPart = parts.find((part) =>
          /County/i.test(part.trim())
        );
        if (countyPart) {
          countyName = countyPart.trim();
        }
      }

      return {
        id: feature.id,
        label: feature.place_name,
        lat: feature.center[1],
        lon: feature.center[0],
        county: countyName,
      };
    });

    console.log('Processed', suggestions.length, 'suggestions with county data');

    return new Response(
      JSON.stringify({ suggestions }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error('Error in suggest function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', suggestions: [] }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});