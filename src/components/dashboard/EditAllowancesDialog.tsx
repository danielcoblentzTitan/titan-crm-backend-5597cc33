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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  total_allowance_flooring: z.string().optional(),
  total_allowance_cabinets: z.string().optional(),
  total_allowance_countertops: z.string().optional(),
  total_allowance_plumbing: z.string().optional(),
  total_allowance_electrical: z.string().optional(),
  total_allowance_lighting: z.string().optional(),
  total_allowance_paint: z.string().optional(),
  total_allowance_windows_doors: z.string().optional(),
  total_allowance_misc: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Project {
  id: string;
  total_allowance_flooring?: number;
  total_allowance_cabinets?: number;
  total_allowance_countertops?: number;
  total_allowance_plumbing?: number;
  total_allowance_electrical?: number;
  total_allowance_lighting?: number;
  total_allowance_paint?: number;
  total_allowance_windows_doors?: number;
  total_allowance_misc?: number;
}

interface EditAllowancesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onSuccess: () => void;
}

export function EditAllowancesDialog({
  open,
  onOpenChange,
  project,
  onSuccess,
}: EditAllowancesDialogProps) {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (open && project) {
      reset({
        total_allowance_flooring: project.total_allowance_flooring?.toString() || "",
        total_allowance_cabinets: project.total_allowance_cabinets?.toString() || "",
        total_allowance_countertops: project.total_allowance_countertops?.toString() || "",
        total_allowance_plumbing: project.total_allowance_plumbing?.toString() || "",
        total_allowance_electrical: project.total_allowance_electrical?.toString() || "",
        total_allowance_lighting: project.total_allowance_lighting?.toString() || "",
        total_allowance_paint: project.total_allowance_paint?.toString() || "",
        total_allowance_windows_doors: project.total_allowance_windows_doors?.toString() || "",
        total_allowance_misc: project.total_allowance_misc?.toString() || "",
      });
    }
  }, [open, project, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          total_allowance_flooring: data.total_allowance_flooring ? parseFloat(data.total_allowance_flooring) : 0,
          total_allowance_cabinets: data.total_allowance_cabinets ? parseFloat(data.total_allowance_cabinets) : 0,
          total_allowance_countertops: data.total_allowance_countertops ? parseFloat(data.total_allowance_countertops) : 0,
          total_allowance_plumbing: data.total_allowance_plumbing ? parseFloat(data.total_allowance_plumbing) : 0,
          total_allowance_electrical: data.total_allowance_electrical ? parseFloat(data.total_allowance_electrical) : 0,
          total_allowance_lighting: data.total_allowance_lighting ? parseFloat(data.total_allowance_lighting) : 0,
          total_allowance_paint: data.total_allowance_paint ? parseFloat(data.total_allowance_paint) : 0,
          total_allowance_windows_doors: data.total_allowance_windows_doors ? parseFloat(data.total_allowance_windows_doors) : 0,
          total_allowance_misc: data.total_allowance_misc ? parseFloat(data.total_allowance_misc) : 0,
        })
        .eq("id", project.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Allowances updated successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating allowances:", error);
      toast({
        title: "Error",
        description: "Failed to update allowances",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project Allowances</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_allowance_flooring">Flooring Allowance</Label>
              <Input
                id="total_allowance_flooring"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("total_allowance_flooring")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_allowance_cabinets">Cabinets Allowance</Label>
              <Input
                id="total_allowance_cabinets"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("total_allowance_cabinets")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_allowance_countertops">Countertops Allowance</Label>
              <Input
                id="total_allowance_countertops"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("total_allowance_countertops")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_allowance_plumbing">Plumbing Allowance</Label>
              <Input
                id="total_allowance_plumbing"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("total_allowance_plumbing")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_allowance_electrical">Electrical Allowance</Label>
              <Input
                id="total_allowance_electrical"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("total_allowance_electrical")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_allowance_lighting">Lighting Allowance</Label>
              <Input
                id="total_allowance_lighting"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("total_allowance_lighting")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_allowance_paint">Paint Allowance</Label>
              <Input
                id="total_allowance_paint"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("total_allowance_paint")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_allowance_windows_doors">Windows/Doors Allowance</Label>
              <Input
                id="total_allowance_windows_doors"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("total_allowance_windows_doors")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_allowance_misc">Miscellaneous Allowance</Label>
              <Input
                id="total_allowance_misc"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("total_allowance_misc")}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Allowances"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
