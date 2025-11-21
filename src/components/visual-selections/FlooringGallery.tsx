import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "./ProductCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface FlooringGalleryProps {
  selectedProductId?: string;
  masterDefaultId?: string;
  onSelectProduct: (productId: string) => void;
}

export const FlooringGallery = ({
  selectedProductId,
  masterDefaultId,
  onSelectProduct
}: FlooringGalleryProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriceTier, setSelectedPriceTier] = useState<string>("all");

  const { data: products, isLoading } = useQuery({
    queryKey: ['flooring_products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flooring_products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data;
    }
  });

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriceTier = selectedPriceTier === 'all' || product.price_tier === selectedPriceTier;
    return matchesSearch && matchesPriceTier;
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted aspect-[4/3] rounded-lg mb-4"></div>
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search flooring products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Tabs value={selectedPriceTier} onValueChange={setSelectedPriceTier} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="standard">Standard</TabsTrigger>
            <TabsTrigger value="premium">Premium</TabsTrigger>
            <TabsTrigger value="luxury">Luxury</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts?.map(product => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            roomImageUrl={product.room_image_url || undefined}
            textureImageUrl={product.texture_image_url || undefined}
            description={product.description || undefined}
            priceTier={product.price_tier || 'standard'}
            isSelected={product.id === selectedProductId}
            isMasterDefault={product.id === masterDefaultId}
            onSelect={onSelectProduct}
            showHoverEffect={true}
          />
        ))}
      </div>

      {filteredProducts?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No flooring products found matching your criteria.
        </div>
      )}
    </div>
  );
};
