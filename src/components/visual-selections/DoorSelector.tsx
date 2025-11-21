import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface DoorProduct {
  id: string;
  name: string;
  door_type: string;
  style?: string;
  material?: string;
  color_options?: string[];
  glass_options?: string[];
  description?: string;
  image_url?: string;
  price_tier?: string;
}

interface DoorSelectorProps {
  doorType: 'entry' | 'interior';
  selectedDoorId?: string;
  onSelect: (door: DoorProduct) => void;
}

export const DoorSelector = ({ doorType, selectedDoorId, onSelect }: DoorSelectorProps) => {
  const [search, setSearch] = useState("");

  const { data: doors, isLoading } = useQuery({
    queryKey: ['door_products', doorType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('door_products')
        .select('*')
        .eq('door_type', doorType)
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as DoorProduct[];
    }
  });

  const filteredDoors = doors?.filter(door =>
    door.name.toLowerCase().includes(search.toLowerCase()) ||
    door.style?.toLowerCase().includes(search.toLowerCase()) ||
    door.material?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder={`Search ${doorType} doors...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredDoors?.map((door) => (
          <Card
            key={door.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedDoorId === door.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onSelect(door)}
          >
            <CardContent className="p-4">
              {door.image_url ? (
                <div className="relative aspect-[3/4] mb-3 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={door.image_url}
                    alt={door.name}
                    className="w-full h-full object-cover"
                  />
                  {selectedDoorId === door.id && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[3/4] mb-3 rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">No image</span>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-medium text-sm leading-tight">{door.name}</h3>
                
                {door.style && (
                  <Badge variant="secondary" className="text-xs">
                    {door.style}
                  </Badge>
                )}
                
                {door.material && (
                  <p className="text-xs text-muted-foreground">{door.material}</p>
                )}

                {door.color_options && door.color_options.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {door.color_options.length} colors
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDoors?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No {doorType} doors found</p>
        </div>
      )}
    </div>
  );
};
