import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, DollarSign, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Project } from "@/services/supabaseService";
import { useProjectMetrics } from "@/hooks/useProjectMetrics";
import { useMultipleProjectPhases } from "@/hooks/useProjectPhases";
import { parseISO, isWithinInterval } from "date-fns";

interface PaymentData {
  projectId: string;
  totalPaid: number;
  totalBudget: number;
  remainingBalance: number;
  paymentProgress: number;
}

interface ProjectPhaseStats {
  permitting: { count: number; value: number; };
  preconstruction: { count: number; value: number; };
  construction: { count: number; value: number; };
  punchlist: { count: number; value: number; };
  completed: { count: number; value: number; };
}

interface MonthlyRevenue {
  month1: { name: string; revenue: number; };
  month2: { name: string; revenue: number; };
  month3: { name: string; revenue: number; };
}

export const ProjectOverview = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const { paymentsById: paymentData, constructionById, phasesById } = useProjectMetrics(projects);
  const { phasesMap } = useMultipleProjectPhases(projects.map(p => p.id));
  const [phaseStats, setPhaseStats] = useState<ProjectPhaseStats>({
    permitting: { count: 0, value: 0 },
    preconstruction: { count: 0, value: 0 },
    construction: { count: 0, value: 0 },
    punchlist: { count: 0, value: 0 },
    completed: { count: 0, value: 0 }
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue>({
    month1: { name: '', revenue: 0 },
    month2: { name: '', revenue: 0 },
    month3: { name: '', revenue: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [projectSchedules, setProjectSchedules] = useState<Record<string, any>>({});
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [phaseModalOpen, setPhaseModalOpen] = useState(false);
  const navigate = useNavigate();

  // Phase-based progress calculation (same as customer portal)
  const calculateProgressFromPhase = useCallback((phase: string): number => {
    const phaseProgressMap: Record<string, number> = {
      "Planning & Permits": 0,
      "Pre Construction": 5,
      "Preconstruction": 5,
      "Framing Crew": 10,
      "Plumbing Underground": 15,
      "Concrete Crew": 20,
      "Interior Framing": 25,
      "Plumbing Rough In": 30,
      "HVAC Rough In": 35,
      "Electric Rough In": 40,
      "Insulation": 45,
      "Drywall": 55,
      "Paint": 65,
      "Flooring": 75,
      "Doors and Trim": 80,
      "Garage Doors and Gutters": 85,
      "Garage Finish": 87,
      "Plumbing Final": 90,
      "HVAC Final": 92,
      "Electric Final": 94,
      "Kitchen Install": 96,
      "Interior Finishes": 98,
      "Final": 100,
      "Completed": 100
    };
    
    return phaseProgressMap[phase] !== undefined ? phaseProgressMap[phase] : 0;
  }, []);

  // Get current phase from schedule
  const getCurrentPhaseFromSchedule = useCallback((projectId: string): string | null => {
    const scheduleData = projectSchedules[projectId];
    if (!scheduleData || !Array.isArray(scheduleData)) return null;

    const today = new Date();
    const trades = scheduleData
      .filter((t: any) => t.startDate && t.endDate)
      .map((t: any) => ({
        name: t.name as string,
        start: parseISO(t.startDate as string),
        end: parseISO(t.endDate as string),
      }))
      .sort((a: any, b: any) => a.start.getTime() - b.start.getTime());

    if (trades.length === 0) return null;
    if (today < trades[0].start) return 'Preconstruction';

    const active = trades.find(tr => isWithinInterval(today, { start: tr.start, end: tr.end }));
    if (active) return active.name;

    return trades[trades.length - 1].name || 'Completed';
  }, [projectSchedules]);

  // Get project progress percentage
  const getProjectProgress = useCallback((project: Project): number => {
    const schedulePhase = getCurrentPhaseFromSchedule(project.id);
    const effectivePhase = schedulePhase || phasesById[project.id] || project.phase;
    const phaseProgress = calculateProgressFromPhase(effectivePhase || '');
    
    return phaseProgress || project.progress || 0;
  }, [getCurrentPhaseFromSchedule, phasesById, calculateProgressFromPhase]);

  const loadProjectSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('project_schedules')
        .select('project_id, schedule_data')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const schedules: Record<string, any> = {};
        data.forEach(schedule => {
          if (!schedules[schedule.project_id]) {
            schedules[schedule.project_id] = schedule.schedule_data;
          }
        });
        setProjectSchedules(schedules);
      }
    } catch (error) {
      console.error('Error loading project schedules:', error);
    }
  };

  useEffect(() => {
    fetchActiveProjects();
    loadProjectSchedules();
  }, []);

  const fetchActiveProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .neq('status', 'Cancelled')
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching projects:', error);
        return;
      }

      setProjects((data || []) as Project[]);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projects.length > 0) {
      const timeoutId = setTimeout(() => {
        calculatePhaseStats();
      }, 100); // Debounce phase stats calculation
      
      return () => clearTimeout(timeoutId);
    }
  }, [projects.length, Object.keys(phasesMap).length]);

  useEffect(() => {
    loadProjectedRevenue();
  }, []);

  // Realtime updates for project changes (phase, status, etc.) - Debounced
  useEffect(() => {
    let updateTimeout: NodeJS.Timeout;
    
    const channel = supabase
      .channel('projects_realtime_overview')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
        // Debounce rapid updates
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
          setProjects((prev) => {
            const record = (payload.new || payload.old) as Partial<Project> & { id: string };
            if (!record || !record.id) return prev;

            if (payload.eventType === 'DELETE') {
              return prev.filter(p => p.id !== record.id);
            }

            const exists = prev.some(p => p.id === record.id);
            const updated = exists
              ? prev.map(p => (p.id === record.id ? ({ ...p, ...(payload.new as Partial<Project>) } as Project) : p))
              : [...prev, record as Project];

            return updated.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
          });
        }, 300); // 300ms debounce
      })
      .subscribe();

    return () => {
      clearTimeout(updateTimeout);
      supabase.removeChannel(channel);
    };
  }, []);

  const loadProjectedRevenue = async () => {
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .neq('status', 'Paid');

      if (error) {
        console.error('Error fetching invoices:', error);
        return;
      }

      // Calculate next 3 months
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const month1 = new Date(currentYear, currentMonth, 1);
      const month2 = new Date(currentYear, currentMonth + 1, 1);
      const month3 = new Date(currentYear, currentMonth + 2, 1);
      const month4 = new Date(currentYear, currentMonth + 3, 1);
      
      const getMonthRevenue = (startMonth: Date, endMonth: Date) => {
        return (invoices || [])
          .filter(invoice => {
            const dueDate = new Date(invoice.due_date);
            return dueDate >= startMonth && dueDate < endMonth;
          })
          .reduce((sum, invoice) => sum + (invoice.total || 0), 0);
      };

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      setMonthlyRevenue({
        month1: {
          name: `${monthNames[month1.getMonth()]} ${month1.getFullYear()}`,
          revenue: getMonthRevenue(month1, month2)
        },
        month2: {
          name: `${monthNames[month2.getMonth()]} ${month2.getFullYear()}`,
          revenue: getMonthRevenue(month2, month3)
        },
        month3: {
          name: `${monthNames[month3.getMonth()]} ${month3.getFullYear()}`,
          revenue: getMonthRevenue(month3, month4)
        }
      });
    } catch (error) {
      console.error('Error loading projected revenue:', error);
    }
  };

  const calculatePhaseStats = () => {
    const stats: ProjectPhaseStats = {
      permitting: { count: 0, value: 0 },
      preconstruction: { count: 0, value: 0 },
      construction: { count: 0, value: 0 },
      punchlist: { count: 0, value: 0 },
      completed: { count: 0, value: 0 }
    };

    projects.forEach((project) => {
      const budget = project.budget || 0;
      const status = (project.status || '').toLowerCase();

      if (status === 'completed') {
        stats.completed.count++;
        stats.completed.value += budget;
        return;
      }

      const phaseStr = (phasesMap[project.id]?.currentPhase || project.phase || '').toLowerCase();

      if (phaseStr.includes('permit') || phaseStr.includes('planning')) {
        stats.permitting.count++;
        stats.permitting.value += budget;
      } else if (phaseStr.includes('pre construction') || phaseStr.includes('preconstruction') || phaseStr.includes('design')) {
        stats.preconstruction.count++;
        stats.preconstruction.value += budget;
      } else if (phaseStr.includes('punch')) {
        // Only punchlist items, not "final" phases
        stats.punchlist.count++;
        stats.punchlist.value += budget;
      } else {
        // Any active schedule phase like framing, rough-ins, insulation, drywall, etc. count as construction
        stats.construction.count++;
        stats.construction.value += budget;
      }
    });

    setPhaseStats(stats);
  };


  const handleProjectClick = (projectId: string) => {
    navigate('/dashboard?tab=projects&project=' + projectId);
  };

  const handleViewPortal = (e: React.MouseEvent, project: any) => {
    e.stopPropagation(); // Prevent triggering the parent click
    const customerName = project.customer_name || 'Customer';
    const portalUrl = `/customer-portal?project=${project.id}&customer=${encodeURIComponent(customerName)}`;
    const newWindow = window.open(portalUrl, '_blank');
    if (newWindow) {
      newWindow.addEventListener('load', () => {
        newWindow.scrollTo(0, 0);
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString.split('T')[0] + 'T12:00:00Z').toLocaleDateString();
  };

  const getProjectTypeDisplay = (description: string) => {
    if (description?.toLowerCase().includes('barndominium')) return 'Barndominium';
    if (description?.toLowerCase().includes('warehouse')) return 'Warehouse';
    if (description?.toLowerCase().includes('garage')) return 'Garage';
    if (description?.toLowerCase().includes('shop')) return 'Shop';
    return 'Building Project';
  };

  const handlePhaseClick = (phase: string) => {
    setSelectedPhase(phase);
    setPhaseModalOpen(true);
  };

  const getProjectsInPhase = (phase: string) => {
    return projects.filter((project) => {
      const status = (project.status || '').toLowerCase();
      
      if (phase === 'completed') {
        return status === 'completed';
      }

      const phaseStr = (phasesMap[project.id]?.currentPhase || project.phase || '').toLowerCase();

      switch (phase) {
        case 'permitting':
          return phaseStr.includes('permit') || phaseStr.includes('planning');
        case 'preconstruction':
          return phaseStr.includes('pre construction') || phaseStr.includes('preconstruction') || phaseStr.includes('design');
        case 'punchlist':
          return phaseStr.includes('punch');
        case 'construction':
          return !phaseStr.includes('permit') && !phaseStr.includes('planning') && 
                 !phaseStr.includes('pre construction') && !phaseStr.includes('preconstruction') && 
                 !phaseStr.includes('design') && 
                 !phaseStr.includes('punch') && status !== 'completed';
        default:
          return false;
      }
    });
  };

  const getPhaseDisplayName = (phase: string) => {
    switch (phase) {
      case 'permitting': return 'Permitting';
      case 'preconstruction': return 'Preconstruction';
      case 'construction': return 'Construction';
      case 'punchlist': return 'Punchlist';
      case 'completed': return 'Completed';
      default: return phase;
    }
  };

  const totalActiveProjects = projects.filter(p => p.status !== 'Completed').length;
  const totalRevenue = projects.reduce((sum, project) => sum + (project.budget || 0), 0);
  const totalPaidRevenue = Object.values(paymentData).reduce((sum, payment) => sum + payment.totalPaid, 0);
  const totalRemainingRevenue = Object.values(paymentData).reduce((sum, payment) => sum + payment.remainingBalance, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold mb-4">Project Overview</CardTitle>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Active Projects</div>
            </div>
            <div>
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </div>
            <div>
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Remaining Revenue</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading projects...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Project Overview</CardTitle>
          <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
            <div>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{totalActiveProjects}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Active Projects</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Total Value</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-orange-600">${totalRemainingRevenue.toLocaleString()}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Remaining Revenue</div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Project Phase Breakdown */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">Project Phases</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3">
              <div 
                className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg border cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => handlePhaseClick('permitting')}
              >
                <div className="text-base sm:text-lg font-bold text-blue-600">{phaseStats.permitting.count}</div>
                <div className="text-xs text-blue-600 mb-1">Permitting</div>
                <div className="text-xs text-gray-600">${phaseStats.permitting.value.toLocaleString()}</div>
              </div>
              
              <div 
                className="text-center p-2 sm:p-3 bg-orange-50 rounded-lg border cursor-pointer hover:bg-orange-100 transition-colors"
                onClick={() => handlePhaseClick('preconstruction')}
              >
                <div className="text-base sm:text-lg font-bold text-orange-600">{phaseStats.preconstruction.count}</div>
                <div className="text-xs text-orange-600 mb-1">Preconstruction</div>
                <div className="text-xs text-gray-600">${phaseStats.preconstruction.value.toLocaleString()}</div>
              </div>
              
              <div 
                className="text-center p-2 sm:p-3 bg-yellow-50 rounded-lg border cursor-pointer hover:bg-yellow-100 transition-colors"
                onClick={() => handlePhaseClick('construction')}
              >
                <div className="text-base sm:text-lg font-bold text-yellow-600">{phaseStats.construction.count}</div>
                <div className="text-xs text-yellow-600 mb-1">Construction</div>
                <div className="text-xs text-gray-600">${phaseStats.construction.value.toLocaleString()}</div>
              </div>
              
              <div 
                className="text-center p-2 sm:p-3 bg-purple-50 rounded-lg border cursor-pointer hover:bg-purple-100 transition-colors"
                onClick={() => handlePhaseClick('punchlist')}
              >
                <div className="text-base sm:text-lg font-bold text-purple-600">{phaseStats.punchlist.count}</div>
                <div className="text-xs text-purple-600 mb-1">Punchlist</div>
                <div className="text-xs text-gray-600">${phaseStats.punchlist.value.toLocaleString()}</div>
              </div>
              
              <div 
                className="text-center p-2 sm:p-3 bg-green-50 rounded-lg border col-span-2 md:col-span-1 cursor-pointer hover:bg-green-100 transition-colors"
                onClick={() => handlePhaseClick('completed')}
              >
                <div className="text-base sm:text-lg font-bold text-green-600">{phaseStats.completed.count}</div>
                <div className="text-xs text-green-600 mb-1">Completed</div>
                <div className="text-xs text-gray-600">${phaseStats.completed.value.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Projected Revenue */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
              Projected Revenue (Next 3 Months)
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="text-center p-2 sm:p-4 bg-green-50 rounded-lg border">
                <div className="text-sm sm:text-xl font-bold text-green-600">${monthlyRevenue.month1.revenue.toLocaleString()}</div>
                <div className="text-xs sm:text-sm text-green-600">{monthlyRevenue.month1.name}</div>
              </div>
              <div className="text-center p-2 sm:p-4 bg-green-50 rounded-lg border">
                <div className="text-sm sm:text-xl font-bold text-green-600">${monthlyRevenue.month2.revenue.toLocaleString()}</div>
                <div className="text-xs sm:text-sm text-green-600">{monthlyRevenue.month2.name}</div>
              </div>
              <div className="text-center p-2 sm:p-4 bg-green-50 rounded-lg border">
                <div className="text-sm sm:text-xl font-bold text-green-600">${monthlyRevenue.month3.revenue.toLocaleString()}</div>
                <div className="text-xs sm:text-sm text-green-600">{monthlyRevenue.month3.name}</div>
              </div>
            </div>
          </div>

          {/* Active Projects List */}
          {projects.filter(p => p.status !== 'Completed').length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Active Projects</h3>
              {projects.filter(p => p.status !== 'Completed').slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-primary hover:text-primary/80 transition-colors truncate">
                              {project.customer_name}
                            </h3>
                            {(phasesMap[project.id]?.currentPhase || project.phase) && (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {phasesMap[project.id]?.currentPhase || project.phase}
                                </Badge>
                                <button
                                  onClick={(e) => handleViewPortal(e, project)}
                                  className="p-1 rounded-full hover:bg-muted transition-colors"
                                  title="View Customer Portal"
                                >
                                  <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                </button>
                              </div>
                            )}
                          </div>
                          <Badge variant="secondary" className="self-start">
                            {getProjectTypeDisplay(project.description || '')}
                          </Badge>
                        </div>
                      </div>
                    
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Start: {formatDate(project.start_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>End: {formatDate(project.estimated_completion)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 min-w-0 sm:min-w-[200px]">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium pr-5">Construction</span>
                          <span className="text-xs font-medium"> {Math.round(phasesMap[project.id]?.currentProgress ?? constructionById[project.id]?.progressPercent ?? (typeof project.progress === 'number' ? project.progress : calculateProgressFromPhase(project.phase || '')))}%</span>
                        </div>
                        <Progress value={phasesMap[project.id]?.currentProgress ?? constructionById[project.id]?.progressPercent ?? (typeof project.progress === 'number' ? project.progress : calculateProgressFromPhase(project.phase || ''))} className="h-2" />
                        {paymentData[project.id] && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium">Payments</span>
                              <span className="text-xs font-medium"> {Math.round(paymentData[project.id].paymentProgress)}%</span>
                            </div>
                            <Progress value={paymentData[project.id].paymentProgress} className="h-2" />
                          </div>
                        )}
                      </div>
                      
                      {project.budget && paymentData[project.id] && (
                        <div 
                          className="flex flex-col gap-1 p-2 rounded border bg-green-50/50 hover:bg-green-100/50 transition-colors cursor-pointer min-w-[140px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/dashboard?tab=projects&project=' + project.id + '&section=payments');
                          }}
                        >
                          <div className="flex items-center gap-1 text-xs text-green-700 font-medium">
                            <DollarSign className="h-3 w-3" />
                            <span>Budget</span>
                          </div>
                          <div className="text-sm font-semibold text-green-800">
                            ${paymentData[project.id].totalBudget.toLocaleString()}
                          </div>
                          <div className="text-xs text-green-600">
                            Paid: ${paymentData[project.id].totalPaid.toLocaleString()}
                          </div>
                          <div className="text-xs text-green-600">
                            Remaining: ${paymentData[project.id].remainingBalance.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {projects.filter(p => p.status !== 'Completed').length > 5 && (
                <div className="text-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/dashboard?tab=projects')}
                  >
                    View All Projects ({projects.filter(p => p.status !== 'Completed').length})
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No active projects found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phase Details Modal */}
      <Dialog open={phaseModalOpen} onOpenChange={setPhaseModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {selectedPhase ? getPhaseDisplayName(selectedPhase) : ''} Projects
            </DialogTitle>
          </DialogHeader>
          
          {selectedPhase && (
            <div className="space-y-4">
              {getProjectsInPhase(selectedPhase).length > 0 ? (
                <div className="space-y-3">
                  {getProjectsInPhase(selectedPhase).map((project) => (
                    <div
                      key={project.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setPhaseModalOpen(false);
                        handleProjectClick(project.id);
                      }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-primary">{project.customer_name}</h4>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {phasesMap[project.id]?.currentPhase || project.phase || 'No Phase Set'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {getProjectTypeDisplay(project.description || '')}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Start: {formatDate(project.start_date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>End: {formatDate(project.estimated_completion)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-lg font-semibold text-green-600">
                            ${(project.budget || 0).toLocaleString()}
                          </div>
                          {paymentData[project.id] && (
                            <div className="text-sm text-orange-600 font-medium">
                              Remaining: ${paymentData[project.id].remainingBalance.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No projects in {getPhaseDisplayName(selectedPhase).toLowerCase()} phase
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};