import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { SelectionItemCard } from "./SelectionItemCard";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Room {
  id: string;
  room_name: string;
  room_type: string;
  length_ft: number;
  width_ft: number;
  ceiling_height_ft: number;
  notes_general: string;
}

interface SelectionItem {
  id: string;
  label: string;
  description: string;
  brand: string;
  model_or_sku: string;
  color_name: string;
  finish: string;
  material_type: string;
  quantity: number;
  unit: string;
  unit_cost_allowance: number;
  total_cost_allowance: number;
  image_url: string;
  trade: string;
  is_upgrade: boolean;
  upgrade_cost: number;
}

interface RoomCardProps {
  room: Room;
  projectId: string;
  onUpdate: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, projectId, onUpdate }) => {
  const [selections, setSelections] = useState<SelectionItem[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSelections();
  }, [room.id]);

  const loadSelections = async () => {
    try {
      const { data, error } = await supabase
        .from("selection_items")
        .select("*")
        .eq("room_id", room.id)
        .order("trade", { ascending: true });

      if (error) throw error;
      setSelections(data || []);
    } catch (error) {
      console.error("Error loading selections:", error);
    } finally {
      setLoading(false);
    }
  };

  const roomSqFt = room.length_ft && room.width_ft ? room.length_ft * room.width_ft : 0;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 h-auto">
                    {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </Button>
                </CollapsibleTrigger>
                <CardTitle className="text-lg">{room.room_name}</CardTitle>
                {room.room_type && (
                  <span className="text-sm text-muted-foreground">({room.room_type})</span>
                )}
              </div>
              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                {roomSqFt > 0 && <span>{roomSqFt.toFixed(0)} sq ft</span>}
                {room.ceiling_height_ft && <span>{room.ceiling_height_ft}' ceiling</span>}
              </div>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Selection
            </Button>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : selections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-3">No selections added yet</p>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Selection
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selections.map((selection) => (
                  <SelectionItemCard
                    key={selection.id}
                    selection={selection}
                    onUpdate={loadSelections}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
