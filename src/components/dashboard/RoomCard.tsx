import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, FolderOpen, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EditRoomDialog } from "./EditRoomDialog";
import { generateRoomPDF } from "@/utils/roomPdfGenerator";

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
  const navigate = useNavigate();
  const [selectionCount, setSelectionCount] = useState({ completed: 0, total: 0 });
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    loadSelectionCount();
  }, [room.id]);

  const loadSelectionCount = async () => {
    try {
      const { data, error } = await supabase
        .from("selection_items")
        .select("id, label, material_type, brand")
        .eq("room_id", room.id);

      if (error) throw error;

      const total = data?.length || 0;
      const completed = data?.filter(
        (s) => s.label && s.material_type && s.brand
      ).length || 0;

      setSelectionCount({ completed, total });
    } catch (error) {
      console.error("Error loading selection count:", error);
    }
  };

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

  const getStatusBadge = () => {
    if (selectionCount.total === 0) {
      return <Badge variant="secondary">Not Started</Badge>;
    }
    if (selectionCount.completed === selectionCount.total) {
      return <Badge className="bg-green-600">Complete</Badge>;
    }
    return <Badge variant="outline">In Progress</Badge>;
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {room.room_name}
                {getStatusBadge()}
              </CardTitle>
              {room.room_type && (
                <p className="text-sm text-muted-foreground mt-1">{room.room_type}</p>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  try {
                    await generateRoomPDF(projectId, room.id);
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to generate room PDF",
                      variant: "destructive",
                    });
                  }
                }}
                title="Generate Room PDF"
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEditDialog(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive/90"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Selections</span>
              <span className="font-medium">
                {selectionCount.completed} / {selectionCount.total}
              </span>
            </div>
            <Button
              onClick={() => navigate(`/project/${projectId}/room/${room.id}`)}
              className="w-full"
              variant="outline"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Open Selections
            </Button>
          </div>

          {room.notes_general && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">{room.notes_general}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <EditRoomDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        room={room}
        onSuccess={() => {
          onUpdate();
          loadSelectionCount();
        }}
      />
    </>
  );
}
