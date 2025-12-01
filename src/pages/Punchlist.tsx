import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabaseService, type Project } from "@/services/supabaseService";
import { PunchlistManager } from "@/components/punchlist/PunchlistManager";
import { supabase } from "@/integrations/supabase/client";

interface SchedulePhase {
  name: string;
  startDate: string | null;
  endDate: string | null;
  workdays: number;
  color: string | null;
}

const Punchlist = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhase, setCurrentPhase] = useState<string>("Planning & Permits");

  const getCurrentPhaseFromSchedule = (scheduleData: SchedulePhase[]): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

    // Sort phases by start date
    const sortedPhases = scheduleData
      .filter(phase => phase.startDate && phase.endDate)
      .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());

    // Check if we're before all phases
    if (sortedPhases.length > 0) {
      const firstPhaseStart = new Date(sortedPhases[0].startDate!);
      firstPhaseStart.setHours(0, 0, 0, 0);
      if (today < firstPhaseStart) {
        return "Preconstruction";
      }
    }

    // Find current phase
    for (const phase of sortedPhases) {
      const startDate = new Date(phase.startDate!);
      const endDate = new Date(phase.endDate!);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      if (today >= startDate && today <= endDate) {
        // Clean up phase name (e.g., "Framing Crew" -> "Framing")
        return phase.name.replace(/\s+(Crew|Team|Work)$/i, '');
      }
    }

    // If we're after all phases
    if (sortedPhases.length > 0) {
      const lastPhaseEnd = new Date(sortedPhases[sortedPhases.length - 1].endDate!);
      lastPhaseEnd.setHours(23, 59, 59, 999);
      if (today > lastPhaseEnd) {
        return "Completed";
      }
    }

    return "Planning & Permits";
  };

  useEffect(() => {
    const loadProjectAndSchedule = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Load project data
        const projects = await supabaseService.getProjects();
        const foundProject = projects.find(p => p.id === id);
        setProject(foundProject || null);

        if (foundProject) {
          // Fetch project schedule data
          const { data: scheduleData, error } = await supabase
            .from("project_schedules")
            .select("schedule_data")
            .eq("project_id", foundProject.id)
            .single();

          if (!error && scheduleData?.schedule_data && Array.isArray(scheduleData.schedule_data)) {
            const phase = getCurrentPhaseFromSchedule(scheduleData.schedule_data as unknown as SchedulePhase[]);
            setCurrentPhase(phase);
          }
        }
      } catch (error) {
        console.error("Error loading project:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProjectAndSchedule();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested project could not be found.</p>
            <Button onClick={() => navigate("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Project Overview Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              {project.name} - Punchlist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Customer:</span>
                <p className="font-medium">{project.customer_name}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Phase:</span>
                <p className="font-medium">{currentPhase}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Punchlist Manager */}
        <PunchlistManager 
          projectId={project.id} 
          isCustomerView={false}
        />
      </div>
    </div>
  );
};

export default Punchlist;