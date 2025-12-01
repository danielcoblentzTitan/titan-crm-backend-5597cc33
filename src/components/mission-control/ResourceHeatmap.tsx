import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, parseISO, startOfWeek, endOfWeek, isSameWeek } from "date-fns";
import { AlertTriangle, Calendar, Users, Clock } from "lucide-react";

interface Resource {
  id: string;
  name: string;
  type: string;
  capacity_per_day: number;
  is_active: boolean;
}

interface ResourceUtilization {
  resource_id: string;
  resource_name: string;
  week_start: string;
  total_capacity: number;
  allocated_capacity: number;
  utilization_percent: number;
  is_overbooked: boolean;
  blackout_days: number;
}

interface WeeklyData {
  week_start: string;
  week_end: string;
  resources: ResourceUtilization[];
}

export const ResourceHeatmap: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);

  const calculateResourceUtilization = async () => {
    setLoading(true);
    try {
      // Get all resources
      const { data: resourcesData, error: resourcesError } = await supabase
        .from("resources")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (resourcesError) throw resourcesError;
      setResources(resourcesData || []);

      // Get all phases and blackouts for the next 12 weeks
      const startDate = startOfWeek(new Date());
      const endDate = addDays(startDate, 12 * 7);

      const [phasesRes, blackoutsRes] = await Promise.all([
        supabase
          .from("project_phases")
          .select(`
            *,
            project:projects(name, status)
          `)
          .gte("start_date", format(startDate, "yyyy-MM-dd"))
          .lte("end_date", format(endDate, "yyyy-MM-dd")),
        supabase
          .from("resource_blackouts")
          .select("*")
          .gte("start_date", format(startDate, "yyyy-MM-dd"))
          .lte("end_date", format(endDate, "yyyy-MM-dd"))
      ]);

      if (phasesRes.error) throw phasesRes.error;
      if (blackoutsRes.error) throw blackoutsRes.error;

      const phases = phasesRes.data || [];
      const blackouts = blackoutsRes.data || [];

      // Calculate utilization by week
      const weeks: WeeklyData[] = [];
      
      for (let i = 0; i < 12; i++) {
        const weekStart = addDays(startDate, i * 7);
        const weekEnd = endOfWeek(weekStart);
        
        const weeklyUtilization: ResourceUtilization[] = [];

        (resourcesData || []).forEach(resource => {
          // Calculate total capacity for the week (5 working days)
          const totalCapacity = resource.capacity_per_day * 5;
          
          // Count blackout days for this resource in this week
          const blackoutDays = blackouts
            .filter(b => b.resource_id === resource.id)
            .reduce((count, blackout) => {
              const blackoutStart = parseISO(blackout.start_date);
              const blackoutEnd = parseISO(blackout.end_date);
              
              // Count overlap days within the week
              const overlapStart = blackoutStart > weekStart ? blackoutStart : weekStart;
              const overlapEnd = blackoutEnd < weekEnd ? blackoutEnd : weekEnd;
              
              if (overlapStart <= overlapEnd) {
                const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                return count + Math.min(overlapDays, 5); // Max 5 working days
              }
              return count;
            }, 0);

          // Calculate allocated capacity from phases
          const allocatedCapacity = phases
            .filter(phase => phase.resource_id === resource.id)
            .filter(phase => {
              if (!phase.start_date || !phase.end_date) return false;
              const phaseStart = parseISO(phase.start_date);
              const phaseEnd = parseISO(phase.end_date);
              return isSameWeek(phaseStart, weekStart) || isSameWeek(phaseEnd, weekStart) ||
                     (phaseStart <= weekStart && phaseEnd >= weekEnd);
            })
            .reduce((total, phase) => {
              // Simplified: assume 1 unit per day for phases overlapping this week
              const phaseStart = parseISO(phase.start_date!);
              const phaseEnd = parseISO(phase.end_date!);
              
              const overlapStart = phaseStart > weekStart ? phaseStart : weekStart;
              const overlapEnd = phaseEnd < weekEnd ? phaseEnd : weekEnd;
              
              if (overlapStart <= overlapEnd) {
                const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                return total + Math.min(overlapDays, 5); // Max 5 working days
              }
              return total;
            }, 0);

          const adjustedCapacity = Math.max(totalCapacity - blackoutDays, 0);
          const utilizationPercent = adjustedCapacity > 0 ? (allocatedCapacity / adjustedCapacity) * 100 : 0;
          const isOverbooked = allocatedCapacity > adjustedCapacity;

          weeklyUtilization.push({
            resource_id: resource.id,
            resource_name: resource.name,
            week_start: format(weekStart, "yyyy-MM-dd"),
            total_capacity: adjustedCapacity,
            allocated_capacity: allocatedCapacity,
            utilization_percent: utilizationPercent,
            is_overbooked: isOverbooked,
            blackout_days: blackoutDays
          });
        });

        weeks.push({
          week_start: format(weekStart, "yyyy-MM-dd"),
          week_end: format(weekEnd, "yyyy-MM-dd"),
          resources: weeklyUtilization
        });
      }

      setWeeklyData(weeks);
    } catch (e) {
      console.error("Failed to calculate resource utilization", e);
      toast({ title: "Error", description: "Failed to load resource data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateResourceUtilization();
  }, []);

  const getUtilizationColor = (percent: number, isOverbooked: boolean) => {
    if (isOverbooked) return "bg-red-500";
    if (percent >= 90) return "bg-orange-500";
    if (percent >= 70) return "bg-yellow-500";
    if (percent >= 40) return "bg-green-500";
    return "bg-gray-300";
  };

  const overbookedResources = weeklyData.flatMap(week => 
    week.resources.filter(r => r.is_overbooked)
  );

  const totalAllocations = weeklyData.reduce((sum, week) => 
    sum + week.resources.reduce((weekSum, r) => weekSum + r.allocated_capacity, 0), 0
  );

  const totalCapacity = weeklyData.reduce((sum, week) => 
    sum + week.resources.reduce((weekSum, r) => weekSum + r.total_capacity, 0), 0
  );

  const overallUtilization = totalCapacity > 0 ? (totalAllocations / totalCapacity) * 100 : 0;

  if (loading) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Resource Heatmap</h2>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </section>
    );
  }

  return (
    <section aria-label="Resource Heatmap" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Resource Heatmap</h2>
        <Button variant="outline" size="sm" onClick={calculateResourceUtilization}>
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Active Resources</p>
                <p className="text-2xl font-bold">{resources.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Overall Utilization</p>
                <p className="text-2xl font-bold">{overallUtilization.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Overbooked</p>
                <p className="text-2xl font-bold">{overbookedResources.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Total Capacity</p>
                <p className="text-2xl font-bold">{totalCapacity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">12-Week Resource Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-300 rounded"></div>
                <span>0-40%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>40-70%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>70-90%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span>90-100%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Overbooked</span>
              </div>
            </div>

            {/* Heatmap Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2 text-sm font-medium">Resource</th>
                    {weeklyData.map(week => (
                      <th key={week.week_start} className="text-center p-1 text-xs">
                        {format(parseISO(week.week_start), "MMM dd")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resources.map(resource => (
                    <tr key={resource.id} className="border-t">
                      <td className="p-2">
                        <div>
                          <div className="font-medium text-sm">{resource.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {resource.type} • {resource.capacity_per_day}/day capacity
                          </div>
                        </div>
                      </td>
                      {weeklyData.map(week => {
                        const utilization = week.resources.find(r => r.resource_id === resource.id);
                        if (!utilization) {
                          return <td key={week.week_start} className="p-1"></td>;
                        }
                        
                        return (
                          <td key={week.week_start} className="p-1">
                            <div className="relative group">
                              <div 
                                className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium text-white ${getUtilizationColor(utilization.utilization_percent, utilization.is_overbooked)}`}
                                title={`${utilization.resource_name}: ${utilization.utilization_percent.toFixed(0)}% utilized (${utilization.allocated_capacity}/${utilization.total_capacity})`}
                              >
                                {utilization.is_overbooked ? '!' : Math.round(utilization.utilization_percent)}
                              </div>
                              
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                <div>{utilization.resource_name}</div>
                                <div>{utilization.allocated_capacity}/{utilization.total_capacity} capacity</div>
                                <div>{utilization.utilization_percent.toFixed(0)}% utilized</div>
                                {utilization.blackout_days > 0 && (
                                  <div>{utilization.blackout_days} blackout days</div>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overbooked Resources Alert */}
      {overbookedResources.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-base text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Overbooked Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overbookedResources.slice(0, 5).map((resource, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{resource.resource_name}</span>
                  <div className="flex items-center gap-2">
                    <span>Week of {format(parseISO(resource.week_start), "MMM dd")}</span>
                    <Badge variant="destructive">
                      {resource.utilization_percent.toFixed(0)}% utilized
                    </Badge>
                  </div>
                </div>
              ))}
              {overbookedResources.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  ...and {overbookedResources.length - 5} more overbooked allocations
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {resources.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No resources found.</p>
              <p className="text-sm">Add resources to see utilization data.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
};