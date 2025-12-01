import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
const windowOptionsImage = "/lovable-uploads/81a32074-218c-40c1-a68b-4ef9650d82ca.png";

// Window style images mapping
const windowImages = {
  "plain_short": "/lovable-uploads/c2f09fe8-3301-4672-879f-4851608544f8.png",
  "short_rectangular_grilles": "/lovable-uploads/d0c5f45c-133d-4d74-aadb-38be7f1d2de0.png",
  "short_square_grilles": "/lovable-uploads/36eee50a-f688-48cd-8daf-3cc633f1c148.png",
  "plain_long": "/lovable-uploads/127e6aac-dcc1-4673-a75c-e0cb2b9f847b.png",
  "long_rectangular_grilles": "/lovable-uploads/e47b7a77-ee47-4ba4-a810-867c573fe2a1.png",
  "long_square_grilles": "/lovable-uploads/0a3886cb-9a2d-48a6-bb6f-b03513531702.png",
  "arch1_plain": "/lovable-uploads/da54ce0e-4eb2-485b-9e7d-bf109181f550.png",
  "arch1_vertical_grilles": "/lovable-uploads/7a1a13db-8702-410c-b852-54011af1ff38.png",
  "arch1_grilles": "/lovable-uploads/3c6f0188-2a05-4c93-a18f-e078e6bc07d1.png",
  "arch2_plain": "/lovable-uploads/8e5558d1-767e-483f-a29b-e424ddc0ce45.png",
  "arch2_vertical_grilles": "/lovable-uploads/01e3fccf-471e-4323-af1e-46aea1a3019f.png",
  "arch2_grilles": "/lovable-uploads/e5b044de-e8fe-4481-a5c9-faee6e7c3582.png"
};

interface WindowSelectorProps {
  selections: any;
  setSelections: (selections: any) => void;
  isEditing: boolean;
}

const windowStyles = [
  { value: "none", label: "No Windows", category: "None", description: "Clean door with no window openings" },
  
  // Individual Window Styles from Grid
  { value: "plain_short", label: "Plain Short", category: "Window Styles", description: "Simple rectangular windows in short format" },
  { value: "short_rectangular_grilles", label: "Short with Rectangular Grilles", category: "Window Styles", description: "Short windows with rectangular grid pattern" },
  { value: "short_square_grilles", label: "Short with Square Grilles", category: "Window Styles", description: "Short windows with square grid pattern" },
  { value: "plain_long", label: "Plain Long", category: "Window Styles", description: "Simple rectangular windows in long format" },
  { value: "long_rectangular_grilles", label: "Long with Rectangular Grilles", category: "Window Styles", description: "Long windows with rectangular grid pattern" },
  { value: "long_square_grilles", label: "Long with Square Grilles", category: "Window Styles", description: "Long windows with square grid pattern" },
  { value: "arch1_plain", label: "Arch1 Plain", category: "Window Styles", description: "Arched windows without grilles" },
  { value: "arch1_vertical_grilles", label: "Arch1 with Vertical Grilles", category: "Window Styles", description: "Arched windows with vertical grid pattern" },
  { value: "arch1_grilles", label: "Arch1 with Grilles", category: "Window Styles", description: "Arched windows with full grid pattern" },
  { value: "arch2_plain", label: "Arch2 Plain", category: "Window Styles", description: "Deeper arched windows without grilles" },
  { value: "arch2_vertical_grilles", label: "Arch2 with Vertical Grilles", category: "Window Styles", description: "Deeper arched windows with vertical grid pattern" },
  { value: "arch2_grilles", label: "Arch2 with Grilles", category: "Window Styles", description: "Deeper arched windows with full grid pattern" }
];

export const WindowSelector = ({ selections, setSelections, isEditing }: WindowSelectorProps) => {
  const handleWindowChange = (value: string) => {
    if (!isEditing) return;
    
    const newSelections = { ...selections };
    newSelections.garage_door_windows = value;
    setSelections(newSelections);
  };

  const selectedWindow = windowStyles.find(w => w.value === selections.garage_door_windows);
  
  // All windows are now compatible with all door styles
  const compatibleWindows = windowStyles;

  const categories = Array.from(new Set(compatibleWindows.map(w => w.category)));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Choose Window Style</h3>
        <p className="text-muted-foreground">
          Add natural light and visual appeal with our selection of window styles.
        </p>
      </div>


      {/* Window Selection Grid */}
      <div className="space-y-4">
        <label className="text-sm font-medium">Select Window Style:</label>
        
        {categories.map(category => (
          <div key={category} className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground border-b pb-1">
              {category}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {compatibleWindows
                .filter(window => window.category === category)
                .map(window => (
                  <Card 
                    key={window.value}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selections.garage_door_windows === window.value
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => handleWindowChange(window.value)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Window Visual */}
                        <div className="w-full h-20 bg-muted rounded overflow-hidden flex items-center justify-center">
                          {window.value === "none" ? (
                            <div className="text-xs text-muted-foreground text-center">
                              No Windows
                            </div>
                          ) : windowImages[window.value as keyof typeof windowImages] ? (
                            <img 
                              src={windowImages[window.value as keyof typeof windowImages]} 
                              alt={window.label}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-xs text-muted-foreground text-center">
                              {window.label}
                            </div>
                          )}
                        </div>
                        
                        {/* Window Info */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {selections.garage_door_windows === window.value && (
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                            )}
                            <span className="text-sm font-medium">{window.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {window.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Window Notes */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-blue-900">Window Style Notes:</h4>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Window styles are compatible with selected door panel type</li>
              <li>Premium styles may require upgraded product pricing</li>
              <li>All windows include standard clear insulated glass</li>
              <li>Custom glass options available upon request</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};