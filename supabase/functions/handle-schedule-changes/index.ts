import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { addDays, subDays, format } from "https://esm.sh/date-fns@3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduleChangeRequest {
  projectId: string;
  scheduleData?: any[];
  changeSummary?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { projectId, scheduleData, changeSummary }: ScheduleChangeRequest = await req.json();
    
    console.log(`Processing schedule changes for project: ${projectId}`);

    // 1. Update Draw 1 due date based on permit_approved_at
    await updateDraw1DueDate(supabase, projectId);

    // 2. Update Draw 4, 5, 6, and 7 due dates from schedule
    await updateDrawDueDatesFromSchedule(supabase, projectId);

    // 3. Create detailed activity records for specific schedule changes
    await createDetailedScheduleChangeActivities(supabase, projectId);

    // 4. Log the completion
    console.log(`Successfully processed schedule changes for project: ${projectId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Schedule changes processed successfully',
        projectId 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error processing schedule changes:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to process schedule changes' 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

/**
 * Sets Draw 1 due date to the project's permit_approved_at timestamp
 */
async function updateDraw1DueDate(supabase: any, projectId: string) {
  console.log(`[drawsService] updateDraw1DueDate for ${projectId}`);

  const { data: project, error: projErr } = await supabase
    .from("projects")
    .select("permit_approved_at")
    .eq("id", projectId)
    .single();

  if (projErr) {
    console.error("[drawsService] failed to load project", projErr);
    return;
  }
  if (!project?.permit_approved_at) {
    console.log("[drawsService] permit_approved_at not set yet, nothing to update");
    return;
  }

  const approvedAt = project.permit_approved_at;

  // Only update Draw 1 invoices, not Draw 2
  const { data: invoices, error: invErr } = await supabase
    .from("invoices")
    .select("id, invoice_number")
    .eq("project_id", projectId)
    .ilike("invoice_number", "%draw 1%")
    .not("invoice_number", "ilike", "%draw 2%");

  if (invErr) {
    console.error("[drawsService] error fetching Draw 1 invoices", invErr);
    return;
  }

  if (!invoices || invoices.length === 0) {
    console.log("[drawsService] no Draw 1 invoices found");
    return;
  }

  const { error: updErr } = await supabase
    .from("invoices")
    .update({ due_date: approvedAt })
    .in("id", invoices.map((i: any) => i.id));

  if (updErr) {
    console.error("[drawsService] error updating Draw 1 due_date", updErr);
  } else {
    console.log("[drawsService] updated Draw 1 due_date to", approvedAt);
  }
}

/**
 * Updates draw due dates from the project's latest schedule:
 * - Draw 4 => Framing Crew end date (Dried-In)
 * - Draw 5 => 1 day before Insulation starts (Rough-Ins Complete)
 * - Draw 6 => Drywall end date (Drywall Installed)
 * - Draw 7 => Final day of project (Project Completion)
 */
async function updateDrawDueDatesFromSchedule(supabase: any, projectId: string) {
  console.log(`[drawsService] updateDrawDueDatesFromSchedule for ${projectId}`);

  const { data: schedule, error: schedErr } = await supabase
    .from("project_schedules")
    .select("schedule_data")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (schedErr) {
    console.error("[drawsService] failed to load schedule", schedErr);
    return;
  }

  const scheduleData = (schedule?.schedule_data as any[]) || [];
  if (!Array.isArray(scheduleData) || scheduleData.length === 0) {
    console.log("[drawsService] no schedule data yet");
    return;
  }

  const getPhaseEnd = (phaseName: string): string | null => {
    const trade = scheduleData.find(
      (t: any) => String(t.name).toLowerCase().includes(phaseName.toLowerCase())
    );
    return trade?.endDate || null;
  };

  const getPhaseStart = (phaseName: string): string | null => {
    const trade = scheduleData.find(
      (t: any) => String(t.name).toLowerCase().includes(phaseName.toLowerCase())
    );
    return trade?.startDate || null;
  };

  // Draw 4: Dried-In - Final day of framing crew phase
  const framingEndDate = getPhaseEnd("framing crew");
  if (framingEndDate) {
    const { data: draw4Invoices, error: draw4Err } = await supabase
      .from("invoices")
      .select("id, invoice_number")
      .eq("project_id", projectId)
      .ilike("invoice_number", "%draw 4%");

    if (!draw4Err && draw4Invoices && draw4Invoices.length > 0) {
      const { error: updErr } = await supabase
        .from("invoices")
        .update({ due_date: framingEndDate })
        .in("id", draw4Invoices.map((i: any) => i.id));

      if (updErr) {
        console.error("[drawsService] error updating Draw 4 due_date", updErr);
      } else {
        console.log("[drawsService] updated Draw 4 due_date to", framingEndDate, "(Dried-In)");
      }
    }
  }

  // Draw 5: Rough-Ins Complete - 1 day before insulation starts
  const insulationStartDate = getPhaseStart("insulation");
  if (insulationStartDate) {
    const oneDayBefore = format(subDays(new Date(insulationStartDate), 1), 'yyyy-MM-dd');
    
    const { data: draw5Invoices, error: draw5Err } = await supabase
      .from("invoices")
      .select("id, invoice_number")
      .eq("project_id", projectId)
      .ilike("invoice_number", "%draw 5%");

    if (!draw5Err && draw5Invoices && draw5Invoices.length > 0) {
      const { error: updErr } = await supabase
        .from("invoices")
        .update({ due_date: oneDayBefore })
        .in("id", draw5Invoices.map((i: any) => i.id));

      if (updErr) {
        console.error("[drawsService] error updating Draw 5 due_date", updErr);
      } else {
        console.log("[drawsService] updated Draw 5 due_date to", oneDayBefore, "(Rough-Ins Complete)");
      }
    }
  }

  // Draw 6: Drywall Installed - Final day of drywall phase
  const drywallEndDate = getPhaseEnd("drywall");
  if (drywallEndDate) {
    const { data: draw6Invoices, error: draw6Err } = await supabase
      .from("invoices")
      .select("id, invoice_number")
      .eq("project_id", projectId)
      .ilike("invoice_number", "%draw 6%");

    if (!draw6Err && draw6Invoices && draw6Invoices.length > 0) {
      const { error: updErr } = await supabase
        .from("invoices")
        .update({ due_date: drywallEndDate })
        .in("id", draw6Invoices.map((i: any) => i.id));

      if (updErr) {
        console.error("[drawsService] error updating Draw 6 due_date", updErr);
      } else {
        console.log("[drawsService] updated Draw 6 due_date to", drywallEndDate, "(Drywall Installed)");
      }
    }
  }

  // Draw 7: Project Completion - Final day of project
  const getFinalProjectDate = (): string | null => {
    let latestEndDate: string | null = null;
    
    for (const phase of scheduleData) {
      if (phase.endDate) {
        if (!latestEndDate || new Date(phase.endDate) > new Date(latestEndDate)) {
          latestEndDate = phase.endDate;
        }
      }
    }
    
    return latestEndDate;
  };

  const finalProjectDate = getFinalProjectDate();
  if (finalProjectDate) {
    const { data: draw7Invoices, error: draw7Err } = await supabase
      .from("invoices")
      .select("id, invoice_number")
      .eq("project_id", projectId)
      .ilike("invoice_number", "%draw 7%");

    if (!draw7Err && draw7Invoices && draw7Invoices.length > 0) {
      const { error: updErr } = await supabase
        .from("invoices")
        .update({ due_date: finalProjectDate })
        .in("id", draw7Invoices.map((i: any) => i.id));

      if (updErr) {
        console.error("[drawsService] error updating Draw 7 due_date", updErr);
      } else {
        console.log("[drawsService] updated Draw 7 due_date to", finalProjectDate, "(Project Completion)");
      }
    }
  }
}

/**
 * Creates detailed activity records for specific schedule changes
 */
async function createDetailedScheduleChangeActivities(supabase: any, projectId: string) {
  try {
    console.log(`[schedule-changes] Creating detailed activities for project: ${projectId}`);

    // Get the two most recent schedules to compare
    const { data: schedules, error: schedErr } = await supabase
      .from("project_schedules")
      .select("schedule_data, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(2);

    if (schedErr) {
      console.error("[schedule-changes] failed to load schedules for comparison", schedErr);
      return;
    }

    if (!schedules || schedules.length < 2) {
      console.log("[schedule-changes] not enough schedules to compare, creating generic activity");
      await createGenericScheduleActivity(supabase, projectId);
      return;
    }

    const [newSchedule, oldSchedule] = schedules;
    const newPhases = (newSchedule.schedule_data as any[]) || [];
    const oldPhases = (oldSchedule.schedule_data as any[]) || [];

    // Get project name for activities
    const { data: project } = await supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .single();

    const projectName = project?.name || "Unknown Project";
    const changes: string[] = [];

    // Compare each phase for changes
    newPhases.forEach((newPhase: any) => {
      const oldPhase = oldPhases.find((old: any) => old.name === newPhase.name);
      
      if (!oldPhase) {
        // New phase added
        changes.push(`${newPhase.name} was added to the schedule`);
        return;
      }

      // Check for date changes
      if (newPhase.startDate !== oldPhase.startDate || newPhase.endDate !== oldPhase.endDate) {
        const newStart = newPhase.startDate ? new Date(newPhase.startDate) : null;
        const oldStart = oldPhase.startDate ? new Date(oldPhase.startDate) : null;
        const newEnd = newPhase.endDate ? new Date(newPhase.endDate) : null;
        const oldEnd = oldPhase.endDate ? new Date(oldPhase.endDate) : null;

        if (newStart && oldStart && newEnd && oldEnd) {
          const oldDuration = Math.ceil((oldEnd.getTime() - oldStart.getTime()) / (1000 * 60 * 60 * 24));
          const newDuration = Math.ceil((newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60 * 24));
          const durationChange = newDuration - oldDuration;

          if (durationChange !== 0) {
            const changeType = durationChange > 0 ? 'extended' : 'shortened';
            const dayText = Math.abs(durationChange) === 1 ? 'day' : 'days';
            changes.push(`${newPhase.name} was ${changeType} by ${Math.abs(durationChange)} ${dayText}`);
          } else if (newStart.getTime() !== oldStart.getTime()) {
            const daysDiff = Math.ceil((newStart.getTime() - oldStart.getTime()) / (1000 * 60 * 60 * 24));
            const direction = daysDiff > 0 ? 'moved later' : 'moved earlier';
            const dayText = Math.abs(daysDiff) === 1 ? 'day' : 'days';
            changes.push(`${newPhase.name} was ${direction} by ${Math.abs(daysDiff)} ${dayText}`);
          }
        }
      }

      // Check for workdays changes
      if (newPhase.workdays !== oldPhase.workdays) {
        const workdayChange = newPhase.workdays - oldPhase.workdays;
        const changeType = workdayChange > 0 ? 'increased' : 'reduced';
        const dayText = Math.abs(workdayChange) === 1 ? 'workday' : 'workdays';
        changes.push(`${newPhase.name} duration was ${changeType} by ${Math.abs(workdayChange)} ${dayText}`);
      }
    });

    // Check for removed phases
    oldPhases.forEach((oldPhase: any) => {
      const stillExists = newPhases.find((newPhase: any) => newPhase.name === oldPhase.name);
      if (!stillExists) {
        changes.push(`${oldPhase.name} was removed from the schedule`);
      }
    });

    // Create activities for each change
    if (changes.length > 0) {
      for (const change of changes) {
        const activity = {
          project_id: projectId,
          project_name: projectName,
          type: "note",
          title: "Schedule Updated",
          description: change,
          status: "new",
          time: new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })
        };

        const { error } = await supabase
          .from("activities")
          .insert(activity);

        if (error) {
          console.error("Error creating detailed schedule activity:", error);
        } else {
          console.log("Created detailed schedule activity:", change);
        }
      }
    } else {
      console.log("[schedule-changes] no significant changes detected, creating generic activity");
      await createGenericScheduleActivity(supabase, projectId);
    }

  } catch (error) {
    console.error("Error in createDetailedScheduleChangeActivities:", error);
    // Fallback to generic activity
    await createGenericScheduleActivity(supabase, projectId);
  }
}

/**
 * Creates a generic schedule change activity (fallback)
 */
async function createGenericScheduleActivity(supabase: any, projectId: string) {
  try {
    const { data: project } = await supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .single();

    const projectName = project?.name || "Unknown Project";
    
    const activity = {
      project_id: projectId,
      project_name: projectName,
      type: "note",
      title: "Schedule Updated",
      description: "Project schedule has been updated with new phase timelines and dates.",
      status: "new",
      time: new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };

    const { error } = await supabase
      .from("activities")
      .insert(activity);

    if (error) {
      console.error("Error creating generic schedule activity:", error);
    } else {
      console.log("Created generic schedule activity for project:", projectId);
    }
  } catch (error) {
    console.error("Error in createGenericScheduleActivity:", error);
  }
}

serve(handler);