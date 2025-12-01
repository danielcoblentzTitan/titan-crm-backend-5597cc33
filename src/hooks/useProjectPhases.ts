import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { parseISO } from 'date-fns';

export interface ProjectPhase {
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  isActive: boolean;
  isCompleted: boolean;
  isUpcoming: boolean;
}

export interface ProjectPhaseData {
  currentPhase: string;
  currentProgress: number;
  phases: ProjectPhase[];
  isLoading: boolean;
}

const PHASE_PROGRESS_MAP: Record<string, number> = {
  "Planning & Permits": 0,
  "Pre Construction": 10,
  "Preconstruction": 10,
  "Framing Crew": 10,
  "Plumbing Underground": 15,
  "Concrete Crew": 20,
  "Interior Framing": 25,
  "Plumbing Rough In": 30,
  "HVAC Rough In": 35,
  "Electric Rough In": 40,
  "Insulation": 45,
  "Drywall": 55,
  "Paint": 65,
  "Flooring": 75,
  "Doors and Trim": 80,
  "Garage Doors and Gutters": 85,
  "Garage Finish": 87,
  "Plumbing Final": 90,
  "HVAC Final": 92,
  "Electric Final": 94,
  "Kitchen Install": 96,
  "Interior Finishes": 98,
  "Final": 100,
  "Completed": 100
};

/**
 * Hook to manage project phases based solely on project schedules
 * This is the single source of truth for all phase-related data
 */
