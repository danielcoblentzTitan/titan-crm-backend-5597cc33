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
    // Customer Info
    project_name: "",
    client_name: "",
    client_email: "",
    phone: "",
    // Address
    site_address: "",
    city: "",
    state: "",
    zip: "",
    // Build Specifications
    lot_size: "",
    house_sq_ft: "",
    garage_sq_ft: "",
    total_square_footage: "",
    bedrooms: "",
    bathrooms: "",
    stories: "",
    wall_height: "",
    build_type: "post-frame",
    // Allowances
    total_allowance_flooring: "",
    total_allowance_cabinets: "",
    total_allowance_countertops: "",
    total_allowance_plumbing: "",
    total_allowance_electrical: "",
    total_allowance_lighting: "",
    total_allowance_paint: "",
    total_allowance_windows_doors: "",
    total_allowance_misc: "",
  });

  const createDefaultRooms = async (projectId: string) => {
    const defaultRooms = [
      { name: "Kitchen", type: "Kitchen", order: 1 },
      { name: "Living Room", type: "Living", order: 2 },
      { name: "Dining Room", type: "Dining", order: 3 },
      { name: "Primary Bedroom", type: "Bedroom", order: 4 },
      { name: "Primary Bathroom", type: "Bathroom", order: 5 },
      { name: "Bedroom 2", type: "Bedroom", order: 6 },
      { name: "Bedroom 3", type: "Bedroom", order: 7 },
      { name: "Bathroom 2", type: "Bathroom", order: 8 },
      { name: "Laundry Room", type: "Utility", order: 9 },
      { name: "Pantry", type: "Storage", order: 10 },
      { name: "Garage", type: "Garage", order: 11 },
      { name: "Mudroom", type: "Utility", order: 12 },
    ];

    const roomsToInsert = defaultRooms.map((room) => ({
      project_id: projectId,
      room_name: room.name,
      room_type: room.type,
      sort_order: room.order,
    }));

    const { error } = await supabase.from("rooms").insert(roomsToInsert);
    if (error) throw error;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const projectData = {
        project_name: formData.project_name,
        client_name: formData.client_name,
        client_email: formData.client_email || null,
        phone: formData.phone || null,
        site_address: formData.site_address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip: formData.zip || null,
        lot_size: formData.lot_size ? parseFloat(formData.lot_size) : null,
        house_sq_ft: formData.house_sq_ft ? parseFloat(formData.house_sq_ft) : null,
        garage_sq_ft: formData.garage_sq_ft ? parseFloat(formData.garage_sq_ft) : null,
        total_square_footage: formData.total_square_footage ? parseFloat(formData.total_square_footage) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
        stories: formData.stories ? parseInt(formData.stories) : null,
        wall_height: formData.wall_height ? parseFloat(formData.wall_height) : null,
        build_type: formData.build_type || null,
        total_allowance_flooring: formData.total_allowance_flooring ? parseFloat(formData.total_allowance_flooring) : 0,
        total_allowance_cabinets: formData.total_allowance_cabinets ? parseFloat(formData.total_allowance_cabinets) : 0,
        total_allowance_countertops: formData.total_allowance_countertops ? parseFloat(formData.total_allowance_countertops) : 0,
        total_allowance_plumbing: formData.total_allowance_plumbing ? parseFloat(formData.total_allowance_plumbing) : 0,
        total_allowance_electrical: formData.total_allowance_electrical ? parseFloat(formData.total_allowance_electrical) : 0,
        total_allowance_lighting: formData.total_allowance_lighting ? parseFloat(formData.total_allowance_lighting) : 0,
        total_allowance_paint: formData.total_allowance_paint ? parseFloat(formData.total_allowance_paint) : 0,
        total_allowance_windows_doors: formData.total_allowance_windows_doors ? parseFloat(formData.total_allowance_windows_doors) : 0,
        total_allowance_misc: formData.total_allowance_misc ? parseFloat(formData.total_allowance_misc) : 0,
      };

      const { data, error } = await supabase
        .from("projects")
        .insert([projectData])
        .select()
        .single();

      if (error) throw error;

      // Create default rooms
      await createDefaultRooms(data.id);

      toast({
        title: "Success",
        description: "Customer project created successfully!",
      });

      setOpen(false);
      setFormData({
        project_name: "",
        client_name: "",
        client_email: "",
        phone: "",
        site_address: "",
        city: "",
        state: "",
        zip: "",
        lot_size: "",
        house_sq_ft: "",
        garage_sq_ft: "",
        total_square_footage: "",
        bedrooms: "",
        bathrooms: "",
        stories: "",
        wall_height: "",
        build_type: "post-frame",
        total_allowance_flooring: "",
        total_allowance_cabinets: "",
        total_allowance_countertops: "",
        total_allowance_plumbing: "",
        total_allowance_electrical: "",
        total_allowance_lighting: "",
        total_allowance_paint: "",
        total_allowance_windows_doors: "",
        total_allowance_misc: "",
      });

      if (onProjectCreated) {
        onProjectCreated();
      }

      navigate(`/projects/${data.id}`);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Customer Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="project_name">Project Name *</Label>
                <Input
                  id="project_name"
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  required
                  placeholder="e.g., Smith Barndominium"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client_name">Customer Name *</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  required
                  placeholder="John Smith"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="client_email">Customer Email</Label>
                <Input
                  id="client_email"
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
            </div>
          </div>

          {/* Build Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Build Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="site_address">Site Address</Label>
                <Input
                  id="site_address"
                  value={formData.site_address}
                  onChange={(e) => setFormData({ ...formData, site_address: e.target.value })}
                  placeholder="123 County Road"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Austin"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="TX"
                  maxLength={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  placeholder="78701"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lot_size">Lot Size (acres)</Label>
                <Input
                  id="lot_size"
                  type="number"
                  step="0.1"
                  value={formData.lot_size}
                  onChange={(e) => setFormData({ ...formData, lot_size: e.target.value })}
                  placeholder="5.0"
                />
              </div>
            </div>
          </div>

          {/* Build Specifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Build Specifications</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="house_sq_ft">House Sq Ft</Label>
                <Input
                  id="house_sq_ft"
                  type="number"
                  value={formData.house_sq_ft}
                  onChange={(e) => setFormData({ ...formData, house_sq_ft: e.target.value })}
                  placeholder="2000"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="garage_sq_ft">Garage Sq Ft</Label>
                <Input
                  id="garage_sq_ft"
                  type="number"
                  value={formData.garage_sq_ft}
                  onChange={(e) => setFormData({ ...formData, garage_sq_ft: e.target.value })}
                  placeholder="600"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="total_square_footage">Total Sq Ft</Label>
                <Input
                  id="total_square_footage"
                  type="number"
                  value={formData.total_square_footage}
                  onChange={(e) => setFormData({ ...formData, total_square_footage: e.target.value })}
                  placeholder="2600"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  placeholder="3"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  placeholder="2.5"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stories">Stories</Label>
                <Input
                  id="stories"
                  type="number"
                  value={formData.stories}
                  onChange={(e) => setFormData({ ...formData, stories: e.target.value })}
                  placeholder="1"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="wall_height">Wall Height (ft)</Label>
                <Input
                  id="wall_height"
                  type="number"
                  step="0.5"
                  value={formData.wall_height}
                  onChange={(e) => setFormData({ ...formData, wall_height: e.target.value })}
                  placeholder="10"
                />
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="build_type">Build Type</Label>
                <select
                  id="build_type"
                  value={formData.build_type}
                  onChange={(e) => setFormData({ ...formData, build_type: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="post-frame">Post-Frame</option>
                  <option value="stick-frame">Stick-Frame</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Allowances */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Budget Allowances</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_allowance_flooring">Flooring ($)</Label>
                <Input
                  id="total_allowance_flooring"
                  type="number"
                  step="0.01"
                  value={formData.total_allowance_flooring}
                  onChange={(e) => setFormData({ ...formData, total_allowance_flooring: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="total_allowance_cabinets">Cabinets ($)</Label>
                <Input
                  id="total_allowance_cabinets"
                  type="number"
                  step="0.01"
                  value={formData.total_allowance_cabinets}
                  onChange={(e) => setFormData({ ...formData, total_allowance_cabinets: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="total_allowance_countertops">Countertops ($)</Label>
                <Input
                  id="total_allowance_countertops"
                  type="number"
                  step="0.01"
                  value={formData.total_allowance_countertops}
                  onChange={(e) => setFormData({ ...formData, total_allowance_countertops: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="total_allowance_plumbing">Plumbing ($)</Label>
                <Input
                  id="total_allowance_plumbing"
                  type="number"
                  step="0.01"
                  value={formData.total_allowance_plumbing}
                  onChange={(e) => setFormData({ ...formData, total_allowance_plumbing: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="total_allowance_electrical">Electrical ($)</Label>
                <Input
                  id="total_allowance_electrical"
                  type="number"
                  step="0.01"
                  value={formData.total_allowance_electrical}
                  onChange={(e) => setFormData({ ...formData, total_allowance_electrical: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="total_allowance_lighting">Lighting ($)</Label>
                <Input
                  id="total_allowance_lighting"
                  type="number"
                  step="0.01"
                  value={formData.total_allowance_lighting}
                  onChange={(e) => setFormData({ ...formData, total_allowance_lighting: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="total_allowance_paint">Paint ($)</Label>
                <Input
                  id="total_allowance_paint"
                  type="number"
                  step="0.01"
                  value={formData.total_allowance_paint}
                  onChange={(e) => setFormData({ ...formData, total_allowance_paint: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="total_allowance_windows_doors">Windows/Doors ($)</Label>
                <Input
                  id="total_allowance_windows_doors"
                  type="number"
                  step="0.01"
                  value={formData.total_allowance_windows_doors}
                  onChange={(e) => setFormData({ ...formData, total_allowance_windows_doors: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="total_allowance_misc">Miscellaneous ($)</Label>
                <Input
                  id="total_allowance_misc"
                  type="number"
                  step="0.01"
                  value={formData.total_allowance_misc}
                  onChange={(e) => setFormData({ ...formData, total_allowance_misc: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
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
