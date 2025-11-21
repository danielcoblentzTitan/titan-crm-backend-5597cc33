import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlooringGallery } from "@/components/visual-selections/FlooringGallery";
import { DoorSelector } from "@/components/visual-selections/DoorSelector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { masterSelectionsService } from "@/services/masterSelectionsService";
import { PropagationDialog } from "@/components/design/PropagationDialog";

export default function InteriorDesignPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedFlooringId, setSelectedFlooringId] = useState<string>("");
  const [selectedDoorId, setSelectedDoorId] = useState<string>("");
  const [wallPaintColor, setWallPaintColor] = useState("");
  const [wallPaintBrand, setWallPaintBrand] = useState("");
  const [ceilingPaintColor, setCeilingPaintColor] = useState("");
  const [ceilingPaintBrand, setCeilingPaintBrand] = useState("");
  const [trimColor, setTrimColor] = useState("");
  const [doorStyle, setDoorStyle] = useState("");
  const [doorColor, setDoorColor] = useState("");
  const [doorHardwareFinish, setDoorHardwareFinish] = useState("");
  const [outletSwitchColor, setOutletSwitchColor] = useState("");
  const [showPropagationDialog, setShowPropagationDialog] = useState(false);

  const { data: masterInterior, isLoading } = useQuery({
    queryKey: ['master_interior_selections', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('master_interior_selections')
        .select('*')
        .eq('project_id', projectId!)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSelectedFlooringId(data.default_flooring_product_id || "");
        setWallPaintColor(data.default_wall_paint_color || "");
        setWallPaintBrand(data.default_wall_paint_brand || "");
        setCeilingPaintColor(data.default_ceiling_paint_color || "");
        setCeilingPaintBrand(data.default_ceiling_paint_brand || "");
        setTrimColor(data.default_trim_color || "");
        setDoorStyle(data.default_door_style || "");
        setDoorColor(data.default_door_color || "");
        setDoorHardwareFinish(data.default_door_hardware_finish || "");
        setOutletSwitchColor(data.default_outlet_switch_color || "");
      }
      
      return data;
    },
    enabled: !!projectId
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('project_name')
        .eq('id', projectId!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId
  });

  const handleSave = async () => {
    setShowPropagationDialog(true);
  };

  const handleConfirmSave = async () => {
    try {
      await masterSelectionsService.updateMasterInterior(projectId!, {
        default_flooring_product_id: selectedFlooringId || null,
        default_wall_paint_color: wallPaintColor || null,
        default_wall_paint_brand: wallPaintBrand || null,
        default_ceiling_paint_color: ceilingPaintColor || null,
        default_ceiling_paint_brand: ceilingPaintBrand || null,
        default_trim_color: trimColor || null,
        default_door_style: doorStyle || null,
        default_door_color: doorColor || null,
        default_door_hardware_finish: doorHardwareFinish || null,
        default_outlet_switch_color: outletSwitchColor || null,
      });

      // Propagate to non-overridden rooms
      await masterSelectionsService.propagateDefaultsToRooms(projectId!, {
        onlyNonOverridden: true
      });

      toast({
        title: "Success",
        description: "Master interior selections saved and applied to rooms"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save master interior selections",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/dashboard/${projectId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Master Interior Selections</h1>
            <p className="text-muted-foreground">{project?.project_name}</p>
          </div>
        </div>
        <Button onClick={handleSave} size="lg">
          <Save className="mr-2 h-4 w-4" />
          Save Master Selections
        </Button>
      </div>

      <div className="space-y-8">
        {/* Flooring Section */}
        <Card>
          <CardHeader>
            <CardTitle>Flooring</CardTitle>
            <CardDescription>
              Select the default flooring that will apply to all bedrooms, living areas, and other interior spaces
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FlooringGallery
              selectedProductId={selectedFlooringId}
              masterDefaultId={masterInterior?.default_flooring_product_id || undefined}
              onSelectProduct={setSelectedFlooringId}
            />
          </CardContent>
        </Card>

        {/* Paint Section */}
        <Card>
          <CardHeader>
            <CardTitle>Paint Colors</CardTitle>
            <CardDescription>
              Set default paint colors for walls and ceilings throughout the home
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wall-paint-color">Wall Paint Color</Label>
                <Input
                  id="wall-paint-color"
                  value={wallPaintColor}
                  onChange={(e) => setWallPaintColor(e.target.value)}
                  placeholder="e.g., SW 7006 Extra White"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wall-paint-brand">Wall Paint Brand</Label>
                <Input
                  id="wall-paint-brand"
                  value={wallPaintBrand}
                  onChange={(e) => setWallPaintBrand(e.target.value)}
                  placeholder="e.g., Sherwin Williams"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ceiling-paint-color">Ceiling Paint Color</Label>
                <Input
                  id="ceiling-paint-color"
                  value={ceilingPaintColor}
                  onChange={(e) => setCeilingPaintColor(e.target.value)}
                  placeholder="e.g., SW 7006 Extra White"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ceiling-paint-brand">Ceiling Paint Brand</Label>
                <Input
                  id="ceiling-paint-brand"
                  value={ceilingPaintBrand}
                  onChange={(e) => setCeilingPaintBrand(e.target.value)}
                  placeholder="e.g., Sherwin Williams"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trim & Doors Section */}
        <Card>
          <CardHeader>
            <CardTitle>Interior Doors</CardTitle>
            <CardDescription>
              Select the default interior door style that will apply throughout the home
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DoorSelector
              doorType="interior"
              selectedDoorId={selectedDoorId}
              onSelect={(door) => setSelectedDoorId(door.id)}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
              <div className="space-y-2">
                <Label htmlFor="trim-color">Trim Color</Label>
                <Input
                  id="trim-color"
                  value={trimColor}
                  onChange={(e) => setTrimColor(e.target.value)}
                  placeholder="e.g., SW 7006 Extra White"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="door-hardware">Door Hardware Finish</Label>
                <Input
                  id="door-hardware"
                  value={doorHardwareFinish}
                  onChange={(e) => setDoorHardwareFinish(e.target.value)}
                  placeholder="e.g., Satin Nickel, Oil Rubbed Bronze"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Electrical Section */}
        <Card>
          <CardHeader>
            <CardTitle>Electrical</CardTitle>
            <CardDescription>
              Set default electrical fixture colors and styles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="outlet-switch-color">Outlet & Switch Color</Label>
              <Input
                id="outlet-switch-color"
                value={outletSwitchColor}
                onChange={(e) => setOutletSwitchColor(e.target.value)}
                placeholder="e.g., White, Light Almond, Gray"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <PropagationDialog
        open={showPropagationDialog}
        onOpenChange={setShowPropagationDialog}
        projectId={projectId!}
        onConfirm={handleConfirmSave}
        changeDescription="This will update all non-overridden interior selections across all rooms to match your new master selections."
      />
    </div>
  );
}