export const useProjectPhases = (projectId: string): ProjectPhaseData => {
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load project schedule data
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('project_schedules')
          .select('schedule_data')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data?.schedule_data) {
          setScheduleData(Array.isArray(data.schedule_data) ? data.schedule_data : []);
        } else {
          setScheduleData([]);
        }
      } catch (error) {
        console.error('Error loading project schedule:', error);
        setScheduleData([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      loadSchedule();
    }
  }, [projectId]);

  // Subscribe to schedule changes
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project-schedule-${projectId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'project_schedules',
          filter: `project_id=eq.${projectId}`
        },
        async () => {
          // Reload schedule data when it changes
          const { data, error } = await supabase
            .from('project_schedules')
            .select('schedule_data')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!error && data?.schedule_data) {
            setScheduleData(Array.isArray(data.schedule_data) ? data.schedule_data : []);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  // Calculate current phase and progress
  const phaseData = useMemo((): ProjectPhaseData => {
    if (isLoading) {
      return {
        currentPhase: 'Loading...',
        currentProgress: 0,
        phases: [],
        isLoading: true
      };
    }

    if (!scheduleData || scheduleData.length === 0) {
      return {
        currentPhase: 'Planning & Permits',
        currentProgress: 0,
        phases: [],
        isLoading: false
      };
    }

    // Normalize today's date to noon local time
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    console.log('=== PHASE CALCULATION DEBUG ===');
    console.log('Today (local date):', today.toISOString().split('T')[0]);
    console.log('Today timestamp:', today.getTime());
    
    // Process schedule data into phases
    const phases: ProjectPhase[] = scheduleData
      .filter((item: any) => item.startDate && item.endDate && item.name)
      .map((item: any) => {
        // Use string comparison to avoid timezone pitfalls
        const nowLocal = new Date();
        const todayStr = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(nowLocal.getDate()).padStart(2, '0')}`;
        
        const startStr = String(item.startDate);
        const endStr = String(item.endDate);
        
        const isActive = todayStr >= startStr && todayStr <= endStr; // inclusive
        const isCompleted = todayStr > endStr;
        const isUpcoming = todayStr < startStr;
        const progress = PHASE_PROGRESS_MAP[item.name] || 0;

        console.log(`Phase: ${item.name}`);
        console.log(`  Start: ${startStr}, End: ${endStr}, Today: ${todayStr}`);
        console.log(`  Active: ${isActive}, Completed: ${isCompleted}, Upcoming: ${isUpcoming}, Progress: ${progress}%`);

        return {
          name: item.name,
          startDate: startStr,
          endDate: endStr,
          progress,
          isActive,
          isCompleted,
          isUpcoming
        };
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate));

    // Determine current phase
    let currentPhase = 'Planning & Permits';
    let currentProgress = 0;

    if (phases.length > 0) {
      // Find active phase first
      const activePhase = phases.find(p => p.isActive);
      if (activePhase) {
        console.log(`Found active phase: ${activePhase.name}`);
        currentPhase = activePhase.name;
        currentProgress = activePhase.progress;
      } else {
        // If no active phase, find the most recent completed phase or next upcoming phase
        const completedPhases = phases.filter(p => p.isCompleted);
        const upcomingPhases = phases.filter(p => p.isUpcoming);
        
        if (completedPhases.length > 0) {
          // Use the last completed phase
          const lastCompleted = completedPhases[completedPhases.length - 1];
          console.log(`Using last completed phase: ${lastCompleted.name}`);
          currentPhase = lastCompleted.name;
          currentProgress = lastCompleted.progress;
        } else if (upcomingPhases.length > 0) {
          // All phases are upcoming, use preconstruction
          console.log('All phases upcoming, using Preconstruction');
          currentPhase = 'Preconstruction';
          currentProgress = 10;
        } else {
          // Fallback
          console.log('Using fallback to first phase');
          currentPhase = phases[0].name;
          currentProgress = phases[0].progress;
        }
      }
    }

    console.log(`Final result SINGLE PROJECT: ${currentPhase} (${currentProgress}%)`);
    console.log('=== END SINGLE PROJECT DEBUG ===');

    return {
      currentPhase,
      currentProgress,
      phases,
      isLoading: false
    };
  }, [scheduleData, isLoading]);

  return phaseData;
};

/**
 * Hook for multiple projects - returns a map of projectId to phase data
 */
export const useMultipleProjectPhases = (projectIds: string[]) => {
  const [phasesMap, setPhasesMap] = useState<Record<string, ProjectPhaseData>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAllSchedules = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('project_schedules')
          .select('project_id, schedule_data, created_at')
          .in('project_id', projectIds)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const newPhasesMap: Record<string, ProjectPhaseData> = {};
          
          // Group by project_id and take the latest schedule per project by created_at
          const latestSchedules = data.reduce((acc, row) => {
            const prev = acc[row.project_id];
            if (!prev || new Date(row.created_at).getTime() > new Date(prev.created_at).getTime()) {
              acc[row.project_id] = row;
            }
            return acc;
          }, {} as Record<string, any>);

           // Process each project's schedule
           projectIds.forEach(projectId => {
             const schedule = latestSchedules[projectId];
             const scheduleData = schedule?.schedule_data || [];
             
             console.log(`=== PROCESSING PROJECT ${projectId} ===`);
             console.log('Schedule data:', scheduleData);
             
             if (!Array.isArray(scheduleData) || scheduleData.length === 0) {
               console.log('No schedule data, using defaults');
               newPhasesMap[projectId] = {
                 currentPhase: 'Planning & Permits',
                 currentProgress: 0,
                 phases: [],
                 isLoading: false
               };
               return;
             }

             const todayNow = new Date();
             const todayLocal = new Date(todayNow.getFullYear(), todayNow.getMonth(), todayNow.getDate(), 12, 0, 0);
             
             const phases: ProjectPhase[] = scheduleData
               .filter((item: any) => item.startDate && item.endDate && item.name)
               .map((item: any) => {
                 // Build today's date string in local timezone (YYYY-MM-DD)
                 const now = new Date();
                 const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; // e.g. 2025-08-20
                 
                 const isActive = today >= item.startDate && today <= item.endDate;
                 const isCompleted = today > item.endDate;
                 const isUpcoming = today < item.startDate;
                 const progress = PHASE_PROGRESS_MAP[item.name] || 0;

                 console.log(`Phase: ${item.name} (${item.startDate} to ${item.endDate})`);
                 console.log(`  Today: ${today}, Active: ${isActive}, Completed: ${isCompleted}, Progress: ${progress}%`);

                 return {
                   name: item.name,
                   startDate: item.startDate,
                   endDate: item.endDate,
                   progress,
                   isActive,
                   isCompleted,
                   isUpcoming
                 };
               })
               .sort((a, b) => a.startDate.localeCompare(b.startDate));

             // Determine current phase
             let currentPhase = 'Planning & Permits';
             let currentProgress = 0;

             if (phases.length > 0) {
               const activePhase = phases.find(p => p.isActive);
               if (activePhase) {
                 console.log(`Found active phase: ${activePhase.name} at ${activePhase.progress}%`);
                 currentPhase = activePhase.name;
                 currentProgress = activePhase.progress;
               } else {
                 const completedPhases = phases.filter(p => p.isCompleted);
                 const upcomingPhases = phases.filter(p => p.isUpcoming);
                 
                 console.log(`Completed phases: ${completedPhases.length}, Upcoming: ${upcomingPhases.length}`);
                 
                 if (completedPhases.length > 0) {
                   const lastCompleted = completedPhases[completedPhases.length - 1];
                   console.log(`Using last completed phase: ${lastCompleted.name} at ${lastCompleted.progress}%`);
                   currentPhase = lastCompleted.name;
                   currentProgress = lastCompleted.progress;
                 } else if (upcomingPhases.length > 0) {
                   console.log('All phases upcoming, using Preconstruction');
                   currentPhase = 'Preconstruction';
                   currentProgress = 10;
                 } else {
                   console.log('Using fallback to first phase');
                   currentPhase = phases[0].name;
                   currentProgress = phases[0].progress;
                 }
               }
             }

             console.log(`Final result for ${projectId}: ${currentPhase} (${currentProgress}%)`);
             console.log(`=== END PROCESSING ===`);

             newPhasesMap[projectId] = {
               currentPhase,
               currentProgress,
               phases,
               isLoading: false
             };
           });

          setPhasesMap(newPhasesMap);
        }
      } catch (error) {
        console.error('Error loading project schedules:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectIds.length > 0) {
      loadAllSchedules();
    }
  }, [projectIds]);

  return { phasesMap, isLoading };
};