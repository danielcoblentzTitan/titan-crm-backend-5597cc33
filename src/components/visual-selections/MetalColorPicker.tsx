import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";

interface MetalColorPickerProps {
  selectedColorId?: string;
  masterDefaultId?: string;
  onSelectColor: (colorId: string) => void;
}

export const MetalColorPicker = ({
  selectedColorId,
  masterDefaultId,
  onSelectColor
}: MetalColorPickerProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: colors, isLoading } = useQuery({
    queryKey: ['metal_color_products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metal_color_products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data;
    }
  });

  const filteredColors = colors?.filter(color => {
    const matchesSearch = color.color_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         color.product_code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || color.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted aspect-square rounded-lg mb-2"></div>
            <div className="h-3 bg-muted rounded"></div>
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
            placeholder="Search colors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="standard">Standard</TabsTrigger>
            <TabsTrigger value="premium">Premium</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredColors?.map(color => (
          <Card
            key={color.id}
            className={`relative cursor-pointer transition-all hover:shadow-lg ${
              color.id === selectedColorId ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onSelectColor(color.id)}
          >
            <CardContent className="p-0">
              <div 
                className="aspect-square rounded-t-lg relative"
                style={{ backgroundColor: color.hex_color || '#ccc' }}
              >
                {color.id === selectedColorId && (
                  <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                
                {color.id === masterDefaultId && (
                  <Badge className="absolute top-2 left-2 bg-accent text-xs">
                    Master
                  </Badge>
                )}
                
                {color.category === 'premium' && (
                  <Badge className="absolute bottom-2 right-2 bg-primary text-xs">
                    Premium
                  </Badge>
                )}
              </div>
              
              <div className="p-3">
                <p className="font-semibold text-sm text-foreground">{color.color_name}</p>
                {color.product_code && (
                  <p className="text-xs text-muted-foreground">{color.product_code}</p>
                )}
                {color.finish_type && (
                  <p className="text-xs text-muted-foreground capitalize">{color.finish_type}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredColors?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No colors found matching your criteria.
        </div>
      )}
    </div>
  );
};
