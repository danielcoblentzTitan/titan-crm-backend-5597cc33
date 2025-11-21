import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Trash2, Package, GripVertical } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PricingCategory, PricingItemWithCategory } from "@/services/pricingService";
import { FormulaCalculator } from "./FormulaCalculator";
import { FormulaResult } from "@/services/formulaService";
import { SortableCategoryItem } from "./SortableCategoryItem";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MasterPricingTableProps {
  selectedCategory: string;
  categories: PricingCategory[];
  filteredItems: PricingItemWithCategory[];
  groupedItems: Record<string, PricingItemWithCategory[]>;
  onCategoryNameChange: (categoryId: string, newName: string) => void;
  onItemNameChange: (itemId: string, newName: string) => void;
  onPriceChange: (itemId: string, newPrice: number) => void;
  onUnitTypeChange: (itemId: string, newUnitType: string) => void;
  onDeleteItem: (itemId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onReorderCategories: (activeId: string, overId: string) => void;
  buildingDimensions?: {
    width: number;
    length: number;
  } | null;
}

export const MasterPricingTable = ({
  selectedCategory,
  categories,
  filteredItems,
  groupedItems,
  onCategoryNameChange,
  onItemNameChange,
  onPriceChange,
  onUnitTypeChange,
  onDeleteItem,
  onDeleteCategory,
  onReorderCategories,
  buildingDimensions
}: MasterPricingTableProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Ensure all categories are shown, even if they have no items
  const allCategoryEntries = categories
    .filter(category => selectedCategory === "all" || category.id === selectedCategory)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map(category => [
      category.id, 
      groupedItems[category.id] || []
    ] as [string, PricingItemWithCategory[]]);

  const categoryIds = allCategoryEntries.map(([categoryId]) => categoryId);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      onReorderCategories(active.id as string, over.id as string);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {selectedCategory === "all" ? "All Items" : categories.find(c => c.id === selectedCategory)?.name || "Items"}
          <span className="text-sm text-muted-foreground ml-2">({filteredItems.length} items)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allCategoryEntries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No items found</p>
            <p className="text-sm">Create some items to get started with your pricing sheet.</p>
          </div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
              <Accordion type="multiple" defaultValue={[]} className="space-y-4">
                {allCategoryEntries.map(([categoryId, categoryItems]) => {
                  const category = categories.find(cat => cat.id === categoryId);
                  
                  return (
                    <SortableCategoryItem
                      key={categoryId}
                      categoryId={categoryId}
                      categoryItems={categoryItems}
                      category={category}
                      onCategoryNameChange={onCategoryNameChange}
                      onItemNameChange={onItemNameChange}
                      onPriceChange={onPriceChange}
                      onUnitTypeChange={onUnitTypeChange}
                      onDeleteItem={onDeleteItem}
                      onDeleteCategory={onDeleteCategory}
                      buildingDimensions={buildingDimensions}
                    />
                  );
                })}
              </Accordion>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
};