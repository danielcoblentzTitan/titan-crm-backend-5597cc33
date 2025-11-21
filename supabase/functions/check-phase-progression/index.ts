import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BARNDO_PHASES = [
  { name: "Planning & Permits", percentage: 0 },
  { name: "Pre Construction", percentage: 5 },
  { name: "Framing Crew", percentage: 10 },
  { name: "Plumbing Underground", percentage: 15 },
  { name: "Concrete Crew", percentage: 20 },
  { name: "Interior Framing", percentage: 25 },
  { name: "Plumbing Rough In", percentage: 30 },
  { name: "HVAC Rough In", percentage: 35 },
  { name: "Electric Rough In", percentage: 40 },
  { name: "Insulation", percentage: 45 },
  { name: "Drywall", percentage: 55 },
  { name: "Paint", percentage: 65 },
  { name: "Flooring", percentage: 75 },
  { name: "Doors and Trim", percentage: 80 },
  { name: "Garage Doors and Gutters", percentage: 85 },
  { name: "Garage Finish", percentage: 87 },
  { name: "Plumbing Final", percentage: 90 },
  { name: "HVAC Final", percentage: 92 },
  { name: "Electric Final", percentage: 94 },
  { name: "Kitchen Install", percentage: 96 },
  { name: "Interior Finishes", percentage: 98 },
  { name: "Final", percentage: 100 }
];

interface ScheduleData {
  name: string;
  start_date: string;
  duration: number;
  color: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting phase progression check...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    
    // Get all active projects with their schedules
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        phase,
        progress,
        start_date,
        project_schedules (
          schedule_data,
          project_start_date
        )
      `)
      .in('status', ['Planning', 'Active', 'In Progress'])
      .not('phase', 'eq', 'Final');

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      throw projectsError;
    }

    console.log(`Found ${projects?.length || 0} active projects to check`);

    let updatedProjects = 0;

    for (const project of projects || []) {
      try {
        const shouldUpdate = await checkAndUpdateProjectPhase(supabase, project, today);
        if (shouldUpdate) {
          updatedProjects++;
        }
      } catch (error) {
        console.error(`Error updating project ${project.id}:`, error);
      }
    }

    console.log(`Phase progression check complete. Updated ${updatedProjects} projects.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Checked ${projects?.length || 0} projects, updated ${updatedProjects}`,
        updatedProjects 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in phase progression check:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function checkAndUpdateProjectPhase(supabase: any, project: any, today: Date) {
  const currentPhase = project.phase;
  const projectSchedule = project.project_schedules?.[0];
  
  if (!projectSchedule?.schedule_data) {
    console.log(`Project ${project.name} has no schedule data, skipping`);
    return false;
  }

  const scheduleData: ScheduleData[] = projectSchedule.schedule_data;
  const projectStartDate = new Date(project.start_date);
  projectStartDate.setHours(0, 0, 0, 0);

  // Check if project should transition from "Pre Construction" to "Framing Crew"
  if (currentPhase === "Pre Construction" && today >= projectStartDate) {
    console.log(`Project ${project.name}: Transitioning to Framing Crew (start date reached)`);
    return await updateProjectPhase(supabase, project.id, "Framing Crew", project.name);
  }

  // Check if project should advance through trade phases based on schedule
  if (currentPhase && currentPhase !== "Planning & Permits" && currentPhase !== "Pre Construction") {
    const nextPhase = getNextPhaseFromSchedule(currentPhase, scheduleData, today);
    
    if (nextPhase && nextPhase !== currentPhase) {
      console.log(`Project ${project.name}: Transitioning from ${currentPhase} to ${nextPhase}`);
      return await updateProjectPhase(supabase, project.id, nextPhase, project.name);
    }
  }

  return false;
}

function getNextPhaseFromSchedule(currentPhase: string, scheduleData: ScheduleData[], today: Date): string | null {
  // Find current phase in schedule
  const currentTradeIndex = scheduleData.findIndex(trade => trade.name === currentPhase);
  
  if (currentTradeIndex === -1) {
    console.log(`Current phase "${currentPhase}" not found in schedule`);
    return null;
  }

  // Check if any subsequent trade should have started by now
  for (let i = currentTradeIndex + 1; i < scheduleData.length; i++) {
    const trade = scheduleData[i];
    const tradeStartDate = new Date(trade.start_date);
    tradeStartDate.setHours(0, 0, 0, 0);
    
    if (today >= tradeStartDate) {
      // Check if this trade name matches a valid phase
      const phaseExists = BARNDO_PHASES.some(phase => phase.name === trade.name);
      if (phaseExists) {
        return trade.name;
      }
    } else {
      // Since trades are in chronological order, stop checking once we find a future trade
      break;
    }
  }

  return null;
}

async function updateProjectPhase(supabase: any, projectId: string, newPhase: string, projectName: string): Promise<boolean> {
  // Get the progress percentage for the new phase
  const phaseData = BARNDO_PHASES.find(p => p.name === newPhase);
  const newProgress = phaseData?.percentage || 0;

  // Update the project
  const { error: updateError } = await supabase
    .from('projects')
    .update({ 
      phase: newPhase, 
      progress: newProgress,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId);

  if (updateError) {
    console.error(`Error updating project ${projectId}:`, updateError);
    throw updateError;
  }

  // Log the activity
  const { error: activityError } = await supabase
    .from('activities')
    .insert({
      project_id: projectId,
      project_name: projectName,
      type: 'phase_update',
      title: 'Automatic Phase Progression',
      description: `Project automatically advanced to ${newPhase} phase`,
      time: new Date().toLocaleTimeString()
    });

  if (activityError) {
    console.error(`Error logging activity for project ${projectId}:`, activityError);
    // Don't throw here, activity logging is not critical
  }

  console.log(`Successfully updated project ${projectName} to phase: ${newPhase} (${newProgress}%)`);
  return true;
}