import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Download, Save, Palette, Home, Zap, Wrench, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DesignSelections {
  // Project Information
  projectName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;

  // Building Exterior
  sidingMaterial: string;
  sidingColor: string;
  roofingMaterial: string;
  roofingColor: string;
  trimColor: string;
  foundationType: string;
  wainscotingHeight: string;
  wainscotingColor: string;
  exteriorDoors: string;
  exteriorDoorColor: string;
  windowStyle: string;
  windowColor: string;
  shutters: boolean;
  shutterColor: string;

  // Building Interior
  flooringLivingArea: string;
  flooringBedrooms: string;
  flooringBathrooms: string;
  flooringKitchen: string;
  wallFinishLivingArea: string;
  wallFinishBedrooms: string;
  wallFinishBathrooms: string;
  wallFinishKitchen: string;
  ceilingType: string;
  ceilingHeight: string;
  interiorDoorStyle: string;
  interiorDoorColor: string;
  hardwareFinish: string;
  baseboardStyle: string;
  baseboardColor: string;
  crownMolding: boolean;

  // Kitchen & Bath
  cabinetStyle: string;
  cabinetColor: string;
  countertopMaterial: string;
  countertopColor: string;
  backsplashMaterial: string;
  backsplashColor: string;
  kitchenAppliances: string[];
  bathroomVanityStyle: string;
  bathroomVanityColor: string;
  bathroomCountertop: string;
  bathroomTileFloor: string;
  bathroomTileWall: string;
  showerSurround: string;
  plumbingFixtureFinish: string;

  // Electrical & Lighting
  lightingSwitchStyle: string;
  lightingSwitchColor: string;
  outletStyle: string;
  outletColor: string;
  lightFixtureStyle: string;
  lightFixtureFinish: string;
  ceilingFanLocations: string[];
  outdoorLighting: string[];

  // HVAC & Mechanical
  hvacSystem: string;
  thermostatType: string;
  ventilationOptions: string[];
  waterHeaterType: string;
  insulation: string;
  insulationRValue: string;

  // Special Features & Upgrades
  fireplace: boolean;
  fireplaceType: string;
  fireplaceLocation: string;
  builtInStorage: string[];
  additionalElectrical: string[];
  smartHomeFeatures: string[];
  
  // Additional Notes
  specialRequests: string;
  notes: string;
}

