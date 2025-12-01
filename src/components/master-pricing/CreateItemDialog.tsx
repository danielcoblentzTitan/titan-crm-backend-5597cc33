import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package } from "lucide-react";
import { PricingCategory } from "@/services/pricingService";

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newItem: {
    name: string;
    description: string;
    unit_type: string;
    base_price: number;
    category_id: string;
  };
  onItemChange: (item: {
    name: string;
    description: string;
    unit_type: string;
    base_price: number;
    category_id: string;
  }) => void;
  onCreateItem: () => void;
  categories: PricingCategory[];
}

export const CreateItemDialog = ({
  open,
  onOpenChange,
  newItem,
  onItemChange,
  onCreateItem,
  categories
}: CreateItemDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Package className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="item-category">Category</Label>
            <Select 
              value={newItem.category_id} 
              onValueChange={(value) => onItemChange({ ...newItem, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="item-name">Item Name</Label>
            <Input
              id="item-name"
              value={newItem.name}
              onChange={(e) => onItemChange({ ...newItem, name: e.target.value })}
              placeholder="Enter item name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="item-unit">Unit Type</Label>
              <Select 
                value={newItem.unit_type} 
                onValueChange={(value) => onItemChange({ ...newItem, unit_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sq ft">Square Foot</SelectItem>
                  <SelectItem value="roof sq ft">Roof Sq Ft</SelectItem>
                  <SelectItem value="wall sq ft">Wall Sq Ft</SelectItem>
                  <SelectItem value="linear ft">Linear Foot</SelectItem>
                  <SelectItem value="cubic yard">Cubic Yard</SelectItem>
                  <SelectItem value="board ft">Board Foot</SelectItem>
                  <SelectItem value="each">Each</SelectItem>
                  <SelectItem value="hour">Hour</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="item-price">Base Price</Label>
              <Input
                id="item-price"
                type="number"
                step="0.01"
                value={newItem.base_price}
                onChange={(e) => onItemChange({ ...newItem, base_price: Number(e.target.value) })}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onCreateItem} disabled={!newItem.name || !newItem.category_id}>
              Create Item
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};