import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RoomCard } from "@/components/dashboard/RoomCard";
import { AddRoomDialog } from "@/components/dashboard/AddRoomDialog";

interface Project {
  id: string;
  project_name: string;
  client_name: string;
  status: string;
  site_address: string;
  city: string;
  state: string;
  total_square_footage: number;
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
          <div className="flex items-center justify-between">
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
                <p className="text-sm text-muted-foreground">{project.client_name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Project Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-lg">{project.status || "Planning"}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Square Footage</p>
                <p className="text-lg">
                  {project.total_square_footage
                    ? `${project.total_square_footage.toLocaleString()} sq ft`
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
          <div className="space-y-4">
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
      </main>
    </div>
  );
}
