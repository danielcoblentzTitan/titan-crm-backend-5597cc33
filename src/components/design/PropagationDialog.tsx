import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface PropagationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onConfirm: () => Promise<void>;
  changeDescription: string;
}

export const PropagationDialog = ({
  open,
  onOpenChange,
  projectId,
  onConfirm,
  changeDescription
}: PropagationDialogProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: affectedRooms } = useQuery({
    queryKey: ['affected_rooms', projectId],
    queryFn: async () => {
      // Get all rooms for this project
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('id, room_name, room_type')
        .eq('project_id', projectId);

      if (roomsError) throw roomsError;

      // Get count of non-overridden items per room
      const roomsWithCounts = await Promise.all(
        rooms?.map(async (room) => {
          const { count } = await supabase
            .from('selection_items')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .eq('uses_master_default', true)
            .eq('is_overridden', false);

          return {
            ...room,
            affectedItemsCount: count || 0
          };
        }) || []
      );

      return roomsWithCounts.filter(room => room.affectedItemsCount > 0);
    },
    enabled: open
  });

  const handleConfirm = async () => {
    setIsUpdating(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const totalAffectedItems = affectedRooms?.reduce(
    (sum, room) => sum + room.affectedItemsCount,
    0
  ) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply Master Selection Changes</DialogTitle>
          <DialogDescription>
            {changeDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-semibold">
                    {affectedRooms?.length || 0} rooms will be updated
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {totalAffectedItems} selection items will be changed
                  </p>
                </div>
              </div>

              {affectedRooms && affectedRooms.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium mb-2">Affected Rooms:</p>
                  <div className="grid gap-2">
                    {affectedRooms.map(room => (
                      <div
                        key={room.id}
                        className="flex items-center justify-between p-2 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span className="font-medium">{room.room_name}</span>
                          {room.room_type && (
                            <Badge variant="outline" className="text-xs">
                              {room.room_type}
                            </Badge>
                          )}
                        </div>
                        <Badge variant="secondary">
                          {room.affectedItemsCount} items
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No rooms will be affected by this change.</p>
                  <p className="text-sm">All rooms have custom selections.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Only non-overridden selections will be updated.
              Custom selections in rooms will remain unchanged.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isUpdating || !affectedRooms || affectedRooms.length === 0}
          >
            {isUpdating ? 'Updating...' : `Update ${affectedRooms?.length || 0} Rooms`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
