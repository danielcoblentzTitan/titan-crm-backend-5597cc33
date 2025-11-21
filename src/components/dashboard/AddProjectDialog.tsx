import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface AddProjectDialogProps {
  onProjectCreated?: () => void;
}

export function AddProjectDialog({ onProjectCreated }: AddProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    project_name: "",
    client_name: "",
    client_email: "",
    site_address: "",
    city: "",
    state: "",
    zip: "",
    total_square_footage: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("projects")
        .insert([{
          ...formData,
          total_square_footage: formData.total_square_footage 
            ? parseFloat(formData.total_square_footage) 
            : null,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Customer project created successfully!",
      });

      setOpen(false);
      setFormData({
        project_name: "",
        client_name: "",
        client_email: "",
        site_address: "",
        city: "",
        state: "",
        zip: "",
        total_square_footage: "",
      });

      if (onProjectCreated) {
        onProjectCreated();
      }

      navigate(`/project/${data.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Customer Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Customer Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="project_name">Project Name *</Label>
              <Input
                id="project_name"
                value={formData.project_name}
                onChange={(e) =>
                  setFormData({ ...formData, project_name: e.target.value })
                }
                required
                placeholder="e.g., Smith Residence"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client_name">Customer Name *</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) =>
                  setFormData({ ...formData, client_name: e.target.value })
                }
                required
                placeholder="John Smith"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client_email">Customer Email</Label>
              <Input
                id="client_email"
                type="email"
                value={formData.client_email}
                onChange={(e) =>
                  setFormData({ ...formData, client_email: e.target.value })
                }
                placeholder="john@example.com"
              />
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="site_address">Site Address</Label>
              <Input
                id="site_address"
                value={formData.site_address}
                onChange={(e) =>
                  setFormData({ ...formData, site_address: e.target.value })
                }
                placeholder="123 Main St"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                placeholder="Austin"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                placeholder="TX"
                maxLength={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) =>
                  setFormData({ ...formData, zip: e.target.value })
                }
                placeholder="78701"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="total_square_footage">Square Footage</Label>
              <Input
                id="total_square_footage"
                type="number"
                value={formData.total_square_footage}
                onChange={(e) =>
                  setFormData({ ...formData, total_square_footage: e.target.value })
                }
                placeholder="2500"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