export function CustomerDesignSelectionForm() {
  const { toast } = useToast();
  const [selections, setSelections] = useState<DesignSelections>({
    // Project Information
    projectName: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    date: new Date().toISOString().split('T')[0],

    // Building Exterior
    sidingMaterial: '',
    sidingColor: '',
    roofingMaterial: '',
    roofingColor: '',
    trimColor: '',
    foundationType: '',
    wainscotingHeight: '',
    wainscotingColor: '',
    exteriorDoors: '',
    exteriorDoorColor: '',
    windowStyle: '',
    windowColor: '',
    shutters: false,
    shutterColor: '',

    // Building Interior
    flooringLivingArea: '',
    flooringBedrooms: '',
    flooringBathrooms: '',
    flooringKitchen: '',
    wallFinishLivingArea: '',
    wallFinishBedrooms: '',
    wallFinishBathrooms: '',
    wallFinishKitchen: '',
    ceilingType: '',
    ceilingHeight: '',
    interiorDoorStyle: '',
    interiorDoorColor: '',
    hardwareFinish: '',
    baseboardStyle: '',
    baseboardColor: '',
    crownMolding: false,

    // Kitchen & Bath
    cabinetStyle: '',
    cabinetColor: '',
    countertopMaterial: '',
    countertopColor: '',
    backsplashMaterial: '',
    backsplashColor: '',
    kitchenAppliances: [],
    bathroomVanityStyle: '',
    bathroomVanityColor: '',
    bathroomCountertop: '',
    bathroomTileFloor: '',
    bathroomTileWall: '',
    showerSurround: '',
    plumbingFixtureFinish: '',

    // Electrical & Lighting
    lightingSwitchStyle: '',
    lightingSwitchColor: '',
    outletStyle: '',
    outletColor: '',
    lightFixtureStyle: '',
    lightFixtureFinish: '',
    ceilingFanLocations: [],
    outdoorLighting: [],

    // HVAC & Mechanical
    hvacSystem: '',
    thermostatType: '',
    ventilationOptions: [],
    waterHeaterType: '',
    insulation: '',
    insulationRValue: '',

    // Special Features & Upgrades
    fireplace: false,
    fireplaceType: '',
    fireplaceLocation: '',
    builtInStorage: [],
    additionalElectrical: [],
    smartHomeFeatures: [],
    
    // Additional Notes
    specialRequests: '',
    notes: ''
  });

  const handleInputChange = (field: keyof DesignSelections, value: string | boolean) => {
    setSelections(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: keyof DesignSelections, value: string, checked: boolean) => {
    setSelections(prev => {
      const currentArray = prev[field] as string[];
      if (checked) {
        return {
          ...prev,
          [field]: [...currentArray, value]
        };
      } else {
        return {
          ...prev,
          [field]: currentArray.filter(item => item !== value)
        };
      }
    });
  };

  const generatePDF = () => {
    // Create a comprehensive text version for now
    const content = `
DESIGN SELECTION FORM

Project Information:
- Project Name: ${selections.projectName}
- Customer Name: ${selections.customerName}
- Email: ${selections.customerEmail}
- Phone: ${selections.customerPhone}
- Date: ${selections.date}

BUILDING EXTERIOR:
- Siding Material: ${selections.sidingMaterial}
- Siding Color: ${selections.sidingColor}
- Roofing Material: ${selections.roofingMaterial}
- Roofing Color: ${selections.roofingColor}
- Trim Color: ${selections.trimColor}
- Foundation Type: ${selections.foundationType}
- Wainscoting Height: ${selections.wainscotingHeight}
- Wainscoting Color: ${selections.wainscotingColor}
- Exterior Doors: ${selections.exteriorDoors}
- Exterior Door Color: ${selections.exteriorDoorColor}
- Window Style: ${selections.windowStyle}
- Window Color: ${selections.windowColor}
- Shutters: ${selections.shutters ? 'Yes' : 'No'}
- Shutter Color: ${selections.shutterColor}

BUILDING INTERIOR:
- Living Area Flooring: ${selections.flooringLivingArea}
- Bedroom Flooring: ${selections.flooringBedrooms}
- Bathroom Flooring: ${selections.flooringBathrooms}
- Kitchen Flooring: ${selections.flooringKitchen}
- Living Area Wall Finish: ${selections.wallFinishLivingArea}
- Bedroom Wall Finish: ${selections.wallFinishBedrooms}
- Bathroom Wall Finish: ${selections.wallFinishBathrooms}
- Kitchen Wall Finish: ${selections.wallFinishKitchen}
- Ceiling Type: ${selections.ceilingType}
- Ceiling Height: ${selections.ceilingHeight}
- Interior Door Style: ${selections.interiorDoorStyle}
- Interior Door Color: ${selections.interiorDoorColor}
- Hardware Finish: ${selections.hardwareFinish}
- Baseboard Style: ${selections.baseboardStyle}
- Baseboard Color: ${selections.baseboardColor}
- Crown Molding: ${selections.crownMolding ? 'Yes' : 'No'}

KITCHEN & BATH:
- Cabinet Style: ${selections.cabinetStyle}
- Cabinet Color: ${selections.cabinetColor}
- Countertop Material: ${selections.countertopMaterial}
- Countertop Color: ${selections.countertopColor}
- Backsplash Material: ${selections.backsplashMaterial}
- Backsplash Color: ${selections.backsplashColor}
- Kitchen Appliances: ${selections.kitchenAppliances.join(', ')}
- Bathroom Vanity Style: ${selections.bathroomVanityStyle}
- Bathroom Vanity Color: ${selections.bathroomVanityColor}
- Bathroom Countertop: ${selections.bathroomCountertop}
- Bathroom Floor Tile: ${selections.bathroomTileFloor}
- Bathroom Wall Tile: ${selections.bathroomTileWall}
- Shower Surround: ${selections.showerSurround}
- Plumbing Fixture Finish: ${selections.plumbingFixtureFinish}

ELECTRICAL & LIGHTING:
- Switch Style: ${selections.lightingSwitchStyle}
- Switch Color: ${selections.lightingSwitchColor}
- Outlet Style: ${selections.outletStyle}
- Outlet Color: ${selections.outletColor}
- Light Fixture Style: ${selections.lightFixtureStyle}
- Light Fixture Finish: ${selections.lightFixtureFinish}
- Ceiling Fan Locations: ${selections.ceilingFanLocations.join(', ')}
- Outdoor Lighting: ${selections.outdoorLighting.join(', ')}

HVAC & MECHANICAL:
- HVAC System: ${selections.hvacSystem}
- Thermostat Type: ${selections.thermostatType}
- Ventilation Options: ${selections.ventilationOptions.join(', ')}
- Water Heater Type: ${selections.waterHeaterType}
- Insulation: ${selections.insulation}
- Insulation R-Value: ${selections.insulationRValue}

SPECIAL FEATURES:
- Fireplace: ${selections.fireplace ? 'Yes' : 'No'}
- Fireplace Type: ${selections.fireplaceType}
- Fireplace Location: ${selections.fireplaceLocation}
- Built-in Storage: ${selections.builtInStorage.join(', ')}
- Additional Electrical: ${selections.additionalElectrical.join(', ')}
- Smart Home Features: ${selections.smartHomeFeatures.join(', ')}

ADDITIONAL NOTES:
- Special Requests: ${selections.specialRequests}
- Notes: ${selections.notes}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Design_Selections_${selections.customerName || 'Customer'}_${selections.date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Design Selections Downloaded",
      description: "Your design selections have been downloaded as a text file.",
    });
  };

  const saveSelections = () => {
    // For now, just save to localStorage
    localStorage.setItem('designSelections', JSON.stringify(selections));
    toast({
      title: "Selections Saved",
      description: "Your design selections have been saved.",
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-primary">Design Selection Form</h1>
        <p className="text-lg text-muted-foreground">
          Please complete this comprehensive form to help us understand your design preferences. 
          Each section contains important decisions that will affect the final appearance and functionality of your building.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={saveSelections} variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save Progress
          </Button>
          <Button onClick={generatePDF}>
            <Download className="h-4 w-4 mr-2" />
            Download Form
          </Button>
        </div>
      </div>

      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Project Information
          </CardTitle>
          <CardDescription>
            Basic project and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={selections.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selections.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="customerName">Your Name</Label>
              <Input
                id="customerName"
                value={selections.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="customerEmail">Email Address</Label>
              <Input
                id="customerEmail"
                type="email"
                value={selections.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">Phone Number</Label>
              <Input
                id="customerPhone"
                value={selections.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Building Exterior */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Building Exterior
          </CardTitle>
          <CardDescription>
            Choose materials, colors, and styles for the exterior of your building
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Siding Material</Label>
              <RadioGroup
                value={selections.sidingMaterial}
                onValueChange={(value) => handleInputChange('sidingMaterial', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="metal" id="metal-siding" />
                  <Label htmlFor="metal-siding">Metal Panel</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="vinyl" id="vinyl-siding" />
                  <Label htmlFor="vinyl-siding">Vinyl Siding</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="wood" id="wood-siding" />
                  <Label htmlFor="wood-siding">Wood Siding</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fiber-cement" id="fiber-cement" />
                  <Label htmlFor="fiber-cement">Fiber Cement</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label htmlFor="sidingColor">Siding Color</Label>
              <Input
                id="sidingColor"
                value={selections.sidingColor}
                onChange={(e) => handleInputChange('sidingColor', e.target.value)}
                placeholder="e.g., Charcoal Gray, Barn Red, Ivory"
              />
            </div>

            <div>
              <Label>Roofing Material</Label>
              <RadioGroup
                value={selections.roofingMaterial}
                onValueChange={(value) => handleInputChange('roofingMaterial', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="metal" id="metal-roof" />
                  <Label htmlFor="metal-roof">Metal Roofing</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="shingles" id="shingles" />
                  <Label htmlFor="shingles">Asphalt Shingles</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tile" id="tile-roof" />
                  <Label htmlFor="tile-roof">Tile Roofing</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="roofingColor">Roofing Color</Label>
              <Input
                id="roofingColor"
                value={selections.roofingColor}
                onChange={(e) => handleInputChange('roofingColor', e.target.value)}
                placeholder="e.g., Galvalume, Forest Green, Charcoal"
              />
            </div>

            <div>
              <Label htmlFor="trimColor">Trim Color</Label>
              <Input
                id="trimColor"
                value={selections.trimColor}
                onChange={(e) => handleInputChange('trimColor', e.target.value)}
                placeholder="e.g., White, Black, Matching Siding"
              />
            </div>

            <div>
              <Label>Foundation/Wainscoting</Label>
              <RadioGroup
                value={selections.foundationType}
                onValueChange={(value) => handleInputChange('foundationType', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="concrete" id="concrete" />
                  <Label htmlFor="concrete">Painted Concrete</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stone" id="stone" />
                  <Label htmlFor="stone">Stone Veneer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="metal-wainscoting" id="metal-wainscoting" />
                  <Label htmlFor="metal-wainscoting">Metal Wainscoting</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="no-wainscoting" />
                  <Label htmlFor="no-wainscoting">None</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Exterior Door Style</Label>
              <RadioGroup
                value={selections.exteriorDoors}
                onValueChange={(value) => handleInputChange('exteriorDoors', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="steel" id="steel-door" />
                  <Label htmlFor="steel-door">Steel Entry Door</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fiberglass" id="fiberglass-door" />
                  <Label htmlFor="fiberglass-door">Fiberglass Door</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="wood" id="wood-door" />
                  <Label htmlFor="wood-door">Wood Door</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="exteriorDoorColor">Exterior Door Color</Label>
              <Input
                id="exteriorDoorColor"
                value={selections.exteriorDoorColor}
                onChange={(e) => handleInputChange('exteriorDoorColor', e.target.value)}
                placeholder="e.g., Black, Dark Green, Natural Wood"
              />
            </div>

            <div>
              <Label>Window Style</Label>
              <RadioGroup
                value={selections.windowStyle}
                onValueChange={(value) => handleInputChange('windowStyle', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single-hung" id="single-hung" />
                  <Label htmlFor="single-hung">Single Hung</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="double-hung" id="double-hung" />
                  <Label htmlFor="double-hung">Double Hung</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="casement" id="casement" />
                  <Label htmlFor="casement">Casement</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sliding" id="sliding" />
                  <Label htmlFor="sliding">Sliding</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="windowColor">Window Frame Color</Label>
              <Input
                id="windowColor"
                value={selections.windowColor}
                onChange={(e) => handleInputChange('windowColor', e.target.value)}
                placeholder="e.g., White, Bronze, Black"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="shutters"
              checked={selections.shutters}
              onCheckedChange={(checked) => handleInputChange('shutters', checked as boolean)}
            />
            <Label htmlFor="shutters">Add Window Shutters</Label>
          </div>

          {selections.shutters && (
            <div>
              <Label htmlFor="shutterColor">Shutter Color</Label>
              <Input
                id="shutterColor"
                value={selections.shutterColor}
                onChange={(e) => handleInputChange('shutterColor', e.target.value)}
                placeholder="e.g., Forest Green, Black, Burgundy"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Building Interior */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Building Interior
          </CardTitle>
          <CardDescription>
            Select flooring, wall finishes, and interior details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-4">Flooring Selections</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="flooringLivingArea">Living Area Flooring</Label>
                <Input
                  id="flooringLivingArea"
                  value={selections.flooringLivingArea}
                  onChange={(e) => handleInputChange('flooringLivingArea', e.target.value)}
                  placeholder="e.g., Luxury Vinyl Plank, Hardwood, Concrete"
                />
              </div>
              <div>
                <Label htmlFor="flooringBedrooms">Bedroom Flooring</Label>
                <Input
                  id="flooringBedrooms"
                  value={selections.flooringBedrooms}
                  onChange={(e) => handleInputChange('flooringBedrooms', e.target.value)}
                  placeholder="e.g., Carpet, Luxury Vinyl Plank"
                />
              </div>
              <div>
                <Label htmlFor="flooringBathrooms">Bathroom Flooring</Label>
                <Input
                  id="flooringBathrooms"
                  value={selections.flooringBathrooms}
                  onChange={(e) => handleInputChange('flooringBathrooms', e.target.value)}
                  placeholder="e.g., Tile, Luxury Vinyl"
                />
              </div>
              <div>
                <Label htmlFor="flooringKitchen">Kitchen Flooring</Label>
                <Input
                  id="flooringKitchen"
                  value={selections.flooringKitchen}
                  onChange={(e) => handleInputChange('flooringKitchen', e.target.value)}
                  placeholder="e.g., Tile, Luxury Vinyl Plank"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-4">Wall Finishes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="wallFinishLivingArea">Living Area Wall Finish</Label>
                <Input
                  id="wallFinishLivingArea"
                  value={selections.wallFinishLivingArea}
                  onChange={(e) => handleInputChange('wallFinishLivingArea', e.target.value)}
                  placeholder="e.g., Painted Drywall, Wood Paneling"
                />
              </div>
              <div>
                <Label htmlFor="wallFinishBedrooms">Bedroom Wall Finish</Label>
                <Input
                  id="wallFinishBedrooms"
                  value={selections.wallFinishBedrooms}
                  onChange={(e) => handleInputChange('wallFinishBedrooms', e.target.value)}
                  placeholder="e.g., Painted Drywall, Textured"
                />
              </div>
              <div>
                <Label htmlFor="wallFinishBathrooms">Bathroom Wall Finish</Label>
                <Input
                  id="wallFinishBathrooms"
                  value={selections.wallFinishBathrooms}
                  onChange={(e) => handleInputChange('wallFinishBathrooms', e.target.value)}
                  placeholder="e.g., Tile, Painted Drywall"
                />
              </div>
              <div>
                <Label htmlFor="wallFinishKitchen">Kitchen Wall Finish</Label>
                <Input
                  id="wallFinishKitchen"
                  value={selections.wallFinishKitchen}
                  onChange={(e) => handleInputChange('wallFinishKitchen', e.target.value)}
                  placeholder="e.g., Painted Drywall, Tile Backsplash"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Ceiling Type</Label>
              <RadioGroup
                value={selections.ceilingType}
                onValueChange={(value) => handleInputChange('ceilingType', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="flat" id="flat-ceiling" />
                  <Label htmlFor="flat-ceiling">Flat Ceiling</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="vaulted" id="vaulted-ceiling" />
                  <Label htmlFor="vaulted-ceiling">Vaulted Ceiling</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="exposed-beams" id="exposed-beams" />
                  <Label htmlFor="exposed-beams">Exposed Beams</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="ceilingHeight">Ceiling Height</Label>
              <Input
                id="ceilingHeight"
                value={selections.ceilingHeight}
                onChange={(e) => handleInputChange('ceilingHeight', e.target.value)}
                placeholder="e.g., 9 feet, 10 feet, 12 feet"
              />
            </div>

            <div>
              <Label htmlFor="interiorDoorStyle">Interior Door Style</Label>
              <Input
                id="interiorDoorStyle"
                value={selections.interiorDoorStyle}
                onChange={(e) => handleInputChange('interiorDoorStyle', e.target.value)}
                placeholder="e.g., 6-Panel, Shaker, Barn Doors"
              />
            </div>

            <div>
              <Label htmlFor="interiorDoorColor">Interior Door Color</Label>
              <Input
                id="interiorDoorColor"
                value={selections.interiorDoorColor}
                onChange={(e) => handleInputChange('interiorDoorColor', e.target.value)}
                placeholder="e.g., White, Natural Wood, Black"
              />
            </div>

            <div>
              <Label htmlFor="hardwareFinish">Hardware Finish</Label>
              <Input
                id="hardwareFinish"
                value={selections.hardwareFinish}
                onChange={(e) => handleInputChange('hardwareFinish', e.target.value)}
                placeholder="e.g., Brushed Nickel, Oil Rubbed Bronze, Black"
              />
            </div>

            <div>
              <Label htmlFor="baseboardStyle">Baseboard Style</Label>
              <Input
                id="baseboardStyle"
                value={selections.baseboardStyle}
                onChange={(e) => handleInputChange('baseboardStyle', e.target.value)}
                placeholder="e.g., 3.25 inch Colonial, 5.25 inch Modern"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="crownMolding"
              checked={selections.crownMolding}
              onCheckedChange={(checked) => handleInputChange('crownMolding', checked as boolean)}
            />
            <Label htmlFor="crownMolding">Add Crown Molding</Label>
          </div>
        </CardContent>
      </Card>

      {/* Kitchen & Bath */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Kitchen & Bath Selections
          </CardTitle>
          <CardDescription>
            Choose finishes and fixtures for kitchen and bathroom areas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-4">Kitchen Selections</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cabinetStyle">Cabinet Style</Label>
                <Input
                  id="cabinetStyle"
                  value={selections.cabinetStyle}
                  onChange={(e) => handleInputChange('cabinetStyle', e.target.value)}
                  placeholder="e.g., Shaker, Raised Panel, Flat Panel"
                />
              </div>
              <div>
                <Label htmlFor="cabinetColor">Cabinet Color</Label>
                <Input
                  id="cabinetColor"
                  value={selections.cabinetColor}
                  onChange={(e) => handleInputChange('cabinetColor', e.target.value)}
                  placeholder="e.g., White, Gray, Natural Wood"
                />
              </div>
              <div>
                <Label htmlFor="countertopMaterial">Countertop Material</Label>
                <Input
                  id="countertopMaterial"
                  value={selections.countertopMaterial}
                  onChange={(e) => handleInputChange('countertopMaterial', e.target.value)}
                  placeholder="e.g., Quartz, Granite, Laminate"
                />
              </div>
              <div>
                <Label htmlFor="countertopColor">Countertop Color</Label>
                <Input
                  id="countertopColor"
                  value={selections.countertopColor}
                  onChange={(e) => handleInputChange('countertopColor', e.target.value)}
                  placeholder="e.g., White Carrara, Black Pearl, Butcher Block"
                />
              </div>
              <div>
                <Label htmlFor="backsplashMaterial">Backsplash Material</Label>
                <Input
                  id="backsplashMaterial"
                  value={selections.backsplashMaterial}
                  onChange={(e) => handleInputChange('backsplashMaterial', e.target.value)}
                  placeholder="e.g., Subway Tile, Natural Stone, Metal"
                />
              </div>
              <div>
                <Label htmlFor="backsplashColor">Backsplash Color</Label>
                <Input
                  id="backsplashColor"
                  value={selections.backsplashColor}
                  onChange={(e) => handleInputChange('backsplashColor', e.target.value)}
                  placeholder="e.g., White, Gray, Natural"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="font-medium">Kitchen Appliances</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {['Refrigerator', 'Range/Cooktop', 'Oven', 'Microwave', 'Dishwasher', 'Garbage Disposal'].map((appliance) => (
                <div key={appliance} className="flex items-center space-x-2">
                  <Checkbox
                    id={appliance}
                    checked={selections.kitchenAppliances.includes(appliance)}
                    onCheckedChange={(checked) => handleArrayChange('kitchenAppliances', appliance, checked as boolean)}
                  />
                  <Label htmlFor={appliance} className="text-sm">{appliance}</Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-4">Bathroom Selections</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bathroomVanityStyle">Vanity Style</Label>
                <Input
                  id="bathroomVanityStyle"
                  value={selections.bathroomVanityStyle}
                  onChange={(e) => handleInputChange('bathroomVanityStyle', e.target.value)}
                  placeholder="e.g., Modern, Traditional, Farmhouse"
                />
              </div>
              <div>
                <Label htmlFor="bathroomVanityColor">Vanity Color</Label>
                <Input
                  id="bathroomVanityColor"
                  value={selections.bathroomVanityColor}
                  onChange={(e) => handleInputChange('bathroomVanityColor', e.target.value)}
                  placeholder="e.g., White, Gray, Natural Wood"
                />
              </div>
              <div>
                <Label htmlFor="bathroomCountertop">Bathroom Countertop</Label>
                <Input
                  id="bathroomCountertop"
                  value={selections.bathroomCountertop}
                  onChange={(e) => handleInputChange('bathroomCountertop', e.target.value)}
                  placeholder="e.g., Quartz, Granite, Cultured Marble"
                />
              </div>
              <div>
                <Label htmlFor="bathroomTileFloor">Bathroom Floor Tile</Label>
                <Input
                  id="bathroomTileFloor"
                  value={selections.bathroomTileFloor}
                  onChange={(e) => handleInputChange('bathroomTileFloor', e.target.value)}
                  placeholder="e.g., Porcelain, Ceramic, Natural Stone"
                />
              </div>
              <div>
                <Label htmlFor="bathroomTileWall">Bathroom Wall Tile</Label>
                <Input
                  id="bathroomTileWall"
                  value={selections.bathroomTileWall}
                  onChange={(e) => handleInputChange('bathroomTileWall', e.target.value)}
                  placeholder="e.g., Subway, Large Format, Mosaic"
                />
              </div>
              <div>
                <Label htmlFor="showerSurround">Shower Surround</Label>
                <Input
                  id="showerSurround"
                  value={selections.showerSurround}
                  onChange={(e) => handleInputChange('showerSurround', e.target.value)}
                  placeholder="e.g., Tile, Solid Surface, Fiberglass"
                />
              </div>
              <div>
                <Label htmlFor="plumbingFixtureFinish">Plumbing Fixture Finish</Label>
                <Input
                  id="plumbingFixtureFinish"
                  value={selections.plumbingFixtureFinish}
                  onChange={(e) => handleInputChange('plumbingFixtureFinish', e.target.value)}
                  placeholder="e.g., Chrome, Brushed Nickel, Bronze"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Electrical & Lighting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Electrical & Lighting
          </CardTitle>
          <CardDescription>
            Select electrical fixtures, switches, and lighting preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="lightingSwitchStyle">Switch Style</Label>
              <Input
                id="lightingSwitchStyle"
                value={selections.lightingSwitchStyle}
                onChange={(e) => handleInputChange('lightingSwitchStyle', e.target.value)}
                placeholder="e.g., Rocker, Toggle, Decorator"
              />
            </div>
            <div>
              <Label htmlFor="lightingSwitchColor">Switch Color</Label>
              <Input
                id="lightingSwitchColor"
                value={selections.lightingSwitchColor}
                onChange={(e) => handleInputChange('lightingSwitchColor', e.target.value)}
                placeholder="e.g., White, Ivory, Black"
              />
            </div>
            <div>
              <Label htmlFor="outletStyle">Outlet Style</Label>
              <Input
                id="outletStyle"
                value={selections.outletStyle}
                onChange={(e) => handleInputChange('outletStyle', e.target.value)}
                placeholder="e.g., Standard, GFCI, USB Combo"
              />
            </div>
            <div>
              <Label htmlFor="outletColor">Outlet Color</Label>
              <Input
                id="outletColor"
                value={selections.outletColor}
                onChange={(e) => handleInputChange('outletColor', e.target.value)}
                placeholder="e.g., White, Ivory, Black"
              />
            </div>
            <div>
              <Label htmlFor="lightFixtureStyle">Light Fixture Style</Label>
              <Input
                id="lightFixtureStyle"
                value={selections.lightFixtureStyle}
                onChange={(e) => handleInputChange('lightFixtureStyle', e.target.value)}
                placeholder="e.g., Modern, Traditional, Industrial"
              />
            </div>
            <div>
              <Label htmlFor="lightFixtureFinish">Light Fixture Finish</Label>
              <Input
                id="lightFixtureFinish"
                value={selections.lightFixtureFinish}
                onChange={(e) => handleInputChange('lightFixtureFinish', e.target.value)}
                placeholder="e.g., Brushed Nickel, Bronze, Black"
              />
            </div>
          </div>

          <div>
            <Label className="font-medium">Ceiling Fan Locations</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {['Living Room', 'Master Bedroom', 'Bedroom 2', 'Bedroom 3', 'Kitchen', 'Dining Room'].map((location) => (
                <div key={location} className="flex items-center space-x-2">
                  <Checkbox
                    id={`fan-${location}`}
                    checked={selections.ceilingFanLocations.includes(location)}
                    onCheckedChange={(checked) => handleArrayChange('ceilingFanLocations', location, checked as boolean)}
                  />
                  <Label htmlFor={`fan-${location}`} className="text-sm">{location}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="font-medium">Outdoor Lighting</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {['Front Entry', 'Back Door', 'Garage', 'Walkway', 'Landscape', 'Security'].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`outdoor-${type}`}
                    checked={selections.outdoorLighting.includes(type)}
                    onCheckedChange={(checked) => handleArrayChange('outdoorLighting', type, checked as boolean)}
                  />
                  <Label htmlFor={`outdoor-${type}`} className="text-sm">{type}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HVAC & Mechanical */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            HVAC & Mechanical Systems
          </CardTitle>
          <CardDescription>
            Choose heating, cooling, and mechanical system preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>HVAC System Type</Label>
              <RadioGroup
                value={selections.hvacSystem}
                onValueChange={(value) => handleInputChange('hvacSystem', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="central-air" id="central-air" />
                  <Label htmlFor="central-air">Central Air & Heat</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="heat-pump" id="heat-pump" />
                  <Label htmlFor="heat-pump">Heat Pump</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mini-split" id="mini-split" />
                  <Label htmlFor="mini-split">Mini-Split System</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="radiant" id="radiant" />
                  <Label htmlFor="radiant">Radiant Floor Heating</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Thermostat Type</Label>
              <RadioGroup
                value={selections.thermostatType}
                onValueChange={(value) => handleInputChange('thermostatType', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="programmable" id="programmable" />
                  <Label htmlFor="programmable">Programmable</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="smart" id="smart" />
                  <Label htmlFor="smart">Smart Thermostat</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="basic" id="basic" />
                  <Label htmlFor="basic">Basic Manual</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Water Heater Type</Label>
              <RadioGroup
                value={selections.waterHeaterType}
                onValueChange={(value) => handleInputChange('waterHeaterType', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tankless" id="tankless" />
                  <Label htmlFor="tankless">Tankless</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tank-gas" id="tank-gas" />
                  <Label htmlFor="tank-gas">Tank - Gas</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tank-electric" id="tank-electric" />
                  <Label htmlFor="tank-electric">Tank - Electric</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hybrid" id="hybrid" />
                  <Label htmlFor="hybrid">Hybrid Heat Pump</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="insulation">Insulation Type</Label>
              <Input
                id="insulation"
                value={selections.insulation}
                onChange={(e) => handleInputChange('insulation', e.target.value)}
                placeholder="e.g., Fiberglass, Spray Foam, Cellulose"
              />
            </div>

            <div>
              <Label htmlFor="insulationRValue">Insulation R-Value</Label>
              <Input
                id="insulationRValue"
                value={selections.insulationRValue}
                onChange={(e) => handleInputChange('insulationRValue', e.target.value)}
                placeholder="e.g., R-13, R-19, R-30"
              />
            </div>
          </div>

          <div>
            <Label className="font-medium">Ventilation Options</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {['Exhaust Fans', 'Whole House Fan', 'ERV System', 'Range Hood', 'Bathroom Fans', 'Attic Ventilation'].map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`ventilation-${option}`}
                    checked={selections.ventilationOptions.includes(option)}
                    onCheckedChange={(checked) => handleArrayChange('ventilationOptions', option, checked as boolean)}
                  />
                  <Label htmlFor={`ventilation-${option}`} className="text-sm">{option}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Special Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Special Features & Upgrades
          </CardTitle>
          <CardDescription>
            Optional features and upgrades for your building
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="fireplace"
              checked={selections.fireplace}
              onCheckedChange={(checked) => handleInputChange('fireplace', checked as boolean)}
            />
            <Label htmlFor="fireplace">Add Fireplace</Label>
          </div>

          {selections.fireplace && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-primary/20">
              <div>
                <Label htmlFor="fireplaceType">Fireplace Type</Label>
                <Input
                  id="fireplaceType"
                  value={selections.fireplaceType}
                  onChange={(e) => handleInputChange('fireplaceType', e.target.value)}
                  placeholder="e.g., Gas, Wood Burning, Electric"
                />
              </div>
              <div>
                <Label htmlFor="fireplaceLocation">Fireplace Location</Label>
                <Input
                  id="fireplaceLocation"
                  value={selections.fireplaceLocation}
                  onChange={(e) => handleInputChange('fireplaceLocation', e.target.value)}
                  placeholder="e.g., Living Room, Master Bedroom"
                />
              </div>
            </div>
          )}

          <div>
            <Label className="font-medium">Built-in Storage</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {['Walk-in Closets', 'Pantry', 'Linen Closets', 'Built-in Shelving', 'Mudroom Storage', 'Garage Storage'].map((storage) => (
                <div key={storage} className="flex items-center space-x-2">
                  <Checkbox
                    id={`storage-${storage}`}
                    checked={selections.builtInStorage.includes(storage)}
                    onCheckedChange={(checked) => handleArrayChange('builtInStorage', storage, checked as boolean)}
                  />
                  <Label htmlFor={`storage-${storage}`} className="text-sm">{storage}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="font-medium">Additional Electrical</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {['Extra Outlets', 'USB Outlets', 'Dedicated Circuits', 'EV Charger Prep', 'Generator Hook-up', 'Security System Pre-wire'].map((electrical) => (
                <div key={electrical} className="flex items-center space-x-2">
                  <Checkbox
                    id={`electrical-${electrical}`}
                    checked={selections.additionalElectrical.includes(electrical)}
                    onCheckedChange={(checked) => handleArrayChange('additionalElectrical', electrical, checked as boolean)}
                  />
                  <Label htmlFor={`electrical-${electrical}`} className="text-sm">{electrical}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="font-medium">Smart Home Features</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {['Smart Locks', 'Smart Lighting', 'Smart Thermostat', 'Security Cameras', 'Video Doorbell', 'Whole Home Audio'].map((smart) => (
                <div key={smart} className="flex items-center space-x-2">
                  <Checkbox
                    id={`smart-${smart}`}
                    checked={selections.smartHomeFeatures.includes(smart)}
                    onCheckedChange={(checked) => handleArrayChange('smartHomeFeatures', smart, checked as boolean)}
                  />
                  <Label htmlFor={`smart-${smart}`} className="text-sm">{smart}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes & Special Requests</CardTitle>
          <CardDescription>
            Please share any special requests, preferences, or additional information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="specialRequests">Special Requests</Label>
            <Textarea
              id="specialRequests"
              value={selections.specialRequests}
              onChange={(e) => handleInputChange('specialRequests', e.target.value)}
              placeholder="Any specific requirements, accessibility needs, or special requests..."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={selections.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any other comments, questions, or information you'd like to share..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Final Actions */}
      <div className="flex gap-4 justify-center pb-8">
        <Button onClick={saveSelections} variant="outline" size="lg">
          <Save className="h-4 w-4 mr-2" />
          Save Progress
        </Button>
        <Button onClick={generatePDF} size="lg">
          <Download className="h-4 w-4 mr-2" />
          Download Complete Form
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground border-t pt-4">
        <p>
          This form helps us understand your design preferences. Once completed, our team will review your selections 
          and contact you to discuss any questions or clarifications needed.
        </p>
        <p className="mt-2">
          <Badge variant="outline">
            Tip: Save your progress frequently to avoid losing your selections
          </Badge>
        </p>
      </div>
    </div>
  );
}