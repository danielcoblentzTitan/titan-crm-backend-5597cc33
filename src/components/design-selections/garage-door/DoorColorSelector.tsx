import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface DoorColorSelectorProps {
  selections: any;
  setSelections: (selections: any) => void;
  isEditing: boolean;
}

const colorPalette = [
  { name: "White", hex: "#FFFFFF", category: "Standard", image: null },
  { name: "Almond", hex: "#F5E6D3", category: "Standard", image: "/lovable-uploads/2e440841-eb8b-4ea2-953a-6ef6231677c3.png" },
  { name: "Desert Tan", hex: "#D2B48C", category: "Standard", image: "/lovable-uploads/e8b742ce-66d9-4320-bb43-2da0182414dc.png" },
  { name: "Sandtone", hex: "#C2B280", category: "Standard", image: "/lovable-uploads/629deaf1-0c6b-4c04-b655-271687df941e.png" },
  { name: "Chocolate", hex: "#7B3F00", category: "Standard", image: "/lovable-uploads/34ac62c1-cdbf-4794-a30e-fd24ca8cff98.png" },
  { name: "Black", hex: "#000000", category: "Standard", image: "/lovable-uploads/025c5629-bd26-4ace-996e-19fdaf7a0bb4.png" },
  { name: "Hunter Green", hex: "#355E3B", category: "Standard", image: "/lovable-uploads/0311f55d-9ece-4271-a283-c4ce8974600d.png" },
  { name: "Medium Wood Finish", hex: "#8B4513", category: "Premium", image: "/lovable-uploads/6d2fa969-aae6-4957-88a9-a5a60b03ec07.png" },
  { name: "Classic Cherry Finish", hex: "#722F37", category: "Premium", image: "/lovable-uploads/87bd7527-20f7-4541-a47d-378851b97259.png" },
  { name: "Classic Walnut Finish", hex: "#5D4037", category: "Premium", image: "/lovable-uploads/99c75f0e-0b56-4fa6-bef8-07a50b22a6c9.png" }
];

export const DoorColorSelector = ({ selections, setSelections, isEditing }: DoorColorSelectorProps) => {
  const [customColor, setCustomColor] = useState(selections.garage_door_custom_color || "");
  const handleColorSelect = (colorName: string) => {
    if (!isEditing) return;
    
    const newSelections = { ...selections };
    newSelections.garage_door_color = colorName.toLowerCase().replace(/\s+/g, '_');
    newSelections.garage_door_custom_color = "";
    setSelections(newSelections);
    setCustomColor("");
  };

  const handleCustomColorChange = (value: string) => {
    if (!isEditing) return;
    
    setCustomColor(value);
    const newSelections = { ...selections };
    newSelections.garage_door_custom_color = value;
    newSelections.garage_door_color = "";
    setSelections(newSelections);
  };

  // Separate standard and premium colors for different grid layouts
  const standardColors = colorPalette.filter(color => color.category === "Standard");
  const premiumColors = colorPalette.filter(color => color.category === "Premium");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Choose Your Door Color</h3>
        <p className="text-muted-foreground">
          Select from our curated color palette or specify a custom color.
        </p>
      </div>

      {/* Standard Colors */}
      <div>
        <h4 className="text-lg font-medium mb-3">Standard Colors</h4>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3">
          {standardColors.map((color) => {
            const isSelected = selections.garage_door_color === color.name.toLowerCase().replace(/\s+/g, '_');
            
            return (
              <div 
                key={color.name}
                className={`relative cursor-pointer group ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''} ${
                  !isEditing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => handleColorSelect(color.name)}
              >
                <div className={`border-2 rounded-lg overflow-hidden transition-all hover:scale-105 ${
                  isSelected ? 'border-primary shadow-lg' : 'border-gray-200 hover:border-gray-400'
                }`}>
                  <div className="w-full h-16 relative">
                    {color.image ? (
                      <img 
                        src={color.image} 
                        alt={color.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log(`Failed to load image for ${color.name}:`, color.image);
                          e.currentTarget.style.display = 'none';
                          const fallbackDiv = e.currentTarget.parentElement?.querySelector('.fallback-color');
                          if (fallbackDiv) {
                            fallbackDiv.classList.remove('hidden');
                          }
                        }}
                      />
                    ) : null}
                    <div 
                      className={`fallback-color w-full h-full absolute inset-0 ${color.image ? 'hidden' : ''}`}
                      style={{ backgroundColor: color.hex }}
                    />
                  </div>
                   <div className="p-2 bg-white">
                     <div className="text-xs font-medium text-center text-gray-900 leading-tight">
                       {color.name}
                     </div>
                   </div>
                </div>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Premium Wood Colors */}
      <div>
        <h4 className="text-lg font-medium mb-3">Premium Wood Finishes</h4>
        <div className="grid grid-cols-3 gap-3">
        {premiumColors.map((color) => {
          const isSelected = selections.garage_door_color === color.name.toLowerCase().replace(/\s+/g, '_');
          
          return (
            <div 
              key={color.name}
              className={`relative cursor-pointer group ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''} ${
                !isEditing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => handleColorSelect(color.name)}
            >
              <div className={`border-2 rounded-lg overflow-hidden transition-all hover:scale-105 ${
                isSelected ? 'border-primary shadow-lg' : 'border-gray-200 hover:border-gray-400'
              }`}>
                <div className="w-full h-16 relative">
                  {color.image ? (
                    <img 
                      src={color.image} 
                      alt={color.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log(`Failed to load image for ${color.name}:`, color.image);
                        // Hide the image and show the fallback color
                        e.currentTarget.style.display = 'none';
                        const fallbackDiv = e.currentTarget.parentElement?.querySelector('.fallback-color');
                        if (fallbackDiv) {
                          fallbackDiv.classList.remove('hidden');
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className={`fallback-color w-full h-full absolute inset-0 ${color.image ? 'hidden' : ''}`}
                    style={{ backgroundColor: color.hex }}
                  />
                </div>
                 <div className="p-2 bg-white">
                   <div className="text-xs font-medium text-center text-gray-900 leading-tight">
                     {color.name}
                   </div>
                 </div>
              </div>
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>

      {/* Custom Color Section */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="space-y-3">
            <Label htmlFor="custom-color" className="text-sm font-medium">
              Custom Color (Optional)
            </Label>
            <div className="flex gap-3">
              <Input
                id="custom-color"
                placeholder="Enter custom color name or code..."
                value={customColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                disabled={!isEditing}
                className="flex-1"
              />
              <input
                type="color"
                value={customColor.startsWith('#') ? customColor : '#ffffff'}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                disabled={!isEditing}
                className="w-12 h-10 border border-input rounded cursor-pointer disabled:opacity-50"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Note: Custom colors may require additional lead time and upgraded product pricing.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Selection Summary */}
      {(selections.garage_door_color || selections.garage_door_custom_color) && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm font-medium">
                Selected: {
                  selections.garage_door_custom_color 
                    ? `Custom Color (${selections.garage_door_custom_color})`
                    : colorPalette.find(c => c.name.toLowerCase().replace(/\s+/g, '_') === selections.garage_door_color)?.name
                }
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};