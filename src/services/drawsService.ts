import { supabase } from "@/integrations/supabase/client";
import { addDays, subDays, format } from "date-fns";

/**
 * Handles all schedule-related updates automatically via edge function
 */
export async function handleScheduleChanges(projectId: string, changeSummary?: string) {
  console.log("[drawsService] triggering schedule change automation for", projectId);
  
  try {
    console.log("[drawsService] invoking handle-schedule-changes function...");
    const { data, error } = await supabase.functions.invoke('handle-schedule-changes', {
      body: {
        projectId,
        changeSummary
      }
    });

    if (error) {
      console.error("[drawsService] error calling schedule changes function:", error);
      throw error;
    }

    console.log("[drawsService] schedule changes processed successfully:", data);
    return data;
  } catch (error) {
    console.error("[drawsService] failed to process schedule changes:", error);
    throw error;
  }
}

/**
 * Sets Draw 1 due date to the project's permit_approved_at timestamp
 * when available. It looks for invoices with invoice_number containing "Draw 1".
 */
export async function updateDraw1DueDate(projectId: string) {
  console.log("[drawsService] updateDraw1DueDate for", projectId);

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
    .not("invoice_number", "ilike", "%draw 2%"); // Exclude Draw 2

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
    .update({ due_date: approvedAt } as any)
    .in("id", invoices.map((i) => i.id));

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
export async function updateDrawDueDatesFromSchedule(projectId: string) {
  console.log("[drawsService] updateDrawDueDatesFromSchedule for", projectId);

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
        .update({ due_date: framingEndDate } as any)
        .in("id", draw4Invoices.map((i) => i.id));

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
        .update({ due_date: oneDayBefore } as any)
        .in("id", draw5Invoices.map((i) => i.id));

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
        .update({ due_date: drywallEndDate } as any)
        .in("id", draw6Invoices.map((i) => i.id));

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
        .update({ due_date: finalProjectDate } as any)
        .in("id", draw7Invoices.map((i) => i.id));

      if (updErr) {
        console.error("[drawsService] error updating Draw 7 due_date", updErr);
      } else {
        console.log("[drawsService] updated Draw 7 due_date to", finalProjectDate, "(Project Completion)");
      }
    }
  }
}
