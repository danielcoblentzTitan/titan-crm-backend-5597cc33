import { Card, CardContent } from "@/components/ui/card";
import { Folder, Package, DollarSign } from "lucide-react";
import { PricingCategory, PricingItemWithCategory } from "@/services/pricingService";

interface MasterPricingStatsProps {
  categories: PricingCategory[];
  items: PricingItemWithCategory[];
}

export const MasterPricingStats = ({ categories, items }: MasterPricingStatsProps) => {
  const averagePrice = items.length > 0 
    ? (items.reduce((sum, item) => sum + item.base_price, 0) / items.length).toFixed(2)
    : '0.00';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Categories</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
            <Folder className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{items.length}</p>
            </div>
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg. Price</p>
              <p className="text-2xl font-bold">${averagePrice}</p>
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};