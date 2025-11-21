import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, PaintBucket, DoorOpen, Zap, Building2, Palette, Package } from "lucide-react";

interface MasterSelectionsHubProps {
  projectId: string;
}

export const MasterSelectionsHub = ({ projectId }: MasterSelectionsHubProps) => {
  const navigate = useNavigate();

  const { data: masterInterior } = useQuery({
    queryKey: ['master_interior_selections', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('master_interior_selections')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  const { data: masterExterior } = useQuery({
    queryKey: ['master_exterior_selections', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('master_exterior_selections')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  const { data: flooringProduct } = useQuery({
    queryKey: ['flooring_product', masterInterior?.default_flooring_product_id],
    queryFn: async () => {
      if (!masterInterior?.default_flooring_product_id) return null;
      
      const { data, error } = await supabase
        .from('flooring_products')
        .select('*')
        .eq('id', masterInterior.default_flooring_product_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!masterInterior?.default_flooring_product_id
  });

  const { data: roomsCount } = useQuery({
    queryKey: ['rooms_count', projectId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      if (error) throw error;
      return count || 0;
    }
  });

  const isConfigured = !!(
    masterInterior?.default_flooring_product_id ||
    masterInterior?.default_wall_paint_color ||
    masterInterior?.default_ceiling_paint_color
  );

  const isExteriorConfigured = !!(
    masterExterior?.metal_siding_color ||
    masterExterior?.metal_roof_color ||
    masterExterior?.metal_trim_color
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Interior Selections Card */}
      <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Master Interior Selections
            </CardTitle>
            <CardDescription>
              Set default selections that apply to all rooms
              {roomsCount ? ` • ${roomsCount} rooms in project` : ''}
            </CardDescription>
          </div>
          <Button onClick={() => navigate(`/design/interior/${projectId}`)}>
            {isConfigured ? 'Edit' : 'Configure'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!isConfigured ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">No master selections configured yet</p>
            <Button onClick={() => navigate(`/design/interior/${projectId}`)}>
              Get Started
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Flooring Preview */}
            {flooringProduct && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Home className="h-4 w-4" />
                  Flooring
                </div>
                <div className="aspect-video rounded-lg overflow-hidden border">
                  <img
                    src={flooringProduct.room_image_url || '/placeholder.svg'}
                    alt={flooringProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm font-medium">{flooringProduct.name}</p>
                <Badge variant="secondary" className="text-xs">
                  {flooringProduct.price_tier}
                </Badge>
              </div>
            )}

            {/* Paint Colors Preview */}
            {masterInterior?.default_wall_paint_color && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <PaintBucket className="h-4 w-4" />
                  Wall Paint
                </div>
                <div className="aspect-video rounded-lg border bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <p className="font-medium">{masterInterior.default_wall_paint_color}</p>
                    {masterInterior.default_wall_paint_brand && (
                      <p className="text-xs text-muted-foreground">{masterInterior.default_wall_paint_brand}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Door Style Preview */}
            {masterInterior?.default_door_style && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <DoorOpen className="h-4 w-4" />
                  Door Style
                </div>
                <div className="aspect-video rounded-lg border bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <p className="font-medium">{masterInterior.default_door_style}</p>
                    {masterInterior.default_door_color && (
                      <p className="text-xs text-muted-foreground">{masterInterior.default_door_color}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Electrical Preview */}
            {masterInterior?.default_outlet_switch_color && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Zap className="h-4 w-4" />
                  Outlets & Switches
                </div>
                <div className="aspect-video rounded-lg border bg-muted flex items-center justify-center">
                  <p className="font-medium">{masterInterior.default_outlet_switch_color}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Exterior Selections Card */}
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Master Exterior Selections
            </CardTitle>
            <CardDescription>
              Set default selections for building exterior
            </CardDescription>
          </div>
          <Button onClick={() => navigate(`/design/exterior/${projectId}`)}>
            {isExteriorConfigured ? 'Edit' : 'Configure'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!isExteriorConfigured ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">No exterior selections configured yet</p>
            <Button onClick={() => navigate(`/design/exterior/${projectId}`)}>
              Get Started
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Metal Siding:</span>
              <Badge variant="secondary">Configured</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Metal Roof:</span>
              <Badge variant="secondary">Configured</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Trim Color:</span>
              <Badge variant="secondary">Configured</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Design Center Quick Links */}
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Design Center
        </CardTitle>
        <CardDescription>
          Quick access to all design areas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate(`/design/packages/${projectId}`)}
          >
            <Package className="h-5 w-5" />
            <span className="text-xs">Packages</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate(`/design/interior/${projectId}`)}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Interior</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate(`/design/exterior/${projectId}`)}
          >
            <Building2 className="h-5 w-5" />
            <span className="text-xs">Exterior</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate(`/design/kitchen/${projectId}`)}
          >
            <PaintBucket className="h-5 w-5" />
            <span className="text-xs">Kitchen</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate(`/design/bathroom/${projectId}`)}
          >
            <DoorOpen className="h-5 w-5" />
            <span className="text-xs">Bathroom</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
  );
};
