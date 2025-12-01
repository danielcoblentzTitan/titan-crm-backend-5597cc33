import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Trash2, Package, GripVertical } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PricingCategory, PricingItemWithCategory } from "@/services/pricingService";
import { FormulaCalculator } from "./FormulaCalculator";
import { FormulaResult } from "@/services/formulaService";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableCategoryItemProps {
  categoryId: string;
  categoryItems: PricingItemWithCategory[];
  category: PricingCategory | undefined;
  onCategoryNameChange: (categoryId: string, newName: string) => void;
  onItemNameChange: (itemId: string, newName: string) => void;
  onPriceChange: (itemId: string, newPrice: number) => void;
  onUnitTypeChange: (itemId: string, newUnitType: string) => void;
  onDeleteItem: (itemId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  buildingDimensions?: {
    width: number;
    length: number;
  } | null;
}

export const SortableCategoryItem = ({
  categoryId,
  categoryItems,
  category,
  onCategoryNameChange,
  onItemNameChange,
  onPriceChange,
  onUnitTypeChange,
  onDeleteItem,
  onDeleteCategory,
  buildingDimensions
}: SortableCategoryItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: categoryId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const categoryName = category?.name || 'Uncategorized';

  const unitTypeOptions = [
    'each', 'Each', 'sq ft', 'lin ft', 'wall sq ft', 'roof sq ft', 'inside wall sq ft', 'per door', 'per window'
  ];

  return (
    <AccordionItem 
      ref={setNodeRef} 
      style={style}
      key={categoryId} 
      value={categoryId} 
      className="border border-border rounded-lg"
    >
      <AccordionTrigger className="bg-primary/5 rounded-t-lg px-4 py-3 border-l-4 border-primary hover:no-underline">
        <div className="flex items-center justify-between w-full mr-4">
          <div className="flex items-center gap-2 flex-1">
            <div 
              {...attributes} 
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-primary/10 rounded"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              value={categoryName}
              onChange={(e) => {
                e.stopPropagation();
                onCategoryNameChange(categoryId, e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-xl font-bold text-primary border-0 bg-transparent p-0 h-auto focus-visible:ring-1 focus-visible:ring-primary mr-4"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {categoryItems.length} item{categoryItems.length !== 1 ? 's' : ''}
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Category</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{categoryName}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onDeleteCategory(categoryId)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </AccordionTrigger>
       
      <AccordionContent className="px-4 pb-4">
        {categoryItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No items in this category</p>
          </div>
        ) : (
          <>
            {/* Column Headers */}
            <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground border-b pb-2 mb-4">
              <div className="col-span-5">Item Name</div>
              <div className="col-span-2">Unit Type</div>
              <div className="col-span-3">Base Price</div>
              <div className="col-span-2">Actions</div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              {categoryItems.map((item) => (
                <div key={item.id}>
                  <div className="grid grid-cols-12 gap-2 items-center py-3 border-b border-border/30 hover:bg-muted/30 rounded-lg px-2">
                    <div className="col-span-5">
                      <div className="flex items-center gap-2">
                        <Input
                          value={item.name}
                          onChange={(e) => onItemNameChange(item.id, e.target.value)}
                          className="font-medium border-0 bg-transparent p-0 h-auto focus-visible:ring-1 focus-visible:ring-primary"
                        />
                        {item.has_formula && (
                          <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded">Formula</span>
                        )}
                      </div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Select
                        value={item.unit_type}
                        onValueChange={(value) => onUnitTypeChange(item.id, value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {unitTypeOptions.map((unitType) => (
                            <SelectItem key={unitType} value={unitType}>
                              {unitType}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <div className="flex items-center">
                        <span className="text-sm mr-1">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.base_price}
                          onChange={(e) => onPriceChange(item.id, Number(e.target.value))}
                          className="text-sm h-8 w-24"
                        />
                        {item.has_formula && (
                          <span className="text-xs text-muted-foreground ml-2">base</span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteItem(item.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {item.has_formula && (
                    <div className="pl-2 pr-2 pb-2">
                      <FormulaCalculator 
                        item={item}
                        buildingDimensions={buildingDimensions}
                        onCalculationChange={(result: FormulaResult | null) => {
                          console.log('Formula calculation:', result);
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};