import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

interface DesignPreviewProps {
  selections: any;
}

export const DesignPreview = ({ selections }: DesignPreviewProps) => {
  const getStyleName = () => {
    const styleMap: { [key: string]: string } = {
      "traditional_short": "Traditional Short Panel",
      "traditional_long": "Traditional Long Panel", 
      "carriage_house": "Carriage House",
      "modern_flush": "Modern Flush",
      "contemporary": "Contemporary Glass"
    };
    return styleMap[selections.garage_door_style] || "Not Selected";
  };

  const getColorName = () => {
    if (selections.garage_door_custom_color) {
      return `Custom: ${selections.garage_door_custom_color}`;
    }
    if (selections.garage_door_color) {
      return selections.garage_door_color.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    }
    return "Not Selected";
  };

  const getWindowName = () => {
    if (!selections.garage_door_windows || selections.garage_door_windows === "none") {
      return "No Windows";
    }
    return selections.garage_door_windows.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  const getHardwareList = () => {
    const hardware = selections.garage_door_hardware || {};
    const features = selections.garage_door_features || {};
    const items = [];

    // Hardware items
    Object.entries(hardware).forEach(([type, value]) => {
      if (value && value !== "none") {
        const displayName = (value as string).replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        items.push(`${type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}: ${displayName}`);
      }
    });

    // Feature items
    Object.entries(features).forEach(([feature, enabled]) => {
      if (enabled) {
        const displayName = feature.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        items.push(displayName);
      }
    });

    return items;
  };

  const isComplete = selections.garage_door_style && selections.garage_door_color && selections.garage_door_windows !== undefined;

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Design Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual Representation */}
        <div className="relative bg-gradient-to-b from-sky-100 to-green-100 rounded-lg p-4 min-h-32">
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            {/* Simple garage door representation */}
            <div 
              className="w-24 h-16 border-2 rounded-sm relative"
              style={{ 
                backgroundColor: selections.garage_door_custom_color?.startsWith('#') 
                  ? selections.garage_door_custom_color 
                  : '#f8f8f8',
                borderColor: '#666'
              }}
            >
              {/* Panel lines based on style */}
              {selections.garage_panel_type === 'short' && (
                <>
                  <div className="absolute top-1/4 left-0 right-0 h-px bg-gray-400"></div>
                  <div className="absolute top-2/4 left-0 right-0 h-px bg-gray-400"></div>
                  <div className="absolute top-3/4 left-0 right-0 h-px bg-gray-400"></div>
                </>
              )}
              {selections.garage_panel_type === 'long' && (
                <>
                  <div className="absolute top-1/3 left-0 right-0 h-px bg-gray-400"></div>
                  <div className="absolute top-2/3 left-0 right-0 h-px bg-gray-400"></div>
                </>
              )}
              
              {/* Windows */}
              {selections.garage_door_windows && selections.garage_door_windows !== "none" && (
                <div className="absolute top-2 left-2 right-2 h-4 bg-blue-200 border border-blue-300 rounded-sm opacity-80"></div>
              )}
              
              {/* Hardware indicators */}
              {selections.garage_door_hardware?.handles && selections.garage_door_hardware.handles !== "none" && (
                <div className="absolute right-1 top-1/2 w-1 h-2 bg-gray-600 rounded-full transform -translate-y-1/2"></div>
              )}
            </div>
          </div>
        </div>

        {/* Selection Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progress:</span>
            <Badge variant={isComplete ? "default" : "secondary"}>
              {isComplete ? "Complete" : "In Progress"}
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Style:</span>
              <span className="ml-2 text-muted-foreground">{getStyleName()}</span>
            </div>
            
            <div>
              <span className="font-medium">Color:</span>
              <span className="ml-2 text-muted-foreground">{getColorName()}</span>
            </div>
            
            <div>
              <span className="font-medium">Windows:</span>
              <span className="ml-2 text-muted-foreground">{getWindowName()}</span>
            </div>

            {getHardwareList().length > 0 && (
              <div>
                <span className="font-medium">Hardware & Features:</span>
                <ul className="ml-4 mt-1 space-y-1">
                  {getHardwareList().map((item, index) => (
                    <li key={index} className="text-xs text-muted-foreground">• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {!isComplete && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-3">
              <p className="text-xs text-yellow-800">
                Complete all required selections to finish your custom garage door design.
              </p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};