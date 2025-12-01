import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  Calendar,
  Building2,
  CheckCircle,
  Users,
  Clock,
  PieChart,
  BarChart3,
  ArrowUpDown
} from "lucide-react";
import { supabaseService, TeamMember, Lead, Project } from "@/services/supabaseService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SalesMetrics {
  // Lead Volume & Quality
  totalLeads: number;
  qualifiedLeads: number;
  qualificationRate: number;
  
  // Conversion Metrics
  inquiryToAppointment: number;
  appointmentToProposal: number;
  proposalToContract: number;
  overallConversion: number;
  
  // Sales Performance
  contractsSigned: number;
  averageContractSize: number;
  totalSignedRevenue: number;
  
  // Sales Cycle
  averageSalesCycleDays: number;
  
  // Pipeline & Forecast
  pipelineValue: number;
  projectedSales30Days: number;
  projectedSales60Days: number;
  projectedSales90Days: number;
}

export const SalesPerformance = () => {
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics>({
    totalLeads: 0,
    qualifiedLeads: 0,
    qualificationRate: 0,
    inquiryToAppointment: 0,
    appointmentToProposal: 0,
    proposalToContract: 0,
    overallConversion: 0,
    contractsSigned: 0,
    averageContractSize: 0,
    totalSignedRevenue: 0,
    averageSalesCycleDays: 0,
    pipelineValue: 0,
    projectedSales30Days: 0,
    projectedSales60Days: 0,
    projectedSales90Days: 0,
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
    loadSalesMetrics();
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

  const getTimeFilteredDate = () => {
    const now = new Date();
    if (timeFilter === "month") {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeFilter === "ytd") {
      return new Date(now.getFullYear(), 0, 1);
    }
    return null; // All time
  };

  const loadSalesMetrics = async () => {
    try {
      setLoading(true);
      const [leads, projects, activities, invoices, schedules] = await Promise.all([
        supabaseService.getLeads(),
        supabaseService.getProjects(),
        supabaseService.getActivities(),
        supabaseService.getInvoices(),
        supabase.from('project_schedules').select('*').then(({ data }) => data || [])
      ]);
      
      const startDate = getTimeFilteredDate();
      
      // Filter data by time period
      const filteredLeads = startDate 
        ? leads.filter(lead => new Date(lead.created_at) >= startDate)
        : leads;
      
      const filteredProjects = startDate
        ? projects.filter(project => new Date(project.start_date) >= startDate)
        : projects;

      // Filter by team member if selected
      const memberFilteredLeads = selectedMember === "all" 
        ? filteredLeads
        : filteredLeads.filter(lead => lead.assigned_to === selectedMember);

      // Lead Volume & Quality
      const totalLeads = memberFilteredLeads.length;
      const qualifiedLeads = memberFilteredLeads.filter(lead => 
        lead.status !== 'New' && lead.status !== 'Lost'
      ).length;
      const qualificationRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;

      // Conversion Metrics (simplified - would need more detailed tracking in real app)
      const appointmentLeads = memberFilteredLeads.filter(lead => 
        activities.some(activity => 
          activity.title?.includes('appointment') && 
          activity.description?.includes(lead.id)
        )
      ).length;
      const proposalLeads = memberFilteredLeads.filter(lead => 
        activities.some(activity => 
          activity.title?.includes('proposal') && 
          activity.description?.includes(lead.id)
        )
      ).length;
      const wonLeads = memberFilteredLeads.filter(lead => lead.status === 'Won').length;
      
      const inquiryToAppointment = totalLeads > 0 ? (appointmentLeads / totalLeads) * 100 : 0;
      const appointmentToProposal = appointmentLeads > 0 ? (proposalLeads / appointmentLeads) * 100 : 0;
      const proposalToContract = proposalLeads > 0 ? (wonLeads / proposalLeads) * 100 : 0;
      const overallConversion = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

      // Sales Performance
      const contractsSigned = wonLeads;
      const signedProjects = filteredProjects.filter(p => p.status !== 'Planning');
      const totalSignedRevenue = signedProjects.reduce((sum, project) => sum + (project.budget || 0), 0);
      const averageContractSize = signedProjects.length > 0 ? totalSignedRevenue / signedProjects.length : 0;

      // Sales Cycle (average days from lead creation to won status)
      const wonLeadsWithDates = memberFilteredLeads.filter(lead => 
        lead.status === 'Won' && lead.created_at
      );
      const totalCycleDays = wonLeadsWithDates.reduce((sum, lead) => {
        const createdDate = new Date(lead.created_at);
        const wonDate = new Date(); // In real app, track actual won date
        return sum + Math.ceil((wonDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      }, 0);
      const averageSalesCycleDays = wonLeadsWithDates.length > 0 ? totalCycleDays / wonLeadsWithDates.length : 0;

      // Pipeline & Forecast
      const activeLeads = memberFilteredLeads.filter(lead => 
        lead.status !== 'Won' && lead.status !== 'Lost' && !lead.archived_at
      );
      const pipelineValue = activeLeads.reduce((sum, lead) => 
        sum + ((lead.estimated_value || 0) * ((lead.pipeline_probability || 50) / 100)), 0
      );

      // Projected Sales forecasts based on expected closing dates
      const projectedSales30Days = activeLeads
        .filter(lead => {
          const followUp = lead.next_follow_up ? new Date(lead.next_follow_up) : null;
          return followUp && followUp <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        })
        .reduce((sum, lead) => sum + ((lead.estimated_value || 0) * ((lead.pipeline_probability || 50) / 100)), 0);

      const projectedSales60Days = activeLeads
        .filter(lead => {
          const followUp = lead.next_follow_up ? new Date(lead.next_follow_up) : null;
          return followUp && followUp <= new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
        })
        .reduce((sum, lead) => sum + ((lead.estimated_value || 0) * ((lead.pipeline_probability || 50) / 100)), 0);

      const projectedSales90Days = activeLeads
        .filter(lead => {
          const followUp = lead.next_follow_up ? new Date(lead.next_follow_up) : null;
          return followUp && followUp <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        })
        .reduce((sum, lead) => sum + ((lead.estimated_value || 0) * ((lead.pipeline_probability || 50) / 100)), 0);


      setSalesMetrics({
        totalLeads,
        qualifiedLeads,
        qualificationRate,
        inquiryToAppointment,
        appointmentToProposal,
        proposalToContract,
        overallConversion,
        contractsSigned,
        averageContractSize,
        totalSignedRevenue,
        averageSalesCycleDays,
        pipelineValue,
        projectedSales30Days,
        projectedSales60Days,
        projectedSales90Days
      });
    } catch (error) {
      console.error('Error loading sales metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load sales metrics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Total Leads</div>
            </div>
            <div>
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Contracts Signed</div>
            </div>
            <div>
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Pipeline Value</div>
            </div>
            <div>
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Avg Contract Size</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading sales performance...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <CardTitle className="text-xl font-semibold text-black">Sales Performance</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
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
                <SelectItem value="all">All Team Members</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Top Row - Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg border">
              <div className="text-xl sm:text-2xl font-bold text-black">{salesMetrics.totalLeads}</div>
              <div className="text-xs sm:text-sm text-black">Total Leads</div>
              <div className="text-xs text-black mt-1">{salesMetrics.qualificationRate.toFixed(1)}% Qualified</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg border">
              <div className="text-xl sm:text-2xl font-bold text-black">{Math.round(salesMetrics.averageSalesCycleDays)}</div>
              <div className="text-xs sm:text-sm text-black">Avg Days</div>
              <div className="text-xs text-black mt-1">Lead to Contract</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg border">
              <div className="text-xl sm:text-2xl font-bold text-black">{salesMetrics.contractsSigned}</div>
              <div className="text-xs sm:text-sm text-black">Contracts Signed</div>
              <div className="text-xs text-black mt-1">${salesMetrics.averageContractSize.toLocaleString()} Avg</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg border">
              <div className="text-xl sm:text-2xl font-bold text-black">${Math.round(salesMetrics.pipelineValue).toLocaleString()}</div>
              <div className="text-xs sm:text-sm text-black">Current Pipeline</div>
              <div className="text-xs text-black mt-1">Projected Sales</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg border col-span-2 md:col-span-1">
              <div className="text-xl sm:text-2xl font-bold text-black">{salesMetrics.overallConversion.toFixed(1)}%</div>
              <div className="text-xs sm:text-sm text-black">Overall Conversion</div>
              <div className="text-xs text-black mt-1">Lead to Contract</div>
            </div>
          </div>

          {/* Projected Sales */}
          <div className="p-3 sm:p-4 bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-lg border">
            <h4 className="font-medium text-black mb-3 flex items-center gap-2 text-sm sm:text-base">
              <TrendingUp className="h-4 w-4 text-black" />
              Projected Sales (Lead Pipeline)
            </h4>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="text-center">
                <div className="text-sm sm:text-lg font-bold text-black">${Math.round(salesMetrics.projectedSales30Days).toLocaleString()}</div>
                <div className="text-xs text-black">30 Days</div>
              </div>
              <div className="text-center">
                <div className="text-sm sm:text-lg font-bold text-black">${Math.round(salesMetrics.projectedSales60Days).toLocaleString()}</div>
                <div className="text-xs text-black">60 Days</div>
              </div>
              <div className="text-center">
                <div className="text-sm sm:text-lg font-bold text-black">${Math.round(salesMetrics.projectedSales90Days).toLocaleString()}</div>
                <div className="text-xs text-black">90 Days</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};