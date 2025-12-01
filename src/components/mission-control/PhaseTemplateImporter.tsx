
import React, { useMemo, useState } from "react";
import { createPhasesFromTemplate } from "@/services/phaseService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { syncProjectSchedule } from "@/services/scheduleSyncService";

type ProjectLite = {
  id: string;
  name: string;
  start_date?: string | null;
};

interface PhaseTemplateImporterProps {
  projects: ProjectLite[];
  onCompleted?: () => void;
}

export const PhaseTemplateImporter: React.FC<PhaseTemplateImporterProps> = ({ projects, onCompleted }) => {
  const { toast } = useToast();
  const [projectId, setProjectId] = useState<string>(projects[0]?.id || "");
  const [templateName, setTemplateName] = useState<string>("Barndominium");
  const defaultStart = useMemo(() => {
    const p = projects.find((x) => x.id === projectId);
    return p?.start_date || "";
  }, [projects, projectId]);
  const [startDate, setStartDate] = useState<string>(defaultStart || "");
  const [publishing, setPublishing] = useState(false);

  React.useEffect(() => {
    setStartDate(defaultStart || "");
  }, [defaultStart]);

  const handleGenerate = async () => {
    if (!projectId || !startDate) {
      toast({
        title: "Missing info",
        description: "Please select a project and a start date.",
        variant: "destructive",
      });
      return;
    }
    setPublishing(true);
    try {
      const res = await createPhasesFromTemplate({
        projectId,
        projectStartDate: startDate,
        templateName,
        publishToCustomer: false,
      });
      toast({
        title: "Phases created",
        description: `Created ${res.created} phases and ${res.dependencies} dependencies.`,
      });
      await syncProjectSchedule(projectId);
      toast({
        title: "Customer schedule updated",
        description: "Published phases synced to customer portal.",
      });
      onCompleted?.();
    } catch (e: any) {
      console.error("Create phases error:", e);
      toast({
        title: "Error",
        description: "Could not generate phases. Ensure you're signed in as a builder.",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phase Tools — Build from Template</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Project</label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Template</label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            >
              <option value="Residential">Residential (4 core phases)</option>
              <option value="Commercial">Commercial (20 phases)</option>
              <option value="Barndominium">Barndominium (20 phases)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <input
              type="date"
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={startDate || ""}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Weekends and holidays will be skipped automatically</p>
          <p>• Residential includes only core phases (others can be added manually)</p>
          <p>• Commercial and Barndominium include all 20 phases</p>
        </div>

        <div className="flex items-center justify-end pt-2">
          <Button onClick={handleGenerate} disabled={publishing || !projectId || !startDate}>
            {publishing ? "Building..." : "Generate Phases"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
