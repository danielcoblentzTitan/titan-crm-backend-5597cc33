import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Palette, Home } from "lucide-react";

interface RoomVisualizerProps {
  selections: any;
}

export const RoomVisualizer = ({ selections }: RoomVisualizerProps) => {
  const [selectedRoomType, setSelectedRoomType] = useState<string>("living_room");
  const [selectedRoomForVisualization, setSelectedRoomForVisualization] = useState<string>("living_room");

  // Color mapping for Sherwin Williams colors
  const getColorHex = (colorSelection: string): string => {
    const colorMap: { [key: string]: string } = {
      "agreeable_gray": "#D4D2D0",
      "accessible_beige": "#D6C7B3", 
      "balanced_beige": "#E8DCC0",
      "repose_gray": "#C7C8C5",
      "alabaster": "#F2F0E8",
      "pure_white": "#FFFFFF",
      "creamy": "#F2E9D0",
      "natural_linen": "#E8E2D5",
      "mindful_gray": "#D2D0CD",
      "collonade_gray": "#C2C1BC",
      "amazing_gray": "#A5A5A0",
      "swiss_coffee": "#F7F3E9",
      "requisite_gray": "#BBBBB8",
      "tricorn_black": "#2C2C30",
      "naval": "#1F2937",
      "iron_ore": "#4C4C4C"
    };
    return colorMap[colorSelection] || "#F5F5F5";
  };

  // Flooring color mapping
  const getFlooringColor = (flooringType: string, colorSelection: string): string => {
    if (colorSelection) {
      const flooringColorMap: { [key: string]: string } = {
        "light_oak": "#D2B48C",
        "medium_oak": "#B8860B", 
        "dark_walnut": "#5D4E37",
        "gray_wash": "#A0A0A0",
        "espresso": "#362D1D",
        "natural_oak": "#DEB887",
        "cherry": "#8B4513",
        "maple": "#DDD5C7",
        "hickory": "#C19A6B",
        "beige": "#F5F5DC",
        "light_gray": "#D3D3D3",
        "charcoal": "#36454F",
        "travertine": "#E6D7C3",
        "slate_blue": "#6A7B8A",
        "tan": "#D2B48C",
        "navy": "#1B365D"
      };
      return flooringColorMap[colorSelection] || "#DEB887";
    }
    
    // Default colors based on flooring type
    const defaultFlooringColors: { [key: string]: string } = {
      "luxury_vinyl": "#D2B48C",
      "laminate": "#B8860B",
      "hardwood": "#DEB887", 
      "tile": "#F5F5DC",
      "carpet": "#D3D3D3",
      "concrete": "#A0A0A0"
    };
    return defaultFlooringColors[flooringType] || "#DEB887";
  };

  const getTrimStyle = (trimStyle: string): string => {
    const trimStyles: { [key: string]: string } = {
      "modern": "2px solid white",
      "traditional": "4px solid white", 
      "colonial": "6px solid white",
      "craftsman": "8px solid white"
    };
    return trimStyles[trimStyle] || "3px solid white";
  };

  const paintColor = getColorHex(selections[`${selectedRoomForVisualization}_paint_color`]);
  const flooringType = selections[`${selectedRoomForVisualization}_flooring`];
  const flooringColor = selections[`${selectedRoomForVisualization}_flooring_color`];
  const customFlooringColor = selections[`${selectedRoomForVisualization}_flooring_custom_color`];
  const trimStyle = getTrimStyle(selections.interior_trim_style);
  
  const finalFlooringColor = customFlooringColor ? 
    getFlooringColor(flooringType, "medium_oak") : // Default for custom
    getFlooringColor(flooringType, flooringColor);

  const roomTypes = [
    { value: "living_room", label: "Living Room" },
    { value: "master_bedroom", label: "Master Bedroom" },
    { value: "guest_bedroom_1", label: "Guest Bedroom 1" },
    { value: "office_study", label: "Office/Study" },
    { value: "dining_room", label: "Dining Room" },
    { value: "kitchen", label: "Kitchen" },
    { value: "bathroom", label: "Bathroom" },
    { value: "common_areas", label: "Common Areas - Hallways and Entryways" }
  ];

  const renderLivingRoom = () => (
    <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden perspective-1000" style={{ backgroundColor: paintColor }}>
      {/* Floor with perspective */}
      <div 
        className="absolute bottom-0 w-full h-32 transform-gpu"
        style={{ 
          backgroundColor: finalFlooringColor,
          backgroundImage: flooringType === 'hardwood' || flooringType === 'luxury_vinyl' || flooringType === 'laminate' 
            ? `repeating-linear-gradient(90deg, transparent, transparent 25px, rgba(0,0,0,0.15) 25px, rgba(0,0,0,0.15) 26px),
               repeating-linear-gradient(45deg, rgba(0,0,0,0.05), rgba(0,0,0,0.05) 2px, transparent 2px, transparent 4px)`
            : flooringType === 'tile' 
            ? `repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.2) 40px, rgba(0,0,0,0.2) 42px), 
               repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(0,0,0,0.2) 40px, rgba(0,0,0,0.2) 42px)`
            : flooringType === 'carpet'
            ? `repeating-linear-gradient(45deg, rgba(0,0,0,0.03), rgba(0,0,0,0.03) 1px, transparent 1px, transparent 3px),
               repeating-linear-gradient(-45deg, rgba(0,0,0,0.03), rgba(0,0,0,0.03) 1px, transparent 1px, transparent 3px)`
            : 'none',
          clipPath: 'polygon(15% 100%, 85% 100%, 95% 75%, 5% 75%)'
        }}
      />
      
      {/* Back wall */}
      <div className="absolute top-8 left-0 w-full h-40" style={{ backgroundColor: paintColor }}>
        {/* Window */}
        <div className="absolute top-8 right-12 w-20 h-16 bg-blue-100 border-4 border-white rounded shadow-inner">
          <div className="absolute inset-2 border border-white/50"></div>
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/70"></div>
          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white/70"></div>
        </div>
        
        {/* Crown molding */}
        <div className="absolute top-0 left-0 w-full h-2 bg-white shadow-md" style={{ border: trimStyle.split(' ')[0] + ' solid white' }}></div>
      </div>
      
      {/* Left wall with perspective */}
      <div 
        className="absolute top-8 left-0 w-20 h-40 transform -skew-y-12 origin-bottom"
        style={{ backgroundColor: `color-mix(in srgb, ${paintColor} 80%, black)` }}
      >
        {/* Baseboard */}
        <div className="absolute bottom-0 left-0 w-full h-3 bg-white shadow-md"></div>
      </div>
      
      {/* Right wall with perspective */}
      <div 
        className="absolute top-8 right-0 w-20 h-40 transform skew-y-12 origin-bottom"
        style={{ backgroundColor: `color-mix(in srgb, ${paintColor} 80%, black)` }}
      >
        {/* Baseboard */}
        <div className="absolute bottom-0 left-0 w-full h-3 bg-white shadow-md"></div>
      </div>
      
      {/* Ceiling */}
      <div 
        className="absolute top-0 left-0 w-full h-16 bg-white transform-gpu"
        style={{ 
          clipPath: 'polygon(5% 100%, 95% 100%, 85% 0%, 15% 0%)',
          boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.1)'
        }}
      />
      
      {/* Furniture with shadows and details */}
      {/* Sectional sofa */}
      <div className="absolute bottom-32 left-16 w-32 h-16 bg-gray-700 rounded-lg shadow-lg">
        <div className="absolute inset-2 bg-gray-600 rounded"></div>
        <div className="absolute top-1 left-1 w-6 h-6 bg-gray-500 rounded"></div>
        <div className="absolute top-1 right-1 w-6 h-6 bg-gray-500 rounded"></div>
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-3 bg-gray-500 rounded"></div>
      </div>
      
      {/* Coffee table */}
      <div className="absolute bottom-40 left-24 w-16 h-8 bg-amber-800 rounded shadow-md">
        <div className="absolute inset-1 bg-amber-700 rounded"></div>
        <div className="absolute -bottom-2 left-2 w-2 h-2 bg-amber-900 rounded"></div>
        <div className="absolute -bottom-2 right-2 w-2 h-2 bg-amber-900 rounded"></div>
      </div>
      
      {/* Armchair */}
      <div className="absolute bottom-32 right-20 w-12 h-12 bg-blue-700 rounded shadow-lg">
        <div className="absolute inset-1 bg-blue-600 rounded"></div>
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-4 bg-blue-800 rounded"></div>
      </div>
      
      {/* TV stand */}
      <div className="absolute bottom-48 left-1/2 transform -translate-x-1/2 w-24 h-4 bg-gray-800 rounded shadow">
        <div className="absolute inset-0.5 bg-gray-700 rounded"></div>
      </div>
      
      {/* Lamp */}
      <div className="absolute bottom-32 right-8 w-3 h-8 bg-gray-400">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-3 bg-amber-100 rounded-full opacity-80"></div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-gray-600 rounded"></div>
      </div>
      
      {/* Ceiling light */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-amber-100 rounded-full opacity-60 shadow-lg">
        <div className="absolute inset-1 bg-amber-200 rounded-full"></div>
        <div className="absolute inset-2 bg-white rounded-full"></div>
      </div>
      
      {/* Room label with better styling */}
      <div className="absolute top-3 left-3 text-sm font-semibold text-gray-800 bg-white/90 px-3 py-1 rounded-full shadow-sm border">
        Living Room
      </div>
    </div>
  );

  const renderBedroom = () => (
    <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden" style={{ backgroundColor: paintColor }}>
      {/* Floor with perspective */}
      <div 
        className="absolute bottom-0 w-full h-32"
        style={{ 
          backgroundColor: finalFlooringColor,
          backgroundImage: flooringType === 'hardwood' || flooringType === 'luxury_vinyl' || flooringType === 'laminate' 
            ? `repeating-linear-gradient(90deg, transparent, transparent 25px, rgba(0,0,0,0.15) 25px, rgba(0,0,0,0.15) 26px),
               repeating-linear-gradient(45deg, rgba(0,0,0,0.05), rgba(0,0,0,0.05) 2px, transparent 2px, transparent 4px)`
            : flooringType === 'carpet' 
            ? `repeating-linear-gradient(45deg, rgba(0,0,0,0.03), rgba(0,0,0,0.03) 1px, transparent 1px, transparent 3px),
               repeating-linear-gradient(-45deg, rgba(0,0,0,0.03), rgba(0,0,0,0.03) 1px, transparent 1px, transparent 3px)`
            : 'none',
          clipPath: 'polygon(15% 100%, 85% 100%, 95% 75%, 5% 75%)'
        }}
      />
      
      {/* Back wall */}
      <div className="absolute top-8 left-0 w-full h-40" style={{ backgroundColor: paintColor }}>
        {/* Window with curtains */}
        <div className="absolute top-6 left-8 w-24 h-20 bg-blue-100 border-4 border-white rounded shadow-inner">
          <div className="absolute inset-2 border border-white/50"></div>
          <div className="absolute -left-4 top-0 w-8 h-full bg-red-300 opacity-80 rounded-l"></div>
          <div className="absolute -right-4 top-0 w-8 h-full bg-red-300 opacity-80 rounded-r"></div>
        </div>
        
        {/* Headboard wall accent */}
        <div className="absolute top-12 right-8 w-32 h-16" style={{ backgroundColor: `color-mix(in srgb, ${paintColor} 90%, gray)` }}>
          <div className="absolute inset-2 border-2 border-white/20 rounded"></div>
        </div>
        
        {/* Crown molding */}
        <div className="absolute top-0 left-0 w-full h-2 bg-white shadow-md"></div>
      </div>
      
      {/* Ceiling */}
      <div 
        className="absolute top-0 left-0 w-full h-16 bg-white"
        style={{ 
          clipPath: 'polygon(5% 100%, 95% 100%, 85% 0%, 15% 0%)',
          boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.1)'
        }}
      />
      
      {/* Queen bed */}
      <div className="absolute bottom-32 right-8 w-40 h-20 bg-gray-800 rounded-lg shadow-lg">
        {/* Mattress */}
        <div className="absolute inset-2 bg-white rounded border"></div>
        {/* Pillows */}
        <div className="absolute top-3 left-4 w-8 h-4 bg-blue-200 rounded"></div>
        <div className="absolute top-3 right-4 w-8 h-4 bg-blue-200 rounded"></div>
        {/* Comforter */}
        <div className="absolute bottom-3 left-4 right-4 h-8 bg-blue-300 rounded"></div>
      </div>
      
      {/* Nightstands */}
      <div className="absolute bottom-32 right-52 w-8 h-8 bg-amber-800 rounded shadow-md">
        <div className="absolute inset-1 bg-amber-700 rounded"></div>
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-amber-600 rounded"></div>
      </div>
      <div className="absolute bottom-32 right-4 w-8 h-8 bg-amber-800 rounded shadow-md">
        <div className="absolute inset-1 bg-amber-700 rounded"></div>
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-amber-600 rounded"></div>
      </div>
      
      {/* Table lamps */}
      <div className="absolute bottom-24 right-54 w-2 h-6 bg-gray-400">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-amber-100 rounded-full opacity-80"></div>
      </div>
      <div className="absolute bottom-24 right-6 w-2 h-6 bg-gray-400">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-amber-100 rounded-full opacity-80"></div>
      </div>
      
      {/* Dresser */}
      <div className="absolute bottom-32 left-8 w-16 h-12 bg-amber-800 rounded shadow-lg">
        <div className="absolute inset-1 bg-amber-700 rounded"></div>
        <div className="absolute top-2 left-2 w-3 h-1 bg-amber-600 rounded"></div>
        <div className="absolute top-2 right-2 w-3 h-1 bg-amber-600 rounded"></div>
        <div className="absolute bottom-2 left-2 w-3 h-1 bg-amber-600 rounded"></div>
        <div className="absolute bottom-2 right-2 w-3 h-1 bg-amber-600 rounded"></div>
      </div>
      
      {/* Ceiling fan */}
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-12 h-2 bg-gray-600 rounded-full shadow-lg">
        <div className="absolute -top-1 left-0 w-4 h-4 bg-gray-500 rounded-full"></div>
        <div className="absolute -top-1 right-0 w-4 h-4 bg-gray-500 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-amber-100 rounded-full"></div>
      </div>
      
      {/* Room label */}
      <div className="absolute top-3 left-3 text-sm font-semibold text-gray-800 bg-white/90 px-3 py-1 rounded-full shadow-sm border">
        Bedroom
      </div>
    </div>
  );

  const renderKitchen = () => {
    const cabinetColor = selections.kitchen_cabinet_color;
    let cabinetHex = "#FFFFFF";
    
    if (cabinetColor?.startsWith("painted_")) {
      const colorName = cabinetColor.replace("painted_", "");
      const paintedColors: { [key: string]: string } = {
        "pure_white": "#FFFFFF",
        "off_white": "#F8F8F0", 
        "light_gray": "#D3D3D3",
        "navy_blue": "#1B365D",
        "sage_green": "#9CAF88"
      };
      cabinetHex = paintedColors[colorName] || "#FFFFFF";
    } else if (cabinetColor?.startsWith("stained_")) {
      const colorName = cabinetColor.replace("stained_", "");
      const stainedColors: { [key: string]: string } = {
        "natural_oak": "#DEB887",
        "cherry": "#8B4513",
        "dark_walnut": "#5D4E37", 
        "espresso": "#362D1D",
        "gray_stain": "#8B8680"
      };
      cabinetHex = stainedColors[colorName] || "#DEB887";
    }

    // Get countertop color
    const countertopType = selections.kitchen_countertop;
    const countertopColors: { [key: string]: string } = {
      "quartz": "#F5F5F5",
      "granite": "#2F2F2F",
      "marble": "#F8F8FF",
      "butcher_block": "#DEB887",
      "concrete": "#A0A0A0",
      "laminate": "#E6E6E6"
    };
    const countertopColor = countertopColors[countertopType] || "#F5F5F5";

    return (
      <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden" style={{ backgroundColor: paintColor }}>
        {/* Floor with perspective */}
        <div 
          className="absolute bottom-0 w-full h-32"
          style={{ 
            backgroundColor: finalFlooringColor,
            backgroundImage: flooringType === 'tile' 
              ? `repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.2) 40px, rgba(0,0,0,0.2) 42px), 
                 repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(0,0,0,0.2) 40px, rgba(0,0,0,0.2) 42px)`
              : flooringType === 'hardwood' || flooringType === 'luxury_vinyl' || flooringType === 'laminate'
              ? `repeating-linear-gradient(90deg, transparent, transparent 25px, rgba(0,0,0,0.15) 25px, rgba(0,0,0,0.15) 26px)`
              : 'none',
            clipPath: 'polygon(15% 100%, 85% 100%, 95% 75%, 5% 75%)'
          }}
        />
        
        {/* Back wall */}
        <div className="absolute top-8 left-0 w-full h-40" style={{ backgroundColor: paintColor }}>
          {/* Window above sink */}
          <div className="absolute top-16 right-20 w-16 h-12 bg-blue-100 border-3 border-white rounded shadow-inner">
            <div className="absolute inset-1 border border-white/50"></div>
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/70"></div>
          </div>
        </div>
        
        {/* Ceiling */}
        <div 
          className="absolute top-0 left-0 w-full h-16 bg-white"
          style={{ 
            clipPath: 'polygon(5% 100%, 95% 100%, 85% 0%, 15% 0%)',
            boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.1)'
          }}
        />
        
        {/* Lower cabinets with detailed styling */}
        <div className="absolute bottom-32 left-0 w-full h-20" style={{ backgroundColor: cabinetHex }}>
          {/* Cabinet door frames */}
          <div className="h-full w-full grid grid-cols-6 gap-1 p-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-black/10 rounded border border-black/20 relative">
                <div className="absolute inset-1 border border-white/30 rounded"></div>
                <div className="absolute top-1/2 right-1 w-1 h-1 bg-gray-400 rounded-full"></div>
              </div>
            ))}
          </div>
          
          {/* Countertop */}
          <div 
            className="absolute -top-3 left-0 w-full h-3 shadow-lg rounded-sm"
            style={{ 
              backgroundColor: countertopColor,
              backgroundImage: countertopType === 'granite' 
                ? 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.3) 1px, transparent 1px), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.3) 1px, transparent 1px)'
                : countertopType === 'marble'
                ? 'linear-gradient(45deg, rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(-45deg, rgba(0,0,0,0.1) 1px, transparent 1px)'
                : 'none'
            }}
          />
        </div>
        
        {/* Upper cabinets */}
        <div className="absolute top-16 left-0 w-full h-16" style={{ backgroundColor: cabinetHex }}>
          <div className="h-full w-full grid grid-cols-6 gap-1 p-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-black/10 rounded border border-black/20 relative">
                <div className="absolute inset-1 border border-white/30 rounded"></div>
                <div className="absolute bottom-2 right-1 w-1 h-1 bg-gray-400 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Kitchen island */}
        <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 w-24 h-12 shadow-lg" style={{ backgroundColor: cabinetHex }}>
          <div className="h-full w-full grid grid-cols-3 gap-1 p-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-black/10 rounded border border-black/20 relative">
                <div className="absolute inset-1 border border-white/30 rounded"></div>
              </div>
            ))}
          </div>
          {/* Island countertop */}
          <div 
            className="absolute -top-2 left-0 w-full h-2 rounded-sm shadow-md"
            style={{ backgroundColor: countertopColor }}
          />
        </div>
        
        {/* Appliances */}
        {/* Refrigerator */}
        <div className="absolute bottom-32 left-4 w-12 h-24 bg-gray-200 rounded shadow-lg border">
          <div className="absolute inset-2 bg-gray-100 rounded"></div>
          <div className="absolute top-1/2 right-1 w-2 h-8 bg-gray-300 rounded"></div>
          <div className="absolute top-4 right-2 w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
        
        {/* Stove */}
        <div className="absolute bottom-32 right-4 w-12 h-20 bg-gray-800 rounded shadow-lg">
          <div className="absolute top-2 left-2 w-2 h-2 bg-gray-600 rounded-full"></div>
          <div className="absolute top-2 right-2 w-2 h-2 bg-gray-600 rounded-full"></div>
          <div className="absolute bottom-2 left-2 w-2 h-2 bg-gray-600 rounded-full"></div>
          <div className="absolute bottom-2 right-2 w-2 h-2 bg-gray-600 rounded-full"></div>
        </div>
        
        {/* Pendant lights over island */}
        <div className="absolute top-20 left-1/2 transform -translate-x-6 w-3 h-6 bg-gray-600 rounded-b-full shadow">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-amber-100 rounded-full opacity-80"></div>
        </div>
        <div className="absolute top-20 left-1/2 transform translate-x-3 w-3 h-6 bg-gray-600 rounded-b-full shadow">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-amber-100 rounded-full opacity-80"></div>
        </div>
        
        {/* Room label */}
        <div className="absolute top-3 left-3 text-sm font-semibold text-gray-800 bg-white/90 px-3 py-1 rounded-lg shadow-sm border">
          Kitchen
        </div>
      </div>
    );
  };

  const renderRoom = () => {
    const roomName = selectedRoomForVisualization.replace(/_/g, ' ');
    
    if (selectedRoomForVisualization === 'living_room' || selectedRoomForVisualization === 'dining_room') {
      return renderLivingRoom();
    } else if (selectedRoomForVisualization.includes('bedroom') || selectedRoomForVisualization === 'office_study') {
      return renderBedroom();
    } else {
      return renderLivingRoom(); // Default to living room layout
    }
  };

  const getSelectionSummary = () => {
    const paintSelection = selections[`${selectedRoomForVisualization}_paint_color`];
    const flooringSelection = selections[`${selectedRoomForVisualization}_flooring`];
    const flooringColorSelection = selections[`${selectedRoomForVisualization}_flooring_color`];
    const customFlooringSelection = selections[`${selectedRoomForVisualization}_flooring_custom_color`];
    const trimSelection = selections.interior_trim_style;

    return {
      paint: paintSelection?.replace(/_/g, ' ') || "Not selected",
      flooring: flooringSelection?.replace(/_/g, ' ') || "Not selected", 
      flooringColor: customFlooringSelection || flooringColorSelection?.replace(/_/g, ' ') || "Not selected",
      trim: trimSelection?.replace(/_/g, ' ') || "Not selected"
    };
  };

  const summary = getSelectionSummary();

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Room Visualizer
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          See how your color and material selections look in a finished room
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Room Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Room to Visualize:</label>
          <Select value={selectedRoomForVisualization} onValueChange={setSelectedRoomForVisualization}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Choose a room..." />
            </SelectTrigger>
            <SelectContent>
              {roomTypes.map((room) => (
                <SelectItem key={room.value} value={room.value}>
                  {room.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Room Visualization */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Home className="h-4 w-4" />
            {selectedRoomForVisualization.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Preview
          </h4>
          
          {renderRoom()}
        </div>

        {/* Selection Summary */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Current Selections for this Room
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="font-medium text-blue-700">Paint:</span>
              <div className="text-blue-600 capitalize">{summary.paint}</div>
            </div>
            <div>
              <span className="font-medium text-blue-700">Flooring:</span>
              <div className="text-blue-600 capitalize">{summary.flooring}</div>
            </div>
            <div>
              <span className="font-medium text-blue-700">Flooring Color:</span>
              <div className="text-blue-600 capitalize">{summary.flooringColor}</div>
            </div>
            <div>
              <span className="font-medium text-blue-700">Trim Style:</span>
              <div className="text-blue-600 capitalize">{summary.trim}</div>
            </div>
          </div>
          
          {(!summary.paint || summary.paint === "Not selected") && (
            <div className="mt-3 text-xs text-blue-600">
              💡 Make selections in the Interior tab above to see them reflected in the visualization
            </div>
          )}
        </div>

        {/* Kitchen Visualization */}
        {(selections.kitchen_cabinet_style || selections.kitchen_cabinet_color || selections.kitchen_countertop) && (
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Home className="h-4 w-4" />
              Kitchen Preview
            </h4>
            
            {renderKitchen()}
            
            <div className="bg-red-50 p-4 rounded-lg">
              <h5 className="font-semibold text-red-800 mb-3">Kitchen Selections</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="font-medium text-red-700">Cabinet Style:</span>
                  <div className="text-red-600 capitalize">
                    {selections.kitchen_cabinet_style?.replace(/_/g, ' ') || "Not selected"}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-red-700">Cabinet Color:</span>
                  <div className="text-red-600 capitalize">
                    {selections.kitchen_cabinet_color?.replace(/_/g, ' ').replace('painted ', '').replace('stained ', '') || "Not selected"}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-red-700">Countertop:</span>
                  <div className="text-red-600 capitalize">
                    {selections.kitchen_countertop?.replace(/_/g, ' ') || "Not selected"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};