
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { DocumentList } from "@/components/DocumentList";
import { supabaseService } from "@/services/supabaseService";
import type { Project } from "@/services/supabaseService";

const Documents = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

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
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Back</span>
              </Button>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                <span className="text-sm sm:text-xl font-bold">Documents</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg leading-tight">
              {project.name}
            </CardTitle>
            <p className="text-xs sm:text-sm text-gray-600">Customer: {project.customer_name}</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="project" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-8 sm:h-10">
                <TabsTrigger value="project" className="text-xs sm:text-sm px-1 sm:px-3">Project</TabsTrigger>
                <TabsTrigger value="customer" className="text-xs sm:text-sm px-1 sm:px-3">Customer</TabsTrigger>
                <TabsTrigger value="customer-facing" className="text-xs sm:text-sm px-1 sm:px-3">Portal</TabsTrigger>
              </TabsList>
              
              <TabsContent value="project" className="mt-3 sm:mt-6">
                <DocumentList
                  entityId={project.id}
                  entityType="project"
                  customerView={false}
                />
              </TabsContent>
              
              <TabsContent value="customer" className="mt-3 sm:mt-6">
                <DocumentList
                  entityId={project.customer_id}
                  entityType="customer"
                  customerView={false}
                />
              </TabsContent>
              
              <TabsContent value="customer-facing" className="mt-3 sm:mt-6">
                <DocumentList
                  entityId={project.id}
                  entityType="project"
                  customerView={true}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Documents;
