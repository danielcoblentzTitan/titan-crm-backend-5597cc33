import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Building2, LogOut, Settings, Plus, UserPlus, Users, Calendar, FileText, StickyNote as StickyNoteIcon, Calculator, DollarSign, Home, TrendingUp, ClipboardList, Building, Truck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectOverview } from "@/components/ProjectOverview";
import { SalesBreakdownCards } from "@/components/SalesBreakdownCards";
import { SalesPerformance } from "@/components/SalesAndLeadPerformance";
import QuickActionsSidebar from "@/components/QuickActionsSidebar";
import { LazyTabContent } from "@/components/layout/LazyTabContent";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCompletedProjects } from "@/hooks/useCompletedProjects";
import { supabaseService, Project as SupabaseProject } from "@/services/supabaseService";
import { UnifiedNotifications } from "@/components/UnifiedNotifications";
import { ArrowRightLeft } from "lucide-react";
import { TestInviteButton } from "@/components/TestInviteButton";
const BuilderDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [projects, setProjects] = useState<SupabaseProject[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, profile, signOut } = useAuth();
  
  const quickActions = [{
    title: "Add New Lead",
    description: "Create a new lead",
    icon: UserPlus,
    color: "bg-accent",
    action: () => setActiveTab("leads")
  }];
  // Initialize tab from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Update URL when tab changes - debounced to prevent rapid history changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(location.search);
      const currentTabParam = params.get('tab');
      
      if (currentTabParam !== activeTab) {
        params.set('tab', activeTab);
        navigate({ pathname: '/dashboard', search: params.toString() }, { replace: true });
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [activeTab, navigate, location.search]);

  useEffect(() => {
    // Skip auth checks for development
    loadProjects();
  }, [navigate]);
  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectsData = await supabaseService.getProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const filteredProjects = projects.filter(project => project.name.toLowerCase().includes(searchTerm.toLowerCase()) || project.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
  const handleQuickAction = (action: string) => {
    switch (action) {
      case "New Project":
        setActiveTab("projects");
        break;
      case "Add Customer":
        setActiveTab("customers");
        break;
      case "Add Lead":
        setActiveTab("leads");
        break;
      default:
        break;
    }
  };
  const handleEditProject = (project: SupabaseProject) => {
    setActiveTab("projects");
    toast({
      title: "Edit Project",
      description: `Opening project manager to edit ${project.name}`
    });
  };
  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await supabaseService.deleteProject(projectId);
        await loadProjects();
        toast({
          title: "Success",
          description: "Project deleted successfully."
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete project.",
          variant: "destructive"
        });
      }
    }
  };
  const handleSignOut = async () => {
    try {
      console.log('Starting sign out process...');
      await signOut();
      console.log('Sign out successful, navigating to home...');

      // Force navigation after a brief delay to ensure state is cleared
      setTimeout(() => {
        navigate('/', {
          replace: true
        });
        window.location.reload(); // Force page reload to clear any cached state
      }, 100);
    } catch (error) {
      console.error('Sign out error:', error);
      // Force navigation even if sign out fails
      navigate('/', {
        replace: true
      });
      window.location.reload();
    }
  };
  const handleViewSchedule = () => {
    if (projects.length > 0) {
      navigate(`/schedule/${projects[0].id}`);
    } else {
      toast({
        title: "No Projects",
        description: "Create a project first to view schedules.",
        variant: "destructive"
      });
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <img src="/lovable-uploads/f96a4cb4-93ac-4358-83c6-a6ccdd7526dd.png" alt="Titan Buildings" className="h-12 w-auto mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="header-mobile">
        <div className="container-mobile py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <img src="/lovable-uploads/f96a4cb4-93ac-4358-83c6-a6ccdd7526dd.png" alt="Titan Buildings" className="h-6 sm:h-8 w-auto" />
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">Builder Dashboard</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-muted-foreground hidden md:inline truncate max-w-32">
                {profile?.full_name || user?.email}
              </span>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <UnifiedNotifications compact={true} />
                <Button variant="outline" size="sm" onClick={() => navigate('/mission-control')} className="touch-target">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Mission Control</span>
                </Button>
                <Button variant="ghost" size="sm" className="touch-target">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="touch-target">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container-mobile py-4 sm:py-8 pb-20 sm:pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Desktop Navigation */}
          <div className="nav-mobile mb-4 sm:mb-6 hidden sm:block">
            <TabsList className="grid grid-cols-4 md:grid-cols-11 w-full overflow-x-auto">
              <TabsTrigger value="dashboard" className="text-xs sm:text-sm px-1 sm:px-2 md:px-4 whitespace-nowrap">Dashboard</TabsTrigger>
              <TabsTrigger value="leads" className="text-xs sm:text-sm px-1 sm:px-2 md:px-4 whitespace-nowrap">Leads</TabsTrigger>
              <TabsTrigger value="customers" className="text-xs sm:text-sm px-1 sm:px-2 md:px-4 whitespace-nowrap">Customers</TabsTrigger>
              <TabsTrigger value="projects" className="text-xs sm:text-sm px-1 sm:px-2 md:px-4 whitespace-nowrap">Projects</TabsTrigger>
              <TabsTrigger value="team" className="text-xs sm:text-sm px-1 sm:px-2 md:px-4 whitespace-nowrap">Team</TabsTrigger>
              <TabsTrigger value="vendors" className="text-xs sm:text-sm px-1 sm:px-2 md:px-4 whitespace-nowrap">Vendors</TabsTrigger>
              <TabsTrigger value="permits" className="text-xs sm:text-sm px-1 sm:px-2 md:px-4 whitespace-nowrap">Permits</TabsTrigger>
              <TabsTrigger value="reports" className="text-xs sm:text-sm px-1 sm:px-2 md:px-4 whitespace-nowrap">Reports</TabsTrigger>
              <TabsTrigger value="pricing" className="text-xs sm:text-sm px-1 sm:px-2 md:px-4 whitespace-nowrap">Pricing</TabsTrigger>
              <TabsTrigger value="faq" className="text-xs sm:text-sm px-1 sm:px-2 md:px-4 whitespace-nowrap">FAQ</TabsTrigger>
              <TabsTrigger value="bulletin" className="text-xs sm:text-sm px-1 sm:px-2 md:px-4 whitespace-nowrap">Board</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="dashboard" className="space-mobile">

            {/* Main Content with Sidebar Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {/* Left Sidebar - Quick Actions, Notifications, Recent Activity */}
              <div className="xl:col-span-1 order-2 xl:order-1 space-y-4 sm:space-y-6">
                <UnifiedNotifications />
                <QuickActionsSidebar onQuickAction={handleQuickAction} quickActions={quickActions} />
                <SalesBreakdownCards />
              </div>

              {/* Main Content Area - Sales Performance and Project Overview */}
              <div className="xl:col-span-3 space-y-4 sm:space-y-6 order-1 xl:order-2">
                <TestInviteButton />
                <SalesPerformance />
                <ProjectOverview />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="leads">
            <LazyTabContent component="leads" />
          </TabsContent>

          <TabsContent value="customers">
            <LazyTabContent component="customers" />
          </TabsContent>
          
          <TabsContent value="projects">
            <LazyTabContent component="projects" />
          </TabsContent>
          
          <TabsContent value="team">
            <LazyTabContent component="team" />
          </TabsContent>
          
          <TabsContent value="vendors">
            <LazyTabContent component="vendors" />
          </TabsContent>
          
          <TabsContent value="permits">
            <LazyTabContent component="permits" />
          </TabsContent>
          
          <TabsContent value="reports">
            <LazyTabContent component="reports" />
          </TabsContent>
          
          <TabsContent value="pricing">
            <LazyTabContent component="pricing" />
          </TabsContent>
          
          <TabsContent value="faq">
            <LazyTabContent component="faq" />
          </TabsContent>
          
          <TabsContent value="bulletin">
            <LazyTabContent component="bulletin" />
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t sm:hidden z-50">
        <div className="grid grid-cols-5 gap-1 p-2">
          <Button
            variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('dashboard')}
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <Home className="h-4 w-4" />
            <span className="text-xs">Dashboard</span>
          </Button>
          <Button
            variant={activeTab === 'leads' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('leads')}
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Leads</span>
          </Button>
          <Button
            variant={activeTab === 'customers' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('customers')}
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <Users className="h-4 w-4" />
            <span className="text-xs">Customers</span>
          </Button>
          <Button
            variant={activeTab === 'projects' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('projects')}
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <ClipboardList className="h-4 w-4" />
            <span className="text-xs">Projects</span>
          </Button>
          <Button
            variant={activeTab === 'vendors' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('vendors')}
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <Truck className="h-4 w-4" />
            <span className="text-xs">Vendors</span>
          </Button>
        </div>
      </div>
    </div>;
};
export default BuilderDashboard;