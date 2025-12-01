
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, DollarSign, Users, FileText, MessageCircle, Building2, CheckSquare, Edit3 } from "lucide-react";
import { Project, supabaseService } from "@/services/supabaseService";
import { ProjectMessageBoard } from "@/components/ProjectMessageBoard";
import { DocumentList } from "@/components/DocumentList";
import { CameraCaptureDialog } from "@/components/CameraCaptureDialog";
import ProjectMilestones from "@/components/ProjectMilestones";
import ChangeOrderManager from "@/components/ChangeOrderManager";
import { TitanScheduleBuilder } from "@/components/schedule/TitanScheduleBuilder";
import { PunchlistManager } from "@/components/punchlist/PunchlistManager";

const ProjectDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Get the tab from URL params, default to "overview"
  const defaultTab = searchParams.get('tab') || 'overview';

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const projects = await supabaseService.getProjects();
      const foundProject = projects.find(p => p.id === id);
      setProject(foundProject || null);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Project not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-2">
                <Building2 className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold">Project Details</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600">Customer: {project.customer_name}</p>
          <p className="text-gray-600">Status: {project.status}</p>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="change-orders">Change Orders</TabsTrigger>
            <TabsTrigger value="punchlist">Punchlist</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Budget</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${project.budget?.toLocaleString() || 'N/A'}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Progress</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{project.progress || 0}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Phase</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{project.phase || 'Planning'}</div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">Start Date</p>
                      <p className="text-gray-600">{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Estimated Completion</p>
                      <p className="text-gray-600">{project.estimated_completion ? new Date(project.estimated_completion).toLocaleDateString() : 'Not set'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-gray-600">{project.city}, {project.state}</p>
                    </div>
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-gray-600">{project.address || 'Not provided'}</p>
                    </div>
                  </div>
                  {project.description && (
                    <div className="mt-4">
                      <p className="font-medium">Description</p>
                      <p className="text-gray-600">{project.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="space-y-6">
              <div className="flex gap-2">
                <CameraCaptureDialog
                  entityId={project.id}
                  entityType="project"
                  onUploadComplete={() => {
                    // Refresh document list
                    window.location.reload();
                  }}
                  customerInfo={{
                    firstName: project.customer_name.split(' ')[0] || '',
                    lastName: project.customer_name.split(' ').slice(1).join(' ') || project.customer_name
                  }}
                />
                <Button 
                  onClick={() => navigate(`/documents/${project.id}`)}
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View All Documents
                </Button>
              </div>
              
              <DocumentList
                entityId={project.id}
                entityType="project"
                customerView={false}
              />
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <ProjectMessageBoard
              projectId={project.id}
              projectName={project.name}
              isCustomerPortal={false}
              currentUserName="Builder" // This should come from auth context
              currentUserType="builder"
            />
          </TabsContent>

          <TabsContent value="milestones">
            <ProjectMilestones projectId={project.id} projectName={project.name} />
          </TabsContent>

          <TabsContent value="change-orders">
            <ChangeOrderManager projectId={project.id} projectName={project.name} />
          </TabsContent>

          <TabsContent value="punchlist">
            <PunchlistManager projectId={project.id} isCustomerView={false} />
          </TabsContent>

          <TabsContent value="timeline">
            <TitanScheduleBuilder projectId={project.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectDetails;
