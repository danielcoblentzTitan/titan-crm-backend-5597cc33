import { Card, CardContent } from "@/components/ui/card";

interface GarageDoorSummaryProps {
  selections: any;
}

export const GarageDoorSummary = ({ selections }: GarageDoorSummaryProps) => {
  // Door style definitions with images
  const doorStyles = [
    { id: "traditional_short", name: "Traditional Short Panel", description: "Classic raised panel design with shorter panel sections", image: "/lovable-uploads/d9bc815e-a09f-447a-b426-2de6665eb2f1.png" },
    { id: "traditional_long", name: "Traditional Long Panel", description: "Classic raised panel design with longer panel sections", image: "/lovable-uploads/62cf7e25-2655-48b4-83be-bb2b2ad9c6c9.png" },
    { id: "carriage_house", name: "Carriage House", description: "Classic carriage house style with decorative hardware", image: "/lovable-uploads/ab90334e-aba4-4cc0-8fc2-a09141b70aaf.png" },
    { id: "full_view_option", name: "Full View Option", description: "Modern full glass panel design for maximum natural light", image: "/lovable-uploads/bc2fbebe-c886-4a8a-bd6d-176c7c1a4ba3.png" },
    { id: "wood_carriage_style", name: "Wood Carriage Style", description: "Premium carriage house style with authentic wood finish", image: "/lovable-uploads/0d81495b-7e96-4dd4-98fe-1033cf82b79f.png" },
    { id: "coachman_carriage_house", name: "Coachman Carriage House", description: "Traditional coachman style carriage house door", image: "/lovable-uploads/7c5d0a7f-778f-4cb3-aa8f-828480c10fb4.png" }
  ];

  // Get the selected door style info
  const getDoorStyleInfo = () => {
    return doorStyles.find(style => style.id === selections.garage_door_style) || 
           { name: "No Style Selected", description: "Please select a door style", image: null };
  };

  // Get color info
  const getColorInfo = () => {
    if (selections.garage_door_custom_color) {
      return `Custom Color: ${selections.garage_door_custom_color}`;
    }
    
    const colorMap: { [key: string]: string } = {
      white: "White",
      almond: "Almond",
      desert_tan: "Desert Tan",
      sandtone: "Sandtone", 
      chocolate: "Chocolate",
      black: "Black",
      hunter_green: "Hunter Green",
      medium_wood_finish: "Medium Wood Finish",
      classic_cherry_finish: "Classic Cherry Finish",
      classic_walnut_finish: "Classic Walnut Finish"
    };
    
    return colorMap[selections.garage_door_color] || "No Color Selected";
  };

  // Get window info
  const getWindowInfo = () => {
    const windowMap: { [key: string]: string } = {
      none: "No Windows",
      plain_short: "Plain Short",
      short_rectangular_grilles: "Short with Rectangular Grilles",
      short_square_grilles: "Short with Square Grilles", 
      plain_long: "Plain Long",
      long_rectangular_grilles: "Long with Rectangular Grilles",
      long_square_grilles: "Long with Square Grilles",
      arch1_plain: "Arch1 Plain",
      arch1_vertical_grilles: "Arch1 with Vertical Grilles",
      arch1_grilles: "Arch1 with Grilles",
      arch2_plain: "Arch2 Plain", 
      arch2_vertical_grilles: "Arch2 with Vertical Grilles",
      arch2_grilles: "Arch2 with Grilles"
    };
    
    return windowMap[selections.garage_door_windows] || "No Windows Selected";
  };

  // Get hardware info
  const getHardwareInfo = () => {
    const hardware = selections.garage_door_hardware || {};
    const selectedHardware = [];
    
    if (hardware.handles) selectedHardware.push("Decorative Handles");
    if (hardware.hinges) selectedHardware.push("Decorative Hinges");
    if (hardware.clavos) selectedHardware.push("Clavos");
    if (hardware.smart_opener) selectedHardware.push("Smart Opener");
    
    return selectedHardware.length > 0 ? selectedHardware.join(", ") : "No Hardware Selected";
  };

  const doorStyle = getDoorStyleInfo();

  return (
    <Card className="bg-muted/20 border-2">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Door Style Visual */}
          <div className="w-16 h-16 bg-muted rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
            {doorStyle.image ? (
              <img 
                src={doorStyle.image} 
                alt={doorStyle.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-12 h-12 bg-primary/20 rounded border-2 border-primary/40"></div>
            )}
          </div>
          
          {/* Summary Content */}
          <div className="flex-1 space-y-3">
            {/* Selected Style */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="font-semibold text-sm">Selected: {doorStyle.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{doorStyle.description}</p>
            </div>
            
            {/* Summary Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-medium text-muted-foreground">Color:</span>
                <div className="text-foreground">{getColorInfo()}</div>
              </div>
              
              <div>
                <span className="font-medium text-muted-foreground">Windows:</span>
                <div className="text-foreground">{getWindowInfo()}</div>
              </div>
              
              <div className="col-span-2">
                <span className="font-medium text-muted-foreground">Hardware:</span>
                <div className="text-foreground">{getHardwareInfo()}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};