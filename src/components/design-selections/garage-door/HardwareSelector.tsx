import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface HardwareSelectorProps {
  selections: any;
  setSelections: (selections: any) => void;
  isEditing: boolean;
}

const hardwareOptions = [
  {
    id: "handles",
    name: "Lift Handles",
    description: "Traditional-style lift handles for authentic carriage house look",
    options: [
      { value: "none", label: "No Handles" },
      { value: "spade", label: "Spade Lift Handles", image: "/lovable-uploads/66e36217-981a-4df3-a0d8-d0c51ad3b86a.png" },
      { value: "spear", label: "Spear Lift Handles", image: "/lovable-uploads/4f1102bb-ec21-413b-8147-fef2b261076d.png" },
      { value: "colonial", label: "Colonial Lift Handles", image: "/lovable-uploads/a03cd113-67fb-4f85-844c-3512cc8cc92d.png" }
    ]
  },
  {
    id: "hinges",
    name: "Decorative Hinges",
    description: "Enhance the carriage house appearance with decorative hinges",
    options: [
      { value: "none", label: "No Hinges" },
      { value: "spade_strap", label: "Spade Strap Hinge", image: "/lovable-uploads/53e5eeff-933b-403c-9bbb-bf465f634982.png" },
      { value: "spear_strap", label: "Spear Strap Hinge", image: "/lovable-uploads/230fa5f0-0f19-4d44-9708-8dcb976beed1.png" },
      { value: "colonial_strap", label: "Colonial Strap Hinge", image: "/lovable-uploads/15f789cc-e8c3-40c0-a994-1166a03cf7dd.png" }
    ]
  },
  {
    id: "decorative_plates",
    name: "Decorative Plates",
    description: "Decorative step plates for enhanced garage door styling",
    options: [
      { value: "none", label: "No Decorative Plates" },
      { value: "spade_step", label: "Spade Step Plate", image: "/lovable-uploads/f760b20a-025c-4c8b-8d2e-7487d5b5c3de.png" },
      { value: "spear_step", label: "Spear Step Plate", image: "/lovable-uploads/68649a51-baa6-4abf-aa38-b85a7fb62b9b.png" },
      { value: "colonial_step", label: "Colonial Step Plate", image: "/lovable-uploads/26c9d857-4836-45fb-ba04-fbd0109e5541.png" }
    ]
  }
];

const additionalFeatures = [
  {
    id: "insulation",
    name: "Insulation Upgrade",
    description: "Energy-efficient polyurethane insulation for better temperature control"
  },
  {
    id: "quiet_operation",
    name: "Quiet Operation Package",
    description: "Premium belt drive system and sound dampening materials"
  },
  {
    id: "smart_opener",
    name: "Smart Opener Integration",
    description: "WiFi-enabled opener with smartphone app control"
  }
];

export const HardwareSelector = ({ selections, setSelections, isEditing }: HardwareSelectorProps) => {
  const handleHardwareChange = (hardwareType: string, value: string) => {
    if (!isEditing) return;
    
    const newSelections = { ...selections };
    if (!newSelections.garage_door_hardware) {
      newSelections.garage_door_hardware = {};
    }
    newSelections.garage_door_hardware[hardwareType] = value;
    setSelections(newSelections);
  };

  const handleFeatureToggle = (featureId: string, enabled: boolean) => {
    if (!isEditing) return;
    
    const newSelections = { ...selections };
    if (!newSelections.garage_door_features) {
      newSelections.garage_door_features = {};
    }
    newSelections.garage_door_features[featureId] = enabled;
    setSelections(newSelections);
  };

  const getSelectedHardware = (hardwareType: string) => {
    return selections.garage_door_hardware?.[hardwareType] || "none";
  };

  const isFeatureSelected = (featureId: string) => {
    return selections.garage_door_features?.[featureId] || false;
  };


  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Hardware & Features</h3>
        <p className="text-muted-foreground">
          Customize your door with decorative hardware and premium features.
        </p>
      </div>

      {/* Decorative Hardware */}
      <div className="space-y-6">
        <h4 className="text-lg font-semibold">Decorative Hardware</h4>
        
        {hardwareOptions.map((hardware) => (
          <Card key={hardware.id} className="border-l-4 border-l-primary/20">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium">{hardware.name}</h5>
                  <p className="text-sm text-muted-foreground">{hardware.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {hardware.options.map((option) => {
                    const isSelected = getSelectedHardware(hardware.id) === option.value;
                    
                    return (
                      <div
                        key={option.value}
                        className={`border rounded-lg p-3 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => handleHardwareChange(hardware.id, option.value)}
                      >
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              checked={isSelected}
                              onChange={() => handleHardwareChange(hardware.id, option.value)}
                              disabled={!isEditing}
                              className="text-primary"
                            />
                            <span className="text-sm font-medium">{option.label}</span>
                          </div>
                          {option.image && (
                            <div className="flex justify-center">
                              <img 
                                src={option.image} 
                                alt={option.label}
                                className="h-16 w-auto object-contain"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Features */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold">Additional Features</h4>
        
        {additionalFeatures.map((feature) => (
          <Card key={feature.id} className="border-l-4 border-l-secondary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={isFeatureSelected(feature.id)}
                      onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked)}
                      disabled={!isEditing}
                    />
                    <Label htmlFor={feature.id} className="font-medium cursor-pointer">
                      {feature.name}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-11">{feature.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};