import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { dataService } from "@/services/dataService";

const ScheduleManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    projectId: "",
    title: "",
    date: "",
    description: ""
  });
  const { toast } = useToast();

  const projects = dataService.getProjects();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId || !formData.title || !formData.date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const milestone = {
      projectId: formData.projectId,
      title: formData.title,
      date: formData.date,
      status: "upcoming" as const,
      description: formData.description
    };

    dataService.addMilestone(milestone);
    
    // Add activity - changed type from "schedule" to "milestone"
    const project = projects.find(p => p.id === formData.projectId);
    if (project) {
      dataService.addActivity({
        type: "milestone", // Fixed: changed from "schedule" to "milestone"
        title: `New milestone: ${formData.title}`,
        project: project.name,
        projectId: project.id,
        time: "just now",
        status: "new",
        description: `Scheduled for ${new Date(formData.date).toLocaleDateString()}`
      });
    }

    toast({
      title: "Success",
      description: "Schedule milestone added successfully.",
    });

    // Reset form
    setFormData({ projectId: "", title: "", date: "", description: "" });
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when closing
      setFormData({ projectId: "", title: "", date: "", description: "" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Update
        </Button>
      </DialogTrigger>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Add Schedule Milestone</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Project</Label>
            <Select 
              value={formData.projectId} 
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, projectId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name} - {project.customerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Milestone Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Foundation Complete"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Target Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional details about this milestone..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleManager;
