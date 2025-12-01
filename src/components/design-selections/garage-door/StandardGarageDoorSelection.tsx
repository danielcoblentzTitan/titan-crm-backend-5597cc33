import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import shortPanelImage from "@/assets/garage-door-short-full.jpg";
import longPanelImage from "@/assets/garage-door-long-panel-close.jpg";
import windowOptionsImage from "/lovable-uploads/2790377b-4440-4c81-8c6f-7be90d3442da.png";

interface StandardGarageDoorSelectionProps {
  selections: any;
  setSelections: (selections: any) => void;
  isEditing: boolean;
  onSwitchToCustom: () => void;
}

export const StandardGarageDoorSelection = ({ 
  selections, 
  setSelections, 
  isEditing, 
  onSwitchToCustom 
}: StandardGarageDoorSelectionProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Standard Garage Door Selection</CardTitle>
          <Button variant="outline" onClick={onSwitchToCustom} disabled={!isEditing}>
            <Settings className="h-4 w-4 mr-2" />
            Switch to Custom Designer
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Choose your garage door style, color, and window options from our standard selections.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Panel Selection */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Panel Selection</h4>
          <p className="text-sm text-muted-foreground">
            Add depth to your garage door with C.H.I.'s raised panel design, available in both short and long panel options.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="border-2 rounded-lg p-4 mb-3 cursor-pointer hover:border-primary transition-colors"
                   onClick={() => {
                     if (isEditing) {
                       const newSelections = { ...selections };
                       newSelections.garage_panel_type = 'short';
                       setSelections(newSelections);
                     }
                   }}
                   style={{ borderColor: selections.garage_panel_type === 'short' ? 'var(--primary)' : '#e5e7eb' }}>
                <img 
                  src={shortPanelImage} 
                  alt="Short Panel Garage Door"
                  className="w-full h-32 object-cover rounded"
                />
              </div>
              <label className="flex items-center justify-center space-x-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="garage_panel_type" 
                  value="short"
                  checked={selections.garage_panel_type === 'short'}
                  onChange={() => {
                    if (isEditing) {
                      const newSelections = { ...selections };
                      newSelections.garage_panel_type = 'short';
                      setSelections(newSelections);
                    }
                  }}
                  disabled={!isEditing}
                  className="text-primary"
                />
                <span className="font-medium">Short Panel</span>
              </label>
            </div>
            <div className="text-center">
              <div className="border-2 rounded-lg p-4 mb-3 cursor-pointer hover:border-primary transition-colors"
                   onClick={() => {
                     if (isEditing) {
                       const newSelections = { ...selections };
                       newSelections.garage_panel_type = 'long';
                       setSelections(newSelections);
                     }
                   }}
                   style={{ borderColor: selections.garage_panel_type === 'long' ? 'var(--primary)' : '#e5e7eb' }}>
                 <img 
                   src={longPanelImage} 
                   alt="Long Panel Garage Door"
                   className="w-full h-32 object-cover rounded"
                   style={{ objectPosition: 'center 30%' }}
                 />
              </div>
              <label className="flex items-center justify-center space-x-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="garage_panel_type" 
                  value="long"
                  checked={selections.garage_panel_type === 'long'}
                  onChange={() => {
                    if (isEditing) {
                      const newSelections = { ...selections };
                      newSelections.garage_panel_type = 'long';
                      setSelections(newSelections);
                    }
                  }}
                  disabled={!isEditing}
                  className="text-primary"
                />
                <span className="font-medium">Long Panel</span>
              </label>
            </div>
          </div>
        </div>

        {/* Color Selection */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Color Selection</h4>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {[
              { name: "White", hex: "#F8F8F8" },
              { name: "Almond", hex: "#D4C5A9" },
              { name: "Brown", hex: "#6B4423" },
              { name: "Gray", hex: "#9B9B9B" },
              { name: "Desert Tan", hex: "#D2B48C" },
              { name: "Black", hex: "#1C1C1C" },
              { name: "Graphite", hex: "#41424C" },
              { name: "Evergreen", hex: "#2F5233" }
            ].map((color) => {
              const isSelected = selections.garage_door_color === color.name.toLowerCase().replace(' ', '_');
              return (
                <div 
                  key={color.name}
                  className={`relative cursor-pointer group ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  onClick={() => {
                    if (isEditing) {
                      const newSelections = { ...selections };
                      newSelections.garage_door_color = color.name.toLowerCase().replace(' ', '_');
                      setSelections(newSelections);
                    }
                  }}
                >
                  <div className={`border-2 rounded-lg overflow-hidden transition-all hover:scale-105 ${
                    isSelected ? 'border-primary shadow-lg' : 'border-gray-200 hover:border-gray-400'
                  }`}>
                    <div 
                      className="w-full h-12 relative"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="p-1 bg-white">
                      <div className="text-xs font-medium text-center text-gray-900 leading-tight truncate">{color.name}</div>
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

        {/* Garage Door Window Selection */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Garage Door Window Selection</h4>
          <p className="text-sm text-muted-foreground">Choose from our available window styles</p>
          
          {/* Window Reference Image */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <img 
              src={windowOptionsImage} 
              alt="Garage Door Window Options"
              className="w-full h-auto rounded-lg border"
            />
            <p className="text-xs text-gray-600 mt-2 text-center">
              Reference: Available window insert styles for short and long panel doors
            </p>
          </div>
          
          {/* Window Selection Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Window Style:</label>
            <Select
              value={selections.garage_door_windows || ""}
              onValueChange={(value) => {
                if (isEditing) {
                  const newSelections = { ...selections };
                  newSelections.garage_door_windows = value;
                  setSelections(newSelections);
                }
              }}
              disabled={!isEditing}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a window style..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Windows</SelectItem>
                <SelectItem value="plain_short">Plain Short</SelectItem>
                <SelectItem value="cascade_short">Cascade Short</SelectItem>
                <SelectItem value="stockton_short">Stockton Short</SelectItem>
                <SelectItem value="prairie_short">Prairie Short</SelectItem>
                <SelectItem value="waterton_short">Waterton Short</SelectItem>
                <SelectItem value="sherwood_short">Sherwood Short</SelectItem>
                <SelectItem value="cathedral_short">Cathedral Short</SelectItem>
                <SelectItem value="sunburst_short">Sunburst Short</SelectItem>
                <SelectItem value="plain_long">Plain Long</SelectItem>
                <SelectItem value="cascade_long">Cascade Long</SelectItem>
                <SelectItem value="stockton_long">Stockton Long</SelectItem>
                <SelectItem value="arched_stockton_long">Arched Stockton Long</SelectItem>
                <SelectItem value="madison_long">Madison Long</SelectItem>
                <SelectItem value="arched_madison_long">Arched Madison Long</SelectItem>
                <SelectItem value="prairie_long">Prairie Long</SelectItem>
                <SelectItem value="waterton_long">Waterton Long</SelectItem>
                <SelectItem value="sherwood_long">Sherwood Long</SelectItem>
                <SelectItem value="sunburst_long">Sunburst Long</SelectItem>
              </SelectContent>
            </Select>
            
            {selections.garage_door_windows && (
              <div className="mt-2 px-3 py-2 bg-green-50 text-green-800 text-sm rounded-lg">
                Selected: {selections.garage_door_windows.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
            )}
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> Window styles are shown in the reference image above. Final appearance may vary based on door size and manufacturer specifications.
            </p>
          </div>
        </div>

        {/* Upgrade Notice */}
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h5 className="font-semibold text-sm">Want More Options?</h5>
                <p className="text-sm text-muted-foreground mb-3">
                  Use our Custom Designer for advanced features like decorative hardware, insulation upgrades, and premium finishes.
                </p>
                <Button variant="outline" size="sm" onClick={onSwitchToCustom} disabled={!isEditing}>
                  Try Custom Designer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};