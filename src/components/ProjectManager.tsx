
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Plus, FileText, HardHat, CheckCircle, Map, Wrench } from "lucide-react";
import { supabaseService } from "@/services/supabaseService";
import { workflowService } from "@/services/workflowService";
import type { Project, Customer } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";
import { useCompletedProjects } from "@/hooks/useCompletedProjects";
import BudgetPlanner from "./BudgetPlanner";
import ProjectForm from "./ProjectForm";
import { ProjectList } from "./projects/ProjectList";
import { ProjectsMapView } from "./projects/ProjectsMapView";
import { updateDraw1DueDate } from "@/services/drawsService";
import { useProjectMetrics } from "@/hooks/useProjectMetrics";
import { useMultipleProjectPhases } from "@/hooks/useProjectPhases";
import { PhaseTemplateImporter } from "./mission-control/PhaseTemplateImporter";

const BARNDO_PHASES = [
  { name: "Planning & Permits", percentage: 0 },
  { name: "Pre Construction", percentage: 5 },
  { name: "Framing Crew", percentage: 10 },
  { name: "Plumbing Underground", percentage: 15 },
  { name: "Concrete Crew", percentage: 20 },
  { name: "Interior Framing", percentage: 25 },
  { name: "Plumbing Rough In", percentage: 30 },
  { name: "HVAC Rough In", percentage: 35 },
  { name: "Electric Rough In", percentage: 40 },
  { name: "Insulation", percentage: 45 },
  { name: "Drywall", percentage: 55 },
  { name: "Paint", percentage: 65 },
  { name: "Flooring", percentage: 75 },
  { name: "Doors and Trim", percentage: 80 },
  { name: "Garage Doors and Gutters", percentage: 85 },
  { name: "Garage Finish", percentage: 87 },
  { name: "Plumbing Final", percentage: 90 },
  { name: "HVAC Final", percentage: 92 },
  { name: "Electric Final", percentage: 94 },
  { name: "Kitchen Install", percentage: 96 },
  { name: "Interior Finishes", percentage: 98 },
  { name: "Final", percentage: 100 }
];

