import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { DebouncedInput } from "./DebouncedInput";

export interface FeeItem {
  id: string;
  category: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface CategorySectionProps {
  category: string;
  categoryItems: FeeItem[];
  onUpdateItem: (itemId: string, field: keyof FeeItem, value: number | string) => void;
  onAddItem: (category: string) => void;
  onDeleteItem: (itemId: string) => void;
  isLocked: boolean;
  formatCurrency: (amount: number) => string;
}

export const CategorySection = ({
  category,
  categoryItems,
  onUpdateItem,
  onAddItem,
  onDeleteItem,
  isLocked,
  formatCurrency
}: CategorySectionProps) => {
  const handleInputChange = (itemId: string, field: keyof FeeItem, value: string) => {
    if (isLocked) return;
    
    if (field === 'description' || field === 'unit') {
      onUpdateItem(itemId, field, value);
    } else if (field === 'quantity' || field === 'unitPrice') {
      const numValue = value === '' ? 0 : parseFloat(value) || 0;
      onUpdateItem(itemId, field, numValue);
    }
  };

  return (
    <Card className="print:shadow-none print:border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          {category}
          {!isLocked && (
            <Button
              onClick={() => onAddItem(category)}
              size="sm"
              variant="outline"
              className="print:hidden"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 border-b pb-1 print:hidden">
            <div className="col-span-4">Description</div>
            <div className="col-span-1">Unit</div>
            <div className="col-span-2">Quantity</div>
            <div className="col-span-2">Unit Price</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-1">Actions</div>
          </div>

          <div className="print:hidden">
            {categoryItems.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center text-sm">
                <div className="col-span-4">
                  <DebouncedInput
                    initialValue={item.description}
                    onDebouncedChange={(value) => handleInputChange(item.id, 'description', value)}
                    className="h-7 text-xs"
                    disabled={isLocked}
                  />
                </div>
                <div className="col-span-1">
                  <DebouncedInput
                    initialValue={item.unit}
                    onDebouncedChange={(value) => handleInputChange(item.id, 'unit', value)}
                    className="h-7 text-xs"
                    disabled={isLocked}
                  />
                </div>
                <div className="col-span-2">
                  <DebouncedInput
                    initialValue={item.quantity}
                    onDebouncedChange={(value) => handleInputChange(item.id, 'quantity', value)}
                    className="h-7 text-xs"
                    disabled={isLocked}
                    placeholder="0"
                    inputMode="decimal"
                  />
                </div>
                <div className="col-span-2">
                  <DebouncedInput
                    initialValue={item.unitPrice}
                    onDebouncedChange={(value) => handleInputChange(item.id, 'unitPrice', value)}
                    className="h-7 text-xs"
                    disabled={isLocked}
                    placeholder="0"
                    inputMode="decimal"
                  />
                </div>
                <div className="col-span-2 font-medium">
                  {formatCurrency(item.total)}
                </div>
                <div className="col-span-1">
                  {!isLocked && (
                    <Button
                      onClick={() => onDeleteItem(item.id)}
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-2">
            <div className="grid grid-cols-12 gap-2 font-medium">
              <div className="col-span-11 text-right">Category Total:</div>
              <div className="col-span-1">
                {formatCurrency(categoryItems.reduce((sum, item) => sum + item.total, 0))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
