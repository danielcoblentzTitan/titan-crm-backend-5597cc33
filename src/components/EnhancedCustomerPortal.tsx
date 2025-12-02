import { useState, useEffect, useLayoutEffect, useMemo, useCallback } from "react";
import { differenceInDays } from "date-fns";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  FileText, 
  Home,
  TrendingUp,
  AlertCircle,
  MessageCircle,
  Shield,
  CheckCircle,
  Building,
  MapPin,
  User,
  Phone,
  Mail,
  Sparkles,
  ChevronRight,
  Camera,
  Palette
} from "lucide-react";
import { DocumentList } from "./DocumentList";
import DesignSelections from "./DesignSelections";
import WarrantyInformation from "./WarrantyInformation";
import { TitanScheduleBuilder } from "./schedule/TitanScheduleBuilder";
import CustomerInvoices from "./CustomerInvoices";
import { CustomerDocumentGallery } from "./CustomerDocumentGallery";
import ChangeOrderRequests from "./ChangeOrderRequests";
import CustomerFAQ from "./CustomerFAQ";
import { ProjectMessageBoard } from "./ProjectMessageBoard";
import { CustomerRecentActivity } from "./CustomerRecentActivity";
import { Project, supabaseService } from "@/services/supabaseService";
import CustomerPortalTabs from "./CustomerPortalTabs";

import { supabase } from "@/integrations/supabase/client";
import { CameraCaptureDialog } from "@/components/CameraCaptureDialog";
import { useSearchParams } from "react-router-dom";
import { PunchlistManager } from "@/components/punchlist/PunchlistManager";
import fulfordBuilding from "@/assets/projects/fulford-building.png";
import { CoverPhotoManager } from "./CoverPhotoManager";
import { SteppedProgressBar } from "@/components/ui/SteppedProgressBar";

interface EnhancedCustomerPortalProps {
  projectId: string;
  customerName?: string;
  project?: Project;
}

