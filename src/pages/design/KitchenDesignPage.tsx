import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";

export default function KitchenDesignPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [perimeterCabinets, setPerimeterCabinets] = useState("");
  const [islandCabinets, setIslandCabinets] = useState("");
  const [cabinetHardware, setCabinetHardware] = useState("");
  const [perimeterCountertops, setPerimeterCountertops] = useState("");
  const [islandCountertop, setIslandCountertop] = useState("");
  const [backsplashTile, setBacksplashTile] = useState("");
  const [sinkStyle, setSinkStyle] = useState("");
  const [faucetStyle, setFaucetStyle] = useState("");
  const [appliancePackage, setAppliancePackage] = useState("");
  const [notes, setNotes] = useState("");

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
    toast({
      title: "Info",
      description: "Kitchen master selections feature coming soon!"
    });
  };

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
            <h1 className="text-3xl font-bold">Master Kitchen Selections</h1>
            <p className="text-muted-foreground">{project?.project_name}</p>
          </div>
        </div>
        <Button onClick={handleSave} size="lg">
          <Save className="mr-2 h-4 w-4" />
          Save Selections
        </Button>
      </div>

      <div className="space-y-8">
        {/* Cabinets Section */}
        <Card>
          <CardHeader>
            <CardTitle>Cabinetry</CardTitle>
            <CardDescription>
              Select cabinet styles, colors, and hardware
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="perimeter-cabinets">Perimeter Cabinets</Label>
                <Input
                  id="perimeter-cabinets"
                  value={perimeterCabinets}
                  onChange={(e) => setPerimeterCabinets(e.target.value)}
                  placeholder="e.g., Shaker White, Raised Panel Oak"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="island-cabinets">Island Cabinets</Label>
                <Input
                  id="island-cabinets"
                  value={islandCabinets}
                  onChange={(e) => setIslandCabinets(e.target.value)}
                  placeholder="e.g., Navy Blue, Same as Perimeter"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cabinet-hardware">Cabinet Hardware</Label>
                <Input
                  id="cabinet-hardware"
                  value={cabinetHardware}
                  onChange={(e) => setCabinetHardware(e.target.value)}
                  placeholder="e.g., Brushed Nickel Pulls, Black Handles"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Countertops Section */}
        <Card>
          <CardHeader>
            <CardTitle>Countertops & Backsplash</CardTitle>
            <CardDescription>
              Select countertop materials and backsplash tile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="perimeter-countertops">Perimeter Countertops</Label>
                <Input
                  id="perimeter-countertops"
                  value={perimeterCountertops}
                  onChange={(e) => setPerimeterCountertops(e.target.value)}
                  placeholder="e.g., Granite, Quartz"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="island-countertop">Island Countertop</Label>
                <Input
                  id="island-countertop"
                  value={islandCountertop}
                  onChange={(e) => setIslandCountertop(e.target.value)}
                  placeholder="e.g., Butcher Block, Same as Perimeter"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backsplash-tile">Backsplash Tile</Label>
                <Input
                  id="backsplash-tile"
                  value={backsplashTile}
                  onChange={(e) => setBacksplashTile(e.target.value)}
                  placeholder="e.g., Subway Tile, Glass Mosaic"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plumbing Fixtures Section */}
        <Card>
          <CardHeader>
            <CardTitle>Plumbing Fixtures</CardTitle>
            <CardDescription>
              Select sink and faucet styles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sink-style">Sink Style</Label>
                <Input
                  id="sink-style"
                  value={sinkStyle}
                  onChange={(e) => setSinkStyle(e.target.value)}
                  placeholder="e.g., Undermount Double Bowl, Farmhouse"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faucet-style">Faucet Style</Label>
                <Input
                  id="faucet-style"
                  value={faucetStyle}
                  onChange={(e) => setFaucetStyle(e.target.value)}
                  placeholder="e.g., Pull-Down Sprayer, Bridge Style"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appliances Section */}
        <Card>
          <CardHeader>
            <CardTitle>Appliances</CardTitle>
            <CardDescription>
              Select appliance package and finish
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="appliance-package">Appliance Package</Label>
              <Input
                id="appliance-package"
                value={appliancePackage}
                onChange={(e) => setAppliancePackage(e.target.value)}
                placeholder="e.g., GE Stainless Steel Suite, KitchenAid Black Stainless"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about kitchen selections..."
              rows={4}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
