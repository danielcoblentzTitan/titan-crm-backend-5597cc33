import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CloudRain } from "lucide-react";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isSameDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TimelineHeader } from "./schedule/TimelineHeader";
import { SwimlaneRow } from "./schedule/SwimlaneRow";
import { supabase } from "@/integrations/supabase/client";
import { WeatherDelayDialog } from "../schedule/WeatherDelayDialog";
import { formatProjectCode, generateProjectCode } from "@/lib/project-utils";

interface PhaseLike {
  id: string;
  name: string;
  start_date: string; // yyyy-MM-dd
  end_date: string;   // yyyy-MM-dd
  color: string;
}

interface ProjectLike {
  id: string;
  name: string;
  phases: PhaseLike[];
  building_type?: string | null;
  code?: string | null;
}

export function LiveMasterSchedule() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [projects, setProjects] = useState<ProjectLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [weatherDelayOpen, setWeatherDelayOpen] = useState(false);
  const [selectedDelayDate, setSelectedDelayDate] = useState<Date>(new Date());

  // View state and controls
  type RangeMode = "2w" | "4w" | "month";
  const [rangeMode, setRangeMode] = useState<RangeMode>("4w");
  const [density, setDensity] = useState<"compact" | "comfortable">("compact");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const weeksCount = rangeMode === "2w" ? 2 : rangeMode === "4w" ? 4 : 4; // used only for nav step

  // Anchor date controls navigation; initialize to today
  const [anchor, setAnchor] = useState<Date>(new Date());

  const rangeStart = useMemo(() => (
    rangeMode === "month"
      ? startOfMonth(anchor)
      : anchor // Start from the anchor date (today) for week views
  ), [anchor, rangeMode]);

  const rangeEnd = useMemo(() => (
    rangeMode === "month"
      ? endOfMonth(anchor)
      : endOfWeek(addWeeks(rangeStart, (rangeMode === "2w" ? 2 : 4) - 1), { weekStartsOn: 1 })
  ), [anchor, rangeMode, rangeStart]);

  // Workdays (Mon–Fri) within window
  const workdays = useMemo(() => {
    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
    return days.filter((d) => {
      const dow = getDay(d);
      return dow >= 1 && dow <= 5;
    });
  }, [rangeStart, rangeEnd]);

  // Load real project data
  const loadProjects = async () => {
    setLoading(true);
    try {
      // Load projects from both new and legacy tables
      const [{ data: projectDataNew, error: projectErrorNew }, { data: legacyProjects, error: legacyError }] = await Promise.all([
        supabase.from('projects_new').select('*').order('name'),
        supabase
          .from('projects')
          .select('id, name, status, customer_name, building_type')
          .in('status', ['Active', 'In Progress', 'Planning'])
          .order('name')
      ]);

      if (projectErrorNew) throw projectErrorNew;
      if (legacyError) throw legacyError;

      // Dedupe: normalize names and strip generic words like "project"
      const normalizeName = (name: string) => {
        const stopWords = new Set(['project', 'projects']);
        return (name || '')
          .toLowerCase()
          .replace(/[-_]/g, ' ')
          .replace(/[()]/g, '')
          .split(/\s+/)
          .filter((w) => w && !stopWords.has(w))
          .join(' ')
          .trim();
      };
      const newProjectKeys = new Set((projectDataNew || []).map(p => normalizeName(p.name || '')));
      const legacyFiltered = (legacyProjects || []).filter(lp => !newProjectKeys.has(normalizeName(lp.name || '')));

      // Load phases for both new and legacy projects
      const allProjectIds = [
        ...(projectDataNew?.map(p => p.id) || []),
        ...legacyFiltered.map(p => p.id)
      ];
      
      const { data: phasesData, error: phasesError } = await supabase
        .from('project_phases')
        .select('*')
        .in('project_id', (allProjectIds.length ? allProjectIds : ['00000000-0000-0000-0000-000000000000']))
        .not('start_date', 'is', null)
        .not('end_date', 'is', null)
        .order('start_date');

      if (phasesError) throw phasesError;

      // Also load project_schedules for projects that might not have phases
      const { data: schedulesData } = await supabase
        .from('project_schedules')
        .select('*')
        .in('project_id', allProjectIds);

      // Group phases and schedules by project
      const phasesByProject: Record<string, any[]> = {};
      phasesData?.forEach(phase => {
        if (!phasesByProject[phase.project_id]) {
          phasesByProject[phase.project_id] = [];
        }
        phasesByProject[phase.project_id].push(phase);
      });

      // Convert schedule_data to phases format for projects without phases
      const schedulesByProject: Record<string, any> = {};
      schedulesData?.forEach(schedule => {
        if (schedule.schedule_data && Array.isArray(schedule.schedule_data)) {
          schedulesByProject[schedule.project_id] = schedule.schedule_data;
        }
      });

      // Color palette for phases
      const phaseColors = [
        '#8B4513', '#696969', '#DEB887', '#8B0000', '#FFD700', 
        '#4682B4', '#32CD32', '#F0E68C', '#CD853F', '#20B2AA',
        '#DC143C', '#FF6347', '#4169E1', '#228B22', '#FF4500'
      ];

      const transformedNew: ProjectLike[] = (projectDataNew || []).map((project, projectIndex) => {
        const projectPhases = phasesByProject[project.id] || [];
        // Format code as "TB - R/B/C - LASTNAME - 001" with spaces and building type
        const displayName = formatProjectCode(project.code, project.building_type) || project.name;
        
        return {
          id: project.id,
          name: displayName,
          building_type: project.building_type,
          code: project.code,
          phases: projectPhases.map((phase, phaseIndex) => ({
            id: phase.id,
            name: phase.name,
            start_date: phase.start_date,
            end_date: phase.end_date,
            color: phase.color || phaseColors[phaseIndex % phaseColors.length]
          }))
        };
      });

      // Legacy projects - use phases if available, otherwise use schedule_data
      const transformedLegacy: ProjectLike[] = legacyFiltered.map((proj, projectIndex) => {
        let phases: PhaseLike[] = [];
        
        // First try to get phases from project_phases
        const projectPhases = phasesByProject[proj.id] || [];
        if (projectPhases.length > 0) {
          phases = projectPhases.map((phase, phaseIndex) => ({
            id: phase.id,
            name: phase.name,
            start_date: phase.start_date,
            end_date: phase.end_date,
            color: phase.color || phaseColors[phaseIndex % phaseColors.length]
          }));
        } else if (schedulesByProject[proj.id]) {
          // Fall back to schedule_data if no phases
          phases = schedulesByProject[proj.id].map((scheduleItem: any, idx: number) => ({
            id: `${proj.id}-schedule-${idx}`,
            name: scheduleItem.name,
            start_date: scheduleItem.startDate,
            end_date: scheduleItem.endDate,
            color: scheduleItem.color || phaseColors[idx % phaseColors.length]
          }));
        }
        
        // Try to format legacy project names with building type using generated code
        const lastName = ((proj as any).customer_name || proj.name || '').trim().split(/\s+/).slice(-1)[0] || 'PROJECT';
        const code = generateProjectCode((proj as any).building_type || 'Barndominium', lastName, '001');
        const displayName = formatProjectCode(code, (proj as any).building_type) || proj.name || 'Untitled Project';
        
        return {
          id: proj.id,
          name: displayName,
          building_type: (proj as any).building_type,
          code: code,
          phases
        };
      });

      const transformedProjects: ProjectLike[] = [...transformedNew, ...transformedLegacy];

      setProjects(transformedProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();

    // Set up real-time subscriptions for automatic updates
    const channel = supabase
      .channel('live-master-schedule-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'projects_new' 
      }, () => {
        console.log('Projects (new) updated, refreshing master schedule...');
        loadProjects();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'projects' 
      }, () => {
        console.log('Projects (legacy) updated, refreshing master schedule...');
        loadProjects();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'project_phases' 
      }, () => {
        console.log('Project phases updated, refreshing master schedule...');
        loadProjects();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'project_schedules' 
      }, () => {
        console.log('Project schedules updated, refreshing master schedule...');
        loadProjects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, search]);

  const isTodayInRange = useMemo(() => workdays.some((d) => isSameDay(d, new Date())), [workdays]);

  const toggleProject = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const expandAll = () => setExpanded(new Set(filteredProjects.map((p) => p.id)));
  const collapseAll = () => setExpanded(new Set());

  const navigateRange = (dir: "prev" | "next") => {
    if (rangeMode === "month") {
      setAnchor((prev) => (dir === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)));
      setCurrentMonth((prev) => (dir === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)));
    } else {
      const step = rangeMode === "2w" ? 2 : 4;
      setAnchor((prev) => (dir === "prev" ? subWeeks(prev, step) : addWeeks(prev, step)));
      setCurrentMonth((prev) => (dir === "prev" ? subWeeks(prev, step) : addWeeks(prev, step)));
    }
  };

  const handleAddWeatherDelay = (date: Date) => {
    setSelectedDelayDate(date);
    setWeatherDelayOpen(true);
  };

  const handleDelayApplied = () => {
    // Reload the projects to show updated data
    loadProjects();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Master Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading live project schedules...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Master Schedule</CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{filteredProjects.length} Projects</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddWeatherDelay(new Date())}
            >
              <CloudRain className="h-4 w-4 mr-2" />
              Weather Delay
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{format(anchor, rangeMode === "month" ? "MMMM yyyy" : "MMM d, yyyy")}</h3>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => navigateRange("prev")} aria-label="Previous">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateRange("next")} aria-label="Next">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-md border overflow-hidden">
              {(["2w", "4w", "month"] as RangeMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setRangeMode(m)}
                  className={cn(
                    "px-2 py-1 text-xs",
                    m === rangeMode ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"
                  )}
                  aria-label={`Range ${m}`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex rounded-md border overflow-hidden">
              {(["compact", "comfortable"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDensity(d)}
                  className={cn(
                    "px-2 py-1 text-xs",
                    d === density ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"
                  )}
                  aria-label={`Density ${d}`}
                >
                  {d}
                </button>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={expandAll}>Expand all</Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>Collapse all</Button>

            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 px-3 rounded-md border bg-background text-sm"
              aria-label="Search projects"
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <TimelineHeader workdays={workdays} labelWidth={220} />
            <ScrollArea className="max-h-[60vh]">
              <div>
                {filteredProjects.map((p) => (
                  <SwimlaneRow
                    key={p.id}
                    project={p}
                    workdays={workdays}
                    expanded={expanded.has(p.id)}
                    onToggle={() => toggleProject(p.id)}
                    labelWidth={220}
                    density={density}
                  />
                ))}
                {filteredProjects.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {search ? "No projects found matching search" : "No active projects with schedules found"}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
      
      <WeatherDelayDialog
        open={weatherDelayOpen}
        onOpenChange={setWeatherDelayOpen}
        selectedDate={selectedDelayDate}
        onDelayApplied={handleDelayApplied}
      />
    </Card>
  );
}
