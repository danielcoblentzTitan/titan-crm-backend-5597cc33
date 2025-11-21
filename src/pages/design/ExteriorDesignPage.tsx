import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetalColorPicker } from "@/components/visual-selections/MetalColorPicker";
import { DoorSelector } from "@/components/visual-selections/DoorSelector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { masterSelectionsService } from "@/services/masterSelectionsService";

export default function ExteriorDesignPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [metalSidingColorId, setMetalSidingColorId] = useState("");
  const [metalRoofColorId, setMetalRoofColorId] = useState("");
  const [metalTrimColorId, setMetalTrimColorId] = useState("");
  const [selectedEntryDoorId, setSelectedEntryDoorId] = useState("");
  const [porchPostStyle, setPorchPostStyle] = useState("");
  const [porchCeilingMaterial, setPorchCeilingMaterial] = useState("");
  const [exteriorDoorColor, setExteriorDoorColor] = useState("");
  const [windowColor, setWindowColor] = useState("");
  const [garageDoorColor, setGarageDoorColor] = useState("");
  const [stoneWainscotType, setStoneWainscotType] = useState("");
  const [concreteFinishType, setConcreteFinishType] = useState("");
  const [exteriorLightingStyle, setExteriorLightingStyle] = useState("");

  const { data: masterExterior, isLoading } = useQuery({
    queryKey: ['master_exterior_selections', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('master_exterior_selections')
        .select('*')
        .eq('project_id', projectId!)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setMetalSidingColorId(data.metal_siding_color || "");
        setMetalRoofColorId(data.metal_roof_color || "");
        setMetalTrimColorId(data.metal_trim_color || "");
        setPorchPostStyle(data.porch_post_style || "");
        setPorchCeilingMaterial(data.porch_ceiling_material || "");
        setExteriorDoorColor(data.exterior_door_color || "");
        setWindowColor(data.window_color || "");
        setGarageDoorColor(data.garage_door_color || "");
        setStoneWainscotType(data.stone_wainscot_type || "");
        setConcreteFinishType(data.concrete_finish_type || "");
        setExteriorLightingStyle(data.exterior_lighting_style || "");
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
    try {
      await masterSelectionsService.updateMasterExterior(projectId!, {
        metal_siding_color: metalSidingColorId || null,
        metal_roof_color: metalRoofColorId || null,
        metal_trim_color: metalTrimColorId || null,
        porch_post_style: porchPostStyle || null,
        porch_ceiling_material: porchCeilingMaterial || null,
        exterior_door_color: exteriorDoorColor || null,
        window_color: windowColor || null,
        garage_door_color: garageDoorColor || null,
        stone_wainscot_type: stoneWainscotType || null,
        concrete_finish_type: concreteFinishType || null,
        exterior_lighting_style: exteriorLightingStyle || null,
      });

      toast({
        title: "Success",
        description: "Master exterior selections saved successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save master exterior selections",
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
            <h1 className="text-3xl font-bold">Master Exterior Selections</h1>
            <p className="text-muted-foreground">{project?.project_name}</p>
          </div>
        </div>
        <Button onClick={handleSave} size="lg">
          <Save className="mr-2 h-4 w-4" />
          Save Master Selections
        </Button>
      </div>

      <div className="space-y-8">
        {/* Metal Siding Section */}
        <Card>
          <CardHeader>
            <CardTitle>Metal Siding Color</CardTitle>
            <CardDescription>
              Select the primary metal siding color for the building exterior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetalColorPicker
              selectedColorId={metalSidingColorId}
              masterDefaultId={masterExterior?.metal_siding_color || undefined}
              onSelectColor={setMetalSidingColorId}
            />
          </CardContent>
        </Card>

        {/* Metal Roof Section */}
        <Card>
          <CardHeader>
            <CardTitle>Metal Roof Color</CardTitle>
            <CardDescription>
              Select the metal roof color
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetalColorPicker
              selectedColorId={metalRoofColorId}
              masterDefaultId={masterExterior?.metal_roof_color || undefined}
              onSelectColor={setMetalRoofColorId}
            />
          </CardContent>
        </Card>

        {/* Metal Trim Section */}
        <Card>
          <CardHeader>
            <CardTitle>Metal Trim Color</CardTitle>
            <CardDescription>
              Select the metal trim color for corners, eaves, and accents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetalColorPicker
              selectedColorId={metalTrimColorId}
              masterDefaultId={masterExterior?.metal_trim_color || undefined}
              onSelectColor={setMetalTrimColorId}
            />
          </CardContent>
        </Card>

        {/* Doors & Windows Section */}
        <Card>
          <CardHeader>
            <CardTitle>Entry Doors</CardTitle>
            <CardDescription>
              Select the default entry door style for the home
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DoorSelector
              doorType="entry"
              selectedDoorId={selectedEntryDoorId}
              onSelect={(door) => setSelectedEntryDoorId(door.id)}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
              <div className="space-y-2">
                <Label htmlFor="window-color">Window Color</Label>
                <Input
                  id="window-color"
                  value={windowColor}
                  onChange={(e) => setWindowColor(e.target.value)}
                  placeholder="e.g., Bronze, White"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="garage-door-color">Garage Door Color</Label>
                <Input
                  id="garage-door-color"
                  value={garageDoorColor}
                  onChange={(e) => setGarageDoorColor(e.target.value)}
                  placeholder="e.g., White, Walnut"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Porch & Entry Section */}
        <Card>
          <CardHeader>
            <CardTitle>Porch & Entry</CardTitle>
            <CardDescription>
              Configure porch posts and ceiling materials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="porch-post-style">Porch Post Style</Label>
                <Input
                  id="porch-post-style"
                  value={porchPostStyle}
                  onChange={(e) => setPorchPostStyle(e.target.value)}
                  placeholder="e.g., 6x6 Cedar, Steel Column"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="porch-ceiling-material">Porch Ceiling Material</Label>
                <Input
                  id="porch-ceiling-material"
                  value={porchCeilingMaterial}
                  onChange={(e) => setPorchCeilingMaterial(e.target.value)}
                  placeholder="e.g., Tongue & Groove, Metal"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stone & Concrete Section */}
        <Card>
          <CardHeader>
            <CardTitle>Stone & Concrete</CardTitle>
            <CardDescription>
              Set preferences for stone wainscoting and concrete finishes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stone-wainscot">Stone Wainscot Type</Label>
                <Input
                  id="stone-wainscot"
                  value={stoneWainscotType}
                  onChange={(e) => setStoneWainscotType(e.target.value)}
                  placeholder="e.g., River Rock, Stacked Stone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="concrete-finish">Concrete Finish Type</Label>
                <Input
                  id="concrete-finish"
                  value={concreteFinishType}
                  onChange={(e) => setConcreteFinishType(e.target.value)}
                  placeholder="e.g., Broom Finish, Exposed Aggregate"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exterior Lighting Section */}
        <Card>
          <CardHeader>
            <CardTitle>Exterior Lighting</CardTitle>
            <CardDescription>
              Set default exterior lighting style and finish
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="exterior-lighting">Exterior Lighting Style</Label>
              <Input
                id="exterior-lighting"
                value={exteriorLightingStyle}
                onChange={(e) => setExteriorLightingStyle(e.target.value)}
                placeholder="e.g., Modern Black Sconces, Farmhouse Pendants"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
