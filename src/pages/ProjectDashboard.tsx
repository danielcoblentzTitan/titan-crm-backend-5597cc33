import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, FileText, Lock, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RoomCard } from "@/components/dashboard/RoomCard";
import { AddRoomDialog } from "@/components/dashboard/AddRoomDialog";
import { AllowanceSummaryWidget } from "@/components/dashboard/AllowanceSummaryWidget";
import { ProgressWidget } from "@/components/dashboard/ProgressWidget";
import { EditProjectDialog } from "@/components/dashboard/EditProjectDialog";
import { EditAllowancesDialog } from "@/components/dashboard/EditAllowancesDialog";
import { generateFullProjectPDF } from "@/utils/projectSummaryPdfGenerator";

interface Project {
  id: string;
  project_name: string;
  project_number: string;
  client_name: string;
  client_email: string;
  phone: string;
  status: string;
  site_address: string;
  city: string;
  state: string;
  zip: string;
  total_square_footage: number;
  house_sq_ft: number;
  garage_sq_ft: number;
  bedrooms: number;
  bathrooms: number;
  stories: number;
  wall_height: number;
  build_type: string;
}

interface Room {
  id: string;
  room_name: string;
  room_type: string;
  length_ft: number;
  width_ft: number;
  ceiling_height_ft: number;
  notes_general: string;
}

export default function ProjectDashboard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showEditAllowances, setShowEditAllowances] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      // Load project
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Load rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true });

      if (roomsError) throw roomsError;
      setRooms(roomsData || []);
    } catch (error) {
      console.error("Error loading project:", error);
      toast({
        title: "Error",
        description: "Failed to load project data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">Project not found</p>
            <Button onClick={() => navigate("/projects")}>Back to Projects</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/projects")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{project.project_name}</h1>
                <p className="text-sm text-muted-foreground">
                  {project.project_number && `${project.project_number} • `}
                  {project.client_name}
                  {project.phone && ` • ${project.phone}`}
                </p>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowEditProject(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Project Info
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowEditAllowances(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Allowances
            </Button>
            <Button variant="outline" size="sm" onClick={async () => {
              try {
                await generateFullProjectPDF(projectId!);
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to generate PDF",
                  variant: "destructive",
                });
              }
            }}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Full PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/project/${projectId}/trades`)}>
              <FileText className="h-4 w-4 mr-2" />
              Trade Views
            </Button>
            <Button variant="outline" size="sm">
              <Lock className="h-4 w-4 mr-2" />
              Lock Selections
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Project Info */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-lg capitalize">{project.status || "Planning"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Build Type</p>
                <p className="text-lg capitalize">{project.build_type || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="text-lg">
                  {project.city && project.state
                    ? `${project.city}, ${project.state}`
                    : project.site_address || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-lg text-sm">{project.client_email || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">House Size</p>
                <p className="text-lg">
                  {project.house_sq_ft
                    ? `${project.house_sq_ft.toLocaleString()} sq ft`
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Garage Size</p>
                <p className="text-lg">
                  {project.garage_sq_ft
                    ? `${project.garage_sq_ft.toLocaleString()} sq ft`
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bedrooms</p>
                <p className="text-lg">{project.bedrooms || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bathrooms</p>
                <p className="text-lg">{project.bathrooms || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stories</p>
                <p className="text-lg">{project.stories || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Wall Height</p>
                <p className="text-lg">
                  {project.wall_height ? `${project.wall_height} ft` : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Widgets */}
        <div className="grid gap-6 md:grid-cols-2">
          <AllowanceSummaryWidget projectId={projectId!} />
          <ProgressWidget projectId={projectId!} />
        </div>

        {/* Rooms Section */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Rooms & Selections</h2>
          <Button onClick={() => setShowAddRoom(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </Button>
        </div>

        {rooms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No rooms added yet</p>
              <Button onClick={() => setShowAddRoom(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Room
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                projectId={projectId!}
                onUpdate={loadProjectData}
              />
            ))}
          </div>
        )}

        <AddRoomDialog
          open={showAddRoom}
          onOpenChange={setShowAddRoom}
          projectId={projectId!}
          onSuccess={loadProjectData}
        />

        {project && (
          <>
            <EditProjectDialog
              open={showEditProject}
              onOpenChange={setShowEditProject}
              project={project}
              onSuccess={loadProjectData}
            />
            <EditAllowancesDialog
              open={showEditAllowances}
              onOpenChange={setShowEditAllowances}
              project={project}
              onSuccess={loadProjectData}
            />
          </>
        )}
      </main>
    </div>
  );
}
