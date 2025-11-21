import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";

const selectionSchema = z.object({
  category_id: z.string().min(1, "Category is required"),
  label: z.string().min(1, "Label is required"),
  description: z.string().optional(),
  material_type: z.string().optional(),
  brand: z.string().optional(),
  model_or_sku: z.string().optional(),
  color_name: z.string().optional(),
  finish: z.string().optional(),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  unit_cost_allowance: z.string().optional(),
  total_cost_allowance: z.string().optional(),
  is_upgrade: z.boolean().default(false),
  upgrade_cost: z.string().optional(),
  notes_for_sub: z.string().optional(),
});

type SelectionFormValues = z.infer<typeof selectionSchema>;

interface AddSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  roomId: string;
  categoryId?: string;
  editingItem?: {
    id: string;
    label: string;
    description?: string;
    material_type?: string;
    brand?: string;
    model_or_sku?: string;
    color_name?: string;
    finish?: string;
    quantity?: number;
    unit?: string;
    unit_cost_allowance?: number;
    total_cost_allowance?: number;
    is_upgrade?: boolean;
    upgrade_cost?: number;
    notes_for_sub?: string;
    image_url?: string;
    trade?: string;
    category_id: string;
  };
  onSuccess: () => void;
}

interface Category {
  id: string;
  name: string;
  trade: string;
}

export function AddSelectionDialog({ 
  open, 
  onOpenChange, 
  projectId, 
  roomId, 
  categoryId,
  editingItem,
  onSuccess 
}: AddSelectionDialogProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const { toast } = useToast();

  const form = useForm<SelectionFormValues>({
    resolver: zodResolver(selectionSchema),
    defaultValues: {
      category_id: "",
      label: "",
      description: "",
      material_type: "",
      brand: "",
      model_or_sku: "",
      color_name: "",
      finish: "",
      quantity: "",
      unit: "",
      unit_cost_allowance: "",
      total_cost_allowance: "",
      is_upgrade: false,
      upgrade_cost: "",
      notes_for_sub: "",
    },
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (open && editingItem) {
      // Populate form with editing item data
      form.reset({
        category_id: editingItem.category_id,
        label: editingItem.label,
        description: editingItem.description || "",
        material_type: editingItem.material_type || "",
        brand: editingItem.brand || "",
        model_or_sku: editingItem.model_or_sku || "",
        color_name: editingItem.color_name || "",
        finish: editingItem.finish || "",
        quantity: editingItem.quantity?.toString() || "",
        unit: editingItem.unit || "",
        unit_cost_allowance: editingItem.unit_cost_allowance?.toString() || "",
        total_cost_allowance: editingItem.total_cost_allowance?.toString() || "",
        is_upgrade: editingItem.is_upgrade || false,
        upgrade_cost: editingItem.upgrade_cost?.toString() || "",
        notes_for_sub: editingItem.notes_for_sub || "",
      });
    } else if (open && !editingItem) {
      // Reset form for new item
      form.reset({
        category_id: categoryId || "",
        label: "",
        description: "",
        material_type: "",
        brand: "",
        model_or_sku: "",
        color_name: "",
        finish: "",
        quantity: "",
        unit: "",
        unit_cost_allowance: "",
        total_cost_allowance: "",
        is_upgrade: false,
        upgrade_cost: "",
        notes_for_sub: "",
      });
    }
  }, [open, editingItem, categoryId, form]);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("selection_categories")
      .select("*")
      .order("sort_order");

    if (error) {
      console.error("Error loading categories:", error);
      return;
    }

    setCategories(data || []);
  };

  const onSubmit = async (values: SelectionFormValues) => {
    try {
      const selectedCategory = categories.find((c) => c.id === values.category_id);
      const itemData = {
        project_id: projectId,
        room_id: roomId,
        category_id: values.category_id,
        trade: selectedCategory?.trade || null,
        label: values.label,
        description: values.description || null,
        material_type: values.material_type || null,
        brand: values.brand || null,
        model_or_sku: values.model_or_sku || null,
        color_name: values.color_name || null,
        finish: values.finish || null,
        quantity: values.quantity ? parseFloat(values.quantity) : null,
        unit: values.unit || null,
        unit_cost_allowance: values.unit_cost_allowance ? parseFloat(values.unit_cost_allowance) : null,
        total_cost_allowance: values.total_cost_allowance ? parseFloat(values.total_cost_allowance) : null,
        is_upgrade: values.is_upgrade,
        upgrade_cost: values.upgrade_cost ? parseFloat(values.upgrade_cost) : null,
        notes_for_sub: values.notes_for_sub || null,
      };

      let error;
      if (editingItem) {
        // Update existing item
        const result = await supabase
          .from("selection_items")
          .update(itemData)
          .eq("id", editingItem.id);
        error = result.error;
      } else {
        // Insert new item
        const result = await supabase
          .from("selection_items")
          .insert([itemData]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: editingItem ? "Selection updated successfully" : "Selection added successfully",
      });

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error saving selection:", error);
      toast({
        title: "Error",
        description: editingItem ? "Failed to update selection" : "Failed to add selection",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingItem ? "Edit Selection Item" : "Add Selection Item"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} ({category.trade})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Primary Bathroom Vanity Faucet" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="material_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Ceramic, Wood" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Delta, Kohler" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model_or_sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model/SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Model or SKU number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Matte Black" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="finish"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Finish</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Polished, Brushed" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sq ft">Square Feet</SelectItem>
                        <SelectItem value="linear ft">Linear Feet</SelectItem>
                        <SelectItem value="each">Each</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="bundle">Bundle</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_cost_allowance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Cost ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="total_cost_allowance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Cost ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_upgrade"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>This is an upgrade</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {form.watch("is_upgrade") && (
              <FormField
                control={form.control}
                name="upgrade_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upgrade Cost ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes_for_sub"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes for Subcontractor</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Special installation notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingItem ? "Save Changes" : "Add Selection"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
