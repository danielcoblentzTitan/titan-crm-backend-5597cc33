import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TITAN_STANDARD_COLORS, TITAN_PREMIUM_COLORS, TITAN_TEXTURED_COLORS, COLOR_HEX_MAP } from "@/constants/titanColors";
import { EnhancedColorSelector } from "./components/EnhancedColorSelector";
import { Upload, CheckCircle, Eye, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ScrollableModal } from '@/components/ui/scrollable-modal';
import { GarageDoorSection } from "./GarageDoorSection";
import { BathroomSection } from "./BathroomSection";
import { FlooringTypeSelector } from "./components/FlooringTypeSelector";
import { useSelectionState } from "./hooks/useSelectionState";
import { SelectionProgressBar } from "./SelectionProgressBar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useProjectTabSettings } from "@/hooks/useProjectTabSettings";

// Using uploaded images from public folder
const standardRibMetal = "/lovable-uploads/a743966e-42bb-45ef-b66b-b68d32b36767.png";
const standardRibTextured = "/lovable-uploads/19f9f65b-e7d7-4e0c-8274-845ec38747ff.png";
const standingSeam = "/lovable-uploads/d95c3cd8-6300-4395-ac0b-4636a677d068.png";
import architecturalShingles from "@/assets/panels/architectural-shingles.jpg";
const boardBattenMetal = "/lovable-uploads/5902e7a6-d1d0-4d11-ba04-c21558e8d30e.png";

// Clean door hardware images with white backgrounds
import roundKnobClean from "/lovable-uploads/b159824e-b148-44d6-aede-1576b276e976.png";
import antiqueKnobClean from "@/assets/hardware/antique-knob-clean.png";
import leverHandleClean from "@/assets/hardware/lever-handle-clean.png";
import blackLeverClean from "@/assets/hardware/black-lever-clean.png";
import boardBattenVinyl from "@/assets/siding/board-batten-vinyl.jpg";
import standardVinyl from "@/assets/siding/standard-vinyl.jpg";

import shortPanelImage from "@/assets/garage-door-short-full.jpg";
import longPanelImage from "@/assets/garage-door-long-full.jpg";

// Import countertop images
import quartzImage from "@/assets/countertops/quartz.jpg";
import graniteImage from "@/assets/countertops/granite.jpg";
import marbleImage from "@/assets/countertops/marble.jpg";

// Import door images - using uploaded images
const traditional6PanelImage = "/lovable-uploads/b94ebd2d-0ead-4eed-a1d3-f02282ee447d.png";
const panel2ModernImage = "/lovable-uploads/6c23dd63-1f16-4c51-92a9-7ffe5f4cb135.png";
const archDoorImage = "/lovable-uploads/f100f5ff-c46d-4acd-8028-9976e1b9e5f6.png";
const panel4SquareImage = "/lovable-uploads/69149624-d587-4526-bc43-88349d86551b.png";

// Import cabinet style images
import shakerKitchenImage from "@/assets/cabinets/shaker-kitchen.jpg";
import raisedPanelKitchenImage from "@/assets/cabinets/raised-panel-kitchen-clean.jpg";

// Import flooring images
import luxuryVinylImage from "@/assets/flooring/luxury-vinyl-plank.jpg";
import laminateFloorImage from "@/assets/flooring/laminate.jpg";
import hardwoodImage from "@/assets/flooring/hardwood.jpg";
import ceramicTileImage from "@/assets/flooring/ceramic-tile.jpg";
import carpetImage from "@/assets/flooring/carpet.jpg";
import polishedConcreteImage from "@/assets/flooring/polished-concrete.jpg";

// Import entry door images
import sixPanelWoodImage from "@/assets/entry-doors/six-panel-wood.jpg";
import modernGlassSteelImage from "@/assets/entry-doors/modern-glass-steel.jpg";
import farmhouseWhiteImage from "@/assets/entry-doors/farmhouse-white.jpg";
import craftsmanWoodGlassImage from "@/assets/entry-doors/craftsman-wood-glass.jpg";

// Import trim images
import craftsmanTrimImage from "/lovable-uploads/8d8f7cb0-c8cd-44c4-8688-dd0aa61e2213.png";
import squareTrimImage from "/lovable-uploads/06f639cd-db32-40bc-9102-cc6101c2e4cb.png";
import colonialTrimImage from "/lovable-uploads/10262ed1-8f11-4b49-88dc-a6156ecdb177.png";

// Import bathroom images
import floatingVanityImage from "@/assets/bathroom/floating-vanity.jpg";
import traditionalVanityImage from "@/assets/bathroom/traditional-vanity.jpg";
import vesselSinkVanityImage from "@/assets/bathroom/vessel-sink-vanity.jpg";
import doubleVanityImage from "@/assets/bathroom/double-vanity.jpg";
import freestandingTubImage from "@/assets/bathroom/freestanding-tub.jpg";
import walkInShowerImage from "@/assets/bathroom/walk-in-shower.jpg";

// Import mudroom images
import builtInCubbiesImage from "@/assets/mudroom/built-in-cubbies.jpg";
import lockerStyleImage from "@/assets/mudroom/locker-style.jpg";
import openShelvingImage from "@/assets/mudroom/open-shelving.jpg";
import benchStorageImage from "@/assets/mudroom/bench-storage.jpg";

interface ColorSelectionSectionProps {
  selections: any;
  setSelections: (selections: any) => void;
  isEditing: boolean;
  currentTab?: string;
  setCurrentTab?: (tab: string) => void;
  projectId?: string;
}

