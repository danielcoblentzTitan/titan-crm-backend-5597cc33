
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Users, DollarSign, FileText, Target, TrendingUp } from "lucide-react";
import { supabaseService, TeamMember } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";
import SalesMetrics from "./SalesMetrics";

const StatsOverview = () => {
  const [companyStats, setCompanyStats] = useState<any>(null);
  const [teamMemberStats, setTeamMemberStats] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("company");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedMember === "company") {
      setTeamMemberStats(null);
    } else {
      loadTeamMemberStats(selectedMember);
    }
  }, [selectedMember]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stats, members] = await Promise.all([
        supabaseService.getCompanyStats(),
        supabaseService.getTeamMembers()
      ]);
      setCompanyStats(stats);
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: "Error",
        description: "Failed to load statistics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMemberStats = async (memberId: string) => {
    try {
      const stats = await supabaseService.getTeamMemberStats(memberId);
      setTeamMemberStats(stats);
    } catch (error) {
      console.error('Error loading team member stats:', error);
      toast({
        title: "Error",
        description: "Failed to load team member statistics.",
        variant: "destructive",
      });
    }
  };

  if (loading || !companyStats) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading statistics...</p>
      </div>
    );
  }

  const isCompanyView = selectedMember === "company";
  const currentStats = isCompanyView ? companyStats : teamMemberStats;

  return (
    <div className="space-y-8">
      {/* Sales Metrics Section */}
      <SalesMetrics />
      
      <div className="flex-mobile items-start justify-between gap-4">
        <h3 className="text-base sm:text-lg font-semibold">Lead Performance</h3>
        <Select value={selectedMember} onValueChange={setSelectedMember}>
          <SelectTrigger className="w-full sm:w-48 lg:w-64 text-xs sm:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="company">Company Overview</SelectItem>
            {teamMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid-mobile-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Leads Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Leads</CardTitle>
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{currentStats?.leads?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {currentStats?.leads?.new || 0} new
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Qualified</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{currentStats?.leads?.qualified || 0}</div>
            <p className="text-xs text-muted-foreground">
              {currentStats?.leads?.won || 0} converted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Lead Value</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              ${(currentStats?.leads?.totalValue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Pipeline value
            </p>
          </CardContent>
        </Card>

        {/* Company-only stats */}
        {isCompanyView && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Projects</CardTitle>
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{companyStats.projects.active}</div>
              <p className="text-xs text-muted-foreground">
                {companyStats.projects.total} total
              </p>
            </CardContent>
          </Card>
        )}

        {/* Individual team member placeholder */}
        {!isCompanyView && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Conversion</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">
                {currentStats?.leads?.total > 0 
                  ? Math.round((currentStats.leads.won / currentStats.leads.total) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Lead to customer
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Company-only additional stats */}
      {isCompanyView && (
        <div className="grid-mobile-2 lg:grid-cols-3 gap-3 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Customers</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{companyStats.customers.total}</div>
              <p className="text-xs text-muted-foreground">
                Active base
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">
                ${companyStats.invoices.totalValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {companyStats.invoices.paid} paid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Portfolio</CardTitle>
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">
                ${companyStats.projects.totalValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Total value
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StatsOverview;
