import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useState } from "react";

interface ProductCardProps {
  id: string;
  name: string;
  roomImageUrl?: string;
  textureImageUrl?: string;
  description?: string;
  priceTier?: string;
  isSelected?: boolean;
  isMasterDefault?: boolean;
  onSelect: (id: string) => void;
  showHoverEffect?: boolean;
}

export const ProductCard = ({
  id,
  name,
  roomImageUrl,
  textureImageUrl,
  description,
  priceTier = "standard",
  isSelected = false,
  isMasterDefault = false,
  onSelect,
  showHoverEffect = true
}: ProductCardProps) => {
  const [showTexture, setShowTexture] = useState(false);

  const displayImage = showTexture && textureImageUrl ? textureImageUrl : roomImageUrl;

  const priceTierColors = {
    standard: "bg-secondary",
    premium: "bg-primary",
    luxury: "bg-accent"
  };

  return (
    <Card 
      className={`relative overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onSelect(id)}
      onMouseEnter={() => showHoverEffect && setShowTexture(true)}
      onMouseLeave={() => showHoverEffect && setShowTexture(false)}
    >
      <CardContent className="p-0">
        <div className="relative aspect-[4/3] overflow-hidden">
          {displayImage && (
            <img
              src={displayImage}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          )}
          
          {isSelected && (
            <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
          
          {isMasterDefault && (
            <Badge className="absolute top-2 left-2 bg-accent">
              Master Default
            </Badge>
          )}
          
          {priceTier && priceTier !== 'standard' && (
            <Badge 
              className={`absolute bottom-2 right-2 ${priceTierColors[priceTier as keyof typeof priceTierColors]}`}
            >
              {priceTier.charAt(0).toUpperCase() + priceTier.slice(1)}
            </Badge>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-foreground mb-1">{name}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
          )}
          
          <Button 
            variant={isSelected ? "default" : "outline"} 
            size="sm" 
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(id);
            }}
          >
            {isSelected ? 'Selected' : 'Select'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