export const ColorSelectionSection = ({ selections, setSelections, isEditing, currentTab = "exterior", setCurrentTab, projectId }: ColorSelectionSectionProps) => {
  const [selectedRoom, setSelectedRoom] = useState('living_room');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string } | null>(null);
  const [selectedTexturedRoofColor, setSelectedTexturedRoofColor] = useState<string>('#8B4513'); // Default brown
  const [selectedTexturedSidingColor, setSelectedTexturedSidingColor] = useState<string>('#8B4513'); // Default brown
  const [texturedModalOpen, setTexturedModalOpen] = useState(false);
  const [selectedTexturedColor, setSelectedTexturedColor] = useState<{ color: any; index: number; type: 'roof' | 'siding' } | null>(null);
  const [trimModalOpen, setTrimModalOpen] = useState(false);
  const [kitchenModalOpen, setKitchenModalOpen] = useState(false);
  const [selectedKitchenImage, setSelectedKitchenImage] = useState<{src: string, title: string, description: string, features: string[]} | null>(null);
  // Use passed currentTab or fallback to local state
  const [currentSection, setCurrentSection] = useState(currentTab);
  
  // Get tab settings for this project
  const { isTabEnabled } = useProjectTabSettings(projectId || '');
  
  // Color selection handler for FlooringTypeSelector
  const handleColorSelect = (roomPrefix: string, colorName: string) => {
    if (isEditing) {
      const colorSelectionKey = `${roomPrefix}_flooring_color`;
      const newSelections = { ...selections };
      newSelections[colorSelectionKey] = colorName.toLowerCase().replace(/\s+/g, '_');
      setSelections(newSelections);
    }
  };
  
  // Use the selection state hook
  const { updateSelection, updateColorSelection, updateCustomColor } = useSelectionState({
    selections,
    setSelections,
    isEditing
  });

  const openImageModal = (src: string, title: string) => {
    setSelectedImage({ src, title });
    setImageModalOpen(true);
  };

  const openTexturedModal = (colorIndex: number, type: 'roof' | 'siding') => {
    setSelectedTexturedColor({ 
      color: TITAN_TEXTURED_COLORS[colorIndex], 
      index: colorIndex, 
      type 
    });
    setTexturedModalOpen(true);
  };

  const navigateTexturedColor = (direction: 'prev' | 'next') => {
    if (!selectedTexturedColor) return;
    
    const newIndex = direction === 'prev' 
      ? (selectedTexturedColor.index === 0 ? TITAN_TEXTURED_COLORS.length - 1 : selectedTexturedColor.index - 1)
      : (selectedTexturedColor.index === TITAN_TEXTURED_COLORS.length - 1 ? 0 : selectedTexturedColor.index + 1);
    
    setSelectedTexturedColor({
      ...selectedTexturedColor,
      color: TITAN_TEXTURED_COLORS[newIndex],
      index: newIndex
    });
  };

  const handleTexturedColorSelect = (color: any, type: 'roof' | 'siding') => {
    if (!isEditing) return;
    
    const newSelections = { ...selections };
    const colorKey = type === 'roof' ? 'roof_color' : 'siding_color';
    newSelections[colorKey] = `${color.name} (${color.code})`;
    setSelections(newSelections);
    
    if (type === 'roof') {
      setSelectedTexturedRoofColor(color.hex);
    } else {
      setSelectedTexturedSidingColor(color.hex);
    }
  };

  // Helper function to extract hex color from selection string
  const getColorHex = (colorSelection: string): string => {
    // Extract color name from selection string like "Brown (WXB1009L)"
    const colorName = colorSelection.split(' (')[0];
    return COLOR_HEX_MAP[colorName] || "#CCCCCC";
  };

  const colorOptions = [...TITAN_STANDARD_COLORS, ...TITAN_PREMIUM_COLORS];

  const buildingComponents = [
    { id: 'siding', name: 'Siding', description: 'Primary wall color' },
    { id: 'roof', name: 'Roof', description: 'Main roof color' },
    { id: 'trim', name: 'Trim', description: 'Entry door, window, and garage door trim' },
    { id: 'fascia', name: 'Fascia', description: 'Boards where gutters are attached' },
    { id: 'wainscoting', name: 'Wainscoting', description: 'Lower wall accent panels' },
    { id: 'wainscoting_corner', name: 'Wainscoting Corner Color', description: 'Corner trim color for wainscoting' }
  ];


  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="text-center">
          <span className="text-2xl font-bold">Titan Buildings – Customer Selections Sheet</span>
          <p className="text-sm text-muted-foreground mt-2">Choose colors and materials for your barndominium</p>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={currentSection} onValueChange={(value) => {
          setCurrentSection(value);
          setCurrentTab?.(value);
        }} className="w-full">
          <TabsList className="grid w-full bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-1 shadow-sm" style={{
            gridTemplateColumns: `repeat(${[
              isTabEnabled('exterior', 'design'),
              isTabEnabled('garage', 'design'),
              isTabEnabled('entry', 'design'),
              isTabEnabled('interior', 'design'),
              isTabEnabled('kitchen', 'design'),
              isTabEnabled('bathrooms', 'design'),
              isTabEnabled('mudroom', 'design')
            ].filter(Boolean).length}, 1fr)`
          }}>
            {isTabEnabled('exterior', 'design') && (
              <TabsTrigger 
                value="exterior" 
                className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md rounded-lg transition-all duration-200 hover:bg-white/50"
              >
                <span className="hidden sm:inline">Exterior</span>
              </TabsTrigger>
            )}
            {isTabEnabled('garage', 'design') && (
              <TabsTrigger 
                value="garage" 
                className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-md rounded-lg transition-all duration-200 hover:bg-white/50"
              >
                <span className="hidden sm:inline">Garage</span>
              </TabsTrigger>
            )}
            {isTabEnabled('entry', 'design') && (
              <TabsTrigger 
                value="entry" 
                className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-md rounded-lg transition-all duration-200 hover:bg-white/50"
              >
                <span className="hidden sm:inline">Entry</span>
              </TabsTrigger>
            )}
            {isTabEnabled('interior', 'design') && (
              <TabsTrigger 
                value="interior" 
                className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-md rounded-lg transition-all duration-200 hover:bg-white/50"
              >
                <span className="hidden sm:inline">Interior</span>
              </TabsTrigger>
            )}
            {isTabEnabled('kitchen', 'design') && (
              <TabsTrigger 
                value="kitchen" 
                className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-red-700 data-[state=active]:shadow-md rounded-lg transition-all duration-200 hover:bg-white/50"
              >
                <span className="hidden sm:inline">Kitchen</span>
              </TabsTrigger>
            )}
            {isTabEnabled('bathrooms', 'design') && (
              <TabsTrigger 
                value="bathrooms" 
                className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-cyan-700 data-[state=active]:shadow-md rounded-lg transition-all duration-200 hover:bg-white/50"
              >
                <span className="hidden sm:inline">Baths</span>
              </TabsTrigger>
            )}
            {isTabEnabled('mudroom', 'design') && (
              <TabsTrigger 
                value="mudroom" 
                className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-md rounded-lg transition-all duration-200 hover:bg-white/50"
              >
                <span className="hidden sm:inline">Mudroom</span>
              </TabsTrigger>
            )}
          </TabsList>


          {/* Exterior Colors Tab */}
          <TabsContent value="exterior" className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
              <h3 className="text-lg font-bold text-blue-800 mb-2">Metal Building Colors - 40 Year Warranty</h3>
              <p className="text-sm text-blue-600">Choose your colors for each building component</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Non-wainscoting components */}
              {buildingComponents.filter(component => !component.id.includes('wainscoting')).map((component) => (
                <div key={component.id} className="space-y-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="text-base font-semibold">{component.name}</h4>
                        <p className="text-xs text-muted-foreground">{component.description}</p>
                      </div>
                    </div>
                    {selections[`${component.id}_color`] && (
                      <div className="flex items-center space-x-2 px-2 py-1 bg-green-50 rounded-full">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: getColorHex(selections[`${component.id}_color`]) }}
                        />
                        <span className="text-xs font-medium text-green-800">Selected</span>
                      </div>
                    )}
                  </div>
                  
                  <EnhancedColorSelector
                    colors={colorOptions}
                    selectedValue={selections[`${component.id}_color`] || ''}
                    onColorSelect={(colorValue) => {
                      console.log('ColorSelectionSection - onColorSelect called:', { colorValue, isEditing, componentId: component.id });
                      if (isEditing) {
                        try {
                          console.log('ColorSelectionSection - before updating selections:', selections);
                          const newSelections = { ...selections };
                          newSelections[`${component.id}_color`] = colorValue;
                          console.log('ColorSelectionSection - new selections:', newSelections);
                          setSelections(newSelections);
                          console.log('ColorSelectionSection - setSelections called successfully');
                        } catch (error) {
                          console.error('ColorSelectionSection - Error in onColorSelect:', error);
                        }
                      }
                    }}
                    isEditing={isEditing}
                    componentId={component.id}
                  />
                </div>
              ))}
            </div>
            
            {/* Wainscoting Add Option */}
            <div className="flex items-center justify-center my-6">
              <Button
                type="button"
                variant={selections.wainscoting_included ? "default" : "outline"}
                size="lg"
                onClick={() => {
                  if (isEditing) {
                    const newSelections = { ...selections };
                    newSelections.wainscoting_included = !selections.wainscoting_included;
                    // Clear wainscoting selections if removing
                    if (!newSelections.wainscoting_included) {
                      newSelections.wainscoting_color = '';
                      newSelections.wainscoting_corner_color = '';
                    }
                    setSelections(newSelections);
                  }
                }}
                disabled={!isEditing}
              >
                {selections.wainscoting_included ? "✓ Wainscoting Added" : "+ Add Wainscoting"}
              </Button>
            </div>
            
            {/* Wainscoting components */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Wainscoting components */}
              {buildingComponents.filter(component => component.id.includes('wainscoting')).map((component) => (
                <div key={component.id} className="space-y-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="text-base font-semibold">{component.name}</h4>
                        <p className="text-xs text-muted-foreground">{component.description}</p>
                      </div>
                      {component.id === 'wainscoting_corner' && !selections.wainscoting_included && (
                        <div className="text-xs text-gray-500 italic">
                          (Wainscoting not added)
                        </div>
                      )}
                    </div>
                    {selections[`${component.id}_color`] && (
                      <div className="flex items-center space-x-2 px-2 py-1 bg-green-50 rounded-full">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: getColorHex(selections[`${component.id}_color`]) }}
                        />
                        <span className="text-xs font-medium text-green-800">Selected</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Only show color selection if wainscoting components are included */}
                  {selections.wainscoting_included && (
                    <EnhancedColorSelector
                      colors={colorOptions}
                      selectedValue={selections[`${component.id}_color`] || ''}
                      onColorSelect={(colorValue) => {
                        console.log('ColorSelectionSection - onColorSelect called:', { colorValue, isEditing, componentId: component.id });
                        if (isEditing) {
                          try {
                            console.log('ColorSelectionSection - before updating selections:', selections);
                            const newSelections = { ...selections };
                            newSelections[`${component.id}_color`] = colorValue;
                            console.log('ColorSelectionSection - new selections:', newSelections);
                            setSelections(newSelections);
                            console.log('ColorSelectionSection - setSelections called successfully');
                          } catch (error) {
                            console.error('ColorSelectionSection - Error in onColorSelect:', error);
                          }
                        }
                      }}
                      isEditing={isEditing}
                      componentId={component.id}
                    />
                  )}
                </div>
              ))}
            </div>


            {/* Roofing Selection */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-4">Roofing Selection</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <label className="flex flex-col items-center space-y-3 cursor-pointer border-2 border-transparent hover:border-primary rounded-lg p-4 bg-white transition-all">
                  <input 
                    type="radio" 
                    name="metal_panel" 
                    value="standard_rib" 
                    className="text-primary"
                    disabled={!isEditing}
                  />
                   <div className="relative w-full h-24 bg-gray-300 rounded-lg bg-cover bg-center group" 
                        style={{backgroundImage: `url(${standardRibMetal})`}}>
                       <div 
                         className="absolute top-2 right-2 bg-white/90 rounded-lg p-1.5 shadow-md hover:bg-white transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          openImageModal(standardRibMetal, "Standard Rib Metal");
                        }}
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </div>
                   </div>
                  <div className="text-center">
                    <strong className="text-sm">Standard Rib Metal</strong>
                    <p className="text-xs text-gray-600 mt-1">Traditional vertical ribbed metal panel</p>
                  </div>
                </label>
                
                <label className="flex flex-col items-center space-y-3 cursor-pointer border-2 border-transparent hover:border-primary rounded-lg p-4 bg-white transition-all">
                  <input 
                    type="radio" 
                    name="metal_panel" 
                    value="standard_rib_textured" 
                    className="text-primary"
                    disabled={!isEditing}
                  />
                   <div className="relative w-full h-24 bg-gray-400 rounded-lg bg-cover bg-center group" 
                        style={{backgroundImage: `url(${standardRibTextured})`}}>
                     {/* Color overlay */}
                     <div 
                       className="absolute inset-0 rounded-lg opacity-30 mix-blend-multiply"
                       style={{ backgroundColor: selectedTexturedRoofColor }}
                     />
                     <div 
                        className="absolute top-2 right-2 bg-white/90 rounded-lg p-1.5 shadow-md hover:bg-white transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                       onClick={(e) => {
                         e.stopPropagation();
                         openImageModal(standardRibTextured, "Standard Rib Metal Textured");
                       }}
                     >
                       <Eye className="h-4 w-4 text-gray-600" />
                     </div>
                  </div>
                   <div className="text-center">
                     <strong className="text-sm">Standard Rib Metal Textured</strong>
                     <p className="text-xs text-gray-600 mt-1">Textured finish vertical ribbed panel</p>
                      <p className="text-xs text-orange-600 font-medium mt-1 italic">*Upgraded product. Price will be provided if selection has been made</p>
                     
                      {/* Available textured colors */}
                      <div className="flex justify-center gap-2 mt-2">
                        {TITAN_TEXTURED_COLORS.map((color, index) => {
                          const isSelected = selections.roof_color === `${color.name} (${color.code})`;
                          return (
                            <div 
                              key={index}
                              className={`relative cursor-pointer group ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                              onClick={() => {
                                if (isEditing) {
                                  const newSelections = { ...selections };
                                  newSelections['roof_color'] = `${color.name} (${color.code})`;
                                  setSelections(newSelections);
                                  setSelectedTexturedRoofColor(color.hex);
                                }
                              }}
                            >
                              <div className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                                isSelected ? 'border-primary shadow-lg' : 'border-gray-300 hover:border-gray-500'
                              }`}>
                                <div 
                                  className="w-full h-full rounded-full relative overflow-hidden"
                                  style={{ backgroundColor: color.hex }}
                                >
                                  {/* Texture overlay for small circles */}
                                  <div 
                                    className="absolute inset-0 opacity-20 rounded-full"
                                    style={{
                                      backgroundImage: `
                                        repeating-linear-gradient(
                                          45deg,
                                          transparent,
                                          transparent 1px,
                                          rgba(255,255,255,0.1) 1px,
                                          rgba(255,255,255,0.1) 2px
                                        )
                                      `
                                    }}
                                  />
                                  {/* Eye icon for modal view */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openTexturedModal(index, 'roof');
                                    }}
                                    className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors opacity-0 group-hover:opacity-100 rounded-full"
                                  >
                                    <Eye size={12} className="text-white drop-shadow-lg" />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Selected indicator */}
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                   </div>
                </label>
                
                <label className="flex flex-col items-center space-y-3 cursor-pointer border-2 border-transparent hover:border-primary rounded-lg p-4 bg-white transition-all">
                  <input 
                    type="radio" 
                    name="metal_panel" 
                    value="standing_seam" 
                    className="text-primary"
                    disabled={!isEditing}
                  />
                   <div className="relative w-full h-24 bg-gray-500 rounded-lg bg-cover bg-center group" 
                        style={{backgroundImage: `url(${standingSeam})`}}>
                      <div 
                         className="absolute top-2 right-2 bg-white/90 rounded-lg p-1.5 shadow-md hover:bg-white transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          openImageModal(standingSeam, "Standing Seam with Hidden Fastener");
                        }}
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </div>
                   </div>
                  <div className="text-center">
                    <strong className="text-sm">Standing Seam with Hidden Fastener</strong>
                    <p className="text-xs text-gray-600 mt-1">Premium concealed fastener system</p>
                     <p className="text-xs text-orange-600 font-medium mt-1 italic">*Upgraded product. Price will be provided if selection has been made</p>
                  </div>
                </label>
                
                <label className="flex flex-col items-center space-y-3 cursor-pointer border-2 border-transparent hover:border-primary rounded-lg p-4 bg-white transition-all">
                  <input 
                    type="radio" 
                    name="metal_panel" 
                    value="architectural_shingles" 
                    className="text-primary"
                    disabled={!isEditing}
                  />
                   <div className="relative w-full h-24 bg-gray-600 rounded-lg bg-cover bg-center group" 
                        style={{backgroundImage: `url(${architecturalShingles})`}}>
                     <div 
                       className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center cursor-pointer"
                       onClick={(e) => {
                         e.stopPropagation();
                         openImageModal(architecturalShingles, "Architectural Shingles");
                       }}
                     >
                       <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-6 w-6" />
                     </div>
                   </div>
                  <div className="text-center">
                    <strong className="text-sm">Architectural Shingles</strong>
                    <p className="text-xs text-gray-600 mt-1">Traditional asphalt roofing shingles</p>
                     <p className="text-xs text-orange-600 font-medium mt-1 italic">*Upgraded product. Price will be provided if selection has been made</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Siding Selection */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-4">Siding Selection</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <label className="flex flex-col items-center space-y-3 cursor-pointer border-2 border-transparent hover:border-primary rounded-lg p-4 bg-white transition-all">
                  <input 
                    type="radio" 
                    name="siding_panel" 
                    value="standard_rib_metal" 
                    className="text-primary"
                    disabled={!isEditing}
                  />
                   <div className="relative w-full h-24 bg-gray-300 rounded-lg bg-cover bg-center group" 
                        style={{backgroundImage: `url(${standardRibMetal})`}}>
                     <div 
                       className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center cursor-pointer"
                       onClick={(e) => {
                         e.stopPropagation();
                         openImageModal(standardRibMetal, "Standard Rib Metal");
                       }}
                     >
                       <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-6 w-6" />
                     </div>
                   </div>
                  <div className="text-center">
                    <strong className="text-sm">Standard Rib Metal</strong>
                    <p className="text-xs text-gray-600 mt-1">Traditional vertical ribbed metal siding</p>
                  </div>
                </label>
                
                <label className="flex flex-col items-center space-y-3 cursor-pointer border-2 border-transparent hover:border-primary rounded-lg p-4 bg-white transition-all">
                  <input 
                    type="radio" 
                    name="siding_panel" 
                    value="standard_rib_textured" 
                    className="text-primary"
                    disabled={!isEditing}
                  />
                   <div className="relative w-full h-24 bg-gray-400 rounded-lg bg-cover bg-center group" 
                        style={{backgroundImage: `url(${standardRibTextured})`}}>
                     {/* Color overlay */}
                     <div 
                       className="absolute inset-0 rounded-lg opacity-30 mix-blend-multiply"
                       style={{ backgroundColor: selectedTexturedSidingColor }}
                     />
                     <div 
                        className="absolute top-2 right-2 bg-white/90 rounded-lg p-1.5 shadow-md hover:bg-white transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                       onClick={(e) => {
                         e.stopPropagation();
                         openImageModal(standardRibTextured, "Standard Rib Metal Textured");
                       }}
                     >
                       <Eye className="h-4 w-4 text-gray-600" />
                     </div>
                  </div>
                   <div className="text-center">
                     <strong className="text-sm">Standard Rib Metal Textured</strong>
                     <p className="text-xs text-gray-600 mt-1">Textured finish ribbed metal</p>
                      <p className="text-xs text-orange-600 font-medium mt-1 italic">*Upgraded product. Price will be provided if selection has been made</p>
                     
                      {/* Available textured colors */}
                      <div className="flex justify-center gap-2 mt-2">
                        {TITAN_TEXTURED_COLORS.map((color, index) => {
                          const isSelected = selections.siding_color === `${color.name} (${color.code})`;
                          return (
                            <div 
                              key={index}
                              className={`relative cursor-pointer group ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                              onClick={() => {
                                if (isEditing) {
                                  const newSelections = { ...selections };
                                  newSelections['siding_color'] = `${color.name} (${color.code})`;
                                  setSelections(newSelections);
                                  setSelectedTexturedSidingColor(color.hex);
                                }
                              }}
                            >
                              <div className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                                isSelected ? 'border-primary shadow-lg' : 'border-gray-300 hover:border-gray-500'
                              }`}>
                                <div 
                                  className="w-full h-full rounded-full relative overflow-hidden"
                                  style={{ backgroundColor: color.hex }}
                                >
                                  {/* Texture overlay for small circles */}
                                  <div 
                                    className="absolute inset-0 opacity-20 rounded-full"
                                    style={{
                                      backgroundImage: `
                                        repeating-linear-gradient(
                                          45deg,
                                          transparent,
                                          transparent 1px,
                                          rgba(255,255,255,0.1) 1px,
                                          rgba(255,255,255,0.1) 2px
                                        )
                                      `
                                    }}
                                  />
                                  {/* Eye icon for modal view */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openTexturedModal(index, 'siding');
                                    }}
                                    className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors opacity-0 group-hover:opacity-100 rounded-full"
                                  >
                                    <Eye size={12} className="text-white drop-shadow-lg" />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Selected indicator */}
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                   </div>
                </label>
                
                <label className="flex flex-col items-center space-y-3 cursor-pointer border-2 border-transparent hover:border-primary rounded-lg p-4 bg-white transition-all">
                  <input 
                    type="radio" 
                    name="siding_panel" 
                    value="board_batten_metal" 
                    className="text-primary"
                    disabled={!isEditing}
                  />
                   <div className="relative w-full h-24 bg-gray-500 rounded-lg bg-cover bg-center group" 
                        style={{backgroundImage: `url(${boardBattenMetal})`}}>
                      <div 
                         className="absolute top-2 right-2 bg-white/90 rounded-lg p-1.5 shadow-md hover:bg-white transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          openImageModal(boardBattenMetal, "Board and Batten Metal");
                        }}
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </div>
                   </div>
                  <div className="text-center">
                    <strong className="text-sm">Board and Batten Metal</strong>
                    <p className="text-xs text-gray-600 mt-1">Wide flat panels with metal seams</p>
                     <p className="text-xs text-orange-600 font-medium mt-1 italic">*Upgraded product. Price will be provided if selection has been made</p>
                  </div>
                </label>
                
                <label className="flex flex-col items-center space-y-3 cursor-pointer border-2 border-transparent hover:border-primary rounded-lg p-4 bg-white transition-all">
                  <input 
                    type="radio" 
                    name="siding_panel" 
                    value="board_batten_vinyl" 
                    className="text-primary"
                    disabled={!isEditing}
                  />
                   <div className="relative w-full h-24 bg-gray-600 rounded-lg bg-cover bg-center group" 
                        style={{backgroundImage: `url(${boardBattenVinyl})`}}>
                      <div 
                         className="absolute top-2 right-2 bg-white/90 rounded-lg p-1.5 shadow-md hover:bg-white transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          openImageModal(boardBattenVinyl, "Board and Batten Vinyl");
                        }}
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </div>
                   </div>
                  <div className="text-center">
                    <strong className="text-sm">Board and Batten Vinyl</strong>
                    <p className="text-xs text-gray-600 mt-1">Vinyl board and batten style</p>
                     <p className="text-xs text-orange-600 font-medium mt-1 italic">*Upgraded product. Price will be provided if selection has been made</p>
                  </div>
                </label>
                
                <label className="flex flex-col items-center space-y-3 cursor-pointer border-2 border-transparent hover:border-primary rounded-lg p-4 bg-white transition-all">
                  <input 
                    type="radio" 
                    name="siding_panel" 
                    value="standard_vinyl" 
                    className="text-primary"
                    disabled={!isEditing}
                  />
                   <div className="relative w-full h-24 bg-gray-700 rounded-lg bg-cover bg-center group" 
                        style={{backgroundImage: `url(${standardVinyl})`}}>
                      <div 
                         className="absolute top-2 right-2 bg-white/90 rounded-lg p-1.5 shadow-md hover:bg-white transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          openImageModal(standardVinyl, "Standard Vinyl Siding");
                        }}
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </div>
                   </div>
                  <div className="text-center">
                    <strong className="text-sm">Standard Vinyl Siding</strong>
                    <p className="text-xs text-gray-600 mt-1">Traditional horizontal vinyl siding</p>
                     <p className="text-xs text-orange-600 font-medium mt-1 italic">*Upgraded product. Price will be provided if selection has been made</p>
                  </div>
                </label>
              </div>
            </div>
            
            {/* Selection Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-blue-800">Your Color Selections</h3>
                
                {/* Color Combination Preview */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-blue-700">Color Combination:</span>
                  <div className="flex space-x-1">
                    {[
                      { id: 'siding', name: 'Main Siding' },
                      { id: 'trim', name: 'Trim' },
                      { id: 'fascia', name: 'Fascia' },
                      { id: 'roof', name: 'Roof' },
                      { id: 'wainscoting_corner', name: 'Wainscoting Corner' },
                      { id: 'wainscoting', name: 'Wainscoting' }
                    ].map((component) => {
                      const selectedColor = selections[`${component.id}_color`];
                      return selectedColor ? (
                        <div
                          key={component.id}
                          className="w-8 h-8 rounded shadow-sm"
                          style={{ backgroundColor: getColorHex(selectedColor) }}
                          title={`${component.name}: ${selectedColor.split(' (')[0]}`}
                        />
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {[
                  { id: 'siding', name: 'Main Siding', icon: '' },
                  { id: 'trim', name: 'Trim', icon: '' },
                  { id: 'fascia', name: 'Fascia', icon: '' },
                  { id: 'roof', name: 'Roof', icon: '' },
                  { id: 'wainscoting_corner', name: 'Wainscoting Corner', icon: '' },
                  { id: 'wainscoting', name: 'Wainscoting', icon: '' }
                ].map((component) => {
                  const selectedColor = selections[`${component.id}_color`];
                  return (
                    <div key={component.id} className="p-3 border rounded-lg bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{component.name}</span>
                        </div>
                        {selectedColor ? (
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: getColorHex(selectedColor) }}
                            />
                            <span className="text-xs text-green-600 font-medium">
                              Selected: {selectedColor.split(' (')[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Not selected</span>
                        )}
                      </div>
                      {selectedColor && (
                        <div className="mt-1 text-xs text-gray-600">{selectedColor}</div>
                      )}
                    </div>
                  );
                })}
              </div>

            {/* Window Selection */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-4">Window Grid Patterns & Colors</h4>
              
              <div className="mb-6">
                <h5 className="font-medium mb-3">Grid Pattern</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { id: 'no_grid', name: 'No Grid', description: 'Clean, unobstructed glass', image: '/lovable-uploads/11a93c6e-d799-4467-b26e-656a706fb0da.png' },
                    { id: 'colonial', name: 'Colonial', description: 'Traditional divided light pattern', image: '/lovable-uploads/d2f5dfde-f114-4dd6-bfd1-95cd4d069953.png' },
                    { id: 'half_colonial', name: 'Half Colonial', description: 'Top section divided lights only', image: '/lovable-uploads/f116d633-f732-4dfb-b047-8844c37e349a.png' },
                    { id: 'prairie', name: 'Prairie', description: 'Modern geometric grid pattern', image: '/lovable-uploads/733df529-b1a3-425d-a981-420e5602cffa.png' },
                    { id: 'farmhouse', name: 'Farmhouse', description: 'Simple rectangular divisions', image: '/lovable-uploads/2b2e5496-d77b-4f1b-b537-5cfa4be1f69d.png' }
                  ].map((pattern) => (
                    <label 
                      key={pattern.id} 
                      className={`flex flex-col h-full cursor-pointer border-2 rounded-lg p-4 bg-white transition-all hover:shadow-md ${
                        selections.window_grid_pattern === pattern.id 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' 
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="window_grid_pattern" 
                        value={pattern.id} 
                        className="sr-only"
                        disabled={!isEditing}
                        onChange={() => {
                          if (isEditing) {
                            const newSelections = { ...selections };
                            newSelections.window_grid_pattern = pattern.id;
                            setSelections(newSelections);
                          }
                        }}
                      />
                      
                      {/* Image Container */}
                      <div className="relative w-full h-32 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 mb-3">
                        <div 
                          className="w-full h-full bg-cover bg-center cursor-pointer transition-transform duration-200"
                          style={{
                            backgroundImage: `url(${pattern.image})`,
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openImageModal(pattern.image, `Window Grid Pattern - ${pattern.name}`);
                          }}
                        >
                           {/* Hover Overlay */}
                            <div className="absolute top-2 right-2 bg-white/90 rounded-lg p-1.5 shadow-md hover:bg-white transition-colors cursor-pointer opacity-0 hover:opacity-100">
                              <Eye className="h-4 w-4 text-gray-600" />
                            </div>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex flex-col flex-1 text-center">
                        <div className="flex-1">
                          <strong className="text-sm font-semibold text-gray-900 block">{pattern.name}</strong>
                          <p className="text-xs text-gray-600 leading-tight mt-1">{pattern.description}</p>
                        </div>
                        <p className="text-xs text-green-600 font-medium mt-2">Standard option</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Window Colors */}
              <div>
                <h5 className="font-medium mb-3">Window Frame Colors (Exterior/Interior)</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { 
                      id: 'white_white', 
                      name: 'White/White', 
                      description: 'White exterior, white interior',
                      exteriorColor: '#FFFFFF',
                      interiorColor: '#FFFFFF',
                      standard: true 
                    },
                    { 
                      id: 'white_black', 
                      name: 'Black EXT / White INT', 
                      description: 'Black exterior, white interior',
                      exteriorColor: '#1a1a1a',
                      interiorColor: '#FFFFFF'
                    },
                    { 
                      id: 'black_black', 
                      name: 'Black/Black', 
                      description: 'Black exterior, black interior',
                      exteriorColor: '#1a1a1a',
                      interiorColor: '#1a1a1a'
                    }
                  ].map((color) => (
                    <label key={color.id} className={`flex flex-col items-center space-y-3 cursor-pointer border-2 rounded-lg p-4 bg-white transition-all hover:shadow-md ${
                      selections.window_frame_color === color.id ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' : 'border-gray-200 hover:border-primary/50'
                    }`}>
                      <input 
                        type="radio" 
                        name="window_frame_color" 
                        value={color.id} 
                        className="text-primary"
                        disabled={!isEditing}
                        onChange={() => {
                          if (isEditing) {
                            const newSelections = { ...selections };
                            newSelections.window_frame_color = color.id;
                            setSelections(newSelections);
                          }
                        }}
                      />
                      
                      {/* Color Swatch */}
                      <div className="relative w-20 h-16 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                        {/* Split swatch showing exterior and interior */}
                        <div className="absolute inset-0 flex">
                          {/* Exterior half */}
                          <div 
                            className="w-1/2 h-full border-r border-gray-300"
                            style={{ backgroundColor: color.exteriorColor }}
                          >
                            {color.exteriorColor === '#FFFFFF' && (
                              <div className="w-full h-full border border-gray-200"></div>
                            )}
                          </div>
                          {/* Interior half */}
                          <div 
                            className="w-1/2 h-full"
                            style={{ backgroundColor: color.interiorColor }}
                          >
                            {color.interiorColor === '#FFFFFF' && (
                              <div className="w-full h-full border border-gray-200"></div>
                            )}
                          </div>
                        </div>
                        {/* Labels */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs py-1">
                          <div className="flex justify-between px-1">
                            <span>EXT</span>
                            <span>INT</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <strong className="text-sm">{color.name}</strong>
                        <p className="text-xs text-gray-600 mt-1">{color.description}</p>
                        {color.standard && (
                          <p className="text-xs text-green-600 font-medium mt-1">Standard option</p>
                        )}
                        {!color.standard && (
                          <p className="text-xs text-orange-600 font-medium mt-1 italic">*Upgraded product. Price will be provided if selection has been made</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
              
            </div>

            {/* Standard Colors Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-2">🏡 Standard Color Components</h3>
              <p className="text-sm text-gray-600 mb-4">These components come in standard colors. You can request a different color if needed.</p>
              <div className="space-y-4">
                {[
                  { component: 'LT Ceiling', standardColor: 'Brite White', fieldName: 'lt_ceiling_custom' },
                  { component: 'Soffit', standardColor: 'White', fieldName: 'soffit_custom' },
                  { component: 'Gutters and Downspouts', standardColor: 'White', fieldName: 'gutters_custom' },
                  { component: 'Vinyl Post Sleeves', standardColor: 'White', fieldName: 'post_sleeves_custom' }
                ].map((item) => (
                  <div key={item.fieldName} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                    <div className="flex items-center space-x-4">
                      <span className="font-medium">{item.component}</span>
                      <span className="text-sm text-muted-foreground">Standard: {item.standardColor}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm">Request different color:</label>
                      <Input 
                        name={item.fieldName}
                        placeholder="Enter color request..."
                        className="w-48"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="text-lg font-bold text-foreground mb-2">ℹ️ Important Color Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <p><strong>40-Year Warranty:</strong> All colors include Sherwin-Williams® 40-year paint warranty</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <p><strong>Color Matching:</strong> Colors shown may vary slightly from actual metal panels</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <p><strong>Metal Samples:</strong> Contact our office for physical color samples if needed</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <p><strong>Popular Combinations:</strong> Many customers choose matching siding and trim with contrasting roof</p>
                </div>
              </div>
            </div>

          </TabsContent>

          {/* Garage Doors Tab */}
          <TabsContent value="garage">
            <GarageDoorSection 
              selections={selections}
              setSelections={setSelections}
              isEditing={isEditing}
            />
            
          </TabsContent>

          {/* Entry Doors Tab */}
          <TabsContent value="entry" className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
              <h3 className="text-lg font-bold text-green-800 mb-2">Entry Door Selection</h3>
              <p className="text-sm text-green-600">Choose your main entrance door style and features</p>
            </div>

            {/* Door Style Selection */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Front Entry Door Style</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 {[
                   { id: 'shaker_entry_door', name: 'Shaker Entry Door', description: 'Clean modern style with sleek lines', image: '/lovable-uploads/759236ab-9ac8-4085-8a5f-d477cb48377c.png' },
                   { id: 'shaker_with_sidelights', name: 'Shaker with Sidelights', description: 'Enhanced entrance with side windows', image: '/lovable-uploads/f1c40d56-f91d-4446-9735-b7a1da88b177.png' },
                   { id: 'craftsman_style', name: 'Craftsman Style', description: 'Traditional wood with glass panel', image: '/lovable-uploads/2829cec7-78db-43ed-b982-ffcb34627281.png' },
                   { id: 'six_panel_wood', name: 'Six Panel Wood', description: 'Classic traditional raised panel design', image: '/lovable-uploads/3d3c0c83-6e9a-4842-a134-7ff60912b548.png' }
                ].map((style) => (
                   <div 
                     key={style.id}
                     className={`border-2 rounded-lg cursor-pointer transition-all hover:border-primary overflow-hidden w-full flex flex-col bg-white ${
                       selections.entry_door_style === style.id ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' : 'border-gray-200 hover:shadow-lg'
                     }`}
                     onClick={() => {
                       if (isEditing) {
                         const newSelections = { ...selections };
                         newSelections.entry_door_style = style.id;
                         setSelections(newSelections);
                       }
                     }}
                   >
                     <div className="relative h-64">
                       <img 
                         src={style.image} 
                         alt={style.name}
                         className="w-full h-full object-cover"
                       />
                       {selections.entry_door_style === style.id && (
                         <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                           <span className="text-white text-xs">✓</span>
                         </div>
                       )}
                     </div>
                     <div className="p-4 bg-white h-36 flex flex-col justify-between">
                       <div>
                         <h5 className="font-semibold text-lg text-gray-900 mb-1">{style.name}</h5>
                         <p className="text-sm text-blue-600 mb-2">{style.description}</p>
                       </div>
                       <div className="flex items-center justify-between min-h-[24px]">
                         <div>
                           {(style.id === 'shaker_with_sidelights' || style.id === 'craftsman_style' || style.id === 'six_panel_wood') && (
                             <div className="bg-amber-100 border border-amber-300 text-amber-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                               <Star className="h-3 w-3 fill-current" />
                               Upgrade
                             </div>
                           )}
                         </div>
                         {selections.entry_door_style === style.id && (
                           <div className="text-xs text-green-600 font-medium">Selected</div>
                         )}
                       </div>
                     </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Remaining Entry Door Style */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Remaining Entry Door Style</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div 
                   className={`border-2 rounded-lg cursor-pointer transition-all hover:border-primary overflow-hidden w-full flex flex-col bg-white ${
                    selections.standard_remaining_doors === 'nine_lite_entry' ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' : 'border-gray-200 hover:shadow-lg'
                  }`}
                  onClick={() => {
                    if (isEditing) {
                      const newSelections = { ...selections };
                      newSelections.standard_remaining_doors = 'nine_lite_entry';
                      setSelections(newSelections);
                    }
                  }}
                >
                   <div className="relative h-64">
                    <img 
                      src="/lovable-uploads/48f18b60-3236-4e97-8aae-b66cab00b37c.png" 
                      alt="9-lite Entry Door for Remaining Doors"
                      className="w-full h-full object-cover"
                    />
                    {selections.standard_remaining_doors === 'nine_lite_entry' && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                   <div className="p-4 bg-white">
                     <h5 className="font-semibold text-lg text-gray-900 mb-1">9-Lite Entry Door</h5>
                     <p className="text-sm text-blue-600">Standard 9-lite option for all other entry doors</p>
                     {selections.standard_remaining_doors === 'nine_lite_entry' && (
                       <div className="text-xs text-green-600 font-medium mt-2">Selected</div>
                     )}
                   </div>
                </div>

                <div 
                  className={`border-2 rounded-lg cursor-pointer transition-all hover:border-primary overflow-hidden w-full flex flex-col bg-white ${
                    selections.standard_remaining_doors === 'six_panel_entry' ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' : 'border-gray-200 hover:shadow-lg'
                  }`}
                  onClick={() => {
                    if (isEditing) {
                      const newSelections = { ...selections };
                      newSelections.standard_remaining_doors = 'six_panel_entry';
                      setSelections(newSelections);
                    }
                  }}
                >
                  <div className="relative h-64">
                    <img 
                      src="/lovable-uploads/4cb563f1-6e26-42b4-9e0c-a1ec400e2cbf.png" 
                      alt="Six Panel Entry Door"
                      className="w-full h-full object-cover"
                    />
                    {selections.standard_remaining_doors === 'six_panel_entry' && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                   <div className="p-4 bg-white">
                     <h5 className="font-semibold text-lg text-gray-900 mb-1">Six Panel Entry Door</h5>
                     <p className="text-sm text-blue-600">Classic six-panel design for remaining doors</p>
                     {selections.standard_remaining_doors === 'six_panel_entry' && (
                       <div className="text-xs text-green-600 font-medium mt-2">Selected</div>
                     )}
                   </div>
                </div>
              </div>
            </div>

            {/* Door Material */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Door Material</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'fiberglass', name: 'Fiberglass', description: 'Energy efficient, low maintenance' },
                  { id: 'steel', name: 'Steel', description: 'Security and durability' },
                  { id: 'wood', name: 'Wood', description: 'Natural beauty, customizable' }
                ].map((material) => (
                  <div 
                    key={material.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
                      selections.entry_door_material === material.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                    onClick={() => {
                      if (isEditing) {
                        const newSelections = { ...selections };
                        newSelections.entry_door_material = material.id;
                        setSelections(newSelections);
                      }
                    }}
                   >
                     <h5 className="font-semibold">{material.name}</h5>
                     <p className="text-sm text-muted-foreground mb-2">{material.description}</p>
                     {material.id === 'wood' && (
                       <div className="bg-amber-100 border border-amber-300 text-amber-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit mb-2">
                         <Star className="h-3 w-3 fill-current" />
                         Upgrade
                       </div>
                     )}
                     {selections.entry_door_material === material.id && (
                       <div className="text-xs text-green-600 font-medium">Selected</div>
                     )}
                  </div>
                ))}
              </div>
            </div>

            {/* Door Color/Finish */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Door Color/Finish</h4>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {[
                  { name: "White", hex: "#FFFFFF" },
                  { name: "Black", hex: "#000000" },
                  { name: "Dark Brown", hex: "#3C2414" },
                  { name: "Charcoal Gray", hex: "#36454F" },
                  { name: "Cherry", hex: "#8B0000" },
                  { name: "Gray", hex: "#808080" },
                  { name: "Hunter Green", hex: "#355E3B" },
                  { name: "Navy Blue", hex: "#000080" }
                ].map((color, index) => {
                  const isSelected = selections.entry_door_color === color.name.toLowerCase().replace(' ', '_');
                  return (
                    <div 
                      key={index}
                      className={`relative cursor-pointer group ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      onClick={() => {
                        if (isEditing) {
                          const newSelections = { ...selections };
                          newSelections.entry_door_color = color.name.toLowerCase().replace(' ', '_');
                          setSelections(newSelections);
                        }
                      }}
                    >
                      <div className={`border-2 rounded-lg overflow-hidden transition-all ${
                        isSelected ? 'border-primary shadow-lg' : 'border-gray-200 hover:border-gray-400'
                      }`}>
                        <div 
                          className="w-full h-12"
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

            {/* Custom Door Upload Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Upload Custom Door Image</h4>
              <p className="text-sm text-muted-foreground">
                Have a specific door design in mind? Upload an image and let us know your preferences.
              </p>
              
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (isEditing && e.target.files?.[0]) {
                            const file = e.target.files[0];
                            const newSelections = { ...selections };
                            newSelections.entry_door_custom_image = file.name;
                            setSelections(newSelections);
                          }
                        }}
                        disabled={!isEditing}
                      />
                      <Button variant="outline" className="w-full" disabled={!isEditing}>
                        Choose Image
                      </Button>
                    </label>
                    <p className="text-xs text-gray-500">
                      Supported formats: JPG, PNG, GIF (Max 10MB)
                    </p>
                  </div>
                </div>
                
                {selections.entry_door_custom_image && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        Uploaded: {selections.entry_door_custom_image}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Notes section for custom door */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes about your door preference:</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={4}
                  placeholder="Describe the door style, material preferences, hardware, or any specific features you'd like..."
                  value={selections.entry_door_custom_notes || ''}
                  onChange={(e) => {
                    if (isEditing) {
                      const newSelections = { ...selections };
                      newSelections.entry_door_custom_notes = e.target.value;
                      setSelections(newSelections);
                    }
                  }}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </TabsContent>

          {/* Interior Walls and Flooring Tab */}
          <TabsContent value="interior" className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg">
              <h3 className="text-lg font-bold text-purple-800 mb-2">Interior Walls & Flooring</h3>
              <p className="text-sm text-purple-600">Select finishes for each room in your home</p>
            </div>

            {/* Desktop Layout: Rooms on left, selections on right */}
            <div className="lg:grid lg:grid-cols-3 lg:gap-6 space-y-6 lg:space-y-0">
              
              {/* Room Selection - Left Side on Desktop */}
              <div className="lg:col-span-1">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Room-by-Room Selections</h4>

                  {/* Room Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                    {[
                      { id: 'living_room', name: 'Living Room' },
                      { id: 'master_bedroom', name: 'Master Bedroom' },
                      { id: 'guest_bedroom_1', name: 'Guest Bedroom 1' },
                      { id: 'guest_bedroom_2', name: 'Guest Bedroom 2' },
                      { id: 'guest_bedroom_3', name: 'Guest Bedroom 3' },
                      { id: 'office_study', name: 'Office/Study' },
                      { id: 'dining_room', name: 'Dining Room' },
                      { id: 'kitchen', name: 'Kitchen' },
                      { id: 'bathroom', name: 'Bathroom' },
                      { id: 'common_areas', name: 'Common Areas' }
                    ].map((room) => {
                      const paintSelection = selections[`${room.id}_paint_color`];
                      const flooringSelection = selections[`${room.id}_flooring`];
                      const flooringColorSelection = selections[`${room.id}_flooring_color`];
                      
                      return (
                        <Card key={room.id} className={`p-3 border-2 hover:border-primary/30 transition-colors cursor-pointer ${
                          selectedRoom === room.id ? 'border-primary bg-primary/5' : ''
                        }`} onClick={() => setSelectedRoom(room.id)}>
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-sm leading-tight">{room.name}</h5>
                            {(paintSelection || flooringSelection) && (
                              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          
                          {/* Current Selections Display - Mobile Optimized */}
                          <div className="space-y-1 mb-3 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Paint:</span>
                              <span className="font-medium text-right leading-tight max-w-[60%]">
                                {paintSelection ? paintSelection.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'None'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Floor:</span>
                              <span className="font-medium text-right leading-tight max-w-[60%]">
                                {flooringSelection ? flooringSelection.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'None'}
                              </span>
                            </div>
                            {flooringColorSelection && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Color:</span>
                                <span className="font-medium text-right leading-tight max-w-[60%]">
                                  {flooringColorSelection.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Paint & Flooring Selections - Right Side on Desktop */}
              <div className="lg:col-span-2 space-y-6">


            {/* Room-Specific Selections */}
            <div className="space-y-6 p-4 bg-gray-50 rounded-lg">

              {/* Standard Ceiling and Trim Colors */}
              <div className="space-y-4 mb-6 p-4 bg-blue-50 rounded-lg">
                <h5 className="font-semibold text-blue-800">Standard Finishes (All Rooms)</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded border">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded bg-white border-2 border-gray-300"></div>
                      <div>
                        <div className="font-medium">Ceiling</div>
                        <div className="text-sm text-gray-600">Flat White</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded bg-white border-2 border-gray-300"></div>
                      <div>
                        <div className="font-medium">Trim & Interior Doors</div>
                        <div className="text-sm text-gray-600">Semi-Gloss Brite White</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Paint Color for Selected Room */}
              <div className="space-y-4">
                <h5 className="font-semibold">Wall Paint Color - 16 Most Popular Sherwin Williams Colors</h5>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                  {[
                    { name: "Agreeable Gray", hex: "#D4D2D0", sw: "SW 7029" },
                    { name: "Accessible Beige", hex: "#D6C7B3", sw: "SW 7036" },
                    { name: "Balanced Beige", hex: "#E8DCC0", sw: "SW 7037" },
                    { name: "Repose Gray", hex: "#C7C8C5", sw: "SW 7015" },
                    { name: "Alabaster", hex: "#F2F0E8", sw: "SW 7008" },
                    { name: "Pure White", hex: "#FFFFFF", sw: "SW 7005" },
                    { name: "Creamy", hex: "#F2E9D0", sw: "SW 7012" },
                    { name: "Natural Linen", hex: "#E8E2D5", sw: "SW 9109" },
                    { name: "Mindful Gray", hex: "#D2D0CD", sw: "SW 7016" },
                    { name: "Collonade Gray", hex: "#C2C1BC", sw: "SW 7641" },
                    { name: "Amazing Gray", hex: "#A5A5A0", sw: "SW 7044" },
                    { name: "Swiss Coffee", hex: "#F7F3E9", sw: "SW 6330" },
                    { name: "Requisite Gray", hex: "#BBBBB8", sw: "SW 7023" },
                    { name: "Tricorn Black", hex: "#2C2C30", sw: "SW 6258" },
                    { name: "Naval", hex: "#1F2937", sw: "SW 6244" },
                    { name: "Iron Ore", hex: "#4C4C4C", sw: "SW 7069" }
                  ].map((color, index) => {
                    const selectionKey = `${selectedRoom}_paint_color`;
                    const isSelected = selections[selectionKey] === color.name.toLowerCase().replace(/\s+/g, '_');
                    return (
                      <div 
                        key={index}
                        className={`relative cursor-pointer group ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                        onClick={() => {
                          if (isEditing) {
                            const newSelections = { ...selections };
                            newSelections[selectionKey] = color.name.toLowerCase().replace(/\s+/g, '_');
                            setSelections(newSelections);
                          }
                        }}
                      >
                        <div className={`border-2 rounded-lg overflow-hidden transition-all ${
                          isSelected ? 'border-primary shadow-lg' : 'border-gray-200 hover:border-gray-400'
                        }`}>
                          <div 
                            className="w-full h-10"
                            style={{ backgroundColor: color.hex }}
                          />
                          <div className="p-1 bg-white">
                            <div className="text-xs font-medium text-center text-gray-900 leading-tight truncate">{color.name} {color.sw}</div>
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

                {/* Custom Color Option */}
                <div className="mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg">
                  <h6 className="font-medium mb-2 text-sm">Custom Color Option</h6>
                  <p className="text-xs text-gray-600 mb-2">If you prefer a different color than the ones shown above, please specify:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Color Name"
                      name={`${selectedRoom}_custom_paint_name`}
                      defaultValue={selections[`${selectedRoom}_custom_paint_name`] || ''}
                      disabled={!isEditing}
                      className="text-sm"
                    />
                    <Input
                      placeholder="Color Code"
                      name={`${selectedRoom}_custom_paint_code`}
                      defaultValue={selections[`${selectedRoom}_custom_paint_code`] || ''}
                      disabled={!isEditing}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Flooring for Selected Room */}
              <div className="space-y-4">
                <h5 className="font-semibold">Flooring</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { id: 'luxury_vinyl', name: 'Luxury Vinyl Plank', description: 'Waterproof, durable, easy maintenance', image: luxuryVinylImage },
                    { id: 'laminate', name: 'Laminate', description: 'Cost-effective wood look', image: laminateFloorImage },
                    { id: 'hardwood', name: 'Hardwood', description: 'Natural beauty and value', image: hardwoodImage },
                    { id: 'tile', name: 'Ceramic Tile', description: 'Durable and water-resistant', image: ceramicTileImage },
                    { id: 'carpet', name: 'Carpet', description: 'Comfort and warmth', image: carpetImage },
                    { id: 'concrete', name: 'Polished Concrete', description: 'Modern industrial look', image: polishedConcreteImage }
                  ].map((flooring) => {
                    const selectionKey = `${selectedRoom}_flooring`;
                    const isSelected = selections[selectionKey] === flooring.id;
                    return (
                      <div 
                        key={flooring.id}
                        className={`border-2 rounded-lg cursor-pointer transition-all hover:border-primary overflow-hidden ${
                          isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' : 'border-gray-200 hover:shadow-lg'
                        }`}
                        onClick={() => {
                          if (isEditing) {
                            const newSelections = { ...selections };
                            newSelections[selectionKey] = flooring.id;
                            setSelections(newSelections);
                          }
                        }}
                      >
                        <div className="relative">
                          <img 
                            src={flooring.image} 
                            alt={flooring.name}
                            className="w-full h-32 object-cover"
                          />
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h6 className="font-semibold">{flooring.name}</h6>
                          <p className="text-sm text-muted-foreground">{flooring.description}</p>
                          {isSelected && (
                            <div className="mt-2 text-xs text-green-600 font-medium">Selected</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Flooring Color Options */}
                {selections[`${selectedRoom}_flooring`] && selections[`${selectedRoom}_flooring`] !== 'concrete' && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h6 className="font-semibold mb-4">
                      Choose Color for {selections[`${selectedRoom}_flooring`]?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h6>
                    
                    {/* Color options based on flooring type */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        {(() => {
                          let colors = [];
                          const flooringType = selections[`${selectedRoom}_flooring`];
                          
                          if (flooringType === 'luxury_vinyl') {
                            colors = [
                              { name: "Dove Tail Oak", image: "/lovable-uploads/63cbfb52-ce12-4451-bd1a-aa8613716e84.png", roomImage: "/lovable-uploads/260dd908-7b57-437a-b106-b037f2653571.png" },
                              { name: "Forged Oak", image: "/lovable-uploads/38d0a6c8-28d3-4cfc-99a9-f81ea7478904.png", roomImage: "/lovable-uploads/dc4fa0ad-9c1e-4713-81d8-754d68003091.png" },
                              { name: "Charleston Oak", image: "/lovable-uploads/79b5b1ab-a146-4d70-b081-e986bb1fd2fd.png", roomImage: "/lovable-uploads/4d20d1d5-a760-4880-8478-42ef8d896d0e.png" },
                              { name: "Ashen Oak", image: "/lovable-uploads/e875e7dd-e96c-420b-922f-e1ecf43cf189.png", roomImage: "/lovable-uploads/2fd45fd7-a1cc-4bec-88a1-10dd7b6d8e3b.png" },
                              { name: "Catskill Pine", image: "/lovable-uploads/c474068b-9e2f-4f35-a6fb-ec4131e98818.png", roomImage: "/lovable-uploads/fcd25987-1b89-4d60-8953-24c238f17026.png" },
                              { name: "English Grove Oak", image: "/lovable-uploads/91e4d607-1f3b-4fbe-995d-c3c97781e0bb.png", roomImage: "/lovable-uploads/73a9dbab-46ae-49d5-b957-6f473d600946.png" },
                              { name: "Jamestown Hickory", image: "/lovable-uploads/c18c672b-84fb-4bab-8097-48389c642dfe.png", roomImage: "/lovable-uploads/80ea668a-08f6-467b-b833-7151973118b9.png" },
                              { name: "Sisal Oak", image: "/lovable-uploads/ad83d1dd-b77d-4d14-881b-84af87361211.png", roomImage: "/lovable-uploads/4a467de8-c2c9-4fac-aa0a-fa14f782b4cf.png" },
                              { name: "Penny Oak", image: "/lovable-uploads/1e37a94c-38c4-4adc-8b75-c7e584ff9ec5.png", roomImage: "/lovable-uploads/1d14f0ba-451f-4189-8c4c-78fde6297fd4.png" },
                              { name: "Coir Oak", image: "/lovable-uploads/2c55b555-54ea-4cb8-b11a-07d799b57b76.png", roomImage: "/lovable-uploads/383f9226-6064-4711-b00f-78a9aaad20bb.png" }
                            ];
                          } else if (flooringType === 'laminate') {
                            colors = [
                              { name: "Florian Oak", image: "/lovable-uploads/c9304f1f-8b92-4e7c-a708-d4b213cfbfc3.png", roomImage: "/lovable-uploads/3263a0ed-f91d-490c-827d-44631aa20c80.png" },
                              { name: "Calabash Oak", image: "/lovable-uploads/91e710aa-6da5-4dbc-932d-d7672b225cd4.png", roomImage: "/lovable-uploads/94e746e7-c4f2-47de-bd65-8dd93eee4ed8.png" },
                              { name: "Warm Honey Oak", image: "/lovable-uploads/4fc85078-cbe9-4a9c-a922-f91a34ce825e.png", roomImage: "/lovable-uploads/bf8a9e51-3f61-438c-99cf-60ca0ba385fa.png" },
                              { name: "Toasted Chestnut", image: "/lovable-uploads/1781dcab-1757-4249-9566-ef34f9c66a6d.png", roomImage: "/lovable-uploads/e100b481-8cae-45ef-ae24-5b7250a44f20.png" },
                              { name: "Harrison Hickory", image: "/lovable-uploads/483084df-d21b-4a07-b788-10798cacba30.png", roomImage: "/lovable-uploads/fda36730-dc7c-4a05-852d-620f29d45778.png" },
                              { name: "Aged Hickory", image: "/lovable-uploads/93d9dea6-07c6-4a45-a309-82c4b3f07edb.png", roomImage: "/lovable-uploads/f3711256-0564-41c9-96e5-f5fc7ca582da.png" },
                              { name: "Restoration Oak", image: "/lovable-uploads/749252f8-28a7-4580-b997-8d5f57f0c171.png", roomImage: "/lovable-uploads/67e0a4c1-23e3-4b2c-9832-05fda8590ba3.png" },
                              { name: "Whistler Oak", image: "/lovable-uploads/e731de88-aec5-41c7-8c4e-91c07b89fb12.png", roomImage: "/lovable-uploads/ca30a04e-138c-4ee7-815b-f5a050a9da5a.png" },
                              { name: "Laguna Acacia", image: "/lovable-uploads/82374440-b73d-487a-9543-aa1c45a8361e.png", roomImage: "/lovable-uploads/63ed3400-3fd8-4a32-bad6-e52da8783072.png" },
                              { name: "Vailmont Chestnut", image: "/lovable-uploads/af37601a-0d79-4504-92b2-4ef03fc0cfc2.png", roomImage: "/lovable-uploads/d2e670cf-8d16-4eec-831b-8972396ef4b7.png" }
                            ];
                          } else if (flooringType === 'hardwood') {
                            colors = [
                              { name: "Wheat", image: "/lovable-uploads/046935a2-ca16-4b9d-ae73-4b02837f6ded.png", roomImage: "/lovable-uploads/7b3de176-d685-48b4-b7c1-37e4a5c24d29.png" },
                              { name: "Linen", image: "/lovable-uploads/192c2d82-e252-4da7-b164-dae7e25e98b7.png", roomImage: "/lovable-uploads/5b326c61-6171-4615-a6e2-e9f6d3e687dc.png" },
                              { name: "Ochre", image: "/lovable-uploads/a73900ec-7385-4db2-b117-b53c6f79930b.png", roomImage: "/lovable-uploads/0317a016-1536-4fb6-9bf3-cc1df4546f24.png" },
                              { name: "Feather", image: "/lovable-uploads/308d6fc1-a766-432c-b9f2-7d9251aa6f68.png", roomImage: "/lovable-uploads/60a6db1c-a8d2-4ad1-abeb-2c52bba8e062.png" },
                              { name: "Amber", image: "/lovable-uploads/da019277-90b0-4cb0-9656-90d678eb5811.png", roomImage: "/lovable-uploads/9e82b078-7798-4993-93f9-c30a13b9f32e.png" }
                            ];
                          } else if (flooringType === 'tile') {
                            colors = [
                              { name: "Alamosa Beige", image: "/lovable-uploads/31c0036e-4bc1-4a73-98d3-c04b46a326f4.png", roomImage: "/lovable-uploads/c242b632-c0dd-4203-b328-9ed6f44c62b0.png" },
                              { name: "Alamosa Gray", image: "/lovable-uploads/fc988720-2fdb-4e56-99c1-c02c291b457c.png", roomImage: "/lovable-uploads/53a24932-6403-4ea4-9a12-5ffec52a71d6.png" },
                              { name: "Colorado Gray", image: "/lovable-uploads/2b6b08ec-818c-4ef3-84f8-660979d04d53.png", roomImage: "/lovable-uploads/f30fb0d0-9be3-430a-bd07-70d9fc4f6ef3.png" },
                              { name: "Bianco Carrara", image: "/lovable-uploads/7a0b7dcd-76a4-4144-ad8d-99101b1e761b.png", roomImage: "/lovable-uploads/96ac7549-bd76-4550-87d3-b877c65f2b96.png" },
                              { name: "Harbor Gray", image: "/lovable-uploads/701e832b-ca13-4779-ad13-73b3bf48c974.png", roomImage: "/lovable-uploads/607248fa-4d6f-4173-b7e4-4a1818cfc633.png" }
                            ];
                          } else if (flooringType === 'carpet') {
                            colors = [
                              { name: "Ash Gray", image: "/lovable-uploads/9f1e9750-1c8e-4b4d-a805-19081ff0f2b5.png", roomImage: "/lovable-uploads/e57163e5-c40f-4eb3-9813-cf7eeffbb2c4.png" },
                              { name: "Gaucho Brown", image: "/lovable-uploads/d0ae0452-ec39-4c53-8066-852dbd8ae513.png", roomImage: "/lovable-uploads/8c8e745c-8ac7-4004-8c9c-62e93e879586.png" },
                              { name: "Heartwarmer Mist", image: "/lovable-uploads/6d8e08b1-4fd6-44c4-9906-e1b7bbbcef2e.png", roomImage: "/lovable-uploads/dd097584-e4b5-470a-9b76-0b4efc60bee7.png" },
                              { name: "Heirloom Gray", image: "/lovable-uploads/c428be9f-e797-4430-8a54-66fb52a67ce7.png", roomImage: "/lovable-uploads/c30eb8b9-1bd4-46b9-9f32-54af3d3c051a.png" },
                              { name: "Smoke Embers Gray", image: "/lovable-uploads/b51cbb1e-3879-49ed-9f6c-a5fff885739c.png", roomImage: "/lovable-uploads/83113855-c4e7-4eeb-8011-d2a54dc03311.png" }
                            ];
                          }

                          return colors.map((color, index) => {
                            const colorSelectionKey = `${selectedRoom}_flooring_color`;
                            const isColorSelected = selections[colorSelectionKey] === color.name.toLowerCase().replace(/\s+/g, '_');
                             // For LVP with images
                             if (color.image) {
                               return (
                                 <div 
                                   key={index}
                                   className={`relative cursor-pointer group ${isColorSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                   onClick={() => {
                                     if (isEditing) {
                                       const newSelections = { ...selections };
                                       newSelections[colorSelectionKey] = color.name.toLowerCase().replace(/\s+/g, '_');
                                       // Clear custom color when selecting standard color
                                       newSelections[`${selectedRoom}_flooring_custom_color`] = '';
                                       setSelections(newSelections);
                                     }
                                   }}
                                 >
                                   <div className={`border-2 rounded-lg overflow-hidden transition-all ${
                                     isColorSelected ? 'border-primary shadow-lg' : 'border-gray-200 hover:border-gray-400'
                                   }`}>
                                     <div className="relative">
                                       <img 
                                         src={color.image} 
                                         alt={color.name}
                                         className="w-full h-20 object-cover"
                                       />
                        <div 
                          className="absolute top-2 right-2 bg-white/90 rounded-lg p-1.5 shadow-md hover:bg-white transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            openImageModal(color.roomImage || color.image, color.name);
                          }}
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </div>
                                     </div>
                                     <div className="p-2 bg-white">
                                       <div className="text-xs font-medium text-center text-gray-900 leading-tight">{color.name}</div>
                                     </div>
                                   </div>
                                   {isColorSelected && (
                                     <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                       <span className="text-white text-xs">✓</span>
                                     </div>
                                   )}
                                 </div>
                               );
                             }

                             // For other flooring types with color swatches
                             return (
                               <div 
                                 key={index}
                                 className={`relative cursor-pointer group ${isColorSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                 onClick={() => {
                                   if (isEditing) {
                                     const newSelections = { ...selections };
                                     newSelections[colorSelectionKey] = color.name.toLowerCase().replace(/\s+/g, '_');
                                     // Clear custom color when selecting standard color
                                     newSelections[`${selectedRoom}_flooring_custom_color`] = '';
                                     setSelections(newSelections);
                                   }
                                 }}
                               >
                                 <div className={`border-2 rounded-lg overflow-hidden transition-all ${
                                   isColorSelected ? 'border-primary shadow-lg' : 'border-gray-200 hover:border-gray-400'
                                 }`}>
                                   <div 
                                     className="w-full h-10"
                                     style={{ backgroundColor: color.hex }}
                                   />
                                   <div className="p-1 bg-white">
                                     <div className="text-xs font-medium text-center text-gray-900 leading-tight truncate">{color.name}</div>
                                   </div>
                                 </div>
                                 {isColorSelected && (
                                   <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                     <span className="text-white text-xs">✓</span>
                                   </div>
                                 )}
                               </div>
                             );
                          });
                        })()}
                      </div>

                      {/* Custom Color Option */}
                      <div className="mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg">
                        <h6 className="font-medium mb-2">Custom Color</h6>
                        <p className="text-xs text-gray-600 mb-2">If you prefer a different color, please specify:</p>
                        <Input
                          placeholder="e.g., Brazilian Cherry, Honey Oak, etc."
                          name={`${selectedRoom}_flooring_custom_color`}
                          defaultValue={selections[`${selectedRoom}_flooring_custom_color`] || ''}
                          disabled={!isEditing}
                          className="w-full text-sm"
                          onChange={(e) => {
                            if (e.target.value && isEditing) {
                              // Clear standard color selection when custom is entered
                              const newSelections = { ...selections };
                              newSelections[`${selectedRoom}_flooring_color`] = '';
                              newSelections[`${selectedRoom}_flooring_custom_color`] = e.target.value;
                              setSelections(newSelections);
            }


            {/* Door Hardware */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold">Door Hardware Style</h4>
              
              {/* Hardware Styles */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: 'round_knob', name: 'Round Knob', description: 'Classic round door knob', image: '/lovable-uploads/b159824e-b148-44d6-aede-1576b276e976.png' },
                  { id: 'antique_knob', name: 'Antique Knob', description: 'Traditional round knob', image: '/lovable-uploads/6865cd36-3329-42ae-8922-61f05a1a8d90.png' },
                  { id: 'lever_handle', name: 'Lever Handle', description: 'Modern lever handle', image: '/lovable-uploads/73566b45-5c46-4402-b3b5-0f4f6d25f252.png' }
                ].map((style) => (
                  <div 
                    key={style.id}
                    className={`border-2 rounded-lg cursor-pointer transition-all hover:border-primary overflow-hidden ${
                      selections.door_hardware_style === style.id ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' : 'border-gray-200 hover:shadow-lg'
                    }`}
                    onClick={() => {
                      if (isEditing) {
                        const newSelections = { ...selections };
                        newSelections.door_hardware_style = style.id;
                        setSelections(newSelections);
                      }
                    }}
                  >
                    <div className="relative">
                      <div 
                        className="w-full h-32 bg-white bg-cover bg-center cursor-pointer border border-gray-100"
                        style={{
                          backgroundImage: `url(${style.image})`,
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openImageModal(style.image, `Door Hardware - ${style.name}`);
                        }}
                      >
                          <div className="absolute top-2 right-2 bg-white/90 rounded-lg p-1.5 shadow-md hover:bg-white transition-colors cursor-pointer opacity-0 hover:opacity-100">
                            <Eye className="h-4 w-4 text-gray-600" />
                          </div>
                      </div>
                      {selections.door_hardware_style === style.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h5 className="font-semibold">{style.name}</h5>
                      <p className="text-sm text-muted-foreground">{style.description}</p>
                      {selections.door_hardware_style === style.id && (
                        <div className="mt-2 text-xs text-green-600 font-medium">Selected</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Hardware Colors */}
              {selections.door_hardware_style && (
                <div className="space-y-4">
                  <h5 className="text-md font-semibold">Choose Hardware Finish</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { id: 'oil_rubbed_bronze', name: 'Oil Rubbed Bronze', hex: '#4A4A3A', metallic: true },
                      { id: 'brushed_nickel', name: 'Brushed Nickel', hex: '#B5B5B5', metallic: true },
                      { id: 'matte_black', name: 'Matte Black', hex: '#2C2C2C' },
                      { id: 'antique_brass', name: 'Antique Brass', hex: '#CD7F32', metallic: true }
                    ].map((color) => (
                      <div 
                        key={color.id}
                        className={`cursor-pointer p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                          selections.door_hardware_finish === color.id ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' : 'border-gray-200 hover:border-gray-400'
                        }`}
                        onClick={() => {
                          if (isEditing) {
                            const newSelections = { ...selections };
                            newSelections.door_hardware_finish = color.id;
                            setSelections(newSelections);
                          }
                        }}
                      >
                        <div className="flex flex-col items-center space-y-3">
                          <div className="relative">
                            <div 
                              className={`w-16 h-16 rounded-full border-2 border-gray-300 shadow-sm ${
                                color.metallic ? 'bg-gradient-to-br from-white via-gray-200 to-gray-400' : ''
                              }`}
                              style={{ 
                                backgroundColor: color.metallic ? undefined : color.hex,
                                background: color.metallic ? `linear-gradient(135deg, ${color.hex}, #ffffff40, ${color.hex})` : color.hex
                              }}
                            >
                              {color.metallic && (
                                <div className="absolute inset-0 rounded-full opacity-30"
                                     style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.4), transparent 70%)` }} />
                              )}
                            </div>
                            {selections.door_hardware_finish === color.id && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-medium">{color.name}</span>
                            {selections.door_hardware_finish === color.id && (
                              <div className="text-xs text-green-600 font-medium mt-1">Selected</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Interior Doors */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Interior Door Style (All Interior Doors)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: 'traditional_6_panel', name: 'Traditional 6 Panel Door', description: 'Classic six-panel design', image: traditional6PanelImage },
                  { id: '2_panel_modern', name: '2 Panel Modern Door', description: 'Contemporary two-panel style', image: panel2ModernImage },
                  { id: '2_panel_arch', name: '2 Panel Arch Door', description: 'Elegant arched panel design', image: archDoorImage },
                  { id: '4_panel_square', name: '4 Panel Square Door', description: 'Four-panel square design', image: panel4SquareImage }
                ].map((door, index) => (
                  <div 
                    key={door.id}
                    className={`border-2 rounded-lg cursor-pointer transition-all hover:border-primary overflow-hidden ${
                      selections.interior_door_style === door.id ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' : 'border-gray-200 hover:shadow-lg'
                    }`}
                    onClick={() => {
                      if (isEditing) {
                        const newSelections = { ...selections };
                        newSelections.interior_door_style = door.id;
                        setSelections(newSelections);
                      }
                    }}
                  >
                    <div className="relative">
                      <div 
                        className="w-full h-32 bg-gray-100 bg-cover bg-center cursor-pointer"
                        style={{
                          backgroundImage: `url(${door.image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openImageModal(door.image, `Interior Doors - ${door.name}`);
                        }}
                      >
                         <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow-md hover:bg-white transition-colors cursor-pointer opacity-0 hover:opacity-100">
                           <Eye className="h-4 w-4 text-gray-600" />
                         </div>
                      </div>
                      {selections.interior_door_style === door.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h5 className="font-semibold">{door.name}</h5>
                      <p className="text-sm text-muted-foreground">{door.description}</p>
                      {selections.interior_door_style === door.id && (
                        <div className="mt-2 text-xs text-green-600 font-medium">Selected</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Door Hardware */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold">Door Hardware Style (One Choice for Whole House)</h4>
              
              {/* Hardware Styles */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: 'round_knob', name: 'Round Knob', description: 'Classic round door knob', image: '/lovable-uploads/b159824e-b148-44d6-aede-1576b276e976.png' },
                  { id: 'antique_knob', name: 'Antique Knob', description: 'Traditional round knob', image: '/lovable-uploads/6865cd36-3329-42ae-8922-61f05a1a8d90.png' },
                  { id: 'lever_handle', name: 'Lever Handle', description: 'Modern lever handle', image: '/lovable-uploads/73566b45-5c46-4402-b3b5-0f4f6d25f252.png' }
                ].map((style) => (
                  <div 
                    key={style.id}
                    className={`border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg overflow-hidden bg-white ${
                      selections.door_hardware_style === style.id ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' : 'border-gray-200 hover:border-primary'
                    }`}
                    onClick={() => {
                      if (isEditing) {
                        updateSelection('door_hardware_style', style.id);
                      }
                    }}
                  >
                    <div className="relative">
                      <img 
                        src={style.image} 
                        alt={style.name}
                        className="w-full h-32 object-contain bg-white border"
                      />
                      {selections.door_hardware_style === style.id && (
                        <div className="absolute top-2 left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h5 className="font-semibold text-sm mb-1">{style.name}</h5>
                      <p className="text-xs text-muted-foreground">{style.description}</p>
                      {selections.door_hardware_style === style.id && (
                        <div className="mt-2 text-xs text-green-600 font-medium">Selected</div>
                      )}
                    </div>
                    <input 
                      type="hidden" 
                      name="door_hardware_style" 
                      value={selections.door_hardware_style === style.id ? style.id : ''}
                    />
                  </div>
                ))}
              </div>

              {/* Hardware Colors */}
              {selections.door_hardware_style && (
                <div className="space-y-4">
                  <h5 className="text-md font-semibold">Choose Hardware Finish</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { id: 'oil_rubbed_bronze', name: 'Oil Rubbed Bronze', hex: '#4A4A3A', metallic: true },
                      { id: 'brushed_nickel', name: 'Brushed Nickel', hex: '#B5B5B5', metallic: true },
                      { id: 'matte_black', name: 'Matte Black', hex: '#2C2C2C' },
                      { id: 'antique_brass', name: 'Antique Brass', hex: '#CD7F32', metallic: true }
                    ].map((color) => (
                      <div 
                        key={color.id}
                        className={`cursor-pointer p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                          selections.door_hardware_finish === color.id ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' : 'border-gray-200 hover:border-gray-400'
                        }`}
                        onClick={() => {
                          if (isEditing) {
                            updateSelection('door_hardware_finish', color.id);
                          }
                        }}
                      >
                        <div className="flex flex-col items-center space-y-3">
                          <div className="relative">
                            <div 
                              className={`w-16 h-16 rounded-full border-2 border-gray-300 shadow-sm ${
                                color.metallic ? 'bg-gradient-to-br from-white via-gray-200 to-gray-400' : ''
                              }`}
                              style={{ 
                                backgroundColor: color.metallic ? undefined : color.hex,
                                background: color.metallic ? `linear-gradient(135deg, ${color.hex}, #ffffff40, ${color.hex})` : color.hex
                              }}
                            >
                              {color.metallic && (
                                <div className="absolute inset-0 rounded-full opacity-30"
                                     style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.4), transparent 70%)` }} />
                              )}
                            </div>
                            {selections.door_hardware_finish === color.id && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-medium">{color.name}</span>
                            {selections.door_hardware_finish === color.id && (
                              <div className="text-xs text-green-600 font-medium mt-1">Selected</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Global Trim and Molding */}
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold">Trim & Molding Style (All Rooms)</h4>
                <p className="text-sm text-muted-foreground">This will apply to all interior rooms</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 'craftsman', name: 'Craftsman', description: 'Thick, substantial trim work', image: craftsmanTrimImage },
                  { id: 'square', name: 'Square', description: 'Simple square profile trim', image: squareTrimImage },
                  { id: 'colonial', name: 'Colonial', description: 'Ornate crown molding style', image: colonialTrimImage }
                ].map((trim) => (
                  <div 
                    key={trim.id}
                    className={`border-2 rounded-lg cursor-pointer transition-all hover:border-primary overflow-hidden ${
                      selections.interior_trim_style === trim.id ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' : 'border-gray-200 hover:shadow-lg'
                    }`}
                    onClick={() => {
                      if (isEditing) {
                        const newSelections = { ...selections };
                        newSelections.interior_trim_style = trim.id;
                        setSelections(newSelections);
                      }
                    }}
                  >
                     <div className="relative">
                       <img 
                         src={trim.image} 
                         alt={trim.name}
                         className="w-full h-24 object-cover cursor-pointer"
                         onClick={(e) => {
                           e.stopPropagation();
                           openImageModal(trim.image, `Trim & Molding - ${trim.name}`);
                         }}
                       />
                       <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow-md hover:bg-white transition-colors cursor-pointer opacity-0 hover:opacity-100">
                         <Eye className="h-4 w-4 text-gray-600" />
                       </div>
                      {selections.interior_trim_style === trim.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h5 className="font-semibold text-sm">{trim.name}</h5>
                      <p className="text-xs text-muted-foreground">{trim.description}</p>
                      {selections.interior_trim_style === trim.id && (
                        <div className="mt-1 text-xs text-green-600 font-medium">Selected</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Selection Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-lg font-bold text-blue-800 mb-4">Room Selection Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  'living_room', 'master_bedroom', 'guest_bedroom_1', 'guest_bedroom_2', 
                  'guest_bedroom_3', 'office_study', 'dining_room', 'hallways', 'entryway'
                ].map((room) => {
                  const paintSelection = selections[`${room}_paint_color`];
                  const flooringSelection = selections[`${room}_flooring`];
                  const hasSelections = paintSelection || flooringSelection;
                  
                  return (
                    <div key={room} className="p-3 border rounded-lg bg-white">
                      <h6 className="font-semibold capitalize text-sm mb-2">
                        {room.replace(/_/g, ' ')}
                      </h6>
                      {hasSelections ? (
                        <div className="space-y-1">
                          {paintSelection && (
                            <div className="text-xs text-green-600">
                              Paint: {paintSelection.replace(/_/g, ' ')}
                            </div>
                          )}
                          {flooringSelection && (
                            <div className="text-xs text-green-600">
                              Floor: {flooringSelection.replace(/_/g, ' ')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">No selections made</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
              </div>
            </div>
          </TabsContent>

          {/* Kitchen Tab */}
          <TabsContent value="kitchen" className="space-y-6">
            <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg">
              <h3 className="text-lg font-bold text-red-800 mb-2">Kitchen Selections</h3>
              <p className="text-sm text-red-600">Design your dream kitchen with these essential choices</p>
            </div>

            {/* Cabinet Style */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Cabinet Style</h4>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-800 font-medium">
                  ✨ All our kitchens feature premium custom Amish cabinets, handcrafted with traditional woodworking techniques for exceptional quality and durability.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { 
                    id: 'shaker', 
                    name: 'Shaker Style', 
                    description: 'Clean, classic five-piece door design with timeless appeal', 
                    image: shakerKitchenImage,
                    features: ['Simple frame and panel', 'Versatile style', 'Works with any decor']
                  },
                  { 
                    id: 'raised_panel', 
                    name: 'Raised Panel', 
                    description: 'Traditional detailed doors with elegant raised center panels', 
                    image: raisedPanelKitchenImage,
                    features: ['Ornate detailing', 'Traditional elegance', 'Rich visual depth']
                  }
                ].map((style) => (
                  <div 
                    key={style.id}
                    className={`border-2 rounded-lg overflow-hidden transition-all hover:border-primary ${
                      selections.kitchen_cabinet_style === style.id ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' : 'border-gray-200 hover:shadow-lg'
                    }`}
                  >
                    {/* Image area - for modal */}
                    <div className="relative group cursor-pointer"
                      onClick={(e) => {
                        console.log('Kitchen image area clicked!', style.name);
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Setting selected kitchen image:', {
                          src: style.image,
                          title: style.name,
                          description: style.description,
                          features: style.features
                        });
                        setSelectedKitchenImage({
                          src: style.image,
                          title: style.name,
                          description: style.description,
                          features: style.features
                        });
                        console.log('Opening kitchen modal...');
                        setKitchenModalOpen(true);
                      }}
                    >
                      <img 
                        src={style.image} 
                        alt={`${style.name} kitchen cabinets`}
                        className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                        <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          Click to enlarge
                        </span>
                      </div>
                      {selections.kitchen_cabinet_style === style.id && (
                        <div className="absolute top-3 right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Content area - for style selection */}
                    <div className="p-6 cursor-pointer"
                      onClick={(e) => {
                        console.log('Content area clicked for style selection');
                        if (isEditing) {
                          const newSelections = { ...selections };
                          newSelections.kitchen_cabinet_style = style.id;
                          setSelections(newSelections);
                        }
                      }}
                    >
                      <h5 className="text-lg font-semibold mb-2">{style.name}</h5>
                      <p className="text-sm text-muted-foreground mb-3">{style.description}</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {style.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-1 h-1 bg-primary rounded-full mr-2"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {selections.kitchen_cabinet_style === style.id && (
                        <div className="mt-3 text-sm text-green-600 font-medium">Selected</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cabinet Color */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Cabinet Color</h4>
              
              {/* Painted Options */}
              <div className="space-y-3">
                <h5 className="font-medium text-gray-700">Painted Options</h5>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { name: "Alabaster", hex: "#F2F0E8", sw: "SW 7008" },
                    { name: "Extra White", hex: "#FCFBF8", sw: "SW 7006" },
                    { name: "Accessible Beige", hex: "#D6C8B5", sw: "SW 7036" },
                    { name: "SW 9130 Evergreen Fog", hex: "#949F96", sw: "SW 9130" },
                    { name: "SW 7016 Mindful Gray", hex: "#D3D0C8", sw: "SW 7016" }
                  ].map((color, index) => {
                    const isSelected = selections.kitchen_cabinet_color === `painted_${color.name.toLowerCase().replace(/\s+/g, '_')}`;
                    return (
                      <div 
                        key={index}
                        className={`relative cursor-pointer group ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                        onClick={() => {
                          if (isEditing) {
                            const newSelections = { ...selections };
                            newSelections.kitchen_cabinet_color = `painted_${color.name.toLowerCase().replace(/\s+/g, '_')}`;
                            setSelections(newSelections);
                          }
                        }}
                      >
                        <div className={`border-2 rounded-lg overflow-hidden transition-all ${
                          isSelected ? 'border-primary shadow-lg' : 'border-gray-200 hover:border-gray-400'
                        }`}>
                          <div 
                            className="w-full h-12"
                            style={{ backgroundColor: color.hex }}
                          />
                          <div className="p-1 bg-white">
                            <div className="text-xs font-medium text-center text-gray-900 leading-tight truncate">{color.name}</div>
                            <div className="text-xs text-center text-gray-500">{color.sw || "Painted"}</div>
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
              
                {/* Custom Paint Color Option */}
                <div className="mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg">
                  <h6 className="font-medium mb-2">Custom Paint Color</h6>
                  <p className="text-xs text-gray-600 mb-2">Have a specific Sherwin Williams color in mind? Enter the color code:</p>
                  <Input
                    placeholder="e.g., SW 7025, SW 6204, etc."
                    name="kitchen_cabinet_custom_color"
                    defaultValue={selections.kitchen_cabinet_custom_color || ''}
                    disabled={!isEditing}
                    className="w-full text-sm"
                    onChange={(e) => {
                      if (e.target.value && isEditing) {
                        // Clear standard color selection when custom is entered
                        const newSelections = { ...selections };
                        newSelections.kitchen_cabinet_color = '';
                        newSelections.kitchen_cabinet_custom_color = e.target.value;
                        setSelections(newSelections);
                      } else if (!e.target.value && isEditing) {
                        // Clear custom color when input is empty
                        const newSelections = { ...selections };
                        newSelections.kitchen_cabinet_custom_color = '';
                        setSelections(newSelections);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Stained Options */}
              <div className="space-y-3">
                <h5 className="font-medium text-gray-700">Stained Options</h5>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { name: "Natural Oak", hex: "#DEB887", image: "/lovable-uploads/782d51c2-3e91-4fdc-9632-11e12b3f5ec8.png" },
                    { name: "Cherry", hex: "#8B4513", image: "/lovable-uploads/618cf8e9-f2eb-4283-b35f-7f323af47626.png" },
                    { name: "Espresso", hex: "#362D1D", image: "/lovable-uploads/2f71116e-0eb1-4ea8-8019-7f3c891a45af.png" },
                    { name: "Dark Walnut", hex: "#5D4E37", image: "/lovable-uploads/b2b47831-2fb1-46b7-aada-a7fa4486cc2c.png" },
                    { name: "Gray Stain", hex: "#8B8680", image: "/lovable-uploads/f7a1ec95-721a-4195-ad80-93a9df8aee74.png" }
                  ].map((color, index) => {
                    const isSelected = selections.kitchen_cabinet_color === `stained_${color.name.toLowerCase().replace(/\s+/g, '_')}`;
                    return (
                      <div 
                        key={index}
                        className={`relative cursor-pointer group ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                        onClick={() => {
                          if (isEditing) {
                            const newSelections = { ...selections };
                            newSelections.kitchen_cabinet_color = `stained_${color.name.toLowerCase().replace(/\s+/g, '_')}`;
                            setSelections(newSelections);
                          }
                        }}
                      >
                        <div className={`border-2 rounded-lg overflow-hidden transition-all ${
                          isSelected ? 'border-primary shadow-lg' : 'border-gray-200 hover:border-gray-400'
                        }`}>
                          {color.image ? (
                            <img 
                              src={color.image} 
                              alt={color.name}
                              className="w-full h-12 object-cover"
                            />
                          ) : (
                            <div 
                              className="w-full h-12"
                              style={{ backgroundColor: color.hex }}
                            />
                          )}
                          <div className="p-1 bg-white">
                            <div className="text-xs font-medium text-center text-gray-900 leading-tight truncate">{color.name}</div>
                            <div className="text-xs text-center text-gray-500">Stained</div>
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
            </div>


            {/* Cabinet Hardware */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Cabinet Hardware</h4>
              <p className="text-sm text-muted-foreground">Choose from our curated selection of knobs and pulls</p>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { 
                    id: 'modern_brushed_nickel', 
                    name: 'Modern Brushed Nickel',
                    description: 'Clean lines with brushed nickel finish',
                    knobStyle: 'Round with subtle ridged texture',
                    pullStyle: 'Sleek bar pull, 5" length',
                    hex: '#B5B5B5',
                    metallic: true
                  },
                  { 
                    id: 'classic_oil_rubbed_bronze', 
                    name: 'Classic Oil Rubbed Bronze',
                    description: 'Traditional styling with rich bronze finish',
                    knobStyle: 'Classic round knob with detailed edge',
                    pullStyle: 'Traditional cup pull, 4" centers',
                    hex: '#4A4A3A',
                    metallic: true
                  },
                  { 
                    id: 'contemporary_matte_black', 
                    name: 'Contemporary Matte Black',
                    description: 'Bold modern look with matte black finish',
                    knobStyle: 'Geometric square knob',
                    pullStyle: 'Linear bar pull, 6" length',
                    hex: '#2C2C2C',
                    metallic: false
                  },
                  { 
                    id: 'farmhouse_antique_brass', 
                    name: 'Farmhouse Antique Brass',
                    description: 'Rustic charm with warm brass tones',
                    knobStyle: 'Vintage-inspired round knob',
                    pullStyle: 'Bin pull with antique brass finish',
                    hex: '#CD7F32',
                    metallic: true
                  },
                  { 
                    id: 'transitional_chrome', 
                    name: 'Transitional Chrome',
                    description: 'Versatile styling with polished chrome',
                    knobStyle: 'Simple round knob with chrome finish',
                    pullStyle: 'Classic bar pull, 4.5" length',
                    hex: '#E5E5E5',
                    metallic: true
                  }
                ].map((hardware) => (
                  <div 
                    key={hardware.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
                      selections.kitchen_hardware === hardware.id ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' : 'border-gray-200'
                    }`}
                    onClick={() => {
                      if (isEditing) {
                        const newSelections = { ...selections };
                        newSelections.kitchen_hardware = hardware.id;
                        setSelections(newSelections);
                      }
                    }}
                  >
                    {/* Hardware Preview with Real Color Swatches */}
                    <div className="mb-3 flex justify-center items-center space-x-3">
                      {/* Knob visualization */}
                      <div 
                        className={`relative w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm ${
                          hardware.metallic ? 'bg-gradient-to-br from-white via-gray-200 to-gray-400' : ''
                        }`}
                        style={{
                          backgroundColor: hardware.metallic ? undefined : hardware.hex,
                          background: hardware.metallic ? `linear-gradient(135deg, ${hardware.hex}, #ffffff40, ${hardware.hex})` : hardware.hex
                        }}
                      >
                        {hardware.metallic && (
                          <div className="absolute inset-0 rounded-full opacity-30 pointer-events-none"
                               style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.4), transparent 70%)` }} />
                        )}
                      </div>
                      {/* Pull visualization */}
                      <div 
                        className={`w-10 h-3 rounded-full shadow-sm ${
                          hardware.metallic ? 'bg-gradient-to-br from-white via-gray-200 to-gray-400' : ''
                        }`}
                        style={{
                          backgroundColor: hardware.metallic ? undefined : hardware.hex,
                          background: hardware.metallic ? `linear-gradient(135deg, ${hardware.hex}, #ffffff40, ${hardware.hex})` : hardware.hex
                        }}
                      ></div>
                    </div>
                    
                    <h5 className="font-semibold text-center mb-2">{hardware.name}</h5>
                    <p className="text-xs text-muted-foreground text-center mb-3">{hardware.description}</p>
                    
                    <div className="space-y-1 text-xs text-gray-600">
                      <div><strong>Knob:</strong> {hardware.knobStyle}</div>
                      <div><strong>Pull:</strong> {hardware.pullStyle}</div>
                    </div>
                    
                    {selections.kitchen_hardware === hardware.id && (
                      <div className="mt-3 text-xs text-green-600 font-medium text-center">✓ Selected</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Countertop Material */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Countertop Material</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 'quartz', name: 'Quartz', description: 'Durable, non-porous, consistent pattern', image: quartzImage },
                  { id: 'granite', name: 'Granite', description: 'Natural stone, unique patterns', image: graniteImage },
                  { id: 'marble', name: 'Marble', description: 'Luxury natural stone', image: marbleImage }
                ].map((material) => (
                  <div 
                    key={material.id}
                    className={`border-2 rounded-lg cursor-pointer transition-all hover:border-primary overflow-hidden ${
                      selections.kitchen_countertop === material.id ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' : 'border-gray-200 hover:shadow-lg'
                    }`}
                    onClick={() => {
                      if (isEditing) {
                        const newSelections = { ...selections };
                        newSelections.kitchen_countertop = material.id;
                        setSelections(newSelections);
                      }
                    }}
                  >
                    <div className="relative">
                      <img 
                        src={material.image} 
                        alt={material.name}
                        className="w-full h-32 object-cover"
                      />
                      {selections.kitchen_countertop === material.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h5 className="font-semibold">{material.name}</h5>
                      <p className="text-sm text-muted-foreground">{material.description}</p>
                      {selections.kitchen_countertop === material.id && (
                        <div className="mt-2 text-xs text-green-600 font-medium">Selected</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Appliance Package */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Appliance Package</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { 
                    id: 'basic', 
                    name: 'Basic Package', 
                    description: 'Essential appliances with reliable performance',
                    image: '/lovable-uploads/0260fd99-23ae-44d4-a184-a2a572b35110.png',
                    tooltip: 'Includes: Basic refrigerator, electric range, built-in dishwasher, over-range microwave. White or black finish options.'
                  },
                  { 
                    id: 'upgraded', 
                    name: 'Upgraded Stainless Package', 
                    description: 'Enhanced stainless steel appliances with premium features',
                    image: '/lovable-uploads/eca66082-4794-4309-8ac9-d86822548827.png',
                    tooltip: 'Includes: Stainless steel refrigerator with ice maker, gas or electric range, stainless dishwasher, built-in microwave. Energy Star rated.'
                  },
                  { 
                    id: 'premium', 
                    name: 'Premium Package', 
                    description: 'Professional-grade appliances with luxury finishes',
                    image: '/lovable-uploads/023ca6a3-8f45-4e39-9f0c-b47abddd1edc.png',
                    tooltip: 'Includes: Counter-depth refrigerator with smart features, professional-style range with convection oven, quiet dishwasher, built-in microwave drawer, garbage disposal.'
                  },
                  { 
                    id: 'own_appliances', 
                    name: "I'll Provide My Own Appliances", 
                    description: 'Customer-supplied appliances',
                    image: null,
                    tooltip: 'You will provide and install your own appliances. We will ensure proper rough-ins and connections are in place.'
                  }
                ].map((package_option) => (
                  <TooltipProvider key={package_option.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className={`border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
                            selections.kitchen_appliances === package_option.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                          }`}
                          onClick={() => {
                            if (isEditing) {
                              const newSelections = { ...selections };
                              newSelections.kitchen_appliances = package_option.id;
                              setSelections(newSelections);
                            }
                          }}
                        >
                          {package_option.image ? (
                            <div className="relative">
                              <img 
                                src={package_option.image} 
                                alt={package_option.name}
                                className="w-full h-48 object-cover rounded-t-lg cursor-pointer hover:opacity-90"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openImageModal(package_option.image, package_option.name);
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openImageModal(package_option.image, package_option.name);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : null}
                          <div className={package_option.image ? "p-4" : "p-6"}>
                            <h5 className="font-semibold">{package_option.name}</h5>
                            <p className="text-sm text-muted-foreground">{package_option.description}</p>
                            {selections.kitchen_appliances === package_option.id && (
                              <div className="mt-2 text-xs text-green-600 font-medium flex items-center">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Selected
                              </div>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{package_option.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>

          </TabsContent>


          {/* Bathrooms Tab */}
          <TabsContent value="bathrooms" className="space-y-6">
            <BathroomSection 
              selections={selections}
              setSelections={setSelections}
              isEditing={isEditing}
            />
          </TabsContent>

          {/* Mudroom/Laundry Room Tab */}
          <TabsContent value="mudroom" className="space-y-6">
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-lg">
              <h3 className="text-lg font-bold text-teal-800 mb-2">Mudroom & Laundry</h3>
              <p className="text-sm text-teal-600">Organize your entry and laundry spaces</p>
            </div>

            {/* Storage Solutions */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Storage Solutions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'built_in_cubbies', name: 'Built-in Cubbies', description: 'Individual storage compartments', image: builtInCubbiesImage },
                  { id: 'lockers', name: 'Locker Style', description: 'Full-height individual lockers', image: lockerStyleImage },
                  { id: 'open_shelving', name: 'Open Shelving', description: 'Flexible open storage', image: openShelvingImage },
                  { id: 'bench_storage', name: 'Bench with Storage', description: 'Seating with hidden storage', image: benchStorageImage }
                ].map((storage) => (
                  <div 
                    key={storage.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
                      selections.mudroom_storage === storage.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                    onClick={() => {
                      if (isEditing) {
                        const newSelections = { ...selections };
                        newSelections.mudroom_storage = storage.id;
                        setSelections(newSelections);
                      }
                    }}
                  >
                    <div className="relative mb-3">
                      <img 
                        src={storage.image} 
                        alt={storage.name}
                        className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90"
                        onClick={(e) => {
                          e.stopPropagation();
                          openImageModal(storage.image, storage.name);
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          openImageModal(storage.image, storage.name);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    <h5 className="font-semibold">{storage.name}</h5>
                    <p className="text-sm text-muted-foreground">{storage.description}</p>
                    {selections.mudroom_storage === storage.id && (
                      <div className="mt-2 text-xs text-green-600 font-medium flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Selected
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mudroom Flooring */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Mudroom Flooring</h4>
              
              {/* Flooring Type Selection */}
              <div className="space-y-3">
                <label className="text-base font-medium">Select Flooring Type</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { 
                      id: 'luxury_vinyl', 
                      name: 'Luxury Vinyl Plank',
                      description: 'Waterproof, durable, easy maintenance',
                      image: "/lovable-uploads/a9f8541e-71a8-4cd2-bffb-20b1fea7edd2.png"
                    },
                    { 
                      id: 'tile', 
                      name: 'Ceramic Tile',
                      description: 'Durable and water-resistant',
                      image: ceramicTileImage
                    }
                  ].map((flooring) => {
                    const selectionKey = 'mudroom_flooring_type';
                    const isSelected = selections[selectionKey] === flooring.id;
                    return (
                      <div 
                        key={flooring.id}
                        className={`border-2 rounded-lg cursor-pointer transition-all hover:border-primary overflow-hidden ${
                          isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' : 'border-gray-200 hover:shadow-lg'
                        }`}
                        onClick={() => {
                          if (isEditing) {
                            setSelections(prev => ({
                              ...prev,
                              mudroom_flooring_type: flooring.id,
                              mudroom_flooring_color: '' // Reset color when type changes
                            }));
                          }
                        }}
                      >
                        <div className="relative">
                          <img 
                            src={flooring.image} 
                            alt={flooring.name}
                            className="w-full h-32 object-cover"
                          />
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h6 className="font-semibold">{flooring.name}</h6>
                          <p className="text-sm text-muted-foreground">{flooring.description}</p>
                          {isSelected && (
                            <div className="mt-2 text-xs text-green-600 font-medium">Selected</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Flooring Color Selection */}
              {selections.mudroom_flooring_type && (
                <div className="space-y-3">
                  <label className="text-base font-medium">Select Color</label>
                  <FlooringTypeSelector
                    flooringType={selections.mudroom_flooring_type}
                    selectedRoom="mudroom"
                    selections={selections}
                    onColorSelect={handleColorSelect}
                    isEditing={isEditing}
                  />
                </div>
              )}
            </div>

            {/* Storage Finish */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Storage Finish</h4>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {[
                  { name: "White", hex: "#FFFFFF" },
                  { name: "Gray", hex: "#808080" },
                  { name: "Natural Wood", hex: "#DEB887" },
                  { name: "Black", hex: "#000000" },
                  { name: "Navy", hex: "#000080" },
                  { name: "Sage Green", hex: "#9CAF88" },
                  { name: "Espresso", hex: "#362D1D" },
                  { name: "Charcoal", hex: "#36454F" }
                ].map((color, index) => {
                  const isSelected = selections.mudroom_storage_finish === color.name.toLowerCase().replace(' ', '_');
                  return (
                    <div 
                      key={index}
                      className={`relative cursor-pointer group ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      onClick={() => {
                        if (isEditing) {
                          const newSelections = { ...selections };
                          newSelections.mudroom_storage_finish = color.name.toLowerCase().replace(' ', '_');
                          setSelections(newSelections);
                        }
                      }}
                    >
                      <div className={`border-2 rounded-lg overflow-hidden transition-all ${
                        isSelected ? 'border-primary shadow-lg' : 'border-gray-200 hover:border-gray-400'
                      }`}>
                        <div 
                          className="w-full h-12"
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

            {/* Laundry Features */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Laundry Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'stacked', name: 'Stacked Washer/Dryer', description: 'Space-saving vertical arrangement' },
                  { id: 'side_by_side', name: 'Side by Side', description: 'Traditional arrangement' },
                  { id: 'utility_sink', name: 'Add Utility Sink', description: 'Convenient washing station' },
                  { id: 'folding_counter', name: 'Folding Counter', description: 'Workspace above appliances' }
                ].map((feature) => (
                  <div 
                    key={feature.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
                      selections.mudroom_laundry_features === feature.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                    onClick={() => {
                      if (isEditing) {
                        const newSelections = { ...selections };
                        newSelections.mudroom_laundry_features = feature.id;
                        setSelections(newSelections);
                      }
                    }}
                  >
                    <h5 className="font-semibold">{feature.name}</h5>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                    {selections.mudroom_laundry_features === feature.id && (
                      <div className="mt-2 text-xs text-green-600 font-medium">Selected</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
    
    {/* Image Modal */}
    <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
      <DialogContent className="max-w-4xl w-full p-0">
        {selectedImage && (
          <div className="relative">
            {selectedImage.src.startsWith('#') ? (
              // Color swatch view
              <div className="flex flex-col items-center justify-center p-8 min-h-[300px]">
                <div 
                  className="w-48 h-48 rounded-lg border-4 border-white shadow-2xl mb-4"
                  style={{ backgroundColor: selectedImage.src }}
                />
                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">{selectedImage.title}</h3>
                  <p className="text-lg text-gray-600 font-mono">{selectedImage.src.toUpperCase()}</p>
                </div>
              </div>
            ) : (
              // Image view
              <>
                <img 
                  src={selectedImage.src} 
                  alt={selectedImage.title}
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg">
                  <h3 className="text-xl font-semibold">{selectedImage.title}</h3>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Enhanced Textured Color Modal */}
    <Dialog open={texturedModalOpen} onOpenChange={setTexturedModalOpen}>
      <DialogContent 
        className="max-w-2xl w-full max-h-[80vh] flex flex-col"
        tabIndex={-1}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Color Selection - {selectedTexturedColor?.color?.name}
          </DialogTitle>
        </DialogHeader>
        
        {selectedTexturedColor && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            {/* Large Color Display */}
            <div className="relative">
              <div 
                className="w-80 h-60 rounded-lg border-4 border-gray-200 shadow-lg relative overflow-hidden"
                style={{ backgroundColor: selectedTexturedColor.color.hex }}
              >
                {/* Texture overlay */}
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: `
                      repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 2px,
                        rgba(255,255,255,0.1) 2px,
                        rgba(255,255,255,0.1) 4px
                      ),
                      repeating-linear-gradient(
                        -45deg,
                        transparent,
                        transparent 2px,
                        rgba(0,0,0,0.05) 2px,
                        rgba(0,0,0,0.05) 4px
                      )
                    `
                  }}
                />
                {/* Metallic shine effect */}
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `linear-gradient(135deg, 
                      rgba(255,255,255,0.3) 0%, 
                      transparent 25%, 
                      transparent 75%, 
                      rgba(255,255,255,0.1) 100%)`
                  }}
                />
              </div>
            </div>

            {/* Color Information */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">{selectedTexturedColor.color.name}</h3>
              <p className="text-lg text-gray-600">Code: {selectedTexturedColor.color.code}</p>
              <p className="text-sm text-gray-500">Hex: {selectedTexturedColor.color.hex}</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                <p className="text-sm font-medium text-blue-800">Textured Finish</p>
                <p className="text-xs text-blue-600">Upgraded product. Price will be provided if selection has been made</p>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateTexturedColor('prev')}
                className="flex items-center space-x-2"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </Button>
              
              <span className="text-sm text-gray-500">
                {selectedTexturedColor.index + 1} of {TITAN_TEXTURED_COLORS.length}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateTexturedColor('next')}
                className="flex items-center space-x-2"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  if (selectedTexturedColor?.color) {
                    handleTexturedColorSelect(selectedTexturedColor.color, selectedTexturedColor.type);
                    setTexturedModalOpen(false);
                  }
                }}
                disabled={!isEditing || !selectedTexturedColor?.color}
                className="px-6"
              >
                Select This Color
              </Button>
              <Button
                variant="outline"
                onClick={() => setTexturedModalOpen(false)}
                className="px-6"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        
        {/* Keyboard Hints */}
        <div className="text-xs text-gray-500 text-center space-x-4">
          <span>← → Navigate</span>
          <span>Enter/Space Select</span>
          <span>Esc Close</span>
        </div>
      </DialogContent>
    </Dialog>

    {/* Kitchen Cabinet Modal */}
    {console.log('Kitchen modal state:', { kitchenModalOpen, selectedKitchenImage })}
    <ScrollableModal
      isOpen={kitchenModalOpen}
      onClose={() => {
        console.log('Closing kitchen modal...');
        setKitchenModalOpen(false);
      }}
      title="Kitchen Cabinet Style"
      description="View detailed kitchen design"
      maxHeight="80vh"
    >
      {selectedKitchenImage && (
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-lg shadow-lg">
            <img 
              src={selectedKitchenImage.src} 
              alt={selectedKitchenImage.title}
              className="w-full h-[250px] md:h-[300px] object-cover object-center"
              style={{ objectPosition: 'center 60%' }}
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{selectedKitchenImage.title}</h3>
              <p className="text-lg text-gray-600 leading-relaxed">{selectedKitchenImage.description}</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-900 mb-4">Style Features</h4>
              <ul className="space-y-3">
                {selectedKitchenImage.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-blue-800">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></span>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </ScrollableModal>

    {/* Trim Styles Modal */}
    <ScrollableModal
      isOpen={trimModalOpen}
      onClose={() => setTrimModalOpen(false)}
      title="Trim & Molding Styles"
      description="Choose from our available trim and molding styles"
      maxHeight="90vh"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: 'craftsman', name: 'Craftsman', description: 'Thick, substantial trim work with clean lines and bold profiles', image: craftsmanTrimImage },
            { id: 'square', name: 'Square', description: 'Simple square profile trim for a modern, minimalist look', image: squareTrimImage },
            { id: 'colonial', name: 'Colonial', description: 'Ornate crown molding style with traditional details', image: colonialTrimImage }
          ].map((trim) => (
            <div 
              key={trim.id}
              className={`border-2 rounded-lg cursor-pointer transition-all hover:border-primary overflow-hidden ${
                selections.interior_trim_style === trim.id ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' : 'border-gray-200 hover:shadow-lg'
              }`}
              onClick={() => {
                if (isEditing) {
                  const newSelections = { ...selections };
                  newSelections.interior_trim_style = trim.id;
                  setSelections(newSelections);
                }
              }}
            >
              <div className="relative">
                <img 
                  src={trim.image} 
                  alt={trim.name}
                  className="w-full h-40 object-cover"
                />
                {selections.interior_trim_style === trim.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h5 className="font-semibold text-lg mb-2">{trim.name}</h5>
                <p className="text-sm text-muted-foreground">{trim.description}</p>
                {selections.interior_trim_style === trim.id && (
                  <div className="mt-2 text-xs text-green-600 font-medium">✓ Selected</div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">About Trim & Molding</h4>
          <p className="text-sm text-blue-700">
            Trim and molding add architectural detail and character to your home's interior. 
            Your selection will be applied to all rooms including door casings, window trim, 
            baseboards, and crown molding where applicable.
          </p>
        </div>
      </div>
    </ScrollableModal>
    </>
  );
};

