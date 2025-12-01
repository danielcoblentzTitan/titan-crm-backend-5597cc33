import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Package, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddMasterItemModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  prefilledData?: Partial<MasterItemFormData>;
}

interface MasterItemFormData {
  category: string;
  subcategory: string;
  item_name: string;
  sku: string;
  vendor: string;
  model: string;
  dimensions: string;
  spec: string;
  uom: string;
  base_cost: number;
  markup_pct: number;
  tax_class: string;
  region: string;
  lead_time_days: number;
  warranty: string;
  effective_date: string;
  is_active: boolean;
}

export const AddMasterItemModal = ({ 
  isOpen, 
  onOpenChange, 
  onSuccess,
  prefilledData 
}: AddMasterItemModalProps) => {
  const [formData, setFormData] = useState<MasterItemFormData>({
    category: '',
    subcategory: '',
    item_name: '',
    sku: '',
    vendor: '',
    model: '',
    dimensions: '',
    spec: '',
    uom: '',
    base_cost: 0,
    markup_pct: 0,
    tax_class: 'Standard',
    region: 'DE/MD',
    lead_time_days: 0,
    warranty: '',
    effective_date: new Date().toISOString().split('T')[0],
    is_active: true,
    ...prefilledData
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const categories = [
    'Materials',
    'Hardware', 
    'Labor',
    'Equipment',
    'Services',
    'Supplies'
  ];

  const subcategories: Record<string, string[]> = {
    'Materials': ['Steel', 'Lumber', 'Concrete', 'Insulation', 'Roofing', 'Siding'],
    'Hardware': ['Fasteners', 'Bolts', 'Screws', 'Nails', 'Brackets'],
    'Labor': ['Installation', 'Skilled', 'General', 'Specialty'],
    'Equipment': ['Rental', 'Purchase', 'Maintenance'],
    'Services': ['Delivery', 'Installation', 'Consulting'],
    'Supplies': ['Safety', 'Tools', 'Cleaning', 'Office']
  };

  const uomOptions = [
    'each', 'linear foot', 'square foot', 'cubic yard', 'hour', 'day',
    'box', 'bag', 'bundle', 'pallet', 'gallon', 'pound', 'ton'
  ];

  const handleInputChange = (field: keyof MasterItemFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.category) {
      toast({
        title: "Error",
        description: "Category is required",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.item_name) {
      toast({
        title: "Error", 
        description: "Item name is required",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.uom) {
      toast({
        title: "Error",
        description: "Unit of measure is required", 
        variant: "destructive"
      });
      return false;
    }

    if (formData.lead_time_days < 0) {
      toast({
        title: "Error",
        description: "Lead time must be 0 or greater",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const checkForDuplicates = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('pricing_items')
        .select('id, name')
        .ilike('name', `%${formData.item_name}%`);

      if (error) throw error;

      if (data && data.length > 0) {
        const duplicate = data[0];
        const proceed = window.confirm(
          `Similar item found: "${duplicate.name}"\n\nDo you want to continue adding this as a new item?`
        );
        return proceed;
      }

      return true;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return true; // Continue if check fails
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const canProceed = await checkForDuplicates();
      if (!canProceed) return;

      // First, find or create the category in pricing_categories
      let categoryId: string;
      
      // Check if category exists
      const { data: existingCategory } = await supabase
        .from('pricing_categories')
        .select('id')
        .eq('name', formData.category)
        .maybeSingle();

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        // Create new category
        const { data: newCategory, error: categoryError } = await supabase
          .from('pricing_categories')
          .insert({
            name: formData.category,
            description: `${formData.category} items`,
            sort_order: 999,
            is_active: true
          })
          .select('id')
          .single();

        if (categoryError) throw categoryError;
        categoryId = newCategory.id;
      }

      // Now create the pricing item in pricing_items table
      const { error } = await supabase
        .from('pricing_items')
        .insert({
          category_id: categoryId,
          name: formData.item_name,
          description: formData.spec || null,
          unit_type: formData.uom,
          base_price: formData.base_cost,
          is_active: formData.is_active,
          sort_order: 999,
          has_formula: false
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item added to master pricing successfully"
      });

      // Reset form
      setFormData({
        category: '',
        subcategory: '',
        item_name: '',
        sku: '',
        vendor: '',
        model: '',
        dimensions: '',
        spec: '',
        uom: '',
        base_cost: 0,
        markup_pct: 0,
        tax_class: 'Standard',
        region: 'DE/MD',
        lead_time_days: 0,
        warranty: '',
        effective_date: new Date().toISOString().split('T')[0],
        is_active: true
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error adding master item:', error);
      toast({
        title: "Error",
        description: "Failed to add item to master pricing",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculatedSellPrice = formData.base_cost * (1 + formData.markup_pct / 100);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Add to Master Pricing
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Select 
                value={formData.subcategory} 
                onValueChange={(value) => handleInputChange('subcategory', value)}
                disabled={!formData.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {formData.category && subcategories[formData.category]?.map(subcat => (
                    <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item_name">Item Name *</Label>
              <Input
                id="item_name"
                value={formData.item_name}
                onChange={(e) => handleInputChange('item_name', e.target.value)}
                placeholder="Enter item name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="Enter SKU"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => handleInputChange('vendor', e.target.value)}
                placeholder="Enter vendor name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="Enter model number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dimensions">Dimensions</Label>
              <Input
                id="dimensions"
                value={formData.dimensions}
                onChange={(e) => handleInputChange('dimensions', e.target.value)}
                placeholder="e.g. 20ft x 4in x 6in"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="spec">Specifications</Label>
              <Textarea
                id="spec"
                value={formData.spec}
                onChange={(e) => handleInputChange('spec', e.target.value)}
                placeholder="Enter specifications"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uom">Unit of Measure *</Label>
              <Select value={formData.uom} onValueChange={(value) => handleInputChange('uom', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select UOM" />
                </SelectTrigger>
                <SelectContent>
                  {uomOptions.map(uom => (
                    <SelectItem key={uom} value={uom}>{uom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_cost">Base Cost</Label>
                <Input
                  id="base_cost"
                  type="number"
                  step="0.01"
                  value={formData.base_cost}
                  onChange={(e) => handleInputChange('base_cost', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="markup_pct">Markup %</Label>
                <Input
                  id="markup_pct"
                  type="number"
                  step="0.1"
                  value={formData.markup_pct}
                  onChange={(e) => handleInputChange('markup_pct', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Calculated Sell Price</Label>
              <div className="p-2 bg-muted rounded-md font-medium">
                ${calculatedSellPrice.toFixed(2)}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead_time_days">Lead Time (Days) *</Label>
              <Input
                id="lead_time_days"
                type="number"
                min="0"
                value={formData.lead_time_days}
                onChange={(e) => handleInputChange('lead_time_days', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax_class">Tax Class</Label>
                <Select value={formData.tax_class} onValueChange={(value) => handleInputChange('tax_class', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Exempt">Exempt</SelectItem>
                    <SelectItem value="Reduced">Reduced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select value={formData.region} onValueChange={(value) => handleInputChange('region', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DE/MD">DE/MD</SelectItem>
                    <SelectItem value="Regional">Regional</SelectItem>
                    <SelectItem value="National">National</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty">Warranty</Label>
              <Input
                id="warranty"
                value={formData.warranty}
                onChange={(e) => handleInputChange('warranty', e.target.value)}
                placeholder="e.g. 1 Year"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="effective_date">Effective Date</Label>
              <Input
                id="effective_date"
                type="date"
                value={formData.effective_date}
                onChange={(e) => handleInputChange('effective_date', e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save to Master"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};