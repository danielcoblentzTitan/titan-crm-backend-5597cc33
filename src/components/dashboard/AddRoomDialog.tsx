import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { roomInitializationService } from "@/services/roomInitializationService";

const roomSchema = z.object({
  room_name: z.string().min(1, "Room name is required"),
  room_type: z.string().optional(),
  length_ft: z.string().optional(),
  width_ft: z.string().optional(),
  ceiling_height_ft: z.string().optional(),
  notes_general: z.string().optional(),
});

type RoomFormValues = z.infer<typeof roomSchema>;

const ROOM_TYPES = [
  { value: "kitchen", label: "Kitchen" },
  { value: "living", label: "Living Room" },
  { value: "bedroom", label: "Bedroom" },
  { value: "bathroom", label: "Bathroom" },
  { value: "hall", label: "Dining/Hall" },
  { value: "office", label: "Office" },
  { value: "utility", label: "Utility/Laundry" },
  { value: "garage", label: "Garage" },
  { value: "exterior", label: "Exterior" },
  { value: "other", label: "Other" },
];

interface AddRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess: () => void;
}

export function AddRoomDialog({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: AddRoomDialogProps) {
  const { toast } = useToast();
  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      room_name: "",
      room_type: "",
      length_ft: "",
      width_ft: "",
      ceiling_height_ft: "",
      notes_general: "",
    },
  });

  const onSubmit = async (values: RoomFormValues) => {
    try {
      const { data: newRoom, error } = await supabase.from("rooms").insert({
        project_id: projectId,
        room_name: values.room_name,
        room_type: values.room_type || null,
        length_ft: values.length_ft ? parseFloat(values.length_ft) : null,
        width_ft: values.width_ft ? parseFloat(values.width_ft) : null,
        ceiling_height_ft: values.ceiling_height_ft ? parseFloat(values.ceiling_height_ft) : null,
        notes_general: values.notes_general || null,
      }).select().single();

      if (error) throw error;

      // Initialize room selections based on room type
      if (newRoom && values.room_type) {
        try {
          // Fetch categories to create category map
          const { data: categories, error: catError } = await supabase
            .from('selection_categories')
            .select('id, name');
          
          if (catError) throw catError;

          const categoryMap: Record<string, string> = {};
          categories?.forEach(cat => {
            categoryMap[cat.name] = cat.id;
          });

          // Initialize room selections
          await roomInitializationService.initializeRoomSelections(
            projectId,
            newRoom.id,
            values.room_type,
            categoryMap
          );
        } catch (initError) {
          console.error('Error initializing room selections:', initError);
          // Don't fail the room creation if initialization fails
        }
      }

      toast({
        title: "Success",
        description: "Room added successfully",
      });

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error adding room:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add room",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Room</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="room_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Master Bedroom" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="room_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROOM_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="length_ft"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Length (ft)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="width_ft"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Width (ft)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ceiling_height_ft"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (ft)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes_general"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about this room..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Room</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
