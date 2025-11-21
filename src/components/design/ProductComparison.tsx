import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Check } from "lucide-react";

interface ComparisonProduct {
  id: string;
  name: string;
  imageUrl?: string;
  description?: string;
  priceTier?: string;
  details?: Record<string, string>;
}

interface ProductComparisonProps {
  products: ComparisonProduct[];
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export const ProductComparison = ({
  products,
  onRemove,
  onSelect,
  onClose
}: ProductComparisonProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Compare Products</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => (
            <Card key={product.id} className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10"
                onClick={() => onRemove(product.id)}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <CardContent className="p-4">
                {product.imageUrl && (
                  <div className="aspect-square mb-4 overflow-hidden rounded-lg">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <h3 className="font-semibold mb-2">{product.name}</h3>
                
                {product.priceTier && (
                  <Badge className="mb-3">
                    {product.priceTier}
                  </Badge>
                )}
                
                {product.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {product.description}
                  </p>
                )}
                
                {product.details && (
                  <div className="space-y-2 mb-4">
                    {Object.entries(product.details).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <Button
                  onClick={() => onSelect(product.id)}
                  className="w-full"
                  size="sm"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Select This One
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {products.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No products to compare. Add products to start comparing.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
