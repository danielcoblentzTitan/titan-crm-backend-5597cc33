import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  room_name: z.string().min(1, "Room name is required"),
  room_type: z.string().optional(),
  length_ft: z.string().optional(),
  width_ft: z.string().optional(),
  ceiling_height_ft: z.string().optional(),
  ceiling_type: z.string().optional(),
  notes_general: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Room {
  id: string;
  room_name: string;
  room_type?: string;
  length_ft?: number;
  width_ft?: number;
  ceiling_height_ft?: number;
  ceiling_type?: string;
  notes_general?: string;
}

interface EditRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room;
  onSuccess: () => void;
}

export function EditRoomDialog({
  open,
  onOpenChange,
  room,
  onSuccess,
}: EditRoomDialogProps) {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (open && room) {
      reset({
        room_name: room.room_name,
        room_type: room.room_type || "",
        length_ft: room.length_ft?.toString() || "",
        width_ft: room.width_ft?.toString() || "",
        ceiling_height_ft: room.ceiling_height_ft?.toString() || "",
        ceiling_type: room.ceiling_type || "",
        notes_general: room.notes_general || "",
      });
    }
  }, [open, room, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const { error } = await supabase
        .from("rooms")
        .update({
          room_name: data.room_name,
          room_type: data.room_type || null,
          length_ft: data.length_ft ? parseFloat(data.length_ft) : null,
          width_ft: data.width_ft ? parseFloat(data.width_ft) : null,
          ceiling_height_ft: data.ceiling_height_ft ? parseFloat(data.ceiling_height_ft) : null,
          ceiling_type: data.ceiling_type || null,
          notes_general: data.notes_general || null,
        })
        .eq("id", room.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room updated successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating room:", error);
      toast({
        title: "Error",
        description: "Failed to update room",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Room Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room_name">Room Name *</Label>
              <Input id="room_name" {...register("room_name")} />
              {errors.room_name && (
                <p className="text-sm text-destructive">{errors.room_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="room_type">Room Type</Label>
              <Input id="room_type" {...register("room_type")} placeholder="e.g., Kitchen, Bedroom" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="length_ft">Length (ft)</Label>
              <Input id="length_ft" type="number" step="0.1" {...register("length_ft")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="width_ft">Width (ft)</Label>
              <Input id="width_ft" type="number" step="0.1" {...register("width_ft")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ceiling_height_ft">Ceiling Height (ft)</Label>
              <Input id="ceiling_height_ft" type="number" step="0.1" {...register("ceiling_height_ft")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ceiling_type">Ceiling Type</Label>
              <Input id="ceiling_type" {...register("ceiling_type")} placeholder="e.g., Flat, Vaulted" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes_general">General Notes</Label>
            <Textarea
              id="notes_general"
              {...register("notes_general")}
              placeholder="Any special notes about this room..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
