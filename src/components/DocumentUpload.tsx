
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Upload, Calendar, User, Trash2 } from "lucide-react";
import { dataService } from "@/services/dataService";
import { supabaseService, Project } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";

const DocumentUpload = () => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [uploadData, setUploadData] = useState({
    name: "",
    type: "PDF",
    file: null as File | null
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projectsData = await supabaseService.getProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadData(prev => ({
        ...prev,
        file,
        name: file.name
      }));
    }
  };

  const handleUpload = () => {
    if (!uploadData.file || !selectedProjectId || !uploadData.name) {
      toast({
        title: "Error",
        description: "Please select a file, project, and enter a name.",
        variant: "destructive",
      });
      return;
    }

    // In a real app, you would upload the file to a server
    // For now, we'll simulate the upload
    const documentData = {
      projectId: selectedProjectId,
      name: uploadData.name,
      type: uploadData.type,
      url: URL.createObjectURL(uploadData.file), // Simulated URL
      size: uploadData.file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "Current User" // In real app, get from auth
    };

    dataService.addDocument(documentData);
    
    // Add activity
    const project = projects.find(p => p.id === selectedProjectId);
    if (project) {
      dataService.addActivity({
        type: 'document',
        title: 'Document uploaded',
        project: project.name,
        projectId: selectedProjectId,
        time: 'Just now',
        status: 'completed',
        description: `${uploadData.name} uploaded successfully`
      });
    }

    toast({
      title: "Success",
      description: "Document uploaded successfully.",
    });

    setIsUploadDialogOpen(false);
    setUploadData({ name: "", type: "PDF", file: null });
    setSelectedProjectId("");
  };

  return (
    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <FileText className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Project</label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="">Choose a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} - {project.customer_name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Document Name</label>
            <Input
              value={uploadData.name}
              onChange={(e) => setUploadData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter document name"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Document Type</label>
            <select
              className="w-full p-2 border rounded-md"
              value={uploadData.type}
              onChange={(e) => setUploadData(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="PDF">PDF</option>
              <option value="Image">Image</option>
              <option value="Document">Document</option>
              <option value="Blueprint">Blueprint</option>
              <option value="Contract">Contract</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Select File</label>
            <Input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUpload;