export const EnhancedCustomerPortal = ({ projectId, customerName, project: initialProject }: EnhancedCustomerPortalProps) => {
  const [project, setProject] = useState<Project | null>(initialProject || null);
  const [projectCosts, setProjectCosts] = useState<any>(null);
  const [loading, setLoading] = useState(!initialProject);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  // Use centralized phase management
  const { currentPhase, currentProgress, phases, isLoading: phasesLoading } = useProjectPhases(projectId);
  
  // Debug logging
  console.log('=== CUSTOMER PORTAL DEBUG ===');
  console.log('Project ID:', projectId);
  console.log('Current Phase:', currentPhase);
  console.log('Current Progress:', currentProgress);
  console.log('Phases Loading:', phasesLoading);
  console.log('=== END CUSTOMER PORTAL DEBUG ===');

  // Force scroll to top immediately before rendering
  useLayoutEffect(() => {
    if (history.scrollRestoration) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Force layout recalculation to fix initial render issues
    const forceReflow = () => {
      document.body.offsetHeight; // Forces reflow
      window.dispatchEvent(new Event('resize'));
    };
    
    // Small delay to ensure CSS is applied
    setTimeout(forceReflow, 100);
  }, []);

  useEffect(() => {
    // Optimized scroll to top - single attempt
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    if (!initialProject) {
      loadProjectData();
    }

    // Initialize tab from URL or session
    const urlTab = searchParams.get('tab');
    const storedTab = sessionStorage.getItem(`cp-tab-${projectId}`);
    if (urlTab) setActiveTab(urlTab);
    else if (storedTab) setActiveTab(storedTab);
  }, [projectId, initialProject]);

  const handleTabChange = useCallback((val: string) => {
    setActiveTab(val);
    try { sessionStorage.setItem(`cp-tab-${projectId}`, val); } catch {}
    const params = new URLSearchParams(searchParams);
    params.set('tab', val);
    setSearchParams(params);
  }, [projectId, searchParams, setSearchParams]);

  // Realtime: keep overview dates in sync with builder updates
  useEffect(() => {
    const channel = supabase
      .channel('project-overview-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` },
        async () => {
          try {
            const { data, error } = await supabase
              .from('projects')
              .select('*')
              .eq('id', projectId)
              .maybeSingle();
            if (!error && data) {
              setProject(data as Project);
            }
          } catch (e) {
            console.error('Error refreshing project after update:', e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      const projects = await supabaseService.getProjects();
      const foundProject = projects.find(p => p.id === projectId);
      setProject(foundProject || null);

      // Load project costs
      // This would be implemented in supabaseService
      // const costs = await supabaseService.getProjectCosts(projectId);
      // setProjectCosts(costs);
    } catch (error) {
      console.error('Error loading project data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clean up old phase calculation code - now using centralized phase management
  const calculateBudgetUsed = () => {
    if (!project || !projectCosts) return 0;
    // This would calculate total costs from project_costs table
    return 0;
  };

  const getBudgetUsedPercentage = () => {
    if (!project?.budget) return 0;
    const used = calculateBudgetUsed();
    return Math.round((used / project.budget) * 100);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Planning': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800',
      'On Hold': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Component to render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Project Cover Photo - Facebook-style cover photo */}
            <CoverPhotoManager 
              projectId={projectId}
              currentCoverPhoto={(project as any)?.cover_photo_url}
              onCoverPhotoUpdate={(url) => {
                if (project) {
                  setProject({ ...project, cover_photo_url: url } as any);
                }
              }}
              isCustomerView={true}
            />
            
            {/* Project Overview Card */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/80">
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-2">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Project Details
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-medium text-xs sm:text-sm">
                      Phase: {currentPhase || 'Planning & Permits'}
                    </Badge>
                    <Badge variant="secondary" className="text-xs sm:text-sm">
                      {project?.description?.toLowerCase().includes('barndo') ? 'Barndominium' : 
                       project?.description?.toLowerCase().includes('commercial') ? 'Commercial' : 'Residential'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                 <div className="space-y-4 sm:space-y-6">
                   {/* Progress Section */}
                   <div>
                     <SteppedProgressBar 
                       currentPhase={currentPhase || 'Planning & Permits'} 
                       currentProgress={Math.round(currentProgress)}
                       variant="default"
                       showLabels={true}
                     />
                   </div>
                  
                  {/* Project Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Start Date</p>
                        <p className="font-medium text-sm truncate">
                          {project?.start_date ? new Date(project.start_date.split('T')[0] + 'T12:00:00Z').toLocaleDateString() : 'TBD'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <CheckCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Est. Completion</p>
                        <p className="font-medium text-sm truncate">
                          {project?.estimated_completion ? 
                            new Date(project.estimated_completion).toLocaleDateString() : 
                            'TBD'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="font-medium text-sm truncate">
                          {project?.estimated_completion && project.start_date ? 
                            `${Math.max(0, differenceInDays(new Date(), new Date(project.start_date)))} / ${Math.ceil((new Date(project.estimated_completion).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24))} days` :
                            'TBD'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <p className="font-medium text-sm truncate">
                          {project?.budget ? `$${project.budget.toLocaleString()}` : 'TBD'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Project Description */}
                  {project?.description && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2 text-sm text-muted-foreground">Project Description</h4>
                      <p className="text-sm">{project.description}</p>
                    </div>
                  )}

                  {/* Project Team Contact Section */}
                  <div className="pt-4 border-t bg-muted/30 rounded-lg p-4">
                    {/* Help Message */}
                    <div className="mb-4 pb-4 border-b border-muted-foreground/20">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <span className="font-medium">Need Help?</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Contact your project manager or building consultant for assistance
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Project Manager */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span className="font-medium">Project Manager</span>
                        </div>
                        <p className="text-sm font-semibold">Kyle</p>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <a 
                            href="tel:3026321048" 
                            className="text-sm text-primary hover:underline"
                          >
                            (302) 632-1048
                          </a>
                        </div>
                      </div>
                      
                      {/* Building Consultant */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building className="h-4 w-4" />
                          <span className="font-medium">Building Consultant</span>
                        </div>
                        <p className="text-sm font-semibold">
                          {(() => {
                            // Determine building consultant based on project data
                            // For now, using project name/description patterns
                            const projectInfo = (project?.name + ' ' + project?.description + ' ' + project?.customer_name).toLowerCase();
                            if (projectInfo.includes('daniel') || projectInfo.includes('fulford')) {
                              return 'Daniel';
                            } else if (projectInfo.includes('chris')) {
                              return 'Chris';
                            }
                            return 'Daniel'; // Default fallback
                          })()}
                        </p>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <a 
                            href={(() => {
                              const projectInfo = (project?.name + ' ' + project?.description + ' ' + project?.customer_name).toLowerCase();
                              if (projectInfo.includes('daniel') || projectInfo.includes('fulford')) {
                                return 'tel:3029855618';
                              } else if (projectInfo.includes('chris')) {
                                return 'tel:3029855903';
                              }
                              return 'tel:3029855618'; // Default fallback
                            })()} 
                            className="text-sm text-primary hover:underline"
                          >
                            {(() => {
                              const projectInfo = (project?.name + ' ' + project?.description + ' ' + project?.customer_name).toLowerCase();
                              if (projectInfo.includes('daniel') || projectInfo.includes('fulford')) {
                                return '(302) 985-5618';
                              } else if (projectInfo.includes('chris')) {
                                return '(302) 985-5903';
                              }
                              return '(302) 985-5618'; // Default fallback
                            })()}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Updates */}
            <CustomerRecentActivity projectId={projectId} />
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Project Schedule</h3>
            </div>
            <TitanScheduleBuilder projectId={projectId} customerPortal={true} />
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="text-base sm:text-lg font-semibold">Project Documents & Photos</h3>
            </div>
            <CustomerDocumentGallery projectId={projectId} />
          </div>
        );

      case 'financial':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Invoices & Payments</h3>
            </div>
            <CustomerInvoices projectId={projectId} />
          </div>
        );

      case 'messages':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Messages</h3>
            </div>
            <ProjectMessageBoard
              projectId={projectId}
              projectName={project?.name || "Your Project"}
              isCustomerPortal={true}
              currentUserName={customerName || project?.customer_name || "Customer"}
              currentUserType="customer"
            />
          </div>
        );

      case 'design':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Home className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Design Selections</h3>
            </div>
            <DesignSelections projectId={projectId} />
          </div>
        );

      case 'punchlist':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Project Punchlist</h3>
            </div>
            <PunchlistManager projectId={projectId} isCustomerView={true} />
          </div>
        );


      case 'warranty':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Warranty Information</h3>
            </div>
            <WarrantyInformation />
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading project details...</div>;
  }

  if (!project) {
    return <div className="flex items-center justify-center p-8">Project not found</div>;
  }

  return (
    <>
      <div className="min-h-screen pt-0 pb-32 sm:pb-0">
        {/* Enhanced Header with Gradient */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary opacity-90"></div>
          
          <div className="relative z-10 py-1 sm:py-2 md:py-2 lg:py-3">
            <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
              <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-2 sm:gap-3">
                <div className="w-full sm:w-auto text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                    {project.name.split(' - ')[0]}
                  </h1>
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white/90 leading-tight">
                    {project.name.split(' - ')[1] || 'Project'}
                  </h2>
                </div>
                
                {/* Removed header image - now using cover photo in overview */}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 pb-24 sm:pb-28 md:pb-32 lg:pb-36 xl:pb-40 max-w-7xl 2xl:pb-8">
          {/* Desktop Tabs - Only for very large screens */}
          <div className="hidden 2xl:block">
            <Card className="shadow-lg border-0">
              <div className="p-6 bg-background">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                  <div className="border-b border-border pb-4">
                    <CustomerPortalTabs activeTab={activeTab} onTabChange={handleTabChange} currentPhase={currentPhase} projectId={projectId} />
                  </div>
                  <div className="space-y-6">
                    <TabsContent value="overview" className="mt-0">
                      {renderContent()}
                    </TabsContent>
                    <TabsContent value="schedule" className="mt-0">
                      {renderContent()}
                    </TabsContent>
                    <TabsContent value="documents" className="mt-0">
                      {renderContent()}
                    </TabsContent>
                    <TabsContent value="financial" className="mt-0">
                      {renderContent()}
                    </TabsContent>
                    <TabsContent value="messages" className="mt-0">
                      {renderContent()}
                    </TabsContent>
                    <TabsContent value="design" className="mt-0">
                      {renderContent()}
                    </TabsContent>
                    {(project?.progress === 100 || project?.status === 'Completed') && (
                      <TabsContent value="warranty" className="mt-0">
                        {renderContent()}
                      </TabsContent>
                    )}
                  </div>
                </Tabs>
              </div>
            </Card>
          </div>

          {/* Mobile & Tablet Content */}
          <div className="block 2xl:hidden">
            <Card className="shadow-lg border-0">
              <div className="p-3 sm:p-6 bg-background">
                {renderContent()}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t 2xl:hidden z-50 pb-safe-or-4 ipad-pro-fix">
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-1 py-4 px-3 sm:gap-2 sm:py-4 sm:px-4 bottom-nav-safe">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => handleTabChange('overview')}
            className={"flex flex-col items-center gap-1 h-auto py-2 px-1 sm:py-3 sm:px-2 md:py-3 md:px-2 lg:py-4 lg:px-3 xl:py-4 xl:px-3 min-h-[60px] sm:min-h-[70px] md:min-h-[75px] lg:min-h-[80px] xl:min-h-[85px] touch-manipulation"}
          >
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5 lg:h-6 lg:w-6 xl:h-6 xl:w-6" />
            <span className="text-xs sm:text-sm md:text-sm lg:text-base xl:text-base font-medium leading-tight text-center">Overview</span>
          </Button>
          <Button
            variant={activeTab === 'schedule' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => handleTabChange('schedule')}
            className={"flex flex-col items-center gap-1 h-auto py-2 px-1 sm:py-3 sm:px-2 md:py-3 md:px-2 lg:py-4 lg:px-3 xl:py-4 xl:px-3 min-h-[60px] sm:min-h-[70px] md:min-h-[75px] lg:min-h-[80px] xl:min-h-[85px] touch-manipulation"}
          >
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5 lg:h-6 lg:w-6 xl:h-6 xl:w-6" />
            <span className="text-xs sm:text-sm md:text-sm lg:text-base xl:text-base font-medium leading-tight text-center">Schedule</span>
          </Button>
          <Button
            variant={activeTab === 'documents' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => handleTabChange('documents')}
            className={"flex flex-col items-center gap-1 h-auto py-2 px-1 sm:py-3 sm:px-2 md:py-3 md:px-2 lg:py-4 lg:px-3 xl:py-4 xl:px-3 min-h-[60px] sm:min-h-[70px] md:min-h-[75px] lg:min-h-[80px] xl:min-h-[85px] touch-manipulation"}
          >
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5 lg:h-6 lg:w-6 xl:h-6 xl:w-6" />
            <span className="text-xs sm:text-sm md:text-sm lg:text-base xl:text-base font-medium leading-tight text-center">Docs</span>
          </Button>
          <Button
            variant={activeTab === 'financial' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => handleTabChange('financial')}
            className={"flex flex-col items-center gap-1 h-auto py-2 px-1 sm:py-3 sm:px-2 md:py-3 md:px-2 lg:py-4 lg:px-3 xl:py-4 xl:px-3 min-h-[60px] sm:min-h-[70px] md:min-h-[75px] lg:min-h-[80px] xl:min-h-[85px] touch-manipulation"}
          >
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5 lg:h-6 lg:w-6 xl:h-6 xl:w-6" />
            <span className="text-xs sm:text-sm md:text-sm lg:text-base xl:text-base font-medium leading-tight text-center">Finance</span>
          </Button>
          <Button
            variant={activeTab === 'messages' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => handleTabChange('messages')}
            className={"flex flex-col items-center gap-1 h-auto py-2 px-1 sm:py-3 sm:px-2 md:py-3 md:px-2 lg:py-4 lg:px-3 xl:py-4 xl:px-3 min-h-[60px] sm:min-h-[70px] md:min-h-[75px] lg:min-h-[80px] xl:min-h-[85px] touch-manipulation"}
          >
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5 lg:h-6 lg:w-6 xl:h-6 xl:w-6" />
            <span className="text-xs sm:text-sm md:text-sm lg:text-base xl:text-base font-medium leading-tight text-center">Messages</span>
          </Button>
          <Button
            variant={activeTab === 'design' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => handleTabChange('design')}
            className={"hidden sm:flex flex-col items-center gap-1 h-auto py-2 px-1 sm:py-3 sm:px-2 md:py-3 md:px-2 lg:py-4 lg:px-3 xl:py-4 xl:px-3 min-h-[60px] sm:min-h-[70px] md:min-h-[75px] lg:min-h-[80px] xl:min-h-[85px] touch-manipulation"}
          >
            <Palette className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5 lg:h-6 lg:w-6 xl:h-6 xl:w-6" />
            <span className="text-xs sm:text-sm md:text-sm lg:text-base xl:text-base font-medium leading-tight text-center">Design</span>
          </Button>
        </div>
      </div>
    </>
  );
};
