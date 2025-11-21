import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";

interface ProgressWidgetProps {
  projectId: string;
}

export function ProgressWidget({ projectId }: ProgressWidgetProps) {
  const [totalSelections, setTotalSelections] = useState(0);
  const [completedSelections, setCompletedSelections] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [projectId]);

  const loadProgress = async () => {
    try {
      const { data: selections, error } = await supabase
        .from("selection_items")
        .select("id, label, material_type, brand")
        .eq("project_id", projectId);

      if (error) throw error;

      const total = selections?.length || 0;
      // Count selections as "complete" if they have at least label, material_type, and brand
      const completed = selections?.filter(
        (s) => s.label && s.material_type && s.brand
      ).length || 0;

      setTotalSelections(total);
      setCompletedSelections(completed);
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading progress...</div>;
  }

  const percentage = totalSelections > 0 
    ? Math.round((completedSelections / totalSelections) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Project Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-3xl font-bold">
            {completedSelections} / {totalSelections}
          </p>
          <p className="text-sm text-muted-foreground">
            Selections Completed
          </p>
        </div>
        <Progress value={percentage} className="h-2" />
        <p className="text-center text-sm text-muted-foreground">
          {percentage}% Complete
        </p>
      </CardContent>
    </Card>
  );
}
