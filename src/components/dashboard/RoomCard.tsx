import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Room {
  id: string;
  room_name: string;
  room_type: string;
  length_ft: number;
  width_ft: number;
  ceiling_height_ft: number;
  notes_general: string;
}

interface RoomCardProps {
  room: Room;
  projectId: string;
  onUpdate: () => void;
}

export function RoomCard({ room, projectId, onUpdate }: RoomCardProps) {
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${room.room_name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("rooms")
        .delete()
        .eq("id", room.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room deleted successfully",
      });

      onUpdate();
    } catch (error) {
      console.error("Error deleting room:", error);
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{room.room_name}</CardTitle>
          {room.room_type && (
            <p className="text-sm text-muted-foreground">{room.room_type}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="text-destructive hover:text-destructive/90"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-sm">
          {room.length_ft && (
            <div>
              <p className="text-muted-foreground">Length</p>
              <p className="font-medium">{room.length_ft} ft</p>
            </div>
          )}
          {room.width_ft && (
            <div>
              <p className="text-muted-foreground">Width</p>
              <p className="font-medium">{room.width_ft} ft</p>
            </div>
          )}
          {room.ceiling_height_ft && (
            <div>
              <p className="text-muted-foreground">Height</p>
              <p className="font-medium">{room.ceiling_height_ft} ft</p>
            </div>
          )}
        </div>
        {room.notes_general && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Notes</p>
            <p className="text-sm">{room.notes_general}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
