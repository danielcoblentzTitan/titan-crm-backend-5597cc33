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

export default function BathroomDesignPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [floorTile, setFloorTile] = useState("");
  const [showerTile, setShowerTile] = useState("");
  const [vanityStyle, setVanityStyle] = useState("");
  const [vanityCountertop, setVanityCountertop] = useState("");
  const [vanityHardware, setVanityHardware] = useState("");
  const [sinkType, setSinkType] = useState("");
  const [faucetStyle, setFaucetStyle] = useState("");
  const [showerValve, setShowerValve] = useState("");
  const [showerhead, setShowerhead] = useState("");
  const [toilet, setToilet] = useState("");
  const [vanityLighting, setVanityLighting] = useState("");
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
      description: "Bathroom master selections feature coming soon!"
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
            <h1 className="text-3xl font-bold">Master Bathroom Selections</h1>
            <p className="text-muted-foreground">{project?.project_name}</p>
          </div>
        </div>
        <Button onClick={handleSave} size="lg">
          <Save className="mr-2 h-4 w-4" />
          Save Selections
        </Button>
      </div>

      <div className="space-y-8">
        {/* Tile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Tile Selections</CardTitle>
            <CardDescription>
              Select floor and shower tile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floor-tile">Floor Tile</Label>
                <Input
                  id="floor-tile"
                  value={floorTile}
                  onChange={(e) => setFloorTile(e.target.value)}
                  placeholder="e.g., 12x24 Porcelain, Hexagon Mosaic"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shower-tile">Shower/Tub Surround Tile</Label>
                <Input
                  id="shower-tile"
                  value={showerTile}
                  onChange={(e) => setShowerTile(e.target.value)}
                  placeholder="e.g., Subway Tile, Large Format"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vanity Section */}
        <Card>
          <CardHeader>
            <CardTitle>Vanity</CardTitle>
            <CardDescription>
              Select vanity style, countertop, and hardware
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vanity-style">Vanity Style</Label>
                <Input
                  id="vanity-style"
                  value={vanityStyle}
                  onChange={(e) => setVanityStyle(e.target.value)}
                  placeholder="e.g., 60 inch Double, Floating"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vanity-countertop">Vanity Countertop</Label>
                <Input
                  id="vanity-countertop"
                  value={vanityCountertop}
                  onChange={(e) => setVanityCountertop(e.target.value)}
                  placeholder="e.g., Quartz, Granite"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vanity-hardware">Vanity Hardware</Label>
                <Input
                  id="vanity-hardware"
                  value={vanityHardware}
                  onChange={(e) => setVanityHardware(e.target.value)}
                  placeholder="e.g., Chrome Knobs, Black Pulls"
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
              Select sinks, faucets, shower components, and toilet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sink-type">Sink Type</Label>
                <Input
                  id="sink-type"
                  value={sinkType}
                  onChange={(e) => setSinkType(e.target.value)}
                  placeholder="e.g., Undermount, Vessel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faucet-style">Faucet Style</Label>
                <Input
                  id="faucet-style"
                  value={faucetStyle}
                  onChange={(e) => setFaucetStyle(e.target.value)}
                  placeholder="e.g., Widespread, Single Hole"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shower-valve">Shower Valve & Trim</Label>
                <Input
                  id="shower-valve"
                  value={showerValve}
                  onChange={(e) => setShowerValve(e.target.value)}
                  placeholder="e.g., Delta Trinsic, Moen Align"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="showerhead">Showerhead</Label>
                <Input
                  id="showerhead"
                  value={showerhead}
                  onChange={(e) => setShowerhead(e.target.value)}
                  placeholder="e.g., Rainfall, Multi-Function"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toilet">Toilet</Label>
                <Input
                  id="toilet"
                  value={toilet}
                  onChange={(e) => setToilet(e.target.value)}
                  placeholder="e.g., Elongated Comfort Height"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lighting Section */}
        <Card>
          <CardHeader>
            <CardTitle>Lighting</CardTitle>
            <CardDescription>
              Select vanity lighting style
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="vanity-lighting">Vanity Lighting</Label>
              <Input
                id="vanity-lighting"
                value={vanityLighting}
                onChange={(e) => setVanityLighting(e.target.value)}
                placeholder="e.g., 3-Light Bar, Wall Sconces"
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
              placeholder="Add any additional notes about bathroom selections..."
              rows={4}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
