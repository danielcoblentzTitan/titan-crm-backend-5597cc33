import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  project_name: string;
  project_number: string | null;
  client_name: string;
  status: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
}

export default function ProjectsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkAuth();
    loadProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [searchQuery, projects]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
    }
  };

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = projects.filter(
      (p) =>
        p.project_name.toLowerCase().includes(query) ||
        p.client_name.toLowerCase().includes(query) ||
        p.project_number?.toLowerCase().includes(query) ||
        p.city?.toLowerCase().includes(query)
    );
    setFilteredProjects(filtered);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-600";
      case "planning":
        return "bg-blue-600";
      case "completed":
        return "bg-gray-600";
      default:
        return "bg-yellow-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Titan Builder Projects</h1>
            <div className="flex gap-2">
              <Button onClick={() => navigate("/projects/new")}>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects by name, client, number, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "No projects found matching your search" : "No projects yet"}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate("/projects/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{project.project_name}</CardTitle>
                      {project.project_number && (
                        <p className="text-sm text-muted-foreground">{project.project_number}</p>
                      )}
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status || "Planning"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Client: </span>
                      <span className="font-medium">{project.client_name}</span>
                    </div>
                    {project.city && project.state && (
                      <div>
                        <span className="text-muted-foreground">Location: </span>
                        <span className="font-medium">
                          {project.city}, {project.state}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Created: </span>
                      <span className="font-medium">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
