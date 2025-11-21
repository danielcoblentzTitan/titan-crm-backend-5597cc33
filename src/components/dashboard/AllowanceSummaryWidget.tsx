import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

interface AllowanceCategory {
  name: string;
  allowance: number;
  selected: number;
}

interface AllowanceSummaryProps {
  projectId: string;
}

export function AllowanceSummaryWidget({ projectId }: AllowanceSummaryProps) {
  const [categories, setCategories] = useState<AllowanceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllowanceSummary();
  }, [projectId]);

  const loadAllowanceSummary = async () => {
    try {
      // Get project allowances
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;

      // Get selected totals per trade
      const { data: selections, error: selectionsError } = await supabase
        .from("selection_items")
        .select("trade, total_cost_allowance")
        .eq("project_id", projectId);

      if (selectionsError) throw selectionsError;

      // Calculate selected amounts per trade
      const tradeMap: { [key: string]: number } = {};
      selections?.forEach((item) => {
        const trade = item.trade || "misc";
        tradeMap[trade] = (tradeMap[trade] || 0) + (item.total_cost_allowance || 0);
      });

      const summaryCategories: AllowanceCategory[] = [
        {
          name: "Flooring",
          allowance: project.total_allowance_flooring || 0,
          selected: tradeMap["Flooring"] || 0,
        },
        {
          name: "Cabinets",
          allowance: project.total_allowance_cabinets || 0,
          selected: tradeMap["Cabinets"] || 0,
        },
        {
          name: "Countertops",
          allowance: project.total_allowance_countertops || 0,
          selected: tradeMap["Countertops"] || 0,
        },
        {
          name: "Plumbing",
          allowance: project.total_allowance_plumbing || 0,
          selected: tradeMap["Plumbing"] || 0,
        },
        {
          name: "Electrical",
          allowance: project.total_allowance_electrical || 0,
          selected: tradeMap["Electrical"] || 0,
        },
        {
          name: "Lighting",
          allowance: project.total_allowance_lighting || 0,
          selected: tradeMap["Lighting"] || 0,
        },
        {
          name: "Paint",
          allowance: project.total_allowance_paint || 0,
          selected: tradeMap["Paint"] || 0,
        },
        {
          name: "Windows/Doors",
          allowance: project.total_allowance_windows_doors || 0,
          selected: tradeMap["Windows/Doors"] || 0,
        },
        {
          name: "Misc",
          allowance: project.total_allowance_misc || 0,
          selected: tradeMap["Misc"] || tradeMap["misc"] || 0,
        },
      ];

      setCategories(summaryCategories);
    } catch (error) {
      console.error("Error loading allowance summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (allowance: number, selected: number) => {
    if (selected === 0) return "bg-muted";
    if (selected <= allowance) return "bg-green-500";
    return "bg-red-500";
  };

  const getStatusText = (allowance: number, selected: number) => {
    if (selected === 0) return "No selections";
    const diff = allowance - selected;
    if (diff >= 0) return `Under by $${diff.toFixed(2)}`;
    return `Over by $${Math.abs(diff).toFixed(2)}`;
  };

  if (loading) {
    return <div>Loading allowances...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Allowance Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.name}
              className="p-4 border rounded-lg space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">{category.name}</h4>
                <div
                  className={`h-2 w-2 rounded-full ${getStatusColor(
                    category.allowance,
                    category.selected
                  )}`}
                />
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Allowance:</span>
                  <span className="font-medium">
                    ${category.allowance.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Selected:</span>
                  <span className="font-medium">
                    ${category.selected.toFixed(2)}
                  </span>
                </div>
                <div className="pt-1 border-t">
                  <p className="text-xs text-muted-foreground">
                    {getStatusText(category.allowance, category.selected)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
