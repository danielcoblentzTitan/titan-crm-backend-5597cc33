
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, Target, Calendar } from "lucide-react";
import { supabaseService, TeamMember } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";

interface SalesData {
  totalSales: number;
  totalProjects: number;
  completedProjects: number;
  averageProjectValue: number;
}

const SalesMetrics = () => {
  const [salesData, setSalesData] = useState<SalesData>({
    totalSales: 0,
    totalProjects: 0,
    completedProjects: 0,
    averageProjectValue: 0
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("ytd");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSalesData();
  }, [selectedMember, timeFilter]);

  const loadData = async () => {
    try {
      const members = await supabaseService.getTeamMembers();
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
      toast({
        title: "Error",
        description: "Failed to load team members.",
        variant: "destructive",
      });
    }
  };

  const loadSalesData = async () => {
    try {
      setLoading(true);
      const projects = await supabaseService.getProjects();
      
      // Filter projects based on time period
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      let filteredProjects = projects;
      
      if (timeFilter === "month") {
        filteredProjects = projects.filter(project => {
          const projectDate = new Date(project.start_date);
          return projectDate.getFullYear() === currentYear && 
                 projectDate.getMonth() === currentMonth;
        });
      } else if (timeFilter === "ytd") {
        filteredProjects = projects.filter(project => {
          const projectDate = new Date(project.start_date);
          return projectDate.getFullYear() === currentYear;
        });
      }
      
      // Filter by team member if selected
      if (selectedMember !== "all") {
        // For now, we'll use all projects since we don't have salesperson assignment
        // This can be enhanced when we add salesperson tracking to projects
      }
      
      const totalSales = filteredProjects.reduce((sum, project) => sum + (project.budget || 0), 0);
      const completedProjects = filteredProjects.filter(p => p.status === 'Completed').length;
      const averageProjectValue = filteredProjects.length > 0 ? totalSales / filteredProjects.length : 0;
      
      setSalesData({
        totalSales,
        totalProjects: filteredProjects.length,
        completedProjects,
        averageProjectValue
      });
    } catch (error) {
      console.error('Error loading sales data:', error);
      toast({
        title: "Error",
        description: "Failed to load sales data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading sales metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex-mobile items-start justify-between gap-4">
        <h3 className="text-base sm:text-lg font-semibold">Sales Performance</h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-full sm:w-32 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger className="w-full sm:w-48 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Salespeople</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid-mobile-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">${salesData.totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {timeFilter === "month" ? "This month" : timeFilter === "ytd" ? "YTD" : "All time"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Projects Sold</CardTitle>
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{salesData.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {salesData.completedProjects} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Avg Value</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">${salesData.averageProjectValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per project
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Completion</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              {salesData.totalProjects > 0 
                ? Math.round((salesData.completedProjects / salesData.totalProjects) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Completed
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesMetrics;
