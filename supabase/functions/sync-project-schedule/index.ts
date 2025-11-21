import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function formatDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function countBusinessDays(start: Date, end: Date) {
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return Math.max(count, 0);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { projectId } = await req.json();
    if (!projectId) {
      return new Response(JSON.stringify({ error: 'Missing projectId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch phases for the project
    const { data: phases, error: phasesError } = await supabase
      .from('project_phases')
      .select('id, name, start_date, end_date, color')
      .eq('project_id', projectId)
      .order('start_date', { ascending: true });

    if (phasesError) {
      console.error('[sync-project-schedule] Error fetching phases:', phasesError);
      throw phasesError;
    }

    if (!phases || phases.length === 0) {
      console.log('[sync-project-schedule] No phases found for project', projectId);
      return new Response(JSON.stringify({ success: true, updated: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine project_start_date from earliest phase start
    const startDates = phases
      .map((p) => p.start_date)
      .filter(Boolean)
      .map((d) => new Date(d as string));

    const projectStart = startDates.length > 0 ? new Date(Math.min(...startDates.map((d) => d.getTime()))) : new Date();

    // Build schedule_data from phases
    const schedule_data = phases.map((p) => {
      const sd = p.start_date ? new Date(p.start_date as string) : new Date(projectStart);
      const ed = p.end_date ? new Date(p.end_date as string) : new Date(sd);
      return {
        name: p.name,
        workdays: countBusinessDays(sd, ed),
        color: p.color || '#3b82f6', // fallback if no color
      };
    });

    // Upsert into project_schedules
    const { data: existing, error: existingError } = await supabase
      .from('project_schedules')
      .select('id')
      .eq('project_id', projectId)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error('[sync-project-schedule] Error checking existing schedule:', existingError);
      throw existingError;
    }

    const payload = {
      project_id: projectId,
      project_start_date: formatDate(projectStart),
      schedule_data,
    } as any;

    let upsertError: any = null;
    if (existing?.id) {
      const { error } = await supabase
        .from('project_schedules')
        .update(payload)
        .eq('id', existing.id);
      upsertError = error;
    } else {
      const { error } = await supabase
        .from('project_schedules')
        .insert(payload);
      upsertError = error;
    }

    if (upsertError) {
      console.error('[sync-project-schedule] Error upserting project_schedules:', upsertError);
      throw upsertError;
    }

    console.log('[sync-project-schedule] Synced schedule for project', projectId);

    return new Response(JSON.stringify({ success: true, updated: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[sync-project-schedule] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
