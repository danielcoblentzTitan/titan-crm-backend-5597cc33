import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Folder, Package, Download } from "lucide-react";
import { PricingCategory } from "@/services/pricingService";
import PlumbingCalculator from "@/components/PlumbingCalculator";

interface MasterPricingControlsProps {
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: PricingCategory[];
  onAddCategory: () => void;
  onAddItem: () => void;
  onExport: () => void;
  onAddToMechanicals?: (itemName: string, price: number) => void;
}

export const MasterPricingControls = ({
  selectedCategory,
  onCategoryChange,
  categories,
  onAddCategory,
  onAddItem,
  onExport,
  onAddToMechanicals
}: MasterPricingControlsProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center space-x-2">
        <Label htmlFor="category-filter">Filter by Category:</Label>
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={onAddCategory}>
          <Folder className="h-4 w-4 mr-2" />
          Add Category
        </Button>

        <Button variant="outline" size="sm" onClick={onAddItem}>
          <Package className="h-4 w-4 mr-2" />
          Add Item
        </Button>

        <PlumbingCalculator 
          onCalculationComplete={(total, breakdown) => {
            console.log('Plumbing calculation:', { total, breakdown });
          }}
          onAddToMechanicals={onAddToMechanicals}
        />

        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>
    </div>
  );
};