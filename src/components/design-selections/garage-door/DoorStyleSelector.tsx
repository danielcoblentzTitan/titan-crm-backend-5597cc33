import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Eye, Upload, ExternalLink } from "lucide-react";

// Using uploaded images directly
const traditionalShortImage = "/lovable-uploads/d9bc815e-a09f-447a-b426-2de6665eb2f1.png";
const traditionalLongImage = "/lovable-uploads/62cf7e25-2655-48b4-83be-bb2b2ad9c6c9.png";
const carriageHouseImage = "/lovable-uploads/ab90334e-aba4-4cc0-8fc2-a09141b70aaf.png";

interface DoorStyleSelectorProps {
  selections: any;
  setSelections: (selections: any) => void;
  isEditing: boolean;
}

const doorStyles = [
  {
    id: "traditional_short",
    name: "Traditional Short Panel",
    description: "Classic raised panel design with shorter panel sections",
    image: traditionalShortImage,
    type: "Traditional",
    panelType: "short"
  },
  {
    id: "traditional_long",
    name: "Traditional Long Panel", 
    description: "Classic raised panel design with longer panel sections",
    image: traditionalLongImage,
    type: "Traditional",
    panelType: "long"
  },
  {
    id: "carriage_house",
    name: "Carriage House",
    description: "Classic carriage house style with decorative hardware",
    image: carriageHouseImage,
    type: "Carriage House",
    panelType: "decorative"
  },
  {
    id: "full_view_option",
    name: "Full View Option",
    description: "Modern full glass panel design for maximum natural light",
    image: "/lovable-uploads/bc2fbebe-c886-4a8a-bd6d-176c7c1a4ba3.png",
    type: "Modern",
    panelType: "full_view",
    upgrade: true
  },
  {
    id: "wood_carriage_style",
    name: "Wood Carriage Style",
    description: "Premium carriage house style with authentic wood finish",
    image: "/lovable-uploads/0d81495b-7e96-4dd4-98fe-1033cf82b79f.png",
    type: "Premium Carriage",
    panelType: "wood_carriage",
    upgrade: true
  },
  {
    id: "coachman_carriage_house",
    name: "Coachman Carriage House",
    description: "Traditional coachman style carriage house door",
    image: "/lovable-uploads/7c5d0a7f-778f-4cb3-aa8f-828480c10fb4.png",
    type: "Coachman",
    panelType: "coachman",
    upgrade: true
  }
];

const DoorStyleModal = ({ selections, onStyleSelect, isEditing }: {
  selections: any;
  onStyleSelect: (styleId: string) => void;
  isEditing: boolean;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const nextDoor = () => {
    setCurrentIndex((prev) => (prev + 1) % doorStyles.length);
  };

  const prevDoor = () => {
    setCurrentIndex((prev) => (prev - 1 + doorStyles.length) % doorStyles.length);
  };

  const handleSelect = (styleId: string) => {
    onStyleSelect(styleId);
    setIsOpen(false);
  };

  const currentStyle = doorStyles[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Eye className="h-4 w-4 mr-2" />
          Browse All Door Styles
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Choose Your Garage Door Style</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          {/* Main Image Display */}
          <div className="relative bg-gray-50 rounded-lg overflow-hidden">
            <img 
              src={currentStyle.image} 
              alt={currentStyle.name}
              className="w-full h-96 object-contain"
            />
            
            {/* Navigation Arrows */}
            <Button
              variant="outline"
              size="sm"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
              onClick={prevDoor}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
              onClick={nextDoor}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Current Selection Indicator */}
            {selections.garage_door_style === currentStyle.id && (
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center">
                ✓
              </div>
            )}
          </div>

          {/* Door Information */}
          <div className="mt-4 text-center">
            <h3 className="text-xl font-semibold">{currentStyle.name}</h3>
            <p className="text-muted-foreground mt-1">{currentStyle.description}</p>
            <div className="mt-2 flex gap-2">
              <span className="inline-block bg-secondary px-3 py-1 rounded-full text-sm">
                {currentStyle.type}
              </span>
              {currentStyle.upgrade && (
                <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                  ★ Upgrade Option
                </span>
              )}
            </div>
          </div>

          {/* Door Thumbnails */}
          <div className="flex justify-center gap-2 mt-4">
            {doorStyles.map((style, index) => (
              <button
                key={style.id}
                onClick={() => setCurrentIndex(index)}
                className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  currentIndex === index ? 'border-primary' : 'border-gray-200'
                }`}
              >
                <img 
                  src={style.image} 
                  alt={style.name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSelect(currentStyle.id)}
              disabled={!isEditing}
              className="px-8"
            >
              {selections.garage_door_style === currentStyle.id ? 'Selected' : 'Select This Style'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const DoorStyleSelector = ({ selections, setSelections, isEditing }: DoorStyleSelectorProps) => {
  const [customDesignFile, setCustomDesignFile] = useState<File | null>(null);

  const handleStyleSelect = (styleId: string) => {
    if (!isEditing) return;
    
    const selectedStyle = doorStyles.find(style => style.id === styleId);
    if (!selectedStyle) return;

    const newSelections = { ...selections };
    newSelections.garage_door_style = styleId;
    newSelections.garage_panel_type = selectedStyle.panelType;
    newSelections.garage_door_type = selectedStyle.type;
    // Clear custom design if selecting a preset style
    newSelections.custom_design_file = null;
    setSelections(newSelections);
    setCustomDesignFile(null);
  };

  const handleCustomDesignUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditing) return;
    
    const file = event.target.files?.[0];
    if (file) {
      setCustomDesignFile(file);
      const newSelections = { ...selections };
      newSelections.custom_design_file = file;
      // Clear preset style selection
      newSelections.garage_door_style = "";
      newSelections.garage_panel_type = "";
      newSelections.garage_door_type = "Custom";
      setSelections(newSelections);
    }
  };

  const selectedStyle = doorStyles.find(style => style.id === selections.garage_door_style);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Choose Your Door Style</h3>
        <p className="text-muted-foreground">
          Select from our range of garage door styles, from traditional to contemporary designs.
        </p>
      </div>


      {/* Browse Modal */}
      <DoorStyleModal 
        selections={selections}
        onStyleSelect={handleStyleSelect}
        isEditing={isEditing}
      />

      {/* Quick Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {doorStyles.map((style) => {
          const isSelected = selections.garage_door_style === style.id;
          
          return (
            <Card 
              key={style.id}
              className={`cursor-pointer transition-all hover:scale-102 ${
                isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
              } ${!isEditing ? 'opacity-75 cursor-not-allowed' : ''}`}
              onClick={() => handleStyleSelect(style.id)}
            >
              <CardContent className="p-0">
                <div className="relative">
                  <img 
                    src={style.image} 
                    alt={style.name}
                    className="w-full h-48 object-contain bg-gray-50 rounded-t-lg"
                  />
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center">
                      ✓
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-sm mb-1">{style.name}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{style.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs bg-secondary px-2 py-1 rounded">
                        {style.type}
                      </span>
                      {style.upgrade && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          ★ Upgrade
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <span className="text-xs text-primary font-medium">Selected</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Custom Design Upload Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Design Your Own Door
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">
              Want something completely custom? Design your perfect garage door using Clopay's online designer, 
              then upload a screenshot of your design including all the specs you chose.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => window.open('https://www.clopay.com/garage-doors/design-center', '_blank', 'noopener,noreferrer')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Design on Clopay.com
            </Button>
            
            <div className="flex-1">
              <Label htmlFor="custom-design" className="sr-only">
                Upload Custom Design
              </Label>
              <Input
                id="custom-design"
                type="file"
                accept="image/*"
                onChange={handleCustomDesignUpload}
                disabled={!isEditing}
                className="cursor-pointer"
              />
            </div>
          </div>

          {(customDesignFile || selections.custom_design_file) && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <span className="text-sm font-medium">
                  ✓ Custom design uploaded: {customDesignFile?.name || 'Custom design file'}
                </span>
              </div>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground bg-yellow-50 p-3 rounded border border-yellow-200">
            <strong>Instructions:</strong> Design your door on Clopay's website, then take a screenshot 
            that shows your completed design along with all the specifications you selected 
            (size, style, color, windows, hardware, etc.). Upload that screenshot here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};