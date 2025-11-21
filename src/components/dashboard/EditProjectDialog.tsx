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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  project_name: z.string().min(1, "Project name is required"),
  client_name: z.string().min(1, "Client name is required"),
  client_email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  site_address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  lot_size: z.string().optional(),
  house_sq_ft: z.string().optional(),
  garage_sq_ft: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  stories: z.string().optional(),
  wall_height: z.string().optional(),
  build_type: z.string().optional(),
  status: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Project {
  id: string;
  project_name: string;
  client_name: string;
  client_email?: string;
  phone?: string;
  site_address?: string;
  city?: string;
  state?: string;
  zip?: string;
  lot_size?: number;
  house_sq_ft?: number;
  garage_sq_ft?: number;
  bedrooms?: number;
  bathrooms?: number;
  stories?: number;
  wall_height?: number;
  build_type?: string;
  status?: string;
}

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onSuccess: () => void;
}

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
  onSuccess,
}: EditProjectDialogProps) {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (open && project) {
      reset({
        project_name: project.project_name,
        client_name: project.client_name,
        client_email: project.client_email || "",
        phone: project.phone || "",
        site_address: project.site_address || "",
        city: project.city || "",
        state: project.state || "",
        zip: project.zip || "",
        lot_size: project.lot_size?.toString() || "",
        house_sq_ft: project.house_sq_ft?.toString() || "",
        garage_sq_ft: project.garage_sq_ft?.toString() || "",
        bedrooms: project.bedrooms?.toString() || "",
        bathrooms: project.bathrooms?.toString() || "",
        stories: project.stories?.toString() || "",
        wall_height: project.wall_height?.toString() || "",
        build_type: project.build_type || "",
        status: project.status || "",
      });
    }
  }, [open, project, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          project_name: data.project_name,
          client_name: data.client_name,
          client_email: data.client_email || null,
          phone: data.phone || null,
          site_address: data.site_address || null,
          city: data.city || null,
          state: data.state || null,
          zip: data.zip || null,
          lot_size: data.lot_size ? parseFloat(data.lot_size) : null,
          house_sq_ft: data.house_sq_ft ? parseFloat(data.house_sq_ft) : null,
          garage_sq_ft: data.garage_sq_ft ? parseFloat(data.garage_sq_ft) : null,
          bedrooms: data.bedrooms ? parseInt(data.bedrooms) : null,
          bathrooms: data.bathrooms ? parseFloat(data.bathrooms) : null,
          stories: data.stories ? parseInt(data.stories) : null,
          wall_height: data.wall_height ? parseFloat(data.wall_height) : null,
          build_type: data.build_type || null,
          status: data.status || null,
        })
        .eq("id", project.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project updated successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project Information</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project_name">Project Name *</Label>
              <Input id="project_name" {...register("project_name")} />
              {errors.project_name && (
                <p className="text-sm text-destructive">{errors.project_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value) => setValue("status", value)} defaultValue={project.status}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="selections">Selections</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name *</Label>
              <Input id="client_name" {...register("client_name")} />
              {errors.client_name && (
                <p className="text-sm text-destructive">{errors.client_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" {...register("phone")} />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="client_email">Email</Label>
              <Input id="client_email" type="email" {...register("client_email")} />
              {errors.client_email && (
                <p className="text-sm text-destructive">{errors.client_email.message}</p>
              )}
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="site_address">Build Address</Label>
              <Input id="site_address" {...register("site_address")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" {...register("state")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip">Zip Code</Label>
              <Input id="zip" {...register("zip")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lot_size">Lot Size (acres)</Label>
              <Input id="lot_size" type="number" step="0.01" {...register("lot_size")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="house_sq_ft">House Size (sq ft)</Label>
              <Input id="house_sq_ft" type="number" {...register("house_sq_ft")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="garage_sq_ft">Garage Size (sq ft)</Label>
              <Input id="garage_sq_ft" type="number" {...register("garage_sq_ft")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input id="bedrooms" type="number" {...register("bedrooms")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input id="bathrooms" type="number" step="0.5" {...register("bathrooms")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stories">Stories</Label>
              <Input id="stories" type="number" {...register("stories")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wall_height">Wall Height (ft)</Label>
              <Input id="wall_height" type="number" {...register("wall_height")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="build_type">Build Type</Label>
              <Select onValueChange={(value) => setValue("build_type", value)} defaultValue={project.build_type}>
                <SelectTrigger>
                  <SelectValue placeholder="Select build type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post-frame">Post Frame</SelectItem>
                  <SelectItem value="stick-frame">Stick Frame</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