const ProjectManager = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPhaseToolsOpen, setIsPhaseToolsOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState("permit");
  const [completeSubTab, setCompleteSubTab] = useState("list");
  const { toast } = useToast();
  const { projects: completedProjects } = useCompletedProjects();
  const { phasesById } = useProjectMetrics(projects);
  
  // Use centralized phase management for all projects
  const projectIds = projects.map(p => p.id);
  const { phasesMap, isLoading: phasesLoading } = useMultipleProjectPhases(projectIds);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsData, customersData] = await Promise.all([
        supabaseService.getProjects(),
        supabaseService.getCustomers()
      ]);
      setProjects(projectsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data.",
        variant: "destructive",
      });
    }
  };

  const refreshProjects = () => {
    loadData();
  };

  const handlePhaseUpdate = async (projectId: string, newPhase: string) => {
    const phaseData = BARNDO_PHASES.find(p => p.name === newPhase);
    const newProgress = phaseData ? phaseData.percentage : 0;
    
    try {
      const updated = await supabaseService.updateProject(projectId, { phase: newPhase, progress: newProgress });
      if (updated) {
        setProjects(await supabaseService.getProjects());
        toast({
          title: "Phase Updated",
          description: `Project phase updated to ${newPhase} (${newProgress}%)`,
        });
        
        // Add activity
        await supabaseService.addActivity({
          type: 'milestone',
          title: `Phase updated to ${newPhase}`,
          project_name: updated.name,
          project_id: updated.id,
          time: 'Just now',
          status: 'completed',
          description: `Project moved to ${newPhase} phase (${newProgress}% complete)`
        });

        // When permit is approved (Pre Construction), set Draw 1 due to this timestamp
        if (newPhase === 'Pre Construction') {
          // Fire-and-forget; logs will show outcome
          updateDraw1DueDate(projectId).catch((e) => console.error("updateDraw1DueDate error", e));
        }
      }
    } catch (error) {
      console.error('Error updating phase:', error);
      toast({
        title: "Error",
        description: "Failed to update project phase.",
        variant: "destructive",
      });
    }
  };

  const handleProjectSubmit = async (data: Partial<Project>) => {
    try {
      if (editingProject) {
        const updated = await supabaseService.updateProject(editingProject.id, data);
        if (updated) {
          // Check if status changed to Completed
          if (data.status === 'Completed' && editingProject.status !== 'Completed') {
            await workflowService.handleProjectCompletion(updated);
          }
          
          await loadData();
          toast({
            title: "Success",
            description: "Project updated successfully.",
          });
          
          // Add activity
          await supabaseService.addActivity({
            type: 'milestone',
            title: 'Project updated',
            project_name: data.name || editingProject.name,
            project_id: editingProject.id,
            time: 'Just now',
            status: 'completed',
            description: 'Project details were updated'
          });
        }
        setEditingProject(null);
      } else {
        const projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'> = {
          name: data.name || '',
          customer_id: data.customer_id || '',
          customer_name: data.customer_name || '',
          status: data.status || 'Planning',
          progress: data.progress || 0,
          phase: data.phase,
          start_date: data.start_date || '',
          estimated_completion: data.estimated_completion || '',
          budget: data.budget || 0,
          description: data.description,
          address: data.address,
          city: data.city,
          state: data.state,
          zip: data.zip,
          end_date: data.end_date
        };
        
        const newProject = await supabaseService.addProject(projectData);
        await loadData();
        toast({
          title: "Success",
          description: "Project added successfully.",
        });
        
        // Add activity
        await supabaseService.addActivity({
          type: 'milestone',
          title: 'New project created',
          project_name: data.name || 'New Project',
          project_id: newProject.id,
          time: 'Just now',
          status: 'new',
          description: 'Project has been added to the system'
        });
        
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Error",
        description: "Failed to save project.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
  };

  const handleDelete = async (projectId: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        const success = await supabaseService.deleteProject(projectId);
        if (success) {
          await loadData();
          toast({
            title: "Success",
            description: "Project deleted successfully.",
          });
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        toast({
          title: "Error",
          description: "Failed to delete project.",
          variant: "destructive",
        });
      }
    }
  };

  // Categorize projects based on construction timeline
  const getProjectsByCategory = (category: string) => {
    const preConstructionPhases = ['Planning & Permits', 'Pre Construction', 'Preconstruction', 'Site Preparation'];
    const constructionPhases = [
      'Framing Crew', 'Plumbing Underground', 'Concrete Crew', 'Interior Framing',
      'Plumbing Rough In', 'HVAC Rough In', 'Electric Rough In', 'Insulation',
      'Drywall', 'Paint', 'Flooring', 'Doors and Trim', 'Garage Doors and Gutters',
      'Garage Finish', 'Plumbing Final', 'HVAC Final', 'Electric Final',
      'Kitchen Install', 'Interior Finishes'
    ];
    const completePhases = ['Final', 'Final Inspection', 'Completion', 'Completed'];

    return projects.filter((p) => {
      // Use schedule-based phase from centralized hook
      const phase = phasesMap[p.id]?.currentPhase || p.phase || '';
      
      console.log(`Project ${p.name}: phase="${phase}", category check for "${category}"`);
      
      if (category === 'permit') return preConstructionPhases.includes(phase);
      if (category === 'construction') return constructionPhases.includes(phase);
      if (category === 'complete') return completePhases.includes(phase) || p.status === 'Completed';
      return true;
    });
  };

  const permitProjects = getProjectsByCategory("permit");
  const constructionProjects = getProjectsByCategory("construction");
  const completeProjects = getProjectsByCategory("complete");

  return (
    <>
      {/* Mobile Header */}
      <div className="block sm:hidden">
        <div className="bg-primary text-primary-foreground p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Projects</h1>
                <p className="text-sm opacity-90">
                  {projects.length} total projects
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Dialog open={isPhaseToolsOpen} onOpenChange={setIsPhaseToolsOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-8 w-8 p-0">
                    <Wrench className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Mission Control — Phase Tools</DialogTitle>
                  </DialogHeader>
                  <PhaseTemplateImporter
                    projects={projects.map(p => ({ id: p.id, name: p.name, start_date: p.start_date }))}
                    onCompleted={refreshProjects}
                  />
                </DialogContent>
              </Dialog>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-8 w-8 p-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Project</DialogTitle>
                  </DialogHeader>
                  <ProjectForm
                    customers={customers}
                    onSubmit={handleProjectSubmit}
                    onCancel={() => setIsAddDialogOpen(false)}
                    isEdit={false}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden sm:block space-y-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold flex items-center">
            <Building2 className="h-6 w-6 mr-2" />
            Project Management
          </h2>
          <div className="flex items-center gap-2">
            <Dialog open={isPhaseToolsOpen} onOpenChange={setIsPhaseToolsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Wrench className="h-4 w-4 mr-2" />
                  Phase Tools
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Mission Control — Phase Tools</DialogTitle>
                </DialogHeader>
                <PhaseTemplateImporter
                  projects={projects.map(p => ({ id: p.id, name: p.name, start_date: p.start_date }))}
                  onCompleted={refreshProjects}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#003562] hover:bg-[#003562]/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Project</DialogTitle>
                </DialogHeader>
                <ProjectForm
                  customers={customers}
                  onSubmit={handleProjectSubmit}
                  onCancel={() => setIsAddDialogOpen(false)}
                  isEdit={false}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Mobile Tabs - Simplified Design */}
        <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 sm:hidden h-auto p-1">
          <TabsTrigger value="permit" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-[#003562] data-[state=active]:text-white">
            <FileText className="h-4 w-4" />
            <span className="text-xs">Permit</span>
            <Badge variant="secondary" className="text-xs h-5 px-1.5 bg-gray-100 text-gray-600 data-[state=active]:bg-white/20 data-[state=active]:text-white">
              {permitProjects.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="construction" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-[#003562] data-[state=active]:text-white">
            <HardHat className="h-4 w-4" />
            <span className="text-xs">Building</span>
            <Badge variant="secondary" className="text-xs h-5 px-1.5 bg-gray-100 text-gray-600 data-[state=active]:bg-white/20 data-[state=active]:text-white">
              {constructionProjects.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="complete" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-[#003562] data-[state=active]:text-white">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs">Done</span>
            <Badge variant="secondary" className="text-xs h-5 px-1.5 bg-gray-100 text-gray-600 data-[state=active]:bg-white/20 data-[state=active]:text-white">
              {completeProjects.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Desktop Tabs */}
        <TabsList className="hidden sm:grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="permit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Permit Phase
            <Badge variant="secondary" className="ml-1">
              {permitProjects.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="construction" className="flex items-center gap-2">
            <HardHat className="h-4 w-4" />
            Construction
            <Badge variant="secondary" className="ml-1">
              {constructionProjects.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="complete" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Complete
            <Badge variant="secondary" className="ml-1">
              {completeProjects.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="permit" className="space-y-4">
          {/* Mobile Phase Description */}
          <div className="block sm:hidden bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 text-sm">Permit & Planning Phase</h3>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  Projects in planning, permit review, and site preparation stages.
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Phase Description */}
          <div className="hidden sm:block bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h3 className="font-semibold text-blue-800 mb-2">Permit & Planning Phase</h3>
            <p className="text-sm text-blue-600">
              Projects in planning, permit review, and site preparation stages.
            </p>
          </div>

          {permitProjects.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <FileText className="h-8 w-8 sm:h-10 sm:w-10 opacity-50" />
              </div>
              <p className="text-sm sm:text-base">No projects in permit phase</p>
            </div>
          ) : (
            <ProjectList
              projects={permitProjects}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPhaseUpdate={handlePhaseUpdate}
              onUpdate={refreshProjects}
            />
          )}
        </TabsContent>

        <TabsContent value="construction" className="space-y-4">
          {/* Mobile Phase Description */}
          <div className="block sm:hidden bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <HardHat className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-900 text-sm">Active Construction</h3>
                <p className="text-xs text-orange-700 mt-1 leading-relaxed">
                  Projects currently under construction from foundation to interior finish.
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Phase Description */}
          <div className="hidden sm:block bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
            <h3 className="font-semibold text-orange-800 mb-2">Active Construction</h3>
            <p className="text-sm text-orange-600">
              Projects currently under construction from foundation to interior finish.
            </p>
          </div>

          {constructionProjects.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <HardHat className="h-8 w-8 sm:h-10 sm:w-10 opacity-50" />
              </div>
              <p className="text-sm sm:text-base">No projects in construction</p>
            </div>
          ) : (
            <ProjectList
              projects={constructionProjects}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPhaseUpdate={handlePhaseUpdate}
              onUpdate={refreshProjects}
            />
          )}
        </TabsContent>

        <TabsContent value="complete" className="space-y-4">
          {/* Mobile Phase Description */}
          <div className="block sm:hidden bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 text-sm">Completed Projects</h3>
                <p className="text-xs text-green-700 mt-1 leading-relaxed">
                  Finished projects that have passed final inspection and been delivered to clients.
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Phase Description */}
          <div className="hidden sm:block bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <h3 className="font-semibold text-green-800 mb-2">Completed Projects</h3>
            <p className="text-sm text-green-600">
              Finished projects that have passed final inspection and been delivered to clients.
            </p>
          </div>
          
          <Tabs value={completeSubTab} onValueChange={setCompleteSubTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Project List</span>
                <span className="sm:hidden">List</span>
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                <span className="hidden sm:inline">Map View</span>
                <span className="sm:hidden">Map</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              {completeProjects.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-muted-foreground">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 opacity-50" />
                  </div>
                  <p className="text-sm sm:text-base">No completed projects</p>
                </div>
              ) : (
                <ProjectList
                  projects={completeProjects}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onPhaseUpdate={handlePhaseUpdate}
                  onUpdate={refreshProjects}
                />
              )}
            </TabsContent>

            <TabsContent value="map">
              {completedProjects.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-muted-foreground">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Map className="h-8 w-8 sm:h-10 sm:w-10 opacity-50" />
                  </div>
                  <p className="text-sm sm:text-base">No completed projects to display on map</p>
                </div>
              ) : (
                <div className="h-[400px] sm:h-[600px] w-full">
                  <ProjectsMapView projects={completedProjects} />
                  <p className="text-sm mt-2 text-muted-foreground text-center">
                    Showing {completedProjects.length} completed projects
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          {editingProject && (
            <ProjectForm
              project={editingProject}
              customers={customers}
              onSubmit={handleProjectSubmit}
              onCancel={() => setEditingProject(null)}
              isEdit={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectManager;
