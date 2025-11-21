import { supabase } from "@/integrations/supabase/client";

// Force sync the Fulford project schedule with calculated dates
export async function forceScheduleSync() {
  const projectId = "c0d89370-cdfa-4cd8-9ecf-2eb2413429ea";
  
  // Get existing schedule data
  const { data: scheduleRecord } = await supabase
    .from("project_schedules")
    .select("*")
    .eq("project_id", projectId)
    .single();
    
  if (!scheduleRecord || !scheduleRecord.schedule_data) return;
  
  const scheduleData = scheduleRecord.schedule_data as any[];
  const startDate = new Date("2025-08-07");
  
  // Calculate dates for each phase
  const updatedScheduleData = [];
  let currentDate = new Date(startDate);
  
  for (const phase of scheduleData) {
    const startDateStr = currentDate.toISOString().split('T')[0];
    
    // Calculate end date by adding workdays (business days)
    const workdays = phase.workdays || 0;
    const endDate = new Date(currentDate);
    let daysAdded = 0;
    
    while (daysAdded < workdays) {
      endDate.setDate(endDate.getDate() + 1);
      // Skip weekends
      if (endDate.getDay() !== 0 && endDate.getDay() !== 6) {
        daysAdded++;
      }
    }
    
    const endDateStr = endDate.toISOString().split('T')[0];
    
    updatedScheduleData.push({
      ...phase,
      startDate: startDateStr,
      endDate: endDateStr
    });
    
    // Set next phase start date to day after this phase ends
    currentDate = new Date(endDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Update the schedule record
  await supabase
    .from("project_schedules")
    .update({ schedule_data: updatedScheduleData })
    .eq("project_id", projectId);
    
  console.log("Force sync completed for Fulford project");
}