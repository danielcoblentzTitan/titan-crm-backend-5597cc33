// Supabase Edge Function: geocode-project
// Geocodes a project's city/state/zip using Mapbox and updates projects_new
// Requires secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MAPBOX_TOKEN

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type GeocodeBody = {
  project_id: string;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { project_id, city, state, zip } = (await req.json()) as GeocodeBody;

    if (!project_id || !city || !state) {
      return new Response(JSON.stringify({ error: 'Missing project_id/city/state' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const MAPBOX_TOKEN = Deno.env.get('MAPBOX_TOKEN');

    if (!SUPABASE_URL || !SERVICE_KEY || !MAPBOX_TOKEN) {
      return new Response(JSON.stringify({ error: 'Missing server configuration' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const query = encodeURIComponent(`${city}, ${state} ${zip ?? ''}`.trim());
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&limit=1`;

    const geoRes = await fetch(url);
    if (!geoRes.ok) {
      const txt = await geoRes.text();
      return new Response(JSON.stringify({ error: 'Geocoding failed', details: txt }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const geo = await geoRes.json();
    const feature = geo.features?.[0];

    if (!feature?.center || feature.center.length < 2) {
      return new Response(JSON.stringify({ error: 'No coordinates found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [lon, lat] = feature.center as [number, number];

    // Try to update projects_new first (for new projects)
    const { error: updateErrNew } = await supabase
      .from('projects_new')
      .update({ latitude: lat, longitude: lon })
      .eq('id', project_id);

    // If not found in projects_new, try legacy projects table
    if (updateErrNew) {
      const { error: updateErrLegacy } = await supabase
        .from('projects')
        .update({ latitude: lat, longitude: lon })
        .eq('id', project_id);

      if (updateErrLegacy) {
        return new Response(JSON.stringify({ error: 'DB update failed', details: updateErrLegacy.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ lat, lon }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Unexpected error', details: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
