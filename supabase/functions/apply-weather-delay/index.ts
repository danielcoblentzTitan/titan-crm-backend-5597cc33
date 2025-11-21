import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { exceptionDate, reason, delayDays } = await req.json();

    console.log(`[apply-weather-delay] Processing weather delay for ${exceptionDate}, reason: ${reason}, delay: ${delayDays} days`);

    // Create global exception record
    const { data: globalException, error: globalError } = await supabaseClient
      .from('global_exceptions')
      .insert({
        exception_date: exceptionDate,
        exception_type: 'weather',
        reason: reason,
        delay_days: delayDays
      })
      .select()
      .single();

    if (globalError) {
      console.error('[apply-weather-delay] Error creating global exception:', globalError);
      throw globalError;
    }

    console.log(`[apply-weather-delay] Created global exception: ${globalException.id}`);

    // Get all active projects with schedules
    const { data: projects, error: projectsError } = await supabaseClient
      .from('projects')
      .select('id, name, customer_name');

    if (projectsError) {
      console.error('[apply-weather-delay] Error fetching projects:', projectsError);
      throw projectsError;
    }

    let totalProjectsAffected = 0;
    const exceptionDateObj = new Date(exceptionDate);

    for (const project of projects || []) {
      console.log(`[apply-weather-delay] Processing project: ${project.name}`);

      // Get project phases that would be affected (phases that span or come after the exception date)
      const { data: phases, error: phasesError } = await supabaseClient
        .from('project_phases')
        .select('id, name, start_date, end_date, duration_days')
        .eq('project_id', project.id)
        .gte('start_date', exceptionDate)
        .order('start_date');

      if (phasesError) {
        console.error(`[apply-weather-delay] Error fetching phases for project ${project.id}:`, phasesError);
        continue;
      }

      if (!phases || phases.length === 0) {
        console.log(`[apply-weather-delay] No affected phases for project ${project.name}`);
        continue;
      }

      const affectedPhases = [];
      
      // Shift phases that start on or after the exception date
      for (const phase of phases) {
        if (phase.start_date && new Date(phase.start_date) >= exceptionDateObj) {
          const newStartDate = new Date(new Date(phase.start_date).getTime() + delayDays * 24 * 60 * 60 * 1000);
          const newEndDate = new Date(new Date(phase.end_date).getTime() + delayDays * 24 * 60 * 60 * 1000);

          const { error: updateError } = await supabaseClient
            .from('project_phases')
            .update({
              start_date: newStartDate.toISOString().split('T')[0],
              end_date: newEndDate.toISOString().split('T')[0]
            })
            .eq('id', phase.id);

          if (updateError) {
            console.error(`[apply-weather-delay] Error updating phase ${phase.id}:`, updateError);
          } else {
            affectedPhases.push({
              id: phase.id,
              name: phase.name,
              originalStartDate: phase.start_date,
              newStartDate: newStartDate.toISOString().split('T')[0],
              originalEndDate: phase.end_date,
              newEndDate: newEndDate.toISOString().split('T')[0]
            });
            console.log(`[apply-weather-delay] Updated phase ${phase.name}: shifted by ${delayDays} days`);
          }
        }
      }

      if (affectedPhases.length > 0) {
        // Create project exception record
        const { error: projectExceptionError } = await supabaseClient
          .from('project_exceptions')
          .insert({
            project_id: project.id,
            global_exception_id: globalException.id,
            phases_affected: affectedPhases,
            delay_applied_days: delayDays
          });

        if (projectExceptionError) {
          console.error(`[apply-weather-delay] Error creating project exception for ${project.id}:`, projectExceptionError);
        }

        // Create activity log for the project
        const { error: activityError } = await supabaseClient
          .from('activities')
          .insert({
            project_id: project.id,
            type: 'note',
            title: 'Weather Delay Applied',
            description: `${reason}. ${affectedPhases.length} phase(s) delayed by ${delayDays} day(s): ${affectedPhases.map(p => p.name).join(', ')}`,
            project_name: project.name,
            status: 'new',
            time: new Date().toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit', 
              hour12: true 
            })
          });

        if (activityError) {
          console.error(`[apply-weather-delay] Error creating activity for ${project.id}:`, activityError);
        }

        // Sync the updated schedule to project_schedules table
        const { error: syncError } = await supabaseClient.functions.invoke('sync-project-schedule', {
          body: { projectId: project.id }
        });

        if (syncError) {
          console.error(`[apply-weather-delay] Error syncing schedule for ${project.id}:`, syncError);
        }

        totalProjectsAffected++;
        console.log(`[apply-weather-delay] Applied weather delay to project ${project.name}: ${affectedPhases.length} phases affected`);
      }
    }

    console.log(`[apply-weather-delay] Weather delay applied to ${totalProjectsAffected} projects`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        globalExceptionId: globalException.id,
        projectsAffected: totalProjectsAffected 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[apply-weather-delay] Error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});