import { supabase } from "@/integrations/supabase/client";

// Aggregates published phases into project_schedules for a single project.
// Keeps customer portal schedule in sync with builder phases.
export async function syncProjectSchedule(projectId: string) {
  if (!projectId) throw new Error("Missing projectId");

  // 1) Fetch published phases for the project
  const { data: phases, error: phasesError } = await supabase
    .from("project_phases")
    .select("name, start_date, end_date, duration_days, color, publish_to_customer")
    .eq("project_id", projectId)
    .eq("publish_to_customer", true)
    .order("start_date", { ascending: true });

  if (phasesError) throw phasesError;

  // Filter out phases with 0 duration_days
  const activePhases = (phases || []).filter(p => (p.duration_days ?? 0) > 0);

  // 2) Compute project_start_date from active phases only
  const dates = activePhases
    .flatMap((p) => [p.start_date, p.end_date])
    .filter((d): d is string => !!d);

  const project_start_date = dates.length
    ? dates.reduce((min, d) => (d < min ? d : min))
    : null;

  // 3) Build schedule_data payload with calculated dates
  const scheduleData: Array<{
    name: string;
    workdays: number;
    startDate: string | null;
    endDate: string | null;
    color: string | null;
  }> = [];

  let currentDate = project_start_date ? new Date(project_start_date) : null;
  
  for (const phase of activePhases) {
    const workdays = phase.duration_days ?? 0;
    const startDate = currentDate ? currentDate.toISOString().split('T')[0] : null;
    
    // Calculate end date by adding workdays (business days)
    let endDate: string | null = null;
    if (currentDate && workdays > 0) {
      const end = new Date(currentDate);
      let daysAdded = 0;
      while (daysAdded < workdays) {
        end.setDate(end.getDate() + 1);
        // Skip weekends
        if (end.getDay() !== 0 && end.getDay() !== 6) {
          daysAdded++;
        }
      }
      endDate = end.toISOString().split('T')[0];
      // Set currentDate for next phase to the day after this phase ends
      currentDate = new Date(end);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    scheduleData.push({
      name: phase.name,
      workdays,
      startDate,
      endDate,
      color: phase.color ?? null,
    });
  }

  // Compute total_duration_days from calculated schedule
  const scheduleDates = scheduleData
    .flatMap(s => [s.startDate, s.endDate])
    .filter((d): d is string => !!d);

  const scheduleStartDate = scheduleDates.length
    ? scheduleDates.reduce((min, d) => (d < min ? d : min))
    : project_start_date;

  const scheduleEndDate = scheduleDates.length
    ? scheduleDates.reduce((max, d) => (d > max ? d : max))
    : null;

  const total_duration_days = scheduleStartDate && scheduleEndDate
    ? Math.max(
        0,
        Math.round(
          (new Date(scheduleEndDate).getTime() - new Date(scheduleStartDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      )
    : 0;

  // 4) Upsert into project_schedules
  const { error: upsertError } = await supabase.from("project_schedules").upsert(
    {
      project_id: projectId,
      project_start_date: project_start_date,
      total_duration_days,
      schedule_data: scheduleData,
    },
    { onConflict: "project_id" }
  );

  if (upsertError) throw upsertError;

  return { count: scheduleData.length };
}
