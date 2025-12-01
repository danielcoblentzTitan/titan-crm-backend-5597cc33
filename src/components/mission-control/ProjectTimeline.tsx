import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EnhancedCalendarView } from "@/components/schedule/EnhancedCalendarView";
import { ScheduledTradeTask, isNonWorkDay } from "@/components/schedule/types";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, addDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface Project {
  id: string;
  name: string;
  status: string;
  estimated_completion: string | null;
}

interface ProjectPhase {
  id: string;
  project_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  duration_days: number;
  status: string;
  color: string | null;
  resource_id: string | null;
}

interface Resource {
  id: string;
  name: string;
}

function addWorkdaysSkipping(start: Date, workdays: number): Date {
  if (workdays <= 1) return new Date(start);
  let d = new Date(start);
  let added = 1;
  while (added < workdays) {
    d.setDate(d.getDate() + 1);
    if (!isNonWorkDay(d)) added++;
  }
  return d;
}

export const ProjectTimeline: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [resources, setResources] = useState<Record<string, Resource>>({});

  const loadProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status, estimated_completion")
        .order("name", { ascending: true });

      if (error) throw error;
      setProjects(data || []);
      
      if (data && data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
      }
    } catch (e) {
      console.error("Failed to load projects", e);
      toast({ title: "Error", description: "Failed to load projects", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadProjectPhases = async (projectId: string) => {
    if (!projectId) return;
    
    try {
      const [phasesRes, resourcesRes] = await Promise.all([
        supabase
          .from("project_phases")
          .select("*")
          .eq("project_id", projectId)
          .order("start_date", { ascending: true }),
        supabase.from("resources").select("id, name")
      ]);

      if (phasesRes.error) throw phasesRes.error;
      if (resourcesRes.error) throw resourcesRes.error;

      setPhases(phasesRes.data || []);
      
      const resourceMap: Record<string, Resource> = {};
      (resourcesRes.data || []).forEach(r => {
        resourceMap[r.id] = r;
      });
      setResources(resourceMap);
    } catch (e) {
      console.error("Failed to load project phases", e);
      toast({ title: "Error", description: "Failed to load project timeline", variant: "destructive" });
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectPhases(selectedProjectId);
    }
  }, [selectedProjectId]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const trades = phases
    .filter(p => p.start_date && p.end_date)
    .map(p => ({
      id: p.id,
      name: p.name,
      workdays: p.duration_days,
      startDate: parseISO(p.start_date!),
      endDate: parseISO(p.end_date!),
      color: p.color || "#3b82f6",
    }));

  const handlePhaseUpdate = async (trade: ScheduledTradeTask & { id?: string }) => {
    if (!trade.id || !selectedProjectId) return;

    try {
      const endDate = addWorkdaysSkipping(trade.startDate, trade.workdays);
      
      const { error } = await supabase
        .from("project_phases")
        .update({
          start_date: format(trade.startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          duration_days: trade.workdays,
        })
        .eq("id", trade.id);

      if (error) throw error;

      toast({ title: "Updated", description: `Phase "${trade.name}" updated successfully` });
      await loadProjectPhases(selectedProjectId);
    } catch (e) {
      console.error("Failed to update phase", e);
      toast({ title: "Error", description: "Failed to update phase", variant: "destructive" });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "delayed":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "delayed":
        return "bg-red-100 text-red-800";
      case "planned":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Project Timeline</h2>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </section>
    );
  }

  return (
    <section aria-label="Project Timeline" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Project Timeline</h2>
        <Button variant="outline" size="sm" onClick={loadProjects}>
          Refresh
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedProject && (
          <Badge variant="outline" className={getStatusColor(selectedProject.status)}>
            {getStatusIcon(selectedProject.status)}
            <span className="ml-1">{selectedProject.status}</span>
          </Badge>
        )}
      </div>

      {selectedProject && phases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>{selectedProject.name} - Timeline</span>
              {selectedProject.estimated_completion && (
                <Badge variant="outline">
                  Target: {format(parseISO(selectedProject.estimated_completion), "MMM dd, yyyy")}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Phase Status Overview</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                {phases.map(phase => (
                  <div key={phase.id} className="flex items-center gap-2">
                    {getStatusIcon(phase.status)}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{phase.name}</div>
                      <div className="text-muted-foreground">
                        {phase.resource_id && resources[phase.resource_id] 
                          ? resources[phase.resource_id].name 
                          : "Unassigned"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {trades.length > 0 && (
              <EnhancedCalendarView
                startDate={trades[0].startDate}
                trades={trades as ScheduledTradeTask[]}
                onTradeUpdate={handlePhaseUpdate}
                onTradesUpdate={async (updatedTrades) => {
                  for (const trade of updatedTrades) {
                    await handlePhaseUpdate(trade as any);
                  }
                }}
              />
            )}
          </CardContent>
        </Card>
      )}

      {selectedProject && phases.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No phases found for this project.</p>
              <p className="text-sm">Create phases to see the timeline visualization.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {projects.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No projects found.</p>
              <p className="text-sm">Create a project to start managing timelines.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
};