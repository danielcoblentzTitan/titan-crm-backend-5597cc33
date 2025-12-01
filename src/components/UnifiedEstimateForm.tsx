import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calculator, FileText, DollarSign, Building, Zap, ChevronDown, ChevronUp, History, Edit, Plus, Trash2, Minus, X, Home, Warehouse, Save, Trash } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Lead, supabaseService } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";
import { useStatementData, ProjectType } from "./fees-statement/useStatementData";
import { estimatesService } from "@/services/estimatesService";
import { estimateService } from "@/services/estimate/estimateService";
import type { Estimate } from "@/services/estimatesService";
import { pricingService, PricingCategory, PricingItemWithCategory } from "@/services/pricingService";
import { FormulaService, FormulaDimensions, FormulaResult } from "@/services/formulaService";
import PlumbingCalculator from "@/components/PlumbingCalculator";
import { PostCalculationDisplay } from "@/components/PostCalculationDisplay";
import { PostCalculationService } from "@/services/postCalculationService";

// Utility function to format currency with commas
const formatCurrency = (amount: number): string => {
  return '$' + Math.ceil(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

interface UnifiedEstimateFormProps {
  lead: Lead;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEstimateCreated?: (estimateData: any) => void;
}

interface EstimateLineItem {
  id: string;
  category: string;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  unit_type: string;
  has_formula?: boolean;
  formula_type?: string;
  formula_result?: FormulaResult;
}

export const UnifiedEstimateForm = ({
  lead,
  isOpen,
  onOpenChange,
  onEstimateCreated
}: UnifiedEstimateFormProps) => {
  const { toast } = useToast();
  
  // Previous estimates state
  const [previousEstimates, setPreviousEstimates] = useState<Estimate[]>([]);
  const [showPreviousEstimates, setShowPreviousEstimates] = useState(false);
  const [loadingEstimates, setLoadingEstimates] = useState(false);
  const [editingVersionName, setEditingVersionName] = useState<string | null>(null);
  
  // Master pricing and estimate items
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [masterItems, setMasterItems] = useState<PricingItemWithCategory[]>([]);
  const [estimateItems, setEstimateItems] = useState<EstimateLineItem[]>([]);
  const [masterItemQuantities, setMasterItemQuantities] = useState<Record<string, number>>({});
  const [garageDoorOptions, setGarageDoorOptions] = useState<Record<string, {
    hasWindows: boolean;
    windowQuantity: number;
    hasOpener: boolean;
    openerQuantity: number;
  }>>({});
  const [showPlumbingCalculator, setShowPlumbingCalculator] = useState(false);
  const [pricingExpanded, setPricingExpanded] = useState(false);
  
  // Dimensions and basic info
  const [buildingType, setBuildingType] = useState<ProjectType>('barndominium');
  const [dimensions, setDimensions] = useState({
    width: '',
    height: '',
    length: '',
    // Barndominium specific fields (first floor uses main dimensions)
    secondFloorSqFt: '',
    garageWidth: '',
    garageLength: '',
    garageHeight: '',
    interiorWallsLf: ''
  });

  // Building options state
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [customDescription, setCustomDescription] = useState('');
  
  // Windows and garage doors package state
  const [windowsExpanded, setWindowsExpanded] = useState(false);
  const [garageDoorsExpanded, setGarageDoorsExpanded] = useState(false);
  const [entryDoorsExpanded, setEntryDoorsExpanded] = useState(false);
  const [leanToExpanded, setLeanToExpanded] = useState(false);
  
  const [windowOptions, setWindowOptions] = useState({
    insulation_wall_finish: 'liner', // 'liner' or 'drywall' - liner as default
    windows: [] as Array<{id: string, width: number, height: number, isDouble: boolean, quantity: number}>,
    garageDoors: [] as Array<{id: string, name: string, quantity: number, hasOpener: boolean, hasWindows: boolean, hasCarriageHardware: boolean, selectedItemId: string}>,
    entryDoors: [] as Array<{id: string, type: string, width: string, height: string, isCustom: boolean, customDescription?: string, quantity: number}>,
    leanTos: [] as Array<{id: string, width: number, length: number, height: number, hasWraparound: boolean, quantity: number}>,
    exterior_siding: {
      gauge: '29', // '26' or '29' - 29ga as default
      finish: 'painted', // 'painted' or 'textured'
      hasWainscoting: false
    },
    electrical_option: 'A', // 'A', 'B', 'C' - for residential garage only
    // Building structural specifications (primary building)
    truss_pitch: '4/12', // 4/12 to 10/12 - DEFAULT 4/12 (6/12 for barndominiums)
    truss_spacing: '4', // 2' or 4' on center - DEFAULT 4' except barndominiums
    post_sizing: '3ply_2x6', // 3ply 2x6, 3ply 2x8, 4ply 2x6, 4ply 2x8
    moisture_barrier: 'standard', // 'standard' or 'premium' (standard is included in base, premium is upgrade)
    // Debug: Let's see what value this actually gets initialized to
    // console.log('Initial moisture_barrier set to: standard');
    concrete_thickness: 'none', // 'none', '4', '5', or '6' - default to none so it's not auto-selected
    // Garage structural specifications (for barndominiums)
    garage_truss_pitch: '4/12', // 4/12 to 10/12 - DEFAULT 4/12
    garage_truss_spacing: '4', // 2' or 4' on center - DEFAULT 4'
    garage_post_sizing: '3ply_2x6', // 3ply 2x6, 3ply 2x8, 4ply 2x6, 4ply 2x8
    garage_moisture_barrier: 'standard', // 'standard' or 'premium'
    garage_concrete_thickness: 'none', // 'none', '4', '5', or '6' - default to none
    // Second building connection option (for residential/commercial)
    connect_second_building: false,
    // Second building dimensions
    second_building_width: '',
    second_building_length: '',
    second_building_height: '',
    // Second building structural specifications
    second_building_truss_pitch: '4/12',
    second_building_truss_spacing: '4',
    second_building_post_sizing: '3ply_2x6',
    second_building_moisture_barrier: 'standard',
    second_building_concrete_thickness: 'none',
    site_prep_second_building: false,
    perimeter_insulation_second_building: false,
     // Lean-to specifications  
     leanto_concrete_thickness: 'none', // 'none', '4', '5', or '6' - default to none
     leanto1_concrete_thickness: 'none', // 'none', '4', '5', or '6' - for first lean-to
     leanto2_concrete_thickness: 'none', // 'none', '4', '5', or '6' - for second lean-to
     // Global settings
     site_plan: 'none', // 'none', 'standard', 'lines_and_grade', 'upgraded_lines_and_grade'
     // Site prep and perimeter insulation options
     site_prep_house: false,
     site_prep_garage: false,
     site_prep_leanto: false,
     site_prep_leanto1: false,
     site_prep_leanto2: false,
     perimeter_insulation_house: false,
     perimeter_insulation_garage: false,
     perimeter_insulation_leanto: false,
     perimeter_insulation_leanto1: false,
     perimeter_insulation_leanto2: false
  });

  // Force re-render counter for UI updates
  const [renderKey, setRenderKey] = useState(0);
  
  // Force re-render when doors change to update concrete calculations
  useEffect(() => {
    setRenderKey(prev => prev + 1);
  }, [estimateItems]); // Changed to watch estimateItems instead of windowOptions doors
  
  // Margin percentage state with defaults
  const [marginPercentage, setMarginPercentage] = useState(20);

  // Window, garage door, and lean-to form state
  const [windowForm, setWindowForm] = useState({
    width: '',
    height: '',
    isDouble: false,
    selectedItem: '' // ID of selected master pricing item
  });
  
  const [garageDoorForm, setGarageDoorForm] = useState({
    selectedItem: '', // ID of selected master pricing item
    quantity: 1,
    hasOpener: false,
    hasWindows: false,
    hasCarriageHardware: false
  });

  const [entryDoorForm, setEntryDoorForm] = useState({
    type: "3x68_solid",
    customDescription: '',
    selectedItem: '' // ID of selected master pricing item
  });

  const [leanToForm, setLeanToForm] = useState({
    width: '',
    length: '',
    height: '',
    hasWraparound: false
  });

  // Add garage door function
  const addGarageDoor = () => {
    if (garageDoorForm.selectedItem && garageDoorForm.quantity > 0) {
      const selectedItem = masterItems.find(item => item.id === garageDoorForm.selectedItem);
      if (selectedItem) {
        const newGarageDoor = {
          id: Date.now().toString(),
          name: selectedItem.name,
          quantity: garageDoorForm.quantity,
          hasOpener: garageDoorForm.hasOpener,
          hasWindows: garageDoorForm.hasWindows,
          hasCarriageHardware: garageDoorForm.hasCarriageHardware,
          selectedItemId: garageDoorForm.selectedItem
        };
        
        setWindowOptions(prev => ({
          ...prev,
          garageDoors: [...prev.garageDoors, newGarageDoor]
        }));
        
        // Reset form
        setGarageDoorForm({
          selectedItem: '',
          quantity: 1,
          hasOpener: false,
          hasWindows: false,
          hasCarriageHardware: false
        });
      }
    }
  };

  // Add entry door function
  const addEntryDoor = () => {
    const getDisplayType = (type: string) => {
      switch (type) {
        case "3x68_solid": return "3'x6'8\" Solid";
        case "3x68_9lite": return "3'x6'8\" 9-Lite";
        case "6x68_solid": return "6'x6'8\" Solid";
        case "6x68_9lite": return "6'x6'8\" 9-Lite";
        case "6_glass_sliding": return "6' Glass Sliding Door";
        case "custom": return "Custom";
        default: return type;
      }
    };

    const newEntryDoor = {
      id: Date.now().toString(),
      type: getDisplayType(entryDoorForm.type),
      width: entryDoorForm.type.includes("3x68") ? "3'" : entryDoorForm.type.includes("6x68") || entryDoorForm.type === "6_glass_sliding" ? "6'" : "Custom",
      height: entryDoorForm.type.includes("x68") ? "6'8\"" : "Custom",
      isCustom: entryDoorForm.type === 'custom',
      customDescription: entryDoorForm.type === 'custom' ? entryDoorForm.customDescription : undefined,
      quantity: 1
    };
    setWindowOptions(prev => ({
      ...prev,
      entryDoors: [...prev.entryDoors, newEntryDoor]
    }));
    
    // Reset form
    setEntryDoorForm({
      type: "3x68_solid",
      customDescription: '',
      selectedItem: ''
    });
  };

  // Add lean-to function
  const addLeanTo = () => {
    if (leanToForm.width && leanToForm.length && leanToForm.height) {
      const newLeanTo = {
        id: Date.now().toString(),
        width: parseFloat(leanToForm.width),
        length: parseFloat(leanToForm.length),
        height: parseFloat(leanToForm.height),
        hasWraparound: leanToForm.hasWraparound,
        quantity: 1
      };
      setWindowOptions(prev => ({
        ...prev,
        leanTos: [...prev.leanTos, newLeanTo]
      }));
      
      // Reset form
      setLeanToForm({
        width: '',
        length: '',
        height: '',
        hasWraparound: false
      });
    }
  };

  // Add window size function
  const addWindowSize = () => {
    if (windowForm.width && windowForm.height) {
      const newWindow = {
        id: Date.now().toString(),
        width: parseFloat(windowForm.width),
        height: parseFloat(windowForm.height),
        isDouble: windowForm.isDouble,
        quantity: 1
      };
      setWindowOptions(prev => ({
        ...prev,
        windows: [...prev.windows, newWindow]
      }));
      
      // Reset form
      setWindowForm({
        width: '',
        height: '',
        isDouble: false,
        selectedItem: ''
      });
    }
  };

  // Format phone number helper
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Use the statement data hook for calculations
  const {
    items,
    projectDetails,
    updateProjectDetails,
    autoCalculateQuantities,
    calculateTotal,
    formatNumber
  } = useStatementData(`enhanced-estimate-${lead.id}`, buildingType);

  // Function to recalculate base building prices when pitch or other structural options change
  const recalculateBaseBuildingPrices = (newPitch?: string, newGaragePitch?: string, newSecondBuildingPitch?: string, newWidth?: number, newLength?: number, newHeight?: number) => {
    // Use provided dimensions or fall back to current state
    const width = newWidth || parseFloat(dimensions.width || '0');
    const height = newHeight || parseFloat(dimensions.height || '0');
    const length = newLength || parseFloat(dimensions.length || '0');
    
    if (!width || !height || !length) return;
    
    if (width && height && length) {
      const currentPitch = newPitch || windowOptions.truss_pitch;
      const currentGaragePitch = newGaragePitch || windowOptions.garage_truss_pitch;
      const currentSecondBuildingPitch = newSecondBuildingPitch || windowOptions.second_building_truss_pitch;
      
      console.log('Recalculating base building prices with pitch:', currentPitch);
      
      // Calculate barndominium pricing with additional components
      if (buildingType === 'barndominium') {
        const items: EstimateLineItem[] = [];

        // First floor (main building)
        const firstFloorBasePrice = calculateBaseBuildingPrice(width, length, height, parseFloat(currentPitch.split('/')[0]));
        const marginMultiplier = 1 / (1 - marginPercentage / 100);
        const firstFloorPrice = firstFloorBasePrice * marginMultiplier;
        
        items.push({
          id: `base_building_first_floor_${Date.now()}`,
          category: 'Base Building',
          name: 'First Floor - Base Building Package',
          quantity: width * length,
          unit_price: firstFloorPrice / (width * length),
          total: firstFloorPrice,
          unit_type: 'sq ft'
        });

        // Second floor if specified
        if (dimensions.secondFloorSqFt) {
          const secondFloorSqFt = parseFloat(dimensions.secondFloorSqFt);
          if (secondFloorSqFt > 0) {
            const secondFloorBasePrice = 7 * secondFloorSqFt; // Just $7 per sq ft
            const secondFloorPrice = secondFloorBasePrice * marginMultiplier;
            
            items.push({
              id: `base_building_second_floor_${Date.now()}`,
              category: 'Base Building',
              name: 'Second Floor ($7/sq ft)',
              quantity: secondFloorSqFt,
              unit_price: secondFloorPrice / secondFloorSqFt,
              total: secondFloorPrice,
              unit_type: 'sq ft'
            });
          }
        }

        // Garage if specified
        if (dimensions.garageWidth && dimensions.garageLength && dimensions.garageHeight) {
          const garageWidth = parseFloat(dimensions.garageWidth);
          const garageLength = parseFloat(dimensions.garageLength);
          const garageHeight = parseFloat(dimensions.garageHeight);
          
          if (garageWidth > 0 && garageLength > 0 && garageHeight > 0) {
            const garageBasePrice = calculateBaseBuildingPrice(garageWidth, garageLength, garageHeight, parseFloat(currentGaragePitch.split('/')[0]));
            const garagePrice = garageBasePrice * marginMultiplier;
            const garageSqFt = garageWidth * garageLength;
            
            items.push({
              id: `base_building_garage_${Date.now()}`,
              category: 'Base Building',
              name: 'Garage - Base Building Package',
              quantity: garageSqFt,
              unit_price: garagePrice / garageSqFt,
              total: garagePrice,
              unit_type: 'sq ft'
            });
          }
        }

        console.log('Barndominium pricing recalculated:', items);
        
        setEstimateItems(prev => {
          const filtered = prev.filter(item => !item.id.startsWith('base_building_'));
          const newItems = [...items, ...filtered];
          console.log('Updated estimate items with recalculated pricing:', newItems);
          return newItems;
        });
      } else {
        // Standard building calculation
        const items: EstimateLineItem[] = [];
        const marginMultiplier = 1 / (1 - marginPercentage / 100);
        
        // Primary building
        const baseBuildingBasePrice = calculateBaseBuildingPrice(width, length, height, parseFloat(currentPitch.split('/')[0]));
        const baseBuildingPrice = baseBuildingBasePrice * marginMultiplier;
        
        items.push({
          id: `base_building_primary_${Date.now()}`,
          category: 'Base Building',
          name: 'Primary Building - Base Building Package',
          quantity: width * length,
          unit_price: baseBuildingPrice / (width * length),
          total: baseBuildingPrice,
          unit_type: 'sq ft'
        });

        // Second building if connected (for non-barndominium)
        if (windowOptions.connect_second_building && 
            windowOptions.second_building_width && 
            windowOptions.second_building_length && 
            windowOptions.second_building_height) {
          const secondWidth = parseFloat(windowOptions.second_building_width);
          const secondLength = parseFloat(windowOptions.second_building_length);
          const secondHeight = parseFloat(windowOptions.second_building_height);
          
          if (secondWidth > 0 && secondLength > 0 && secondHeight > 0) {
            const secondBuildingBasePrice = calculateBaseBuildingPrice(secondWidth, secondLength, secondHeight, parseFloat(currentSecondBuildingPitch.split('/')[0]));
            const secondBuildingPrice = secondBuildingBasePrice * marginMultiplier;
            const secondSqFt = secondWidth * secondLength;
            
            items.push({
              id: `base_building_second_${Date.now()}`,
              category: 'Base Building',
              name: 'Building 2 - Base Building Package',
              quantity: secondSqFt,
              unit_price: secondBuildingPrice / secondSqFt,
              total: secondBuildingPrice,
              unit_type: 'sq ft'
            });
          }
        }

        setEstimateItems(prev => {
          const filtered = prev.filter(item => !item.id.startsWith('base_building_'));
          const newItems = [...items, ...filtered];
          return newItems;
        });
      }
    }
  };

  // Auto-calculate base building cost when dimensions change
  useEffect(() => {
    if (dimensions.width && dimensions.height && dimensions.length && masterItems.length > 0) {
      const width = parseFloat(dimensions.width);
      const height = parseFloat(dimensions.height);
      const length = parseFloat(dimensions.length);

      if (width && height && length) {
        const sqft = width * length;
        
        updateProjectDetails({
          projectType: buildingType,
          width,
          length,
          height,
          sqft,
          finishedSqft: buildingType === 'barndominium' ? Math.floor(sqft * 0.6) : 0,
          unfinishedSqft: buildingType === 'barndominium' ? Math.floor(sqft * 0.4) : sqft,
          acres: 1,
          doors: windowOptions.garageDoors.length || 0,
          walkDoors: selectedOptions.includes('entry_doors') ? 1 : 0,
          kitchenCabinets: buildingType === 'barndominium' && selectedOptions.includes('kitchen') ? 20 : 0,
          bathrooms: buildingType === 'barndominium' && selectedOptions.includes('bathrooms') ? 2 : 0,
          floors: 1
        });

        // Calculate barndominium pricing with additional components
        if (buildingType === 'barndominium') {
          const items: EstimateLineItem[] = [];

          // First floor (main building)
          const firstFloorBasePrice = calculateBaseBuildingPrice(width, length, height, parseFloat(windowOptions.truss_pitch.split('/')[0]));
          const marginMultiplier = 1 / (1 - marginPercentage / 100);
          const firstFloorPrice = firstFloorBasePrice * marginMultiplier;
          
          items.push({
            id: `base_building_first_floor_${Date.now()}`,
            category: 'Base Building',
            name: 'First Floor - Base Building Package',
            quantity: sqft,
            unit_price: firstFloorPrice / sqft,
            total: firstFloorPrice,
            unit_type: 'sq ft'
          });

          // Second floor if specified
          if (dimensions.secondFloorSqFt) {
            const secondFloorSqFt = parseFloat(dimensions.secondFloorSqFt);
            if (secondFloorSqFt > 0) {
              const secondFloorBasePrice = 7 * secondFloorSqFt; // Just $7 per sq ft
              const secondFloorPrice = secondFloorBasePrice * marginMultiplier;
              
              items.push({
                id: `base_building_second_floor_${Date.now()}`,
                category: 'Base Building',
                name: 'Second Floor ($7/sq ft)',
                quantity: secondFloorSqFt,
                unit_price: secondFloorPrice / secondFloorSqFt,
                total: secondFloorPrice,
                unit_type: 'sq ft'
              });
            }
          }

          // Garage if specified
          if (dimensions.garageWidth && dimensions.garageLength && dimensions.garageHeight) {
            const garageWidth = parseFloat(dimensions.garageWidth);
            const garageLength = parseFloat(dimensions.garageLength);
            const garageHeight = parseFloat(dimensions.garageHeight);
            
            if (garageWidth > 0 && garageLength > 0 && garageHeight > 0) {
              const garageBasePrice = calculateBaseBuildingPrice(garageWidth, garageLength, garageHeight, parseFloat(windowOptions.garage_truss_pitch.split('/')[0]));
              const garagePrice = garageBasePrice * marginMultiplier;
              const garageSqFt = garageWidth * garageLength;
              
              items.push({
                id: `base_building_garage_${Date.now()}`,
                category: 'Base Building',
                name: 'Garage - Base Building Package',
                quantity: garageSqFt,
                unit_price: garagePrice / garageSqFt,
                total: garagePrice,
                unit_type: 'sq ft'
              });
            }
          }

          console.log('Barndominium pricing calculated:', items);
          
          setEstimateItems(prev => {
            const filtered = prev.filter(item => !item.id.startsWith('base_building_'));
            const newItems = [...items, ...filtered];
            console.log('Updated estimate items with barndominium pricing:', newItems);
            return newItems;
          });
        } else {
          // Standard building calculation
          const items: EstimateLineItem[] = [];
          const marginMultiplier = 1 / (1 - marginPercentage / 100);
          
          // Primary building
          const baseBuildingBasePrice = calculateBaseBuildingPrice(width, length, height, parseFloat(windowOptions.truss_pitch.split('/')[0]));
          const baseBuildingPrice = baseBuildingBasePrice * marginMultiplier;
          
          items.push({
            id: `base_building_primary_${Date.now()}`,
            category: 'Base Building',
            name: 'Primary Building - Base Building Package',
            quantity: sqft,
            unit_price: baseBuildingPrice / sqft,
            total: baseBuildingPrice,
            unit_type: 'sq ft'
          });

          // Second building if connected (for non-barndominium)
          if (windowOptions.connect_second_building && 
              windowOptions.second_building_width && 
              windowOptions.second_building_length && 
              windowOptions.second_building_height) {
            const secondWidth = parseFloat(windowOptions.second_building_width);
            const secondLength = parseFloat(windowOptions.second_building_length);
            const secondHeight = parseFloat(windowOptions.second_building_height);
            
            if (secondWidth > 0 && secondLength > 0 && secondHeight > 0) {
              const secondBuildingBasePrice = calculateBaseBuildingPrice(secondWidth, secondLength, secondHeight, parseFloat(windowOptions.second_building_truss_pitch.split('/')[0]));
              const secondBuildingPrice = secondBuildingBasePrice * marginMultiplier;
              const secondSqFt = secondWidth * secondLength;
              
              items.push({
                id: `base_building_second_${Date.now()}`,
                category: 'Base Building',
                name: 'Building 2 - Base Building Package',
                quantity: secondSqFt,
                unit_price: secondBuildingPrice / secondSqFt,
                total: secondBuildingPrice,
                unit_type: 'sq ft'
              });
            }
          }

          setEstimateItems(prev => {
            const filtered = prev.filter(item => !item.id.startsWith('base_building_'));
            const newItems = [...items, ...filtered];
            return newItems;
          });
        }
        
        // Auto-calculate all relevant master pricing items
        autoCalculateAllPricingItems();
      }
    }
  }, [buildingType, windowOptions.garageDoors.length, windowOptions.connect_second_building, windowOptions.second_building_width, windowOptions.second_building_length, windowOptions.second_building_height, updateProjectDetails]);

  // Helper function to add moisture barrier items if premium is selected
  const addMoistureBarrierItems = (itemsArray: EstimateLineItem[], formulaDimensions: FormulaDimensions) => {
    const { width, length, roofArea } = formulaDimensions;
    if (!width || !length || !roofArea) return;

     // Only add pricing for premium moisture barrier (standard is included in base pricing)
     console.log('Moisture barrier check:', windowOptions.moisture_barrier, 'Should add premium?', windowOptions.moisture_barrier === 'premium');
     if (windowOptions.moisture_barrier === 'premium') {
       const dripXItem = masterItems.find(item => 
         item.name.toLowerCase().includes('dripx') || 
         (item.name.toLowerCase().includes('moisture') && item.name.toLowerCase().includes('premium'))
       );
       
       if (dripXItem && !itemsArray.some(existing => existing.id.includes('moisture_barrier_premium'))) {
         const calculatedItem: EstimateLineItem = {
           id: `moisture_barrier_premium_${Date.now()}`,
           category: dripXItem.category?.name || 'Moisture Barrier',
           name: 'Premium DripX Moisture Barrier Upgrade',
           quantity: roofArea,
           unit_price: dripXItem.base_price,
           total: (roofArea * dripXItem.base_price) * (1 / (1 - marginPercentage / 100)), // Apply margin to match UI display
           unit_type: 'roof sq ft'
         };
         itemsArray.push(calculatedItem);
       }
    }

    // Only add premium garage moisture barrier pricing (standard is included in base pricing)
    if (buildingType === 'barndominium' && windowOptions.garage_moisture_barrier === 'premium') {
      const garageRoofArea = formulaDimensions.garageRoofArea || 0;
      
      if (garageRoofArea > 0) {
        const dripXItem = masterItems.find(item => 
          item.name.toLowerCase().includes('dripx') || 
          (item.name.toLowerCase().includes('moisture') && item.name.toLowerCase().includes('premium'))
        );
        
        if (dripXItem && !itemsArray.some(existing => existing.id.includes('garage_moisture_barrier_premium'))) {
          const calculatedItem: EstimateLineItem = {
            id: `garage_moisture_barrier_premium_${Date.now()}`,
            category: dripXItem.category?.name || 'Moisture Barrier',
            name: 'Garage - Premium DripX Moisture Barrier',
            quantity: garageRoofArea,
            unit_price: dripXItem.base_price,
            total: garageRoofArea * dripXItem.base_price,
            unit_type: 'roof sq ft'
          };
          itemsArray.push(calculatedItem);
        }
      }
    }

    // Only add premium second building moisture barrier pricing (standard is included in base pricing)
    if (windowOptions.connect_second_building && windowOptions.second_building_moisture_barrier === 'premium') {
      const secondWidth = parseFloat(windowOptions.second_building_width) || 0;
      const secondLength = parseFloat(windowOptions.second_building_length) || 0;
      const secondPitchString = windowOptions.second_building_truss_pitch || '4/12';
      const [secondRise, secondRun] = secondPitchString.split('/').map(Number);
      
      if (secondWidth > 0 && secondLength > 0) {
        const secondBaseArea = secondWidth * secondLength;
        const secondPitchFactor = Math.sqrt(1 + Math.pow(secondRise / secondRun, 2));
        const secondRoofArea = secondBaseArea * secondPitchFactor;
        
        const dripXItem = masterItems.find(item => 
          item.name.toLowerCase().includes('dripx') || 
          (item.name.toLowerCase().includes('moisture') && item.name.toLowerCase().includes('premium'))
        );
        
        if (dripXItem && !itemsArray.some(existing => existing.id.includes('second_building_moisture_barrier_premium'))) {
          const calculatedItem: EstimateLineItem = {
            id: `second_building_moisture_barrier_premium_${Date.now()}`,
            category: dripXItem.category?.name || 'Moisture Barrier',
            name: 'Second Building - Premium DripX Moisture Barrier',
            quantity: secondRoofArea,
            unit_price: dripXItem.base_price,
            total: secondRoofArea * dripXItem.base_price,
            unit_type: 'roof sq ft'
          };
          itemsArray.push(calculatedItem);
        }
      }
    }
  };

  // Auto-calculate all pricing items based on selections and master pricing
  const autoCalculateAllPricingItems = () => {
    if (!dimensions.width || !dimensions.length || masterItems.length === 0) return;
    
    const formulaDimensions = getFormulaDimensions();
    console.log('Auto-calculating all pricing items with dimensions:', formulaDimensions);
    
     // Clear existing non-base items and premium moisture barrier items, then recalculate
     setEstimateItems(prev => {
       const baseItems = prev.filter(item => 
         item.id.startsWith('base_building_') && 
         !item.id.includes('concrete') &&
         !item.id.includes('moisture_barrier_premium') && // Only remove premium moisture barrier items, not all moisture items
         !item.name.toLowerCase().includes('concrete')
       );
      const newItems = [...baseItems];
      
      // Add items based on selected options
      selectedOptions.forEach(optionId => {
        addItemsForOption(optionId, newItems, formulaDimensions);
      });
      
      // Add items for window configurations
      addWindowItems(newItems, formulaDimensions);
      
      // Add items for garage doors
      addGarageDoorItems(newItems, formulaDimensions);
      
      // Add items for entry doors
      addEntryDoorItems(newItems, formulaDimensions);
      
      // Add items for lean-tos
      addLeanToItems(newItems, formulaDimensions);
      
      // Add site plan items based on selection
      addSitePlanItems(newItems, formulaDimensions);
      
  // Add post upgrade items if needed
  addPostUpgradeItems(newItems, formulaDimensions);
  
  // Add moisture barrier items if premium is selected
  addMoistureBarrierItems(newItems, formulaDimensions);
      
      // Add concrete items directly to newItems array - only if thicknesses are selected
      addConcreteItems(newItems, formulaDimensions);
      
      console.log('Auto-calculated items:', newItems);
      return newItems;
    });
    
    // Force UI re-render
    setRenderKey(prev => prev + 1);
  };

  // Helper function to add items for a specific option
  const addItemsForOption = (optionId: string, itemsArray: EstimateLineItem[], formulaDimensions: FormulaDimensions) => {
    const relevantItems = masterItems.filter(item => {
      switch (optionId) {
        case 'concrete_pad':
          return item.name.toLowerCase().includes('concrete') || 
                 item.name.toLowerCase().includes('foundation') ||
                 item.name.toLowerCase().includes('slab');
        case 'electrical':
          return item.category?.name.toLowerCase().includes('electric');
        case 'plumbing':
          return item.category?.name.toLowerCase().includes('plumb');
        case 'insulation':
          return item.name.toLowerCase().includes('insulation');
        case 'site_plan_standard':
          return item.category?.name.toLowerCase().includes('site') &&
                 item.name.toLowerCase().includes('standard') &&
                 item.name.toLowerCase().includes('site') &&
                 item.name.toLowerCase().includes('plan');
        case 'site_plan_lines_and_grade':
          return item.category?.name.toLowerCase().includes('site') &&
                 item.name.toLowerCase().includes('lines') &&
                 item.name.toLowerCase().includes('grades');
        case 'site_plan_upgraded_lines_and_grade':
          return item.category?.name.toLowerCase().includes('site') &&
                 item.name.toLowerCase().includes('upgraded') &&
                 item.name.toLowerCase().includes('lines') &&
                 item.name.toLowerCase().includes('grades');
        case 'flooring':
          return item.category?.name.toLowerCase().includes('flooring');
        case 'interior_finish':
          return item.name.toLowerCase().includes('drywall') || 
                 item.name.toLowerCase().includes('paint') ||
                 item.name.toLowerCase().includes('trim');
        case 'hvac':
          return item.category?.name.toLowerCase().includes('hvac') ||
                 item.name.toLowerCase().includes('heating') ||
                 item.name.toLowerCase().includes('cooling');
        case 'metal_roof':
          return item.name.toLowerCase().includes('roof') && 
                 item.name.toLowerCase().includes('metal');
        case 'wainscoting':
          return item.name.toLowerCase().includes('wainscoting') || 
                 item.name.toLowerCase().includes('metal wainscoting');
        case 'greenposts':
          return item.name.toLowerCase().includes('green') && 
                 item.name.toLowerCase().includes('post');
        default:
          return false;
      }
    });
    
    relevantItems.forEach(item => {
      const calculatedItem = calculateMasterItem(item, formulaDimensions);
      if (calculatedItem && !itemsArray.some(existing => existing.id.includes(item.id))) {
        itemsArray.push(calculatedItem);
      }
    });
  };

  // Helper function to add window items
  const addWindowItems = (itemsArray: EstimateLineItem[], formulaDimensions: FormulaDimensions) => {
    if (windowOptions.windows.length === 0) return;
    
    const windowItems = masterItems.filter(item => 
      item.name.toLowerCase().includes('window')
    );
    
    windowItems.forEach(item => {
      const totalWindows = windowOptions.windows.reduce((sum, w) => sum + w.quantity, 0);
      if (totalWindows > 0) {
        const calculatedItem = calculateMasterItem(item, formulaDimensions, totalWindows);
        if (calculatedItem && !itemsArray.some(existing => existing.id.includes(item.id))) {
          itemsArray.push(calculatedItem);
        }
      }
    });
  };

  // Helper function to add garage door items
  const addGarageDoorItems = (itemsArray: EstimateLineItem[], formulaDimensions: FormulaDimensions) => {
    if (windowOptions.garageDoors.length === 0) return;
    
    // Only add pricing for specifically selected garage door types
    windowOptions.garageDoors.forEach(door => {
      const selectedItem = masterItems.find(item => item.id === door.selectedItemId);
      if (selectedItem && door.quantity > 0) {
        const calculatedItem = calculateMasterItem(selectedItem, formulaDimensions, door.quantity);
        if (calculatedItem && !itemsArray.some(existing => existing.id.includes(selectedItem.id))) {
          itemsArray.push(calculatedItem);
        }
      }
    });
  };

  // Helper function to add entry door items
  const addEntryDoorItems = (itemsArray: EstimateLineItem[], formulaDimensions: FormulaDimensions) => {
    if (windowOptions.entryDoors.length === 0) return;
    
    // Only add pricing for specifically selected entry door types based on their type/description
    windowOptions.entryDoors.forEach(door => {
      let searchTerms = [];
      
      // Map door types to search terms in master pricing
      switch(door.type) {
        case '3x68_solid':
          searchTerms = ['3\'x6\'8"', 'solid', 'entry'];
          break;
        case '3x68_9lite':
          searchTerms = ['3\'x6\'8"', '9-lite', 'entry'];
          break;
        case '6x68_solid':
          searchTerms = ['6\'x6\'8"', 'solid', 'entry'];
          break;
        case '6x68_9lite':
          searchTerms = ['6\'x6\'8"', '9-lite', 'entry'];
          break;
        case '6_glass_sliding':
          searchTerms = ['6\'', 'glass', 'sliding', 'door'];
          break;
        case 'custom':
          // For custom doors, look for generic entry door items
          searchTerms = ['entry', 'door'];
          break;
      }
      
      if (searchTerms.length > 0) {
        const matchingItem = masterItems.find(item => 
          searchTerms.every(term => 
            item.name.toLowerCase().includes(term.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(term.toLowerCase()))
          )
        );
        
        if (matchingItem && door.quantity > 0) {
          const calculatedItem = calculateMasterItem(matchingItem, formulaDimensions, door.quantity);
          if (calculatedItem && !itemsArray.some(existing => existing.id.includes(matchingItem.id))) {
            itemsArray.push(calculatedItem);
          }
        }
      }
    });
  };

  // Helper function to add lean-to items
  const addLeanToItems = (itemsArray: EstimateLineItem[], formulaDimensions: FormulaDimensions) => {
    if (windowOptions.leanTos.length === 0) return;
    
    const leanToItems = masterItems.filter(item => 
      item.name.toLowerCase().includes('lean') || item.name.toLowerCase().includes('addition')
    );
    
    leanToItems.forEach(item => {
      const totalLeanTos = windowOptions.leanTos.reduce((sum, l) => sum + l.quantity, 0);
      if (totalLeanTos > 0) {
        const calculatedItem = calculateMasterItem(item, formulaDimensions, totalLeanTos);
        if (calculatedItem && !itemsArray.some(existing => existing.id.includes(item.id))) {
          itemsArray.push(calculatedItem);
        }
      }
    });
  };

  // Helper function to add concrete items to the items array
  const addConcreteItems = (itemsArray: EstimateLineItem[], formulaDimensions: FormulaDimensions) => {
    // Concrete pricing has been disabled - checkboxes are for display only
    return;
  };

  // Helper function to add site plan items
  const addSitePlanItems = (itemsArray: EstimateLineItem[], formulaDimensions: FormulaDimensions) => {
    console.log('addSitePlanItems called with site_plan:', windowOptions.site_plan);
    
    // Always remove any existing site plan items first
    const filteredItems = itemsArray.filter(item => item.category !== 'Site Plans');
    itemsArray.length = 0;
    itemsArray.push(...filteredItems);
    
    if (windowOptions.site_plan === 'none' || !windowOptions.site_plan) {
      console.log('Site plan set to none - no site plan items will be added');
      return;
    }
   
   // Find the appropriate site plan item from master pricing based on selection
   let targetItem = null;
   if (windowOptions.site_plan === 'standard') {
     targetItem = masterItems.find(item => 
       item.category?.name.toLowerCase().includes('site') &&
       item.name.toLowerCase().includes('standard') &&
       item.name.toLowerCase().includes('site') &&
       item.name.toLowerCase().includes('plan')
     );
   } else if (windowOptions.site_plan === 'lines_and_grade') {
     targetItem = masterItems.find(item => 
       item.category?.name.toLowerCase().includes('site') &&
       item.name.toLowerCase().includes('lines') &&
       item.name.toLowerCase().includes('grades') &&
       !item.name.toLowerCase().includes('upgraded')
     );
   } else if (windowOptions.site_plan === 'upgraded_lines_and_grade') {
     targetItem = masterItems.find(item => 
       item.category?.name.toLowerCase().includes('site') &&
       item.name.toLowerCase().includes('upgraded') &&
       item.name.toLowerCase().includes('lines') &&
       item.name.toLowerCase().includes('grades')
     );
   }
    
     console.log('Found target item for site plan:', targetItem);
     
     if (targetItem) {
       // Calculate the marginalized price (same as shown in UI)
       const basePrice = targetItem.base_price;
       const marginAmount = (basePrice * marginPercentage) / 100;
       const marginalizedPrice = basePrice + marginAmount;
       
       const siteplanItem: EstimateLineItem = {
         id: `${targetItem.id}_${Date.now()}`,
         category: targetItem.category?.name || 'Site Plans',
         name: targetItem.name,
         quantity: 1,
         unit_price: marginalizedPrice, // Use marginalized price to match UI
         total: marginalizedPrice,
         unit_type: targetItem.unit_type,
         has_formula: targetItem.has_formula,
         formula_type: targetItem.formula_type,
         formula_result: null
       };
       
       console.log('Added site plan item with margin already applied:', siteplanItem);
       if (!itemsArray.some(existing => existing.id.includes(targetItem.id))) {
         itemsArray.push(siteplanItem);
         console.log('Site plan item added - margin already included, no additional margin needed');
       } else {
         console.log('Site plan item already exists');
       }
     }
  };

  // Helper function to add post upgrade items if needed
  const addPostUpgradeItems = (itemsArray: EstimateLineItem[], formulaDimensions: FormulaDimensions) => {
    const { width, length, height, roof_pitch } = formulaDimensions;
    if (!width || !length || !height || !roof_pitch) return;

    const primaryInputs = { building_width: width, building_length: length, building_height: height, roof_pitch };
    const primaryResult = PostCalculationService.getPostCalculationResult(primaryInputs, masterItems);
    
    if (primaryResult.isUpgrade) {
      const { lineItem } = PostCalculationService.calculatePostUpgradeCost(primaryResult);
      if (lineItem && !itemsArray.some(existing => existing.id.startsWith('post_upgrade_primary'))) {
        lineItem.id = `post_upgrade_primary_${Date.now()}`;
        lineItem.name = `Primary Building - ${lineItem.name}`;
        itemsArray.push(lineItem);
      }
    }
  };


  // Calculate master item with proper formula and dimensions
  const calculateMasterItem = (masterItem: PricingItemWithCategory, formulaDimensions: FormulaDimensions, customQuantity?: number): EstimateLineItem | null => {
    let quantity = customQuantity || 1;
    let unitPrice = masterItem.base_price;
    let total = unitPrice;
    let formulaResult: FormulaResult | undefined;

    // Check if item has formula and calculate if so
    if (masterItem.has_formula && masterItem.formula_type) {
      const calculated = FormulaService.calculatePrice(masterItem, formulaDimensions);
      if (calculated) {
        quantity = calculated.quantity;
        unitPrice = calculated.calculatedPrice;
        total = calculated.totalPrice;
        formulaResult = calculated;
      }
    } else if (masterItem.unit_type === 'sq ft') {
      // For items with sq ft unit type but no specific formula, use building square footage
      quantity = formulaDimensions.width * formulaDimensions.length;
      total = quantity * unitPrice;
    } else if (customQuantity) {
      // Use custom quantity for specific items like windows, doors, etc.
      quantity = customQuantity;
      total = quantity * unitPrice;
    }

    return {
      id: `${masterItem.id}_${Date.now()}`,
      category: masterItem.category?.name || 'Uncategorized',
      name: masterItem.name,
      quantity,
      unit_price: unitPrice,
      total,
      unit_type: masterItem.unit_type,
      has_formula: masterItem.has_formula,
      formula_type: masterItem.formula_type,
      formula_result: formulaResult
    };
  };

  // Note: Removed auto-recalculation on option changes since we now handle this in handleOptionChange

  // Note: Removed auto-recalculation on building config changes since we now handle this through specific handlers

  // Note: Removed auto-recalculation on building type changes since we now handle this through specific handlers

  // Removed conflicting calculateBaseBuildingCost calls - now using direct base building price calculation

  // Moved calculateBaseBuildingCost function after getFormulaDimensions

  // Recalculate existing items that use square footage when dimensions change
  const recalculateSquareFootageItems = () => {
    if (!dimensions.width || !dimensions.length) return;
    
    const formulaDimensions = getFormulaDimensions();
    const newSqft = formulaDimensions.width * formulaDimensions.length;
    
    setEstimateItems(prev => prev.map(item => {
      // Only recalculate non-base items with sq ft unit type that don't have formulas
      if (!item.id.startsWith('base_') && item.unit_type === 'sq ft' && !item.has_formula) {
        const newTotal = newSqft * item.unit_price;
        console.log(`Recalculating ${item.name}: ${item.quantity} -> ${newSqft} sq ft, total: ${item.total} -> ${newTotal}`);
        return {
          ...item,
          quantity: newSqft,
          total: newTotal
        };
      }
      return item;
    }));
  };
  useEffect(() => {
    setWindowOptions(prev => ({
      ...prev,
      truss_spacing: buildingType === 'barndominium' ? '2' : '4',
      truss_pitch: buildingType === 'barndominium' ? '6/12' : '4/12'
    }));
    
    // Set default margin based on building type
    if (buildingType === 'barndominium') {
      setMarginPercentage(20);
    } else if (buildingType === 'residential_garage') {
      setMarginPercentage(25);
    } else if (buildingType === 'commercial') {
      setMarginPercentage(20);
    }
  }, [buildingType]);

  // Recalculate base building prices when margin percentage changes
  useEffect(() => {
    if (dimensions.width && dimensions.length && dimensions.height && marginPercentage > 0) {
      const width = parseFloat(dimensions.width);
      const length = parseFloat(dimensions.length);
      const height = parseFloat(dimensions.height);
      
      if (width > 0 && length > 0 && height > 0) {
        recalculateBaseBuildingPrices();
      }
    }
  }, [marginPercentage]);

  // Ensure moisture barrier defaults to standard on component mount
  useEffect(() => {
    if (!windowOptions.moisture_barrier || windowOptions.moisture_barrier === 'premium') {
      setWindowOptions(prev => ({ 
        ...prev, 
        moisture_barrier: 'standard',
        garage_moisture_barrier: 'standard',
        second_building_moisture_barrier: 'standard'
      }));
    }
  }, []);

  // Load previous estimates and master pricing when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadPreviousEstimates();
      loadMasterPricing();
    } else {
      // Clean up state when dialog closes to prevent freeze
      setShowPlumbingCalculator(false);
      setEditingVersionName(null);
      setPricingExpanded(false);
      setWindowsExpanded(false);
    }
  }, [isOpen]);

  const loadMasterPricing = async () => {
    try {
      const [categoriesData, itemsData] = await Promise.all([
        pricingService.getCategories(),
        pricingService.getItems()
      ]);
      setCategories(categoriesData);
      setMasterItems(itemsData);
    } catch (error) {
      console.error('Error loading master pricing:', error);
      toast({
        title: "Error",
        description: "Failed to load pricing data",
        variant: "destructive"
      });
    }
  };

  const loadPreviousEstimates = async () => {
    try {
      setLoadingEstimates(true);
      console.log('Loading previous estimates for lead:', lead.id);
      const estimates = await estimatesService.getEstimatesByLead(lead.id);
      console.log('Raw estimates from service:', estimates);
      console.log('First estimate detailed:', estimates[0]);
      if (estimates[0]) {
        console.log('First estimate price type:', typeof estimates[0].estimated_price);
        console.log('First estimate price value:', estimates[0].estimated_price);
      }
      setPreviousEstimates(estimates);
    } catch (error) {
      console.error('Error loading previous estimates:', error);
    } finally {
      setLoadingEstimates(false);
    }
  };

  // Helper function to parse dimensions from string format
  const parseDimensions = (dimensionString: string): FormulaDimensions => {
    const dims = dimensionString.split('x').map(d => parseFloat(d.replace(/'/g, '').trim()));
    return {
      width: dims[0] || 0,
      length: dims[1] || 0,
      height: dims[2] || parseFloat(dimensions.height || '12')
    };
  };

  // Helper function to get formula dimensions from current form data
  const getFormulaDimensions = (): FormulaDimensions => {
    const width = parseFloat(dimensions.width) || 0;
    const length = parseFloat(dimensions.length) || 0;
    const height = parseFloat(dimensions.height) || 12;
    
    // Parse pitch (e.g., "4/12" -> rise=4, run=12)
    const pitchParts = windowOptions.truss_pitch.split('/');
    const rise = parseFloat(pitchParts[0]) || 4;
    const run = parseFloat(pitchParts[1]) || 12;
    
    // Calculate proper roof area using pitch
    // Roof area = base area * sqrt(1 + (rise/run)^2)
    const baseArea = width * length;
    const pitchFactor = Math.sqrt(1 + Math.pow(rise / run, 2));
    const roofArea = baseArea * pitchFactor;
    
    // Handle second building dimensions (garage for barndominiums, second building for others)
    let totalRoofArea = roofArea;
    let totalPerimeter = (width * 2) + (length * 2);
    let garageWidth = 0;
    let garageLength = 0;
    let garageHeight = 0;
    let garageRoofArea = 0;
    let garagePitch = rise;

    // For barndominiums - use garage dimensions
    if (buildingType === 'barndominium' && dimensions.garageWidth && dimensions.garageLength && dimensions.garageHeight) {
      garageWidth = parseFloat(dimensions.garageWidth) || 0;
      garageLength = parseFloat(dimensions.garageLength) || 0;
      garageHeight = parseFloat(dimensions.garageHeight) || 12;
      
      // Parse garage pitch
      const garagePitchParts = windowOptions.garage_truss_pitch.split('/');
      const garageRise = parseFloat(garagePitchParts[0]) || 4;
      const garageRun = parseFloat(garagePitchParts[1]) || 12;
      garagePitch = garageRise;
      
      // Calculate garage roof area
      const garageBaseArea = garageWidth * garageLength;
      const garagePitchFactor = Math.sqrt(1 + Math.pow(garageRise / garageRun, 2));
      garageRoofArea = garageBaseArea * garagePitchFactor;
      
      // Add garage to totals
      totalRoofArea += garageRoofArea;
      totalPerimeter += (garageWidth * 2) + (garageLength * 2);
    }
    // For non-barndominiums with second building connection
    else if (buildingType !== 'barndominium' && windowOptions.connect_second_building && 
             windowOptions.second_building_width && windowOptions.second_building_length) {
      garageWidth = parseFloat(windowOptions.second_building_width) || 0;
      garageLength = parseFloat(windowOptions.second_building_length) || 0;
      garageHeight = parseFloat(windowOptions.second_building_height) || 12;
      
      // Parse second building pitch
      const secondBuildingPitchParts = windowOptions.second_building_truss_pitch.split('/');
      const secondBuildingRise = parseFloat(secondBuildingPitchParts[0]) || 4;
      const secondBuildingRun = parseFloat(secondBuildingPitchParts[1]) || 12;
      garagePitch = secondBuildingRise;
      
      // Calculate second building roof area
      const secondBuildingBaseArea = garageWidth * garageLength;
      const secondBuildingPitchFactor = Math.sqrt(1 + Math.pow(secondBuildingRise / secondBuildingRun, 2));
      garageRoofArea = secondBuildingBaseArea * secondBuildingPitchFactor;
      
      // Add second building to totals
      totalRoofArea += garageRoofArea;
      totalPerimeter += (garageWidth * 2) + (garageLength * 2);
    }
    
    console.log('Formula dimensions calculation:', { 
      width, length, height, rise, roofArea, 
      garageWidth, garageLength, garageHeight, garageRoofArea,
      totalRoofArea, totalPerimeter 
    });
    
    return {
      width,
      length,
      height,
      pitch: rise, // Just the rise value for formula calculations
      roofArea: roofArea,
      garageWidth,
      garageLength,
      garageHeight,
      garagePitch,
      garageRoofArea,
      totalRoofArea, // Always return the calculated total (either single building or with second building)
      totalPerimeter // Always return the calculated total (either single building or with second building)
    };
  };

  // Calculate base building price using the same formula as the master pricing calculator
  const calculateBaseBuildingPrice = (width: number, length: number, height: number, pitch?: number): number => {
    const B2 = width;   // B2 is width (as in the spreadsheet)
    const B3 = length;  // B3 is length (as in the spreadsheet)
    const B4 = height;  // B4 is height
    const B5 = pitch || parseFloat(windowOptions.truss_pitch.split('/')[0]) || 4;   // B5 is roof pitch

    const pricePerSqFt = 
      -108 +
      (2.566461 * B2) +
      (0.003432 * B3) +
      (0.466366 * B4) +
      (1675.96798 / B2) +
      (189.909144 / B3) -
      (0.003643 * B2 * B4) -
      (0.001466 * B3 * B4) +
      (0.672221 * (B5 - 4)) -
      (6.56163 * (B5 - 4) / B2) +
      (5.930883 * (B5 - 4) / B3) +
      (0.000142 * B2 * B3) -
      (0.018508 * B2 * B2) +
      (0.000051 * B3 * B3);

    const totalSqFt = width * length;
    const totalPrice = Math.max(0, pricePerSqFt) * totalSqFt; // Ensure non-negative price
    
    console.log('calculateBaseBuildingPrice called with:', { width, length, height, pitch: B5 });
    console.log('Calculated price per sq ft:', Math.max(0, pricePerSqFt), 'Total price:', totalPrice);
    
    return totalPrice;
  };
  const calculateBaseBuildingCost = () => {
    console.log('Calculating base building cost...', { masterItems: masterItems.length, buildingType });
    
    if (masterItems.length === 0) {
      console.log('No master items loaded yet');
      return;
    }

    const formulaDimensions = getFormulaDimensions();
    console.log('Formula dimensions:', formulaDimensions);
    
    const newEstimateItems: EstimateLineItem[] = [];

    // Only include essential structural items automatically - concrete and site prep should be optional add-ons
    const structuralKeywords = buildingType === 'residential_garage' 
      ? ['Steel Frame', 'Metal Roof', 'Metal Siding', 'Building Shell', 'Structure']
      : ['Steel Frame', 'Metal Roof', 'Metal Siding', 'Building Shell', 'Structure'];

    console.log('Looking for items with keywords:', structuralKeywords);

    // Find and calculate essential building items
    masterItems.forEach(item => {
      const shouldInclude = structuralKeywords.some(keyword => 
        item.name.toLowerCase().includes(keyword.toLowerCase()) || 
        (item.description && item.description.toLowerCase().includes(keyword.toLowerCase()))
      );

      if (shouldInclude) {
        console.log('Including item:', item.name, item);
        
        let quantity = 1;
        let unitPrice = item.base_price;
        let total = unitPrice;
        let formulaResult: FormulaResult | undefined;

        // Calculate using formula if available
        if (item.has_formula && item.formula_type) {
          console.log('Calculating formula for:', item.name, item.formula_type);
          const calculated = FormulaService.calculatePrice(item, formulaDimensions);
          if (calculated) {
            quantity = calculated.quantity;
            unitPrice = calculated.calculatedPrice;
            total = calculated.totalPrice;
            formulaResult = calculated;
            console.log('Formula result:', calculated);
          }
        } else {
          // For non-formula items, calculate based on square footage if appropriate
          if (item.unit_type === 'sq ft') {
            quantity = formulaDimensions.width * formulaDimensions.length;
            total = quantity * unitPrice;
            console.log(`Base building sq ft calculation for ${item.name}:`, { 
              width: formulaDimensions.width, 
              length: formulaDimensions.length, 
              quantity, 
              unitPrice, 
              total 
            });
          }
        }

        const newItem: EstimateLineItem = {
          id: `base_${item.id}_${Date.now()}`,
          category: item.category?.name || 'Structure',
          name: item.name,
          quantity,
          unit_price: unitPrice,
          total,
          unit_type: item.unit_type,
          has_formula: item.has_formula,
          formula_type: item.formula_type,
          formula_result: formulaResult
        };

        newEstimateItems.push(newItem);
      }
    });

    console.log('New estimate items:', newEstimateItems);

    // Replace existing base items with newly calculated ones
    setEstimateItems(prev => {
      const nonBaseItems = prev.filter(item => !item.id.startsWith('base_'));
      const result = [...nonBaseItems, ...newEstimateItems];
      console.log('Updated estimate items:', result);
      return result;
    });
  };

  // Filter items based on building type and exclude Posts and Site Plans
  const getFilteredCategories = () => {
    const baseFilters = ['Posts', 'Site Plans', 'Site Plan']; // Remove posts and site plan categories
    
    // Define the specific order for categories
    const categoryOrder = [
      'Building Shell Addons',
      'Truss Upgrades', 
      'Roofing',
      'Siding',
      'Windows',
      'Entry Doors',
      'Garage Doors',
      'Concrete',
      'Foundation',
      'Electric Packages',
      'Insulation',
      'Interior Finishes',
      'Stairs',
      'Horse Barns'
    ];
    
    let filteredCategories;
    
    if (buildingType === 'residential_garage') {
      // For residential garage: include Electric Packages, exclude Mechanicals and Flooring
      filteredCategories = categories.filter(cat => 
        !baseFilters.some(filter => cat.name.toLowerCase().includes(filter.toLowerCase())) &&
        cat.name !== 'Mechanicals' &&
        cat.name !== 'Flooring'
      );
    } else if (buildingType === 'barndominium' || buildingType === 'commercial') {
      // For barndominium and commercial: exclude Electric Packages, include Flooring
      filteredCategories = categories.filter(cat => 
        !baseFilters.some(filter => cat.name.toLowerCase().includes(filter.toLowerCase())) &&
        cat.name !== 'Electric Packages'
      );
    } else {
      filteredCategories = categories.filter(cat => 
        !baseFilters.some(filter => cat.name.toLowerCase().includes(filter.toLowerCase()))
      );
    }

    // Sort categories according to the specified order
    return filteredCategories.sort((a, b) => {
      const aIndex = categoryOrder.findIndex(order => 
        a.name.toLowerCase().includes(order.toLowerCase()) || 
        order.toLowerCase().includes(a.name.toLowerCase())
      );
      const bIndex = categoryOrder.findIndex(order => 
        b.name.toLowerCase().includes(order.toLowerCase()) || 
        order.toLowerCase().includes(b.name.toLowerCase())
      );
      
      // If both have order positions, sort by position
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // If only one has order position, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // If neither has order position, sort alphabetically
      return a.name.localeCompare(b.name);
    });
  };

  const getFilteredItems = (categoryId: string) => {
    const categoryItems = masterItems.filter(item => item.category_id === categoryId);
    
    // Get the category to check its name
    const category = categories.find(cat => cat.id === categoryId);
    
    // Filter out concrete, site prep, and perimeter insulation items since they're handled by custom sections
    // Also filter out DripX from Roofing category since it's handled in moisture barrier section
    // Also filter out lean-to items from Building Shell Addons since they're shown in the lean-to section
    return categoryItems.filter(item => {
      const itemName = item.name.toLowerCase();
      
      // Filter out DripX from Roofing category
      if (category?.name === 'Roofing' && itemName.includes('dripx')) {
        return false;
      }
      
      // Filter out lean-to items from Building Shell Addons category since they're shown in lean-to section
      if (category?.name === 'Building Shell Addons' && 
          (itemName.includes('lt open') || itemName.includes('lean') || itemName.includes('addition'))) {
        return false;
      }
      
      // Filter out garage doors that are same height or taller than building
      if (isGarageDoor(item)) {
        const buildingHeight = getTallestBuildingHeight();
        const doorHeight = getGarageDoorHeight(item.name);
        if (doorHeight >= buildingHeight) {
          return false;
        }
      }
      
      return !(
        (itemName.includes('concrete') && (itemName.includes('4"') || itemName.includes('5"') || itemName.includes('6"'))) ||
        (itemName.includes('site') && itemName.includes('prep')) ||
        (itemName.includes('perimeter') && itemName.includes('insulation'))
      );
    });
  };

  // Helper functions to get specific item types from master pricing
  const getGarageDoorItems = () => {
    const buildingHeight = getTallestBuildingHeight();
    
    return masterItems.filter(item => {
      // Check if it's a garage door
      const isGarageItem = item.name.toLowerCase().includes('garage') && 
                          item.name.toLowerCase().includes('door') &&
                          item.is_active;
      
      if (!isGarageItem) return false;
      
      // Get door height and filter out doors that are same height or taller than building
      const doorHeight = getGarageDoorHeight(item.name);
      return doorHeight < buildingHeight;
    });
  };

  const getEntryDoorItems = () => {
    return masterItems.filter(item => 
      (item.name.toLowerCase().includes('entry') || 
       item.name.toLowerCase().includes('walk') || 
       item.name.toLowerCase().includes('personnel')) && 
      item.name.toLowerCase().includes('door') &&
      item.is_active
    );
  };

  const getWindowItems = () => {
    return masterItems.filter(item => 
      item.name.toLowerCase().includes('window') &&
      item.is_active
    );
  };

  
  // Update master item quantity and automatically update estimate if item is already added
  const updateMasterItemQuantity = (itemId: string, quantity: number) => {
    const newQuantity = Math.max(0, quantity);
    
    setMasterItemQuantities(prev => ({
      ...prev,
      [itemId]: newQuantity
    }));
    
    // If the item is already in the estimate, update it with new quantity and price
    const masterItem = masterItems.find(item => item.id === itemId);
    if (masterItem) {
      setEstimateItems(prev => {
        const existingItemIndex = prev.findIndex(estItem => estItem.id.includes(itemId));
        if (existingItemIndex >= 0 && newQuantity > 0) {
          // Update existing item with new quantity
          const updatedItems = [...prev];
          const basePrice = isGarageDoor(masterItem) ? 
            calculateGarageDoorTotal(masterItem) / newQuantity : 
            masterItem.base_price;
          
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: newQuantity,
            unit_price: basePrice,
            total: basePrice * newQuantity
          };
          return updatedItems;
        } else if (existingItemIndex >= 0 && newQuantity === 0) {
          // Remove item if quantity is 0
          return prev.filter(estItem => !estItem.id.includes(itemId));
        }
        return prev;
      });
    }
  };

  // Helper function to extract garage door width from door name/description
  const extractGarageDoorWidth = (doorName: string): number => {
    // Common garage door sizes: 8', 9', 10', 12', 14', 16', 18', 20'
    const widthMatch = doorName.match(/(\d+)['"]?\s*x\s*\d+|(\d+)'\s*wide|(\d+)\s*ft|(\d+)x\d+/i);
    if (widthMatch) {
      const width = parseInt(widthMatch[1] || widthMatch[2] || widthMatch[3] || widthMatch[4]);
      return width || 8; // Default to 8' if extraction fails
    }
    // Default to 8' wide if no width can be extracted
    return 8;
  };

  // Add concrete items based on thickness from master pricing
  const addConcreteToEstimate = (thickness: string, buildingArea: 'house' | 'garage' | 'leanto' | 'leanto1' | 'leanto2' = 'house') => {
    const concreteItem = masterItems.find(item => 
      item.name.toLowerCase().includes('concrete') && 
      item.name.includes(`${thickness}"`)
    );
    
    if (!concreteItem) return;
    
    const formulaDimensions = getFormulaDimensions();
    let totalSqFt = 0;
    let itemName = '';
    
    
    if (buildingArea === 'house') {
      // Main building square footage
      if (formulaDimensions.width && formulaDimensions.length) {
        totalSqFt += formulaDimensions.width * formulaDimensions.length;
        
        // Add concrete for entry doors from both windowOptions and selected master items
        // WindowOptions: 3' = 16 sq ft, 6' = 32 sq ft
        windowOptions.entryDoors.forEach(door => {
          if (door.width === "3'") totalSqFt += 16 * door.quantity;
          else if (door.width === "6'") totalSqFt += 32 * door.quantity;
        });

        // Master items selection (new UI): infer width from item name and use masterItemQuantities
        const entryDoorItems = getEntryDoorItems();
        entryDoorItems.forEach(mi => {
          const qty = Number(masterItemQuantities[mi.id]) || 0;
          if (qty > 0) {
            const name = mi.name.toLowerCase();
            const isSixFoot = /(^|[^0-9])6(['’]|\s*x)/i.test(mi.name) || name.includes('6\'') || name.includes('6’');
            const add = isSixFoot ? 32 : 16; // default to 3' door if unknown
            totalSqFt += add * qty;
          }
        });

        // Add concrete for garage doors (door width + 2') × 6' per door
        windowOptions.garageDoors.forEach(door => {
          const doorWidth = extractGarageDoorWidth(door.name);
          if (doorWidth > 0) {
            totalSqFt += (doorWidth + 2) * 6 * door.quantity;
          }
        });
        // From master items quantities as well
        const garageDoorItems = getGarageDoorItems();
        garageDoorItems.forEach(mi => {
          const qty = Number(masterItemQuantities[mi.id]) || 0;
          if (qty > 0) {
            const w = extractGarageDoorWidth(mi.name);
            totalSqFt += (w + 2) * 6 * qty;
          }
        });
        
        const label = buildingType === 'barndominium' ? 'House' : 'Building';
        itemName = `${thickness}" Concrete (${label})`;
      }
    } else if (buildingArea === 'garage') {
      // Garage/second building square footage
      if (formulaDimensions.garageWidth && formulaDimensions.garageLength) {
        totalSqFt += formulaDimensions.garageWidth * formulaDimensions.garageLength;
        
        // Add concrete for garage doors in garage area from both sources
        windowOptions.garageDoors.forEach(door => {
          const doorWidth = extractGarageDoorWidth(door.name);
          if (doorWidth > 0) totalSqFt += (doorWidth + 2) * 6 * door.quantity;
        });
        const garageDoorItems2 = getGarageDoorItems();
        garageDoorItems2.forEach(mi => {
          const qty = Number(masterItemQuantities[mi.id]) || 0;
          if (qty > 0) {
            const w = extractGarageDoorWidth(mi.name);
            totalSqFt += (w + 2) * 6 * qty;
          }
        });
        
        itemName = `${thickness}" Concrete (Garage)`;
      }
    } else if (buildingArea === 'leanto') {
      // Lean-to square footage (combined)
      if (windowOptions.leanTos.length > 0) {
        totalSqFt = windowOptions.leanTos.reduce((total, leanto) => 
          total + (leanto.width * leanto.length * leanto.quantity), 0);
        itemName = `${thickness}" Concrete (Lean-to)`;
      }
    } else if (buildingArea === 'leanto1') {
      // First lean-to only
      if (windowOptions.leanTos.length > 0) {
        const leanto1 = windowOptions.leanTos[0];
        totalSqFt = leanto1.width * leanto1.length * leanto1.quantity;
        itemName = `${thickness}" Concrete (Lean-to 1)`;
      }
    } else if (buildingArea === 'leanto2') {
      // Second lean-to only
      if (windowOptions.leanTos.length > 1) {
        const leanto2 = windowOptions.leanTos[1];
        totalSqFt = leanto2.width * leanto2.length * leanto2.quantity;
        itemName = `${thickness}" Concrete (Lean-to 2)`;
      }
    }
    
    if (totalSqFt > 0) {
      // Apply margin to unit price
      const marginMultiplier = 1 / (1 - marginPercentage / 100);
      const unitPriceWithMargin = concreteItem.base_price * marginMultiplier;
      
      const newItem: EstimateLineItem = {
        id: `${buildingArea}_concrete_${thickness}_${Date.now()}`,
        category: concreteItem.category?.name || 'Concrete',
        name: itemName,
        quantity: totalSqFt,
        unit_price: unitPriceWithMargin,
        total: totalSqFt * unitPriceWithMargin,
        unit_type: 'sq ft'
      };
      
      setEstimateItems(prev => [...prev.filter(item => !item.id.includes(`${buildingArea}_concrete`)), newItem]);
    }
  };

  // Add site prep items based on building area
  const addSitePrepToEstimate = (buildingType: 'house' | 'garage' | 'leanto' | 'leanto1' | 'leanto2') => {
    const sitePrepItem = masterItems.find(item => 
      item.name.toLowerCase().includes('site') && item.name.toLowerCase().includes('prep')
    );
    
    if (!sitePrepItem) return;
    
    const formulaDimensions = getFormulaDimensions();
    let area = 0;
    let itemName = '';
    
    if (buildingType === 'house' && formulaDimensions.width && formulaDimensions.length) {
      area = formulaDimensions.width * formulaDimensions.length;
      itemName = `${sitePrepItem.name} (House)`;
    } else if (buildingType === 'garage' && formulaDimensions.garageWidth && formulaDimensions.garageLength) {
      area = formulaDimensions.garageWidth * formulaDimensions.garageLength;
      itemName = `${sitePrepItem.name} (Garage)`;
    } else if (buildingType === 'leanto' && windowOptions.leanTos.length > 0) {
      area = windowOptions.leanTos.reduce((total, leanto) => 
        total + (leanto.width * leanto.length * leanto.quantity), 0);
      itemName = `${sitePrepItem.name} (Lean-to)`;
    } else if (buildingType === 'leanto1' && windowOptions.leanTos.length > 0) {
      const leanto1 = windowOptions.leanTos[0];
      area = leanto1.width * leanto1.length * leanto1.quantity;
      itemName = `${sitePrepItem.name} (Lean-to 1)`;
    } else if (buildingType === 'leanto2' && windowOptions.leanTos.length > 1) {
      const leanto2 = windowOptions.leanTos[1];
      area = leanto2.width * leanto2.length * leanto2.quantity;
      itemName = `${sitePrepItem.name} (Lean-to 2)`;
    }
    
    if (area > 0) {
      // Apply margin to site prep unit price
      const marginMultiplier = 1 / (1 - marginPercentage / 100);
      const unitPriceWithMargin = sitePrepItem.base_price * marginMultiplier;
      
      const newItem: EstimateLineItem = {
        id: `${buildingType}_site_prep_${Date.now()}`,
        category: sitePrepItem.category?.name || 'Foundation',
        name: itemName,
        quantity: area,
        unit_price: unitPriceWithMargin,
        total: area * unitPriceWithMargin,
        unit_type: sitePrepItem.unit_type
      };
      
      setEstimateItems(prev => [...prev.filter(item => !item.id.includes(`${buildingType}_site_prep`)), newItem]);
    }
  };

  // Add perimeter insulation items based on building perimeter
  const addPerimeterInsulationToEstimate = (buildingType: 'house' | 'garage' | 'leanto' | 'leanto1' | 'leanto2') => {
    const perimeterInsulationItem = masterItems.find(item => 
      item.name.toLowerCase().includes('perimeter') && item.name.toLowerCase().includes('insulation')
    );
    
    if (!perimeterInsulationItem) return;
    
    const formulaDimensions = getFormulaDimensions();
    let perimeter = 0;
    let itemName = '';
    
    if (buildingType === 'house' && formulaDimensions.width && formulaDimensions.length) {
      perimeter = 2 * (formulaDimensions.width + formulaDimensions.length);
      itemName = `${perimeterInsulationItem.name} (House)`;
    } else if (buildingType === 'garage' && formulaDimensions.garageWidth && formulaDimensions.garageLength) {
      perimeter = 2 * (formulaDimensions.garageWidth + formulaDimensions.garageLength);
      itemName = `${perimeterInsulationItem.name} (Garage)`;
    } else if (buildingType === 'leanto' && windowOptions.leanTos.length > 0) {
      perimeter = windowOptions.leanTos.reduce((total, leanto) => 
        total + (2 * (leanto.width + leanto.length) * leanto.quantity), 0);
      itemName = `${perimeterInsulationItem.name} (Lean-to)`;
    } else if (buildingType === 'leanto1' && windowOptions.leanTos.length > 0) {
      const leanto1 = windowOptions.leanTos[0];
      perimeter = 2 * (leanto1.width + leanto1.length) * leanto1.quantity;
      itemName = `${perimeterInsulationItem.name} (Lean-to 1)`;
    } else if (buildingType === 'leanto2' && windowOptions.leanTos.length > 1) {
      const leanto2 = windowOptions.leanTos[1];
      perimeter = 2 * (leanto2.width + leanto2.length) * leanto2.quantity;
      itemName = `${perimeterInsulationItem.name} (Lean-to 2)`;
    }
    
    if (perimeter > 0) {
      // Apply margin to unit price
      const marginMultiplier = 1 / (1 - marginPercentage / 100);
      const unitPriceWithMargin = perimeterInsulationItem.base_price * marginMultiplier;
      
      const newItem: EstimateLineItem = {
        id: `${buildingType}_perimeter_insulation_${Date.now()}`,
        category: perimeterInsulationItem.category?.name || 'Insulation',
        name: itemName,
        quantity: perimeter,
        unit_price: unitPriceWithMargin,
        total: perimeter * unitPriceWithMargin,
        unit_type: perimeterInsulationItem.unit_type
      };
      
      setEstimateItems(prev => [...prev.filter(item => !item.id.includes(`${buildingType}_perimeter_insulation`)), newItem]);
    }
  };

  // Handle concrete items that need separate calculations for house and garage
  const addConcreteItemsSeparately = (masterItem?: PricingItemWithCategory | null, overrideThickness?: { house?: string; garage?: string; leanto?: string }) => {
    const formulaDimensions = getFormulaDimensions();
    
    // Find the appropriate concrete items based on thickness specifications
    const houseConcreteThickness = overrideThickness?.house || windowOptions.concrete_thickness;
    const garageConcreteThickness = overrideThickness?.garage || (buildingType === 'barndominium' ? 
      windowOptions.garage_concrete_thickness : 
      windowOptions.second_building_concrete_thickness);
    const leantoConcreteThickness = overrideThickness?.leanto || windowOptions.leanto_concrete_thickness;
    
    // Get concrete pricing from master pricing sheet instead of hardcoded values
    const getConcreteItemFromMaster = (thickness: string): PricingItemWithCategory | null => {
      return masterItems.find(item => 
        item.name.toLowerCase().includes('concrete') && 
        item.name.includes(`${thickness}"`)
      ) || null;
    };

    // Apply waste factor (5% industry standard for concrete)
    const wasteFactor = 1.05;
    
    // Get margin multiplier for consistent pricing
    const marginMultiplier = 1 / (1 - marginPercentage / 100);
    
    // Collect all concrete items to add in a single update
    const newConcreteItems: EstimateLineItem[] = [];
    
    // Calculate house concrete
    if (houseConcreteThickness !== 'none' && formulaDimensions.width && formulaDimensions.length) {
      const concreteItem = getConcreteItemFromMaster(houseConcreteThickness);
      if (concreteItem) {
        const baseQuantity = formulaDimensions.width * formulaDimensions.length;
        const adjustedQuantity = baseQuantity * wasteFactor; // Apply waste factor
        const unitPrice = concreteItem.base_price;
        const baseTotal = adjustedQuantity * unitPrice;
        const houseTotal = baseTotal * marginMultiplier; // Apply margin consistently
        
        // Calculate additional concrete for doors
        let additionalConcrete = 0;
        
        // Add concrete for entry doors (3' = 16 sq ft, 6' = 32 sq ft)
        windowOptions.entryDoors.forEach(door => {
          if (door.width === "3'") {
            additionalConcrete += 16 * door.quantity;
          } else if (door.width === "6'") {
            additionalConcrete += 32 * door.quantity;
          }
        });
        
        // Add concrete for garage doors (door width + 2') × 3' per door
        windowOptions.garageDoors.forEach(door => {
          const doorWidth = extractGarageDoorWidth(door.name);
          if (doorWidth > 0) {
            additionalConcrete += (doorWidth + 2) * 6 * door.quantity;
          }
        });
        
        const totalConcreteQuantity = adjustedQuantity + (additionalConcrete * wasteFactor);
        const totalConcreteTotal = totalConcreteQuantity * unitPrice * marginMultiplier;
        
        const houseItem: EstimateLineItem = {
          id: `house_concrete_${houseConcreteThickness}_${Date.now()}`,
          category: concreteItem.category?.name || 'Concrete',
          name: `${houseConcreteThickness}" Concrete (House) - ${Math.round(totalConcreteQuantity)} sq ft total`,
          quantity: totalConcreteQuantity,
          unit_price: unitPrice * marginMultiplier, // Show unit price with margin for transparency
          total: totalConcreteTotal,
          unit_type: concreteItem.unit_type || 'sq ft',
          has_formula: false,
          formula_type: null
        };
        
        newConcreteItems.push(houseItem);
      }
    }
    
    // Calculate garage/second building concrete  
    if (garageConcreteThickness !== 'none') {
      let shouldAddGarageConcrete = false;
      let garageQuantity = 0;
      let buildingLabel = '';
      
      if (buildingType === 'barndominium' && formulaDimensions.garageWidth && formulaDimensions.garageLength) {
        garageQuantity = formulaDimensions.garageWidth * formulaDimensions.garageLength;
        buildingLabel = 'Garage';
        shouldAddGarageConcrete = true;
      } else if (buildingType !== 'barndominium' && windowOptions.connect_second_building && 
                 windowOptions.second_building_width && windowOptions.second_building_length) {
        garageQuantity = parseFloat(windowOptions.second_building_width) * parseFloat(windowOptions.second_building_length);
        buildingLabel = '2nd Building';
        shouldAddGarageConcrete = true;
      }
      
      if (shouldAddGarageConcrete) {
        const concreteItem = getConcreteItemFromMaster(garageConcreteThickness);
        if (concreteItem) {
          const baseQuantity = garageQuantity;
          const adjustedQuantity = baseQuantity * wasteFactor; // Apply waste factor
          const unitPrice = concreteItem.base_price;
          const baseTotal = adjustedQuantity * unitPrice;
          const garageTotal = baseTotal * marginMultiplier; // Apply margin consistently
          
          const garageItem: EstimateLineItem = {
            id: `garage_concrete_${garageConcreteThickness}_${Date.now()}`,
            category: concreteItem.category?.name || 'Concrete',
            name: `${garageConcreteThickness}" Concrete (${buildingLabel})`,
            quantity: adjustedQuantity, // Show adjusted quantity with waste factor
            unit_price: unitPrice * marginMultiplier, // Show unit price with margin for transparency
            total: garageTotal,
            unit_type: concreteItem.unit_type || 'sq ft',
            has_formula: false,
            formula_type: null
          };
          
          newConcreteItems.push(garageItem);
        }
      }
    }
    
    // Calculate lean-to concrete
    if (leantoConcreteThickness !== 'none' && windowOptions.leanTos.length > 0) {
      const concreteItem = getConcreteItemFromMaster(leantoConcreteThickness);
      if (concreteItem) {
        const baseLeantoArea = windowOptions.leanTos.reduce((total, leanto) => 
          total + (leanto.width * leanto.length * leanto.quantity), 0);
        const adjustedLeantoArea = baseLeantoArea * wasteFactor; // Apply waste factor
        const unitPrice = concreteItem.base_price;
        const baseTotal = adjustedLeantoArea * unitPrice;
        const leantoTotal = baseTotal * marginMultiplier; // Apply margin consistently
        
        const leantoItem: EstimateLineItem = {
          id: `leanto_concrete_${leantoConcreteThickness}_${Date.now()}`,
          category: concreteItem.category?.name || 'Concrete',
          name: `${leantoConcreteThickness}" Concrete (Lean-to)`,
          quantity: adjustedLeantoArea, // Show adjusted quantity with waste factor
          unit_price: unitPrice * marginMultiplier, // Show unit price with margin for transparency
          total: leantoTotal,
          unit_type: concreteItem.unit_type || 'sq ft',
          has_formula: false,
          formula_type: null
        };
        
        newConcreteItems.push(leantoItem);
      }
    }
    
    // Update estimate items in a single operation: remove all concrete items and add new ones
    setEstimateItems(prev => {
      const nonConcreteItems = prev.filter(item => 
        !item.id.includes('concrete') && 
        !item.name.toLowerCase().includes('concrete') &&
        !item.category?.toLowerCase().includes('concrete')
      );
      return [...nonConcreteItems, ...newConcreteItems];
    });
    
    // Add site prep items
    const sitePrepItem = masterItems.find(item => 
      item.name.toLowerCase().includes('site') && item.name.toLowerCase().includes('prep')
    );
    if (sitePrepItem) {
      // House site prep
      if (windowOptions.site_prep_house && formulaDimensions.width && formulaDimensions.length) {
        const houseArea = formulaDimensions.width * formulaDimensions.length;
        const houseSitePrepItem: EstimateLineItem = {
          id: `house_site_prep_${Date.now()}`,
          category: sitePrepItem.category?.name || 'Foundation',
          name: `${sitePrepItem.name} (House)`,
          quantity: houseArea,
          unit_price: sitePrepItem.base_price,
          total: houseArea * sitePrepItem.base_price,
          unit_type: sitePrepItem.unit_type,
          has_formula: sitePrepItem.has_formula,
          formula_type: sitePrepItem.formula_type
        };
        setEstimateItems(prev => [...prev, houseSitePrepItem]);
      }
      
      // Garage site prep
      if (windowOptions.site_prep_garage && formulaDimensions.garageWidth && formulaDimensions.garageLength) {
        const garageArea = formulaDimensions.garageWidth * formulaDimensions.garageLength;
        const garageSitePrepItem: EstimateLineItem = {
          id: `garage_site_prep_${Date.now()}`,
          category: sitePrepItem.category?.name || 'Foundation',
          name: `${sitePrepItem.name} (Garage)`,
          quantity: garageArea,
          unit_price: sitePrepItem.base_price,
          total: garageArea * sitePrepItem.base_price,
          unit_type: sitePrepItem.unit_type,
          has_formula: sitePrepItem.has_formula,
          formula_type: sitePrepItem.formula_type
        };
        setEstimateItems(prev => [...prev, garageSitePrepItem]);
      }
      
      // Lean-to site prep
      if (windowOptions.site_prep_leanto && windowOptions.leanTos.length > 0) {
        const totalLeantoArea = windowOptions.leanTos.reduce((total, leanto) => 
          total + (leanto.width * leanto.length * leanto.quantity), 0);
        const leantoSitePrepItem: EstimateLineItem = {
          id: `leanto_site_prep_${Date.now()}`,
          category: sitePrepItem.category?.name || 'Foundation',
          name: `${sitePrepItem.name} (Lean-to)`,
          quantity: totalLeantoArea,
          unit_price: sitePrepItem.base_price,
          total: totalLeantoArea * sitePrepItem.base_price,
          unit_type: sitePrepItem.unit_type,
          has_formula: sitePrepItem.has_formula,
          formula_type: sitePrepItem.formula_type
        };
        setEstimateItems(prev => [...prev, leantoSitePrepItem]);
      }
    }
    
    // Add perimeter insulation items
    const perimeterInsulationItem = masterItems.find(item => 
      item.name.toLowerCase().includes('perimeter') && item.name.toLowerCase().includes('insulation')
    );
    if (perimeterInsulationItem) {
      // House perimeter insulation
      if (windowOptions.perimeter_insulation_house && formulaDimensions.width && formulaDimensions.length) {
        const housePerimeter = 2 * (formulaDimensions.width + formulaDimensions.length);
        const housePerimeterItem: EstimateLineItem = {
          id: `house_perimeter_insulation_${Date.now()}`,
          category: perimeterInsulationItem.category?.name || 'Insulation',
          name: `${perimeterInsulationItem.name} (House)`,
          quantity: housePerimeter,
          unit_price: perimeterInsulationItem.base_price,
          total: housePerimeter * perimeterInsulationItem.base_price,
          unit_type: perimeterInsulationItem.unit_type,
          has_formula: perimeterInsulationItem.has_formula,
          formula_type: perimeterInsulationItem.formula_type
        };
        setEstimateItems(prev => [...prev, housePerimeterItem]);
      }
      
      // Garage perimeter insulation
      if (windowOptions.perimeter_insulation_garage && formulaDimensions.garageWidth && formulaDimensions.garageLength) {
        const garagePerimeter = 2 * (formulaDimensions.garageWidth + formulaDimensions.garageLength);
        const garagePerimeterItem: EstimateLineItem = {
          id: `garage_perimeter_insulation_${Date.now()}`,
          category: perimeterInsulationItem.category?.name || 'Insulation',
          name: `${perimeterInsulationItem.name} (Garage)`,
          quantity: garagePerimeter,
          unit_price: perimeterInsulationItem.base_price,
          total: garagePerimeter * perimeterInsulationItem.base_price,
          unit_type: perimeterInsulationItem.unit_type,
          has_formula: perimeterInsulationItem.has_formula,
          formula_type: perimeterInsulationItem.formula_type
        };
        setEstimateItems(prev => [...prev, garagePerimeterItem]);
      }
      
      // Lean-to perimeter insulation
      if (windowOptions.perimeter_insulation_leanto && windowOptions.leanTos.length > 0) {
        const totalLeantoPerimeter = windowOptions.leanTos.reduce((total, leanto) => 
          total + (2 * (leanto.width + leanto.length) * leanto.quantity), 0);
        const leantoPerimeterItem: EstimateLineItem = {
          id: `leanto_perimeter_insulation_${Date.now()}`,
          category: perimeterInsulationItem.category?.name || 'Insulation',
          name: `${perimeterInsulationItem.name} (Lean-to)`,
          quantity: totalLeantoPerimeter,
          unit_price: perimeterInsulationItem.base_price,
          total: totalLeantoPerimeter * perimeterInsulationItem.base_price,
          unit_type: perimeterInsulationItem.unit_type,
          has_formula: perimeterInsulationItem.has_formula,
          formula_type: perimeterInsulationItem.formula_type
        };
        setEstimateItems(prev => [...prev, leantoPerimeterItem]);
      }
    }

    toast({
      title: "Concrete & Site Options Updated",
      description: `Added selected concrete, site prep, and perimeter insulation options`
    });
  };

  // Check if an item needs separate calculations for house and garage
  const needsSeparateCalculation = (item: PricingItemWithCategory): boolean => {
    const itemName = item.name.toLowerCase();
    
    // Concrete items when different thicknesses are selected
    const secondBuildingConcreteThickness = buildingType === 'barndominium' ? 
      windowOptions.garage_concrete_thickness : 
      windowOptions.second_building_concrete_thickness;
    
    if (itemName.includes('concrete') && 
        windowOptions.concrete_thickness !== secondBuildingConcreteThickness) {
      return true;
    }
    
    // Add other structural items that might differ between house and garage
    // For example: insulation, siding materials with different specs, etc.
    
    return false;
  };

  // Add items with separate specifications for house and garage
  const addItemWithSeparateSpecs = (masterItem: PricingItemWithCategory) => {
    const itemName = masterItem.name.toLowerCase();
    
    if (itemName.includes('concrete')) {
      addConcreteItemsSeparately(masterItem);
    }
    // Add handlers for other structural items that need separate calculations
  };

  // Add item to estimate with specified quantity
  const addItemToEstimateWithQuantity = (masterItem: PricingItemWithCategory, specifiedQuantity?: number) => {
    const formulaDimensions = getFormulaDimensions();
    
    // Check if this is an item that needs separate house/garage calculations for barndominiums
    if (buildingType === 'barndominium' && needsSeparateCalculation(masterItem)) {
      addItemWithSeparateSpecs(masterItem);
      return;
    }
    
    let quantity = specifiedQuantity || masterItemQuantities[masterItem.id] || 1;
    let unitPrice = masterItem.base_price;
    let total = unitPrice * quantity;
    let formulaResult: FormulaResult | undefined;

    // Handle garage door add-ons
    if (isGarageDoor(masterItem)) {
      const options = garageDoorOptions[masterItem.id];
      let addOnCost = 0;
      let addOnDescription = '';
      
      // Check if high lift track is needed based on building height
      const autoHighLift = needsHighLiftTrack(masterItem.name);
      
      if (options?.hasWindows && options.windowQuantity > 0) {
        addOnCost += 200 * options.windowQuantity;
        addOnDescription += ` + ${options.windowQuantity} Row${options.windowQuantity > 1 ? 's' : ''} of Windows`;
      }
      
      if (options?.hasOpener && options.openerQuantity > 0) {
        const openerPrice = getOpenerPrice(masterItem.name);
        addOnCost += openerPrice * options.openerQuantity;
        addOnDescription += ` + ${options.openerQuantity} Opener${options.openerQuantity > 1 ? 's' : ''}`;
      }
      
      // Determine track type automatically
      const trackType = getTrackType(masterItem.name);
      
      if (trackType === 'high_lift') {
        addOnCost += 250;
        addOnDescription += ' + High Lift Track';
      } else if (trackType === 'low_headroom') {
        addOnCost += 300; // $300 for low headroom as specified
        addOnDescription += ' + Low Headroom Track';
      }
      
      unitPrice += addOnCost;
      total = unitPrice * quantity;
      
      // Update the item name to include add-ons
      if (addOnDescription) {
        masterItem = { ...masterItem, name: masterItem.name + addOnDescription };
      }
    }

    // Check if item has formula and calculate if so (skip for garage doors with custom options)
    if (masterItem.has_formula && masterItem.formula_type && !specifiedQuantity && !isGarageDoor(masterItem)) {
      const calculated = FormulaService.calculatePrice(masterItem, formulaDimensions);
      if (calculated) {
        quantity = calculated.quantity;
        unitPrice = calculated.calculatedPrice;
        total = calculated.totalPrice;
        formulaResult = calculated;
      }
    } else if (masterItem.unit_type === 'sq ft' && !specifiedQuantity && !isGarageDoor(masterItem)) {
      // For items with sq ft unit type but no specific formula, use building square footage
      quantity = formulaDimensions.width * formulaDimensions.length;
      total = quantity * unitPrice;
      console.log(`Sq ft calculation for ${masterItem.name}:`, { quantity, unitPrice, total });
    } else if (masterItem.unit_type === 'wall sq ft' && !specifiedQuantity && !isGarageDoor(masterItem)) {
      // For wall sq ft unit type, use the correct wall formula
      const { width, length, height, pitch } = formulaDimensions;
      if (width && length && height && pitch) {
        // Side walls (eave walls): 2 × Length × Height
        const sideWalls = 2 * length * height;
        // End walls (gable walls): 2 × Width × Height  
        const endWalls = 2 * width * height;
        // Gable triangles: 2 × (½ × Width × GableHeight)
        const gableHeight = (width / 2) * (pitch / 12);
        const gableTriangles = 2 * (0.5 * width * gableHeight);
        
        quantity = sideWalls + endWalls + gableTriangles;
        total = quantity * unitPrice;
        console.log(`Wall sq ft calculation for ${masterItem.name}:`, { 
          sideWalls, endWalls, gableTriangles, quantity, unitPrice, total 
        });
      }
    } else if (masterItem.unit_type === 'roof sq ft' && !specifiedQuantity && !isGarageDoor(masterItem)) {
      // For roof sq ft unit type, use the calculated roof area
      quantity = formulaDimensions.roofArea || 0;
      total = quantity * unitPrice;
      console.log(`Roof sq ft calculation for ${masterItem.name}:`, { quantity, unitPrice, total });
    }

    const newItem: EstimateLineItem = {
      id: `${masterItem.id}_${Date.now()}`,
      category: masterItem.category?.name || 'Uncategorized',
      name: masterItem.name,
      quantity,
      unit_price: unitPrice,
      total,
      unit_type: masterItem.unit_type,
      has_formula: masterItem.has_formula,
      formula_type: masterItem.formula_type,
      formula_result: formulaResult
    };

    setEstimateItems(prev => [...prev, newItem]);
    
    toast({
      title: "Item Added",
      description: `${masterItem.name} added to estimate${formulaResult ? ' (formula calculated)' : ''}`
    });
  };

  // Check if an item is a door, window, or cupola that should have quantity inputs
  const isDoorOrWindow = (item: PricingItemWithCategory) => {
    const categoryName = item.category?.name?.toLowerCase() || '';
    const itemName = item.name.toLowerCase();
    return (
      categoryName.includes('door') || 
      categoryName.includes('window') ||
      itemName.includes('door') ||
      itemName.includes('window') ||
      itemName.includes('cupola') // Add cupola support
    );
  };

  // Check if an item is specifically a garage door
  const isGarageDoor = (item: PricingItemWithCategory) => {
    const categoryName = item.category?.name?.toLowerCase() || '';
    const itemName = item.name.toLowerCase();
    return categoryName.includes('garage') || itemName.includes('garage door');
  };

  // Update garage door options
  const updateGarageDoorOptions = (itemId: string, options: Partial<{
    hasWindows: boolean;
    windowQuantity: number;
    hasOpener: boolean;
    openerQuantity: number;
  }>) => {
    setGarageDoorOptions(prev => ({
      ...prev,
      [itemId]: {
        hasWindows: false,
        windowQuantity: 1,
        hasOpener: false,
        openerQuantity: 1,
        ...prev[itemId],
        ...options
      }
    }));
  };

  // Calculate garage door total with add-ons
  const calculateGarageDoorTotal = (item: PricingItemWithCategory) => {
    const quantity = masterItemQuantities[item.id] || 0;
    const options = garageDoorOptions[item.id];
    
    if (quantity === 0) return 0;
    
    let total = item.base_price * quantity;
    
    if (options?.hasWindows && options.windowQuantity > 0) {
      total += 200 * options.windowQuantity; // $200 per row of windows
    }
    
    if (options?.hasOpener && options.openerQuantity > 0) {
      const openerPrice = getOpenerPrice(item.name);
      total += openerPrice * options.openerQuantity;
    }
    
    // Check if high lift track is needed based on building height
    const autoHighLift = needsHighLiftTrack(item.name);
    
    // Determine track type automatically
    const trackType = getTrackType(item.name);
    
    if (trackType === 'high_lift') {
      total += 250 * quantity; // Add $250 per door for high lift track
    } else if (trackType === 'low_headroom') {
      total += 300 * quantity; // Add $300 per door for low headroom as specified
    }
    
    // Apply margin to final total
    const marginMultiplier = 1 / (1 - marginPercentage / 100);
    return total * marginMultiplier;
  };

  // Get the tallest building height from all buildings (main, garage, second building)
  const getTallestBuildingHeight = (): number => {
    let tallestHeight = parseFloat(dimensions.height || '0'); // Main building height
    
    // Check garage height for barndominium
    if (buildingType === 'barndominium' && dimensions.garageHeight) {
      const garageHeight = parseFloat(dimensions.garageHeight);
      if (garageHeight > tallestHeight) {
        tallestHeight = garageHeight;
      }
    }
    
    // Check second building height for non-barndominium with connected second building
    if (buildingType !== 'barndominium' && windowOptions.connect_second_building && windowOptions.second_building_height) {
      const secondBuildingHeight = parseFloat(windowOptions.second_building_height);
      if (secondBuildingHeight > tallestHeight) {
        tallestHeight = secondBuildingHeight;
      }
    }
    
    return tallestHeight;
  };

  // Extract garage door height from door name
  const getGarageDoorHeight = (doorName: string): number => {
    const name = doorName.toLowerCase();
    
    // Extract height from door name (e.g., "10x7 Garage Door" -> height is 7)
    const match = name.match(/(\d+)x(\d+)/);
    if (match) {
      return parseInt(match[2]); // Second number is height
    }
    
    return 7; // Default height
  };

  // Determine track type based on building height vs door height
  const getTrackType = (doorName: string): 'standard' | 'high_lift' | 'low_headroom' => {
    const buildingHeight = getTallestBuildingHeight();
    const doorHeight = getGarageDoorHeight(doorName);
    const heightDifference = buildingHeight - doorHeight;
    
    if (heightDifference > 2) {
      return 'high_lift';
    } else if (heightDifference < 2) {
      return 'low_headroom';
    } else {
      return 'standard'; // exactly 2' difference
    }
  };

  // Check if garage door needs high lift track based on building height
  const needsHighLiftTrack = (doorName: string): boolean => {
    return getTrackType(doorName) === 'high_lift';
  };

  // Get opener price based on garage door size
  const getOpenerPrice = (doorName: string) => {
    const name = doorName.toLowerCase();
    
    // Extract dimensions from door name (e.g., "10x7 Garage Door")
    if (name.includes('8x7') || name.includes('8x8') || name.includes('9x7') || name.includes('9x8') || name.includes('9x9') || name.includes('9x10')) {
      return 700; // Small doors
    } else if (name.includes('10x7') || name.includes('10x8') || name.includes('10x9') || name.includes('10x10') || name.includes('12x7') || name.includes('12x8')) {
      return 905; // Medium doors
    } else if (name.includes('10x12') || name.includes('12x9') || name.includes('12x10') || name.includes('14x7') || name.includes('14x8') || name.includes('14x10') || name.includes('16x7') || name.includes('16x8') || name.includes('16x9')) {
      return 1200; // Large doors
    } else if (name.includes('12x12') || name.includes('14x12') || name.includes('14x14') || name.includes('14x16') || name.includes('16x10') || name.includes('16x12') || name.includes('16x14') || name.includes('16x16')) {
      return 1400; // Extra large doors
    }
    
    return 905; // Default price
  };
  // Legacy function - redirect to new function
  const addItemToEstimate = (masterItem: PricingItemWithCategory) => {
    addItemToEstimateWithQuantity(masterItem);
  };

  // Update estimate item
  const updateEstimateItem = (id: string, field: keyof EstimateLineItem, value: number) => {
    setEstimateItems(prev => 
      prev.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item };
          
          // For formula items, prevent manual quantity changes and recalculate
          if (item.has_formula && field === 'quantity') {
            toast({
              title: "Formula Item",
              description: "Quantity is automatically calculated for this item",
              variant: "destructive"
            });
            return item;
          }
          
          if (field === 'quantity' || field === 'unit_price') {
            (updatedItem as any)[field] = value;
            updatedItem.total = updatedItem.quantity * updatedItem.unit_price;
          } else {
            (updatedItem as any)[field] = value;
          }
          
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Remove estimate item
  const removeEstimateItem = (id: string) => {
    setEstimateItems(prev => prev.filter(item => item.id !== id));
  };

  // Calculate total from estimate items - margin is already applied to individual items when added
  const calculateGrandTotal = () => {
    // Exclude moisture barrier premium items here; we'll add premium explicitly for accuracy
    const itemsTotal = estimateItems
      .filter(item => !item.id.includes('moisture_barrier_premium'))
      .reduce((sum, item) => sum + item.total, 0);
    
    // Add master item quantities with margin applied
    const masterItemsTotal = masterItems.reduce((sum, item) => {
      const quantity = masterItemQuantities[item.id] || 0;
      if (quantity > 0) {
        const baseTotal = item.base_price * quantity;
        const marginMultiplier = 1 / (1 - marginPercentage / 100);
        const finalTotal = baseTotal * marginMultiplier;
        return sum + finalTotal;
      }
      return sum;
    }, 0);

    // Explicitly add premium moisture barrier upgrade cost if selected
    let premiumCost = 0;
    const formulaDimensions = getFormulaDimensions();
    const marginMultiplier = 1 / (1 - marginPercentage / 100);

    const dripXItem = masterItems.find(item =>
      item.name.toLowerCase().includes('dripx') ||
      (item.name.toLowerCase().includes('moisture') && item.name.toLowerCase().includes('premium'))
    );

    if (dripXItem) {
      // Main building
      if (windowOptions.moisture_barrier === 'premium' && formulaDimensions.roofArea) {
        premiumCost += formulaDimensions.roofArea * dripXItem.base_price * marginMultiplier;
      }
      // Garage (barndominium only)
      if (buildingType === 'barndominium' && windowOptions.garage_moisture_barrier === 'premium' && formulaDimensions.garageRoofArea) {
        premiumCost += formulaDimensions.garageRoofArea * dripXItem.base_price * marginMultiplier;
      }
      // Second building
      if (windowOptions.connect_second_building && windowOptions.second_building_moisture_barrier === 'premium') {
        const secondWidth = parseFloat(windowOptions.second_building_width) || 0;
        const secondLength = parseFloat(windowOptions.second_building_length) || 0;
        const secondPitchString = windowOptions.second_building_truss_pitch || '4/12';
        const [secondRise, secondRun] = secondPitchString.split('/').map(Number);
        if (secondWidth > 0 && secondLength > 0) {
          const secondBaseArea = secondWidth * secondLength;
          const secondPitchFactor = Math.sqrt(1 + Math.pow(secondRise / secondRun, 2));
          const secondRoofArea = secondBaseArea * secondPitchFactor;
          premiumCost += secondRoofArea * dripXItem.base_price * marginMultiplier;
        }
      }
    }

    const total = itemsTotal + masterItemsTotal + premiumCost;
    return total;
  };

  // Handle plumbing calculation
  const handlePlumbingCalculated = (total: number, breakdown: any) => {
    const plumbingItem: EstimateLineItem = {
      id: `plumbing_${Date.now()}`,
      category: 'Plumbing',
      name: 'Plumbing Package (Calculated)',
      quantity: 1,
      unit_price: total,
      total: total,
      unit_type: 'package'
    };
    
    setEstimateItems(prev => [...prev, plumbingItem]);
    setShowPlumbingCalculator(false);
    
    toast({
      title: "Plumbing Added",
      description: `Plumbing package for $${total.toLocaleString()} added to estimate`
    });
  };

  const handleUpdateVersionName = async (estimate: Estimate, newName: string) => {
    try {
      await estimatesService.updateEstimate(estimate.id, { version_name: newName });
      
      // Update local state
      setPreviousEstimates(prev => prev.map(est => 
        est.id === estimate.id 
          ? { ...est, version_name: newName }
          : est
      ));
      
      setEditingVersionName(null);
      toast({
        title: "Success",
        description: "Version name updated successfully",
      });
    } catch (error) {
      console.error('Error updating version name:', error);
      toast({
        title: "Error",
        description: "Failed to update version name",
        variant: "destructive"
      });
    }
  };

  const handleDeleteEstimate = async (estimate: Estimate) => {
    if (!confirm(`Are you sure you want to delete "${estimate.version_name || 'this estimate'}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await estimatesService.deleteEstimate(estimate.id);
      
      // Update local state
      setPreviousEstimates(prev => prev.filter(est => est.id !== estimate.id));
      
      toast({
        title: "Estimate Deleted",
        description: `${estimate.version_name || 'Estimate'} has been deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting estimate:', error);
      toast({
        title: "Error",
        description: "Failed to delete estimate",
        variant: "destructive"
      });
    }
  };

  // Function to fix estimates with $0 price
  const fixEstimatePrice = async (estimate: Estimate) => {
    try {
      // For a 30x40x12 residential garage, calculate a reasonable price
      const width = 30;
      const length = 40; 
      const height = 12;
      const sqft = width * length;
      
      // Basic pricing for residential garage (approximately $25-35 per sq ft)
      const pricePerSqft = 30;
      const calculatedPrice = sqft * pricePerSqft;
      
      console.log('Fixing estimate price:', estimate.id, 'from', estimate.estimated_price, 'to', calculatedPrice);
      
      await estimatesService.updateEstimate(estimate.id, { estimated_price: calculatedPrice });
      
      // Update local state
      setPreviousEstimates(prev => prev.map(est => 
        est.id === estimate.id 
          ? { ...est, estimated_price: calculatedPrice }
          : est
      ));
      
      toast({
        title: "Price Updated",
        description: `Estimate price updated to $${calculatedPrice.toLocaleString()}`,
      });
      
    } catch (error) {
      console.error('Error fixing estimate price:', error);
    }
  };

  const loadEstimateData = (estimate: Estimate) => {
    console.log('Loading estimate data:', estimate);
    console.log('Estimated price:', estimate.estimated_price);
    
    // Load estimate data into form
    setDimensions({
      width: estimate.dimensions?.split('x')[0]?.replace(/'/g, '').trim() || '',
      length: estimate.dimensions?.split('x')[1]?.replace(/'/g, '').trim() || '',
      height: estimate.dimensions?.split('x')[2]?.replace(/'/g, '').trim() || estimate.wall_height?.replace(/'/g, '') || '',
      // Initialize barndominium fields with empty strings
      secondFloorSqFt: '',
      garageWidth: '',
      garageLength: '',
      garageHeight: '',
      interiorWallsLf: ''
    });
    
    setBuildingType(estimate.building_type === 'Barndominium' ? 'barndominium' : 
                   estimate.building_type === 'Residential Garage' ? 'residential_garage' : 'commercial');
    
    setCustomDescription(estimate.description || '');
    
    // Load detailed breakdown if available
    if (estimate.detailed_breakdown) {
      const breakdown = estimate.detailed_breakdown;
      
      // Update window options from breakdown
      if (breakdown.post_sizing) {
        setWindowOptions(prev => ({ ...prev, post_sizing: breakdown.post_sizing }));
      }
      if (breakdown.truss_pitch) {
        setWindowOptions(prev => ({ ...prev, truss_pitch: breakdown.truss_pitch }));
      }
      if (breakdown.truss_spacing) {
        setWindowOptions(prev => ({ ...prev, truss_spacing: breakdown.truss_spacing }));
      }
      if (breakdown.moisture_barrier) {
        setWindowOptions(prev => ({ ...prev, moisture_barrier: breakdown.moisture_barrier }));
      }
      if (breakdown.concrete_thickness) {
        setWindowOptions(prev => ({ ...prev, concrete_thickness: breakdown.concrete_thickness }));
      }
      if (breakdown.exterior_siding) {
        setWindowOptions(prev => ({ ...prev, exterior_siding: breakdown.exterior_siding }));
      }
      if (breakdown.insulation_wall_finish) {
        setWindowOptions(prev => ({ ...prev, insulation_wall_finish: breakdown.insulation_wall_finish }));
      }
      
      // Load garage doors
      if (breakdown.garageDoors) {
        setWindowOptions(prev => ({ ...prev, garageDoors: breakdown.garageDoors }));
      }
      
      // Load entry doors
      if (breakdown.entryDoors) {
        setWindowOptions(prev => ({ ...prev, entryDoors: breakdown.entryDoors }));
      }
    }
    
    setShowPreviousEstimates(false);
    
    toast({
      title: "Estimate Loaded",
      description: `Previous estimate data has been loaded into the form`
    });
  };

  // Building feature options with descriptions - different for each building type
  const getBuildingOptions = () => {
    const commonOptions = [
      // Removed all options that conflict with master pricing
    ];

    if (buildingType === 'barndominium') {
      return [
        ...commonOptions,
        { id: 'plumbing', label: 'Plumbing Rough-in', description: 'Complete plumbing rough-in ready for fixtures' },
        { id: 'hvac', label: 'HVAC System', description: 'Central heating and cooling system' },
        { id: 'wall_finish', label: 'Wall & Ceiling Finish', description: '29ga liner panel or drywall hung and finished (ready to paint by others)' },
        { id: 'flooring', label: 'Concrete Floors', description: 'Polished concrete floors throughout' },
        { id: 'kitchen', label: 'Kitchen Package', description: 'Basic kitchen cabinets and countertops' },
        { id: 'bathrooms', label: 'Bathroom Package', description: 'Complete bathroom fixtures and finishes' },
        { id: 'gutters', label: 'Gutters & Downspouts', description: '5" seamless gutters and downspouts included' },
        { id: 'site_plan', label: 'Site Plan Options', description: 'Standard site plan or lines and grade plan' }
      ];
    } else if (buildingType === 'residential_garage') {
      return [
        ...commonOptions
      ];
    } else { // commercial
      return [
        ...commonOptions,
        { id: 'hvac', label: 'Commercial HVAC', description: 'Commercial heating and cooling system' },
        { id: 'fire_systems', label: 'Fire Safety Systems', description: 'Fire suppression and alarm systems' },
        { id: 'accessibility', label: 'ADA Compliance', description: 'ADA compliant features and access' },
        { id: 'gutters', label: 'Gutters & Downspouts', description: '6" seamless gutters and downspouts included' }
      ];
    }
  };

  const buildingOptions = getBuildingOptions();

  // Generate description based on selected options - formatted like the contract template
  const generateDescription = useCallback(() => {
    if (!dimensions.width || !dimensions.height || !dimensions.length) return '';

    const buildingTypeLabel = buildingType === 'barndominium' ? 'Barndominium' : 
                             buildingType === 'residential_garage' ? 'Residential Pole Building' : 'Commercial Pole Building';
    
    const description = `Titan Buildings will furnish the materials and perform the labor necessary for the completion of a ${buildingTypeLabel} providing the following.

• ${dimensions.width}'x${dimensions.length}'x${dimensions.height}' Pole Building - Titan Buildings will construct a building that will meet all local code requirements. The building will be constructed with the following standard features.

Standard Building Features

✓ Footers - ${buildingType === 'commercial' || buildingType === 'barndominium' ? 'Concrete poured footers' : '160 lb. Sakrete @ 3500 p.s.i.'}

✓ Posts - ${windowOptions.post_sizing.replace('_', ' ')} GluLams with Gable Posts Extended to Top of Truss

✓ Skirt Board- Foundation grade treated 2 x 8

✓ Carriers - 2 x 12 Yellow Pine #1 on Each Side of Post and/or Engineered Carriers as Specified in Plans

✓ Trusses - ${windowOptions.truss_pitch} Pitch Engineered Trusses, ${windowOptions.truss_spacing}' o/c

✓ Side Girts and Roof Purlins - 2 x 4, 2' o/c

✓ Roof/Side Steel - ${windowOptions.exterior_siding.gauge} Gauge cold rolled metal ribbed panels using Sherwin Williams® coil coatings with galvalume paint protection. (40 Year Warranty)

✓ Vented Ridge - Vented Ridge Cap to cover the length of roof.

✓ Hurricane Ties- Simpson ties installed on each truss

✓ Overhang - 12" Overhang on Eaves & Gables - Enclosed w/ Vinyl Soffit & Covered with Fascia

✓ Moisture Barrier - ${windowOptions.moisture_barrier === 'standard' ? '5/16" R-foil Reflective Moisture Barrier Insulation under Roof Steel' : 'Premium DripX Moisture Barrier Insulation under Roof Steel'}

✓ Clean-Up - Trash and Extra Material Will Be Removed Upon Completion.

✓ Drawings — CAD Drawings provided by Titan Buildings

✓ Permit — Titan Buildings to file for permit, Cost invoiced Separate to customer.`;

    return description;
  }, [dimensions, buildingType, windowOptions]);

  // Helper function to handle window options changes with immediate price update
  const handleWindowOptionChange = (updateFn: (prev: any) => any) => {
    setWindowOptions(updateFn);
    // Trigger immediate recalculation
    setTimeout(() => {
      if (dimensions.width && dimensions.length && masterItems.length > 0) {
        console.log('Recalculating pricing after window option change');
        autoCalculateAllPricingItems();
      }
    }, 100);
  };

  // Helper function to update existing items when dimensions change
  const updateExistingItemsForDimensionChange = () => {
    console.log('updateExistingItemsForDimensionChange called, current estimateItems:', estimateItems.length);
    const formulaDimensions = getFormulaDimensions();
    console.log('Using formulaDimensions:', formulaDimensions);
    
    setEstimateItems(prev => prev.map(item => {
      // Update items based on their unit type and dimensions
      
      // Items calculated by sq ft (floor area)
      if (item.unit_type === 'sq ft' && !item.unit_type.includes('wall') && !item.unit_type.includes('roof')) {
        let newQuantity = 0;
        
        // House items
        if (item.id.includes('house_') && formulaDimensions.width && formulaDimensions.length) {
          newQuantity = formulaDimensions.width * formulaDimensions.length;
        }
        // Garage items  
        else if (item.id.includes('garage_') && formulaDimensions.garageWidth && formulaDimensions.garageLength) {
          newQuantity = formulaDimensions.garageWidth * formulaDimensions.garageLength;
        }
        // Lean-to items
        else if (item.id.includes('leanto_') && windowOptions.leanTos.length > 0) {
          newQuantity = windowOptions.leanTos.reduce((total, leanto) => 
            total + (leanto.width * leanto.length * leanto.quantity), 0);
        }
        
        if (newQuantity > 0) {
          return {
            ...item,
            quantity: newQuantity,
            total: newQuantity * item.unit_price
          };
        }
      }
      
      // Items calculated by wall sq ft
      if (item.unit_type === 'wall sq ft') {
        let newQuantity = 0;
        
        // House wall calculations
        if (item.id.includes('house_') && formulaDimensions.width && formulaDimensions.length && formulaDimensions.height && formulaDimensions.pitch) {
          const { width, length, height, pitch } = formulaDimensions;
          const sideWalls = 2 * length * height;
          const endWalls = 2 * width * height;
          const gableHeight = (width / 2) * (pitch / 12);
          const gableTriangles = 2 * (0.5 * width * gableHeight);
          newQuantity = sideWalls + endWalls + gableTriangles;
        }
        // Garage wall calculations
        else if (item.id.includes('garage_') && formulaDimensions.garageWidth && formulaDimensions.garageLength && formulaDimensions.garageHeight && formulaDimensions.garagePitch) {
          const { garageWidth, garageLength, garageHeight, garagePitch } = formulaDimensions;
          const sideWalls = 2 * garageLength * garageHeight;
          const endWalls = 2 * garageWidth * garageHeight;
          const gableHeight = (garageWidth / 2) * (garagePitch / 12);
          const gableTriangles = 2 * (0.5 * garageWidth * gableHeight);
          newQuantity = sideWalls + endWalls + gableTriangles;
        }
        
        if (newQuantity > 0) {
          return {
            ...item,
            quantity: newQuantity,
            total: newQuantity * item.unit_price
          };
        }
      }
      
      // Items calculated by roof sq ft
      if (item.unit_type === 'roof sq ft') {
        let newQuantity = 0;
        
        // House roof area
        if (item.id.includes('house_') && formulaDimensions.roofArea) {
          newQuantity = formulaDimensions.roofArea;
        }
        // Garage roof area
        else if (item.id.includes('garage_') && formulaDimensions.garageRoofArea) {
          newQuantity = formulaDimensions.garageRoofArea;
        }
        
        if (newQuantity > 0) {
          return {
            ...item,
            quantity: newQuantity,
            total: newQuantity * item.unit_price
          };
        }
      }
      
      // Items calculated by linear ft (perimeter)
      if (item.unit_type === 'linear ft' || item.name.toLowerCase().includes('perimeter')) {
        let newQuantity = 0;
        
        // House perimeter
        if (item.id.includes('house_') && formulaDimensions.width && formulaDimensions.length) {
          newQuantity = 2 * (formulaDimensions.width + formulaDimensions.length);
        }
        // Garage perimeter
        else if (item.id.includes('garage_') && formulaDimensions.garageWidth && formulaDimensions.garageLength) {
          newQuantity = 2 * (formulaDimensions.garageWidth + formulaDimensions.garageLength);
        }
        // Lean-to perimeter
        else if (item.id.includes('leanto_') && windowOptions.leanTos.length > 0) {
          newQuantity = windowOptions.leanTos.reduce((total, leanto) => 
            total + (2 * (leanto.width + leanto.length) * leanto.quantity), 0);
        }
        
        if (newQuantity > 0) {
          return {
            ...item,
            quantity: newQuantity,
            total: newQuantity * item.unit_price
          };
        }
      }
      
      // Special cases for specific items (concrete, site prep, etc.)
      // House concrete items
      if (item.id.includes('house_concrete') && formulaDimensions.width && formulaDimensions.length) {
        const newQuantity = formulaDimensions.width * formulaDimensions.length;
        return {
          ...item,
          quantity: newQuantity,
          total: newQuantity * item.unit_price
        };
      }
      
      // Garage concrete items
      if (item.id.includes('garage_concrete') && formulaDimensions.garageWidth && formulaDimensions.garageLength) {
        const newQuantity = formulaDimensions.garageWidth * formulaDimensions.garageLength;
        return {
          ...item,
          quantity: newQuantity,
          total: newQuantity * item.unit_price
        };
      }
      
      // Lean-to concrete items
      if (item.id.includes('leanto_concrete') && windowOptions.leanTos.length > 0) {
        const newQuantity = windowOptions.leanTos.reduce((total, leanto) => 
          total + (leanto.width * leanto.length * leanto.quantity), 0);
        return {
          ...item,
          quantity: newQuantity,
          total: newQuantity * item.unit_price
        };
      }
      
      // Handle formula-based items
      if (item.has_formula && item.formula_type) {
        const formulaItem = {
          ...item,
          base_price: item.unit_price // EstimateLineItem uses unit_price, FormulaItem uses base_price
        };
        console.log(`Processing formula item ${item.name} with formula_type: ${item.formula_type}`, formulaItem);
        const formulaResult = FormulaService.calculatePrice(formulaItem, formulaDimensions);
        console.log(`Formula result for ${item.name}:`, formulaResult);
        if (formulaResult) {
          console.log(`Updating formula item ${item.name}: ${item.total} -> ${formulaResult.totalPrice}`);
          return {
            ...item,
            quantity: formulaResult.quantity,
            total: formulaResult.totalPrice
          };
        } else {
          console.log(`No formula result for ${item.name}, keeping original`);
        }
      }
      
      return item;
    }));
    
    console.log('updateExistingItemsForDimensionChange completed');
  };

  // Helper function to check if an item belongs to a specific option
  const checkIfItemBelongsToOption = (item: EstimateLineItem, optionId: string): boolean => {
    switch (optionId) {
      case 'concrete_pad':
        return item.name.toLowerCase().includes('concrete') && 
               item.name.toLowerCase().includes('floor');
      case 'site_prep':
        return item.name.toLowerCase().includes('site prep');
      case 'perimeter_insulation':
        return item.name.toLowerCase().includes('perimeter insulation');
      case 'wainscoting':
        return item.name.toLowerCase().includes('wainscoting') || 
               item.name.toLowerCase().includes('metal wainscoting');
      case 'greenposts':
        return item.name.toLowerCase().includes('green') && 
               item.name.toLowerCase().includes('post');
      case 'insulated_overhead_doors':
        return item.name.toLowerCase().includes('insulated overhead');
      case 'gutters':
        return item.name.toLowerCase().includes('gutter');
      case 'electrical':
        return item.name.toLowerCase().includes('electrical');
      default:
        // For other options, check if item name contains the option name
        return item.name.toLowerCase().includes(optionId.toLowerCase().replace('_', ' '));
    }
  };

  // Helper function to handle dimension changes with immediate price update
  const handleDimensionChange = (field: string, value: string) => {
    setDimensions(prev => ({ ...prev, [field]: value }));
    // Trigger immediate recalculation for base items and update existing selected items
    setTimeout(() => {
      // Use the new value instead of the potentially stale state
      const currentWidth = field === 'width' ? value : dimensions.width;
      const currentLength = field === 'length' ? value : dimensions.length;
      const currentHeight = field === 'height' ? value : dimensions.height;
      
      if (currentWidth && currentLength && masterItems.length > 0) {
        console.log('Recalculating pricing after dimension change');
        // Recalculate base building prices to reflect new dimensions
        recalculateBaseBuildingPrices(undefined, undefined, undefined, parseFloat(currentWidth), parseFloat(currentLength), parseFloat(currentHeight));
        // Update quantities for all existing selected items (preserves checkbox states)
        updateExistingItemsForDimensionChange();
        // Force UI re-render to update displayed option prices
        setRenderKey(prev => prev + 1);
      }
    }, 100);
  };

  // Handle option selection
  const handleOptionChange = (optionId: string, checked: boolean) => {
    console.log('=== OPTION CHANGE ===');
    console.log(`Option ${optionId} changed to ${checked}`);
    console.log('Current dimensions at toggle:', dimensions);
    
    setSelectedOptions(prev => 
      checked 
        ? [...prev, optionId]
        : prev.filter(id => id !== optionId)
    );

    // Add or remove specific item instead of full recalculation
    setTimeout(() => {
      console.log('Processing option change after state update');
      if (dimensions.width && dimensions.length && masterItems.length > 0) {
        console.log('Triggering updateExistingItemsForDimensionChange');
        console.log(`Updating pricing after ${optionId} change`);
        const formulaDimensions = getFormulaDimensions();
        
        if (checked) {
          // Add items for this option
          setEstimateItems(prev => {
            const newItems = [...prev];
            addItemsForOption(optionId, newItems, formulaDimensions);
            return newItems;
          });
        } else {
          // Remove items for this option
          setEstimateItems(prev => {
            return prev.filter(item => {
              // Check if this item belongs to the unchecked option
              const belongsToOption = checkIfItemBelongsToOption(item, optionId);
              return !belongsToOption;
            });
          });
        }
      }
    }, 100);
  };

  const handleSaveEstimate = async () => {
    if (!dimensions.width || !dimensions.height || !dimensions.length) {
      toast({
        title: "Error",
        description: "Please enter all dimensions",
        variant: "destructive"
      });
      return;
    }

    try {
      const total = calculateGrandTotal();
      console.log('Creating enhanced estimate - calculateGrandTotal:', total, 'estimateItems length:', estimateItems.length);
      const description = customDescription || generateDescription();
      
      const buildingTypeLabel = buildingType === 'barndominium' ? 'Barndominium' : 
                               buildingType === 'residential_garage' ? 'Residential Garage' : 'Commercial Building';
      
      // Generate detailed scope including all new features
      const scopeDetails = [];
      
      // Foundation details
      if (buildingType === 'commercial' || buildingType === 'barndominium') {
        scopeDetails.push('Concrete poured footers (standard)');
      }
      
      // Concrete details
      if (selectedOptions.includes('flooring')) {
        scopeDetails.push(`Excavate 4"-6" existing topsoil and place on property, add concrete base (select fill) tamp and prepare for concrete than Pour ${windowOptions.concrete_thickness}" 3500 psi fiber mesh reinforced smooth finish concrete floor inside building. Add 2' overhead door aprons and 4'x4' concrete pads at entry door locations. Concrete will be saw cut to control cracking`);
      }
      
      // Structural details
      scopeDetails.push(`Truss pitch: ${windowOptions.truss_pitch}, ${windowOptions.truss_spacing}' on center`);
      scopeDetails.push(`Post sizing: ${windowOptions.post_sizing.replace('_', ' ')}`);
      
      // Moisture barrier
      const moistureBarrierText = windowOptions.moisture_barrier === 'standard' 
        ? 'Standard 5/16" R-foil Reflective Moisture Barrier Insulation under Roof Steel'
        : 'Premium DripX Moisture Barrier Insulation under Roof Steel';
      scopeDetails.push(moistureBarrierText);
      
      // Gutters (always included)
      if (buildingType === 'commercial') {
        scopeDetails.push('6" seamless gutters and downspouts included');
      } else {
        scopeDetails.push('5" seamless gutters and downspouts included');
      }
      
      // Site plan
      if (windowOptions.site_plan !== 'none') {
        const planType = windowOptions.site_plan === 'standard' ? 'Standard site plan' : 
                        windowOptions.site_plan === 'lines_and_grade' ? 'Lines and grade plan' : 
                        'Upgraded lines and grade plan';
        scopeDetails.push(planType);
      }
      
      // Permit note
      scopeDetails.push('Titan Buildings to file for permit, Cost invoiced Separate to customer');
      
      const enhancedScope = `Complete ${buildingTypeLabel.toLowerCase()} construction as specified. ${scopeDetails.join('. ')}.`;

      const estimateData = {
        buildingType: buildingTypeLabel,
        dimensions: `${dimensions.width}x${dimensions.length}`,
        wallHeight: dimensions.height,
        estimatedPrice: total,
        description,
        scope: enhancedScope,
        timeline: '90-120 days',
        notes: `Enhanced estimate with detailed calculations. Garage doors: ${windowOptions.garageDoors.length}. Entry doors: ${windowOptions.entryDoors.length}. Lean-tos: ${windowOptions.leanTos.length}. Selected features: ${selectedOptions.join(', ')}`,
        detailedBreakdown: items
      };

      await estimatesService.createEstimate(lead, estimateData);
      onEstimateCreated?.(estimateData);
      
      toast({
        title: "Success",
        description: "Enhanced estimate saved successfully"
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save estimate",
        variant: "destructive"
      });
    }
  };

  const handleCreateQuickEstimate = async () => {
    console.log('Starting quick estimate creation with data:', {
      dimensions,
      buildingType,
      lead: lead?.id,
      selectedOptions
    });
    
    if (!dimensions.width || !dimensions.height || !dimensions.length) {
      toast({
        title: "Error",
        description: "Please enter all dimensions",
        variant: "destructive"
      });
      return;
    }

    try {
      const total = calculateGrandTotal();
      console.log('Creating quick written estimate - calculateGrandTotal:', total, 'estimateItems length:', estimateItems.length);
      const description = customDescription || generateDescription();
      
      const buildingTypeLabel = buildingType === 'barndominium' ? 'Barndominium' : 
                               buildingType === 'residential_garage' ? 'Residential Garage' : 'Commercial Building';
      
      // Format phone number for lead
      const formattedLead = {
        ...lead,
        phone: lead.phone ? formatPhoneNumber(lead.phone) : ''
      };
      
      const estimateData = {
        buildingType: buildingTypeLabel,
        dimensions: `${dimensions.width}' x ${dimensions.length}' x ${dimensions.height}'`,
        wallHeight: dimensions.height,
        estimatedPrice: total,
        description,
        scope: `Complete ${buildingTypeLabel.toLowerCase()} construction as specified. Includes ${selectedOptions.length} selected feature packages.`,
        timeline: '90-120 days to completion from permit approval',
        notes: `Enhanced estimate with detailed calculations. Garage doors: ${windowOptions.garageDoors.length}. Entry doors: ${windowOptions.entryDoors.length}. Selected features: ${selectedOptions.join(', ')}`,
        detailedBreakdown: {
          post_sizing: windowOptions.post_sizing,
          truss_pitch: windowOptions.truss_pitch,
          truss_spacing: windowOptions.truss_spacing,
          exterior_siding: windowOptions.exterior_siding,
          moisture_barrier: windowOptions.moisture_barrier,
          concrete_thickness: windowOptions.concrete_thickness,
          insulation_wall_finish: windowOptions.insulation_wall_finish,
          items: {
            ...items,
            garageDoors: windowOptions.garageDoors,
            entryDoors: windowOptions.entryDoors
          }
        }
      };

      console.log('Creating quick estimate with data:', estimateData);
      console.log('Lead data:', formattedLead);

      // Save to estimates database first to get the ID
      const estimate = await estimatesService.createEstimate(formattedLead, estimateData);
      await estimatesService.convertToQuickWrittenEstimate(estimate.id);
      
      // Create quick written estimate with the estimate ID for linking
      await estimateService.createQuickWrittenEstimate(formattedLead, estimateData, estimate.id);
      
      toast({
        title: "Success",
        description: "Quick written estimate created and saved"
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error in handleCreateQuickEstimate:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Full error details:', {
        error,
        leadData: lead,
        dimensions,
        selectedOptions,
        buildingType
      });
      
      toast({
        title: "Error",
        description: `Failed to create quick estimate: ${errorMessage}. Please ensure all fields are filled correctly and try again.`,
        variant: "destructive"
      });
    }
  };

  const handleCreateWrittenEstimate = async () => {
    console.log('Starting written estimate creation with data:', {
      dimensions,
      buildingType,
      lead: lead?.id,
      selectedOptions
    });
    
    if (!dimensions.width || !dimensions.height || !dimensions.length) {
      toast({
        title: "Error", 
        description: "Please fill in all building dimensions",
        variant: "destructive"
      });
      return;
    }

    try {
      const total = calculateGrandTotal();
      console.log('Creating written estimate - calculateGrandTotal:', total, 'estimateItems length:', estimateItems.length);
      
      // Generate description
      const description = customDescription || generateDescription();

      // Create estimate data
      const buildingTypeLabel = buildingType === 'barndominium' ? 'Barndominium' : 
                               buildingType === 'residential_garage' ? 'Residential Garage' : 'Commercial Building';
      
      const estimateData = {
        buildingType: buildingTypeLabel,
        dimensions: `${dimensions.width}' x ${dimensions.length}' x ${dimensions.height}'`,
        wallHeight: dimensions.height,
        estimatedPrice: total,
        description,
        scope: `Complete ${buildingTypeLabel.toLowerCase()} construction as specified including all selected features and options.`,
        timeline: "90-120 days to completion from permit approval",
        notes: `Full written estimate generated with ${selectedOptions.length} selected options`
      };

      console.log('Calling estimateService.createWrittenEstimate with:', {
        lead,
        estimateData
      });
      
      // Create written estimate document
      await estimateService.createWrittenEstimate(lead, estimateData);
      
      toast({
        title: "Success",
        description: "Written estimate created and saved"
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error in handleCreateWrittenEstimate:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Full error details:', {
        error,
        leadData: lead,
        dimensions,
        selectedOptions,
        buildingType
      });
      
      toast({
        title: "Error",
        description: `Failed to create written estimate: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Enhanced Estimate Builder - {lead.first_name} {lead.last_name}
          </DialogTitle>
        </DialogHeader>

        {/* Floating Lead Information and Estimate Summary */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b pb-4 mb-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lead Information */}
            <Card className="border-primary/20 bg-background/95 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Lead Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{lead.first_name} {lead.last_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{lead.phone ? formatPhoneNumber(lead.phone) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium text-xs">{lead.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source:</span>
                    <span className="font-medium">{lead.source || 'N/A'}</span>
                  </div>
                  {lead.city && lead.state && (
                    <div className="flex justify-between col-span-2">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{lead.city}, {lead.state}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Floating Estimate Summary */}
            <Card className="border-green-200 bg-background/95 backdrop-blur-sm dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Estimate Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Building Type:</span>
                    <span className="font-medium">{buildingType === 'barndominium' ? 'Barndominium' : 
                     buildingType === 'residential_garage' ? 'Residential Garage' : 'Commercial'}</span>
                  </div>
                  {dimensions.width && dimensions.length && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dimensions:</span>
                        <span className="font-medium">{dimensions.width}' × {dimensions.length}'{dimensions.height ? ` × ${dimensions.height}'` : ''}</span>
                      </div>
                       <div className="flex justify-between">
                         <span className="text-muted-foreground">Square Feet:</span>
                         <span className="font-medium">
                           {(() => {
                             const primarySqft = parseFloat(dimensions.width) * parseFloat(dimensions.length);
                             let secondSqft = 0;
                             
                             if (buildingType === 'barndominium' && dimensions.garageWidth && dimensions.garageLength) {
                               secondSqft = parseFloat(dimensions.garageWidth) * parseFloat(dimensions.garageLength);
                             } else if (buildingType !== 'barndominium' && windowOptions.connect_second_building && 
                                       windowOptions.second_building_width && windowOptions.second_building_length) {
                               secondSqft = parseFloat(windowOptions.second_building_width) * parseFloat(windowOptions.second_building_length);
                             }
                             
                             if (secondSqft > 0) {
                               const totalSqft = primarySqft + secondSqft;
                               return `${primarySqft.toLocaleString()} + ${secondSqft.toLocaleString()} = ${totalSqft.toLocaleString()}`;
                             } else {
                               return primarySqft.toLocaleString();
                             }
                           })()}
                         </span>
                       </div>
                       <div className="space-y-1">
                         <span className="text-muted-foreground">Features:</span>
                         <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                           {selectedOptions.length > 0 ? (
                             selectedOptions.map((option) => (
                               <div key={option} className="text-green-600 dark:text-green-400">
                                 ✓ {option.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                               </div>
                             ))
                           ) : (
                             <div className="text-muted-foreground text-xs">Base building only</div>
                           )}
                             {/* Show moisture barrier selection */}
                             <div className="text-green-600 dark:text-green-400">
                               ✓ Moisture Barrier: {windowOptions.moisture_barrier === 'premium' ? 'Premium DripX' : 'Standard 5/16" R-foil Reflective'}
                             </div>
                             
                             {/* Show master items with quantities > 0 */}
                             {masterItems.filter(item => (masterItemQuantities[item.id] || 0) > 0).map((item) => {
                               const quantity = masterItemQuantities[item.id] || 0;
                               return (
                                 <div key={item.id} className="text-green-600 dark:text-green-400">
                                   ✓ {item.name} ({quantity})
                                 </div>
                               );
                             })}
                             {/* Show other estimate items (non-master items, excluding moisture barrier duplicates) */}
                             {estimateItems.filter(item => 
                               !item.id.startsWith('base_building_') && 
                               !item.id.includes('moisture_barrier_premium')
                             ).map((item) => (
                               <div key={item.id} className="text-green-600 dark:text-green-400">
                                 ✓ {item.name}
                               </div>
                             ))}
                         </div>
                       </div>
                    </>
                  )}
                  <div className="col-span-2 pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 dark:text-green-400 font-medium">Total Investment:</span>
                        <span className="text-lg font-bold text-green-700 dark:text-green-400" key={renderKey}>
                          {formatCurrency(calculateGrandTotal())}
                        </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Previous Estimates Section */}
        <div className="mb-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Previous Estimates ({previousEstimates.length})
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreviousEstimates(!showPreviousEstimates)}
                >
                  {showPreviousEstimates ? 'Hide' : 'Show'} Previous Estimates
                </Button>
              </div>
            </CardHeader>
            
            {showPreviousEstimates && (
              <CardContent>
                {loadingEstimates ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Loading previous estimates...
                  </div>
                ) : previousEstimates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {previousEstimates.map((estimate, index) => (
                      <Card key={estimate.id} className="border-2 hover:border-primary transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              {editingVersionName === estimate.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={estimate.version_name || `Version ${index + 1}`}
                                    onChange={(e) => {
                                      setPreviousEstimates(prev => prev.map(est => 
                                        est.id === estimate.id 
                                          ? { ...est, version_name: e.target.value }
                                          : est
                                      ));
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleUpdateVersionName(estimate, estimate.version_name || `Version ${index + 1}`);
                                      } else if (e.key === 'Escape') {
                                        setEditingVersionName(null);
                                        loadPreviousEstimates(); // Reload to reset changes
                                      }
                                    }}
                                    className="text-sm h-8"
                                    autoFocus
                                  />
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => handleUpdateVersionName(estimate, estimate.version_name || `Version ${index + 1}`)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Save className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div 
                                  className="cursor-pointer hover:text-blue-600 flex items-center gap-1"
                                  onClick={() => setEditingVersionName(estimate.id)}
                                >
                                  <h4 className="font-medium">{estimate.version_name || `Version ${index + 1}`}</h4>
                                  <Edit className="h-3 w-3 opacity-50" />
                                </div>
                              )}
                              <p className="text-sm text-muted-foreground">
                                {new Date(estimate.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => loadEstimateData(estimate)}
                                className="gap-1 flex-1"
                              >
                                <Edit className="h-3 w-3" />
                                Load
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteEstimate(estimate)}
                                className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Type:</span>
                              <span className="font-medium">{estimate.building_type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Size:</span>
                              <span className="font-medium">{estimate.dimensions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Price:</span>
                              <span className="font-medium text-green-600">
                                ${(() => {
                                  console.log('Rendering price for estimate:', estimate.id, 'Price:', estimate.estimated_price, 'Formatted:', formatCurrency(Number(estimate.estimated_price) || 0));
                                  return formatCurrency(Number(estimate.estimated_price) || 0);
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Status:</span>
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                {estimate.status}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No previous estimates found</p>
                    <p className="text-xs">Create your first estimate below</p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {/* Full Width - Dimensions & Pricing Options */}
          <div className="space-y-6">
            {/* Building Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Building Type & Dimensions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 {/* Margin Input - Inconspicuous */}
                 <div className="mb-4 flex items-center gap-4 p-2 bg-muted/30 rounded border-dashed border">
                   <Label htmlFor="margin" className="text-xs text-muted-foreground">Adjustment</Label>
                   <Input
                     id="margin"
                     type="number"
                     value={marginPercentage}
                     onChange={(e) => setMarginPercentage(Number(e.target.value) || 0)}
                     placeholder="0"
                     className="w-16 h-7 text-xs"
                     min="0"
                     max="100"
                     step="0.1"
                   />
                   
                 </div>
                 
                 <div>
                   <Label htmlFor="buildingType">Building Type</Label>
                   <select
                     id="buildingType"
                     value={buildingType}
                     onChange={(e) => {
                       setBuildingType(e.target.value as ProjectType);
                       setSelectedOptions([]); // Reset options when building type changes
                     }}
                     className="w-full p-2 border border-input rounded-md bg-background"
                   >
                     <option value="barndominium">Barndominium</option>
                     <option value="residential_garage">Residential Garage</option>
                     <option value="commercial">Commercial Building</option>
                   </select>
                 </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="width">Width (ft)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={dimensions.width}
                      onChange={(e) => handleDimensionChange('width', e.target.value)}
                      placeholder="40"
                    />
                  </div>
                  <div>
                    <Label htmlFor="length">Length (ft)</Label>
                    <Input
                      id="length"
                      type="number"
                      value={dimensions.length}
                      onChange={(e) => handleDimensionChange('length', e.target.value)}
                      placeholder="60"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (ft)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={dimensions.height}
                      onChange={(e) => handleDimensionChange('height', e.target.value)}
                      placeholder="12"
                    />
                  </div>
                 </div>

                 {/* Refresh Pricing Button */}
                 <div className="flex justify-end">
                   <Button 
                     variant="outline" 
                     size="sm"
                     onClick={loadMasterPricing}
                     className="flex items-center gap-2"
                   >
                     <Calculator className="h-4 w-4" />
                     Refresh Pricing
                   </Button>
                 </div>

                 {/* Second Building Dimensions (for non-barndominium with connect option) */}
                {buildingType !== 'barndominium' && windowOptions.connect_second_building && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted/10">
                    <Label className="text-sm font-medium text-muted-foreground mb-3 block">
                      Building 2 Dimensions
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="secondWidth">Width (ft)</Label>
                        <Input
                          id="secondWidth"
                          type="number"
                          value={windowOptions.second_building_width || ''}
                          onChange={(e) => {
                            handleWindowOptionChange(prev => ({ 
                              ...prev, 
                              second_building_width: e.target.value 
                            }));
                          }}
                          placeholder="30"
                        />
                      </div>
                      <div>
                        <Label htmlFor="secondLength">Length (ft)</Label>
                        <Input
                          id="secondLength"
                          type="number"
                          value={windowOptions.second_building_length || ''}
                          onChange={(e) => {
                            handleWindowOptionChange(prev => ({ 
                              ...prev, 
                              second_building_length: e.target.value 
                            }));
                          }}
                          placeholder="60"
                        />
                      </div>
                      <div>
                        <Label htmlFor="secondHeight">Height (ft)</Label>
                        <Input
                          id="secondHeight"
                          type="number"
                          value={windowOptions.second_building_height || ''}
                          onChange={(e) => {
                            handleWindowOptionChange(prev => ({ 
                              ...prev, 
                              second_building_height: e.target.value 
                            }));
                          }}
                          placeholder="16"
                        />
                      </div>
                    </div>
                    {windowOptions.second_building_width && windowOptions.second_building_length && (
                      <div className="text-sm text-muted-foreground mt-2">
                        Building 2: {Number(windowOptions.second_building_width) * Number(windowOptions.second_building_length)} sq ft
                      </div>
                    )}
                  </div>
                )}

                {/* Barndominium Specific Fields */}
                {buildingType === 'barndominium' && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-base font-semibold mb-3">Barndominium Specifications</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      First floor dimensions use the main building dimensions above.
                    </p>
                    
                    {/* Second Floor */}
                    <div className="mb-4">
                      <div>
                        <Label htmlFor="secondFloorSqFt">Second Floor Sq Ft ($7/sq ft)</Label>
                        <Input
                          id="secondFloorSqFt"
                          type="number"
                          value={dimensions.secondFloorSqFt}
                          onChange={(e) => handleDimensionChange('secondFloorSqFt', e.target.value)}
                          placeholder="Second floor square feet"
                          className="mt-2"
                        />
                      </div>
                    </div>

                    {/* Garage (Barndominium) or Second Building Dimensions */}
                    {(buildingType === 'barndominium' || windowOptions.connect_second_building) && (
                      <div className="mb-4">
                        <Label className="text-sm font-medium text-muted-foreground">
                          {buildingType === 'barndominium' ? 'Garage Dimensions' : 'Building 2 Dimensions'}
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                          <div>
                            <Label htmlFor="garageWidth">Width (ft)</Label>
                            <Input
                              id="garageWidth"
                              type="number"
                              value={buildingType === 'barndominium' ? dimensions.garageWidth : windowOptions.second_building_width}
                              onChange={(e) => {
                                if (buildingType === 'barndominium') {
                                  handleDimensionChange('garageWidth', e.target.value);
                                } else {
                                  handleWindowOptionChange(prev => ({ 
                                    ...prev, 
                                    second_building_width: e.target.value 
                                  }));
                                }
                              }}
                              placeholder={`${buildingType === 'barndominium' ? 'Garage' : 'Building 2'} width`}
                            />
                          </div>
                          <div>
                            <Label htmlFor="garageLength">Length (ft)</Label>
                            <Input
                              id="garageLength"
                              type="number"
                              value={buildingType === 'barndominium' ? dimensions.garageLength : windowOptions.second_building_length}
                              onChange={(e) => {
                                if (buildingType === 'barndominium') {
                                  handleDimensionChange('garageLength', e.target.value);
                                } else {
                                  handleWindowOptionChange(prev => ({ 
                                    ...prev, 
                                    second_building_length: e.target.value 
                                  }));
                                }
                              }}
                              placeholder={`${buildingType === 'barndominium' ? 'Garage' : 'Building 2'} length`}
                            />
                          </div>
                          <div>
                            <Label htmlFor="garageHeight">Height (ft)</Label>
                            <Input
                              id="garageHeight"
                              type="number"
                              value={buildingType === 'barndominium' ? dimensions.garageHeight : windowOptions.second_building_height}
                              onChange={(e) => {
                                if (buildingType === 'barndominium') {
                                  handleDimensionChange('garageHeight', e.target.value);
                                } else {
                                  handleWindowOptionChange(prev => ({ 
                                    ...prev, 
                                    second_building_height: e.target.value 
                                  }));
                                }
                              }}
                              placeholder={`${buildingType === 'barndominium' ? 'Garage' : 'Building 2'} height`}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Interior Walls */}
                    <div>
                      <Label htmlFor="interiorWallsLf">Interior Walls Linear Feet</Label>
                      <Input
                        id="interiorWallsLf"
                        type="number"
                        value={dimensions.interiorWallsLf}
                        onChange={(e) => handleDimensionChange('interiorWallsLf', e.target.value)}
                        placeholder="Interior walls linear feet"
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}

                {dimensions.width && dimensions.length && buildingType === 'barndominium' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-muted rounded-lg">
                    <div className="text-center">
                      <Label className="text-sm font-medium">Total Barndominium Sq Ft</Label>
                      <p className="text-xl font-bold text-primary">
                        {(parseFloat(dimensions.width) * parseFloat(dimensions.length) + (parseFloat(dimensions.secondFloorSqFt || '0'))).toLocaleString()} sq ft
                      </p>
                      <p className="text-xs text-muted-foreground">
                        First Floor: {(parseFloat(dimensions.width) * parseFloat(dimensions.length)).toLocaleString()} + Second Floor: {parseFloat(dimensions.secondFloorSqFt || '0').toLocaleString()}
                      </p>
                    </div>
                    {dimensions.garageWidth && dimensions.garageLength && (
                      <div className="text-center">
                        <Label className="text-sm font-medium">Total Garage Sq Ft</Label>
                        <p className="text-xl font-bold text-primary">
                          {(parseFloat(dimensions.garageWidth) * parseFloat(dimensions.garageLength)).toLocaleString()} sq ft
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dimensions.garageWidth}' × {dimensions.garageLength}'
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {dimensions.width && dimensions.length && buildingType !== 'barndominium' && (
                  <div className={`mt-4 ${windowOptions.connect_second_building && dimensions.garageWidth && dimensions.garageLength ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''} p-3 bg-muted rounded-lg`}>
                    <div className="text-center">
                      <Label className="text-sm font-medium">Primary Building Sq Ft</Label>
                      <p className="text-xl font-bold text-primary">
                        {(parseFloat(dimensions.width) * parseFloat(dimensions.length)).toLocaleString()} sq ft
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dimensions.width}' × {dimensions.length}'
                      </p>
                    </div>
                    {windowOptions.connect_second_building && dimensions.garageWidth && dimensions.garageLength && (
                      <div className="text-center">
                        <Label className="text-sm font-medium">2nd Building Sq Ft</Label>
                        <p className="text-xl font-bold text-primary">
                          {(parseFloat(dimensions.garageWidth) * parseFloat(dimensions.garageLength)).toLocaleString()} sq ft
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dimensions.garageWidth}' × {dimensions.garageLength}'
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Structural Specifications */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-base font-semibold mb-3">Structural Specifications</h3>
                  
                  {/* Connect Second Building Option for Non-Barndominium */}
                  {buildingType !== 'barndominium' && (
                    <div className="mb-4 p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="connect-second-building"
                          checked={windowOptions.connect_second_building}
                          onCheckedChange={(checked) => {
                            handleWindowOptionChange(prev => ({ 
                              ...prev, 
                              connect_second_building: checked || false 
                            }));
                          }}
                        />
                        <Label htmlFor="connect-second-building" className="text-sm font-medium cursor-pointer">
                          Connect 2nd Building
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        Add specifications for a second connected building (e.g., 30x40 + 30x60)
                      </p>
                    </div>
                  )}
                  
                  <div className={`grid grid-cols-1 gap-4 ${
                    buildingType === 'barndominium' || windowOptions.connect_second_building ? 'md:grid-cols-2' : ''
                  }`}>
                    
                    {/* Primary Building Specifications */}
                    <div className="border rounded-lg p-3 bg-muted/10">
                      <h4 className="font-medium mb-2 text-sm text-center border-b pb-1">
                        {buildingType === 'barndominium' ? 'House' : 'Building'}
                      </h4>
                      <div className="space-y-3">
                        
                         {/* Roof Pitch */}
                         <div>
                           <Label className="text-sm font-medium mb-1 block">Roof Pitch</Label>
                           <div className="grid grid-cols-4 gap-1">
                             {['4/12', '5/12', '6/12', '7/12', '8/12', '9/12', '10/12'].map(pitch => (
                               <div key={`house-pitch-${pitch}`} className="flex items-center space-x-1">
                                 <Checkbox
                                   id={`house-pitch-${pitch}`}
                                   checked={windowOptions.truss_pitch === pitch}
                                   onCheckedChange={(checked) => {
                                     // Always set the pitch when clicked, regardless of checked state
                                     console.log('Pitch clicked:', pitch);
                                     handleWindowOptionChange(prev => ({ ...prev, truss_pitch: pitch }));
                                     setTimeout(() => {
                                       console.log('Recalculating prices after pitch change to:', pitch);
                                       recalculateBaseBuildingPrices(pitch);
                                       autoCalculateAllPricingItems();
                                     }, 100);
                                   }}
                                 />
                                 <Label htmlFor={`house-pitch-${pitch}`} className="text-sm cursor-pointer">
                                   {pitch}
                                 </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Post Calculation Display */}
                        {dimensions.width && dimensions.length && dimensions.height && (
                          <PostCalculationDisplay
                            title={buildingType === 'barndominium' ? 'Primary Building' : 'Building'}
                            inputs={{
                              building_width: parseFloat(dimensions.width),
                              building_length: parseFloat(dimensions.length),
                              building_height: parseFloat(dimensions.height),
                              roof_pitch: parseFloat(windowOptions.truss_pitch.split('/')[0])
                            }}
                          />
                        )}

                        {/* Truss Spacing & Post Sizing */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm font-medium mb-1 block">Spacing</Label>
                            <div className="space-y-1">
                              {[{value: '2', label: "2' OC"}, {value: '4', label: "4' OC"}].map(spacing => (
                                <div key={`house-spacing-${spacing.value}`} className="flex items-center space-x-1">
                                  <Checkbox
                                    id={`house-spacing-${spacing.value}`}
                                    checked={windowOptions.truss_spacing === spacing.value}
                                     onCheckedChange={(checked) => {
                                       // Always set the spacing when clicked, regardless of checked state
                                       console.log('Truss spacing changed to:', spacing.value);
                                       handleWindowOptionChange(prev => ({ ...prev, truss_spacing: spacing.value }));
                                       setTimeout(() => {
                                         console.log('Recalculating prices after truss spacing change to:', spacing.value);
                                         recalculateBaseBuildingPrices();
                                         autoCalculateAllPricingItems();
                                       }, 100);
                                     }}
                                  />
                                  <Label htmlFor={`house-spacing-${spacing.value}`} className="text-sm cursor-pointer">
                                    {spacing.label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>

                         {/* Moisture Barrier */}
                         <div>
                           <Label className="text-sm font-medium mb-1 block">Moisture Barrier</Label>
                              <div className="flex space-x-4">
                                  {[
                                    {value: 'standard', label: 'Standard', price: 0},
                                    {value: 'premium', label: 'Premium', price: (() => {
                                     const dripXItem = masterItems.find(item => 
                                       item.name.toLowerCase().includes('dripx') || 
                                       (item.name.toLowerCase().includes('moisture') && item.name.toLowerCase().includes('premium'))
                                     );
                                     const formulaDimensions = getFormulaDimensions();
                                     if (dripXItem && formulaDimensions.roofArea) {
                                       const basePrice = dripXItem.base_price * formulaDimensions.roofArea;
                                       const marginMultiplier = 1 / (1 - marginPercentage / 100);
                                       return basePrice * marginMultiplier;
                                     }
                                     return 0;
                                   })()}
                                ].map(barrier => (
                                <div key={`house-barrier-${barrier.value}`} className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id={`house-barrier-${barrier.value}`}
                                    name="moisture_barrier"
                                    value={barrier.value}
                                     checked={windowOptions.moisture_barrier === barrier.value}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                         console.log('Moisture barrier changed to:', barrier.value);
                                         console.log('Current windowOptions.moisture_barrier before change:', windowOptions.moisture_barrier);
                                         handleWindowOptionChange(prev => ({ ...prev, moisture_barrier: barrier.value }));
                                        setTimeout(() => {
                                          console.log('Recalculating prices after moisture barrier change to:', barrier.value);
                                          recalculateBaseBuildingPrices();
                                          autoCalculateAllPricingItems();
                                        }, 200);
                                      }
                                    }}
                                    className="w-4 h-4"
                                  />
                                   <Label htmlFor={`house-barrier-${barrier.value}`} className="text-sm cursor-pointer">
                                        {barrier.label} {barrier.price > 0 ? `(+${formatCurrency(barrier.price)})` : '($0)'}
                                   </Label>
                                </div>
                               ))}
                            </div>
                        </div>
                      </div>
                    </div>

                    {/* Garage Specifications (Barndominium only) or Second Building (Non-Barndominium with connection) */}
                    {(buildingType === 'barndominium' || windowOptions.connect_second_building) && (
                      <div className="border rounded-lg p-3 bg-muted/10">
                        <h4 className="font-medium mb-2 text-sm text-center border-b pb-1">
                          {buildingType === 'barndominium' ? 'Garage' : '2nd Building'}
                        </h4>
                        
                        <div className="space-y-3">
                        
                        {/* Roof Pitch */}
                        <div>
                          <Label className="text-sm font-medium mb-1 block">Roof Pitch</Label>
                          <div className="grid grid-cols-4 gap-1">
                            {['4/12', '5/12', '6/12', '7/12', '8/12', '9/12', '10/12'].map(pitch => {
                              const isBarndominiumGarage = buildingType === 'barndominium';
                              const currentValue = isBarndominiumGarage ? 
                                (windowOptions.garage_truss_pitch || "4/12") : 
                                (windowOptions.second_building_truss_pitch || "4/12");
                              const fieldToUpdate = isBarndominiumGarage ? 'garage_truss_pitch' : 'second_building_truss_pitch';
                              
                              return (
                                 <div key={`second-pitch-${pitch}`} className="flex items-center space-x-1">
                                   <Checkbox
                                     id={`second-pitch-${pitch}`}
                                     checked={currentValue === pitch}
                                     onCheckedChange={(checked) => {
                                       // Always set the pitch when clicked, regardless of checked state
                                       console.log('Second building pitch clicked:', pitch);
                                       handleWindowOptionChange(prev => ({ ...prev, [fieldToUpdate]: pitch }));
                                       setTimeout(() => {
                                         console.log('Recalculating prices after second building pitch change to:', pitch);
                                         // Pass the appropriate pitch value based on building type
                                         if (buildingType === 'barndominium') {
                                           recalculateBaseBuildingPrices(undefined, pitch); // Pass as garage pitch
                                         } else {
                                           recalculateBaseBuildingPrices(undefined, undefined, pitch); // Pass as second building pitch
                                         }
                                         autoCalculateAllPricingItems();
                                       }, 100);
                                     }}
                                   />
                                   <Label htmlFor={`second-pitch-${pitch}`} className="text-sm cursor-pointer">
                                     {pitch}
                                   </Label>
                                 </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Post Calculation Display for Second Building/Garage */}
                        {(() => {
                          const isBarndominiumGarage = buildingType === 'barndominium';
                          if (isBarndominiumGarage) {
                            // Garage for barndominium
                            if (dimensions.garageWidth && dimensions.garageLength && dimensions.garageHeight) {
                              return (
                                <PostCalculationDisplay
                                  title="Garage"
                                  inputs={{
                                    building_width: parseFloat(dimensions.garageWidth),
                                    building_length: parseFloat(dimensions.garageLength),
                                    building_height: parseFloat(dimensions.garageHeight),
                                    roof_pitch: parseFloat((windowOptions.garage_truss_pitch || "4/12").split('/')[0])
                                  }}
                                />
                              );
                            }
                          } else {
                            // Second building for non-barndominium
                            if (windowOptions.connect_second_building && 
                                windowOptions.second_building_width && 
                                windowOptions.second_building_length && 
                                windowOptions.second_building_height) {
                              return (
                                <PostCalculationDisplay
                                  title="Building 2"
                                  inputs={{
                                    building_width: parseFloat(windowOptions.second_building_width),
                                    building_length: parseFloat(windowOptions.second_building_length),
                                    building_height: parseFloat(windowOptions.second_building_height),
                                    roof_pitch: parseFloat((windowOptions.second_building_truss_pitch || "4/12").split('/')[0])
                                  }}
                                />
                              );
                            }
                          }
                          return null;
                        })()}

                        {/* Truss Spacing & Post Sizing */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm font-medium mb-1 block">Spacing</Label>
                            <div className="space-y-1">
                              {[{value: '2', label: "2' OC"}, {value: '4', label: "4' OC"}].map(spacing => {
                                const isBarndominiumGarage = buildingType === 'barndominium';
                                const currentValue = isBarndominiumGarage ? 
                                  (windowOptions.garage_truss_spacing || "2") : 
                                  (windowOptions.second_building_truss_spacing || "4");
                                const fieldToUpdate = isBarndominiumGarage ? 'garage_truss_spacing' : 'second_building_truss_spacing';
                                
                                return (
                                  <div key={`second-spacing-${spacing.value}`} className="flex items-center space-x-1">
                                    <Checkbox
                                      id={`second-spacing-${spacing.value}`}
                                      checked={currentValue === spacing.value}
                                       onCheckedChange={(checked) => {
                                         // Always set the spacing when clicked, regardless of checked state
                                         console.log('Second building truss spacing changed to:', spacing.value);
                                         handleWindowOptionChange(prev => ({ ...prev, [fieldToUpdate]: spacing.value }));
                                         setTimeout(() => {
                                           console.log('Recalculating prices after second building truss spacing change to:', spacing.value);
                                           recalculateBaseBuildingPrices();
                                           autoCalculateAllPricingItems();
                                         }, 100);
                                       }}
                                    />
                                    <Label htmlFor={`second-spacing-${spacing.value}`} className="text-sm cursor-pointer">
                                      {spacing.label}
                                    </Label>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                        </div>

                         {/* Moisture Barrier */}
                         <div>
                           <Label className="text-sm font-medium mb-1 block">Moisture Barrier</Label>
                            <div className="flex space-x-4">
                               {[
                                 {value: 'standard', label: 'Standard', price: 0},
                                 {value: 'premium', label: 'Premium', price: (() => {
                                   const dripXItem = masterItems.find(item => 
                                     item.name.toLowerCase().includes('dripx') || 
                                     (item.name.toLowerCase().includes('moisture') && item.name.toLowerCase().includes('premium'))
                                   );
                                   const formulaDimensions = getFormulaDimensions();
                                   const isBarndominiumGarage = buildingType === 'barndominium';
                                   const roofArea = isBarndominiumGarage ? formulaDimensions.garageRoofArea : 
                                     (windowOptions.second_building_width && windowOptions.second_building_length ? 
                                      parseFloat(windowOptions.second_building_width) * parseFloat(windowOptions.second_building_length) * Math.sqrt(1 + Math.pow(1/3, 2)) : 0);
                                    if (dripXItem && roofArea) {
                                      const basePrice = dripXItem.base_price * roofArea;
                                      const marginMultiplier = 1 / (1 - marginPercentage / 100);
                                      return basePrice * marginMultiplier;
                                    }
                                   return 0;
                                 })()}
                               ].map(barrier => {
                               const isBarndominiumGarage = buildingType === 'barndominium';
                               const currentValue = isBarndominiumGarage ? 
                                 (windowOptions.garage_moisture_barrier || "standard") : 
                                 (windowOptions.second_building_moisture_barrier || "standard");
                               const fieldToUpdate = isBarndominiumGarage ? 'garage_moisture_barrier' : 'second_building_moisture_barrier';
                               
                               return (
                                 <div key={`second-barrier-${barrier.value}`} className="flex items-center space-x-1">
                                   <Checkbox
                                     id={`second-barrier-${barrier.value}`}
                                     checked={currentValue === barrier.value}
                                      onCheckedChange={(checked) => {
                                        // Always set the moisture barrier when clicked, regardless of checked state
                                        console.log('Second building moisture barrier changed to:', barrier.value);
                                        handleWindowOptionChange(prev => ({ ...prev, [fieldToUpdate]: barrier.value }));
                                         setTimeout(() => {
                                           console.log('Recalculating prices after second building moisture barrier change to:', barrier.value);
                                           recalculateBaseBuildingPrices();
                                           autoCalculateAllPricingItems();
                                         }, 200);
                                      }}
                                   />
                                    <Label htmlFor={`second-barrier-${barrier.value}`} className="text-sm cursor-pointer">
                                      {barrier.label} {barrier.price > 0 ? `(+${formatCurrency(barrier.price)})` : '($0)'}
                                    </Label>
                                 </div>
                               );
                             })}
                           </div>
                        </div>
                      </div>
                    </div>
                    )}
                  </div>

                  {/* Site Plan - Global Setting */}
                  <div className="mt-3 pt-3 border-t">
                     <Label className="text-sm font-medium mb-1 block">Site Plan</Label>
                     <div className="flex space-x-4">
                       {[
                         {value: 'none', label: 'None', price: 0},
                         {value: 'standard', label: 'Standard', price: (() => {
                           const sitePlanItem = masterItems.find(item => 
                             item.category?.name.toLowerCase().includes('site') &&
                             item.name.toLowerCase().includes('standard') &&
                             item.name.toLowerCase().includes('site') &&
                             item.name.toLowerCase().includes('plan')
                           );
                            if (sitePlanItem) {
                              const basePrice = sitePlanItem.base_price;
                              const marginMultiplier = 1 / (1 - marginPercentage / 100);
                              return basePrice * marginMultiplier;
                            }
                           return 0;
                         })()},
                         {value: 'lines_and_grade', label: 'Lines & Grade', price: (() => {
                           const sitePlanItem = masterItems.find(item => 
                             item.category?.name.toLowerCase().includes('site') &&
                             item.name.toLowerCase().includes('lines') &&
                             item.name.toLowerCase().includes('grades')
                           );
                            if (sitePlanItem) {
                              const basePrice = sitePlanItem.base_price;
                              const marginMultiplier = 1 / (1 - marginPercentage / 100);
                              return basePrice * marginMultiplier;
                            }
                           return 0;
                         })()},
                         {value: 'upgraded_lines_and_grade', label: 'Upgraded Lines & Grade', price: (() => {
                           const sitePlanItem = masterItems.find(item => 
                             item.category?.name.toLowerCase().includes('site') &&
                             item.name.toLowerCase().includes('upgraded') &&
                             item.name.toLowerCase().includes('lines') &&
                             item.name.toLowerCase().includes('grades')
                           );
                            if (sitePlanItem) {
                              const basePrice = sitePlanItem.base_price;
                              const marginMultiplier = 1 / (1 - marginPercentage / 100);
                              return basePrice * marginMultiplier;
                            }
                           return 0;
                         })()}
                       ].map(plan => (
                         <div key={`site-plan-${plan.value}`} className="flex items-center space-x-1">
                           <input
                             type="radio"
                             id={`site-plan-${plan.value}`}
                             name="site-plan"
                             checked={windowOptions.site_plan === plan.value}
                              onChange={() => {
                                console.log('Site plan changed to:', plan.value);
                                
                                // Update state immediately
                                const newWindowOptions = {
                                  ...windowOptions,
                                  site_plan: plan.value
                                };
                                setWindowOptions(newWindowOptions);
                                
                                // Handle site plan changes directly in estimate items
                                setEstimateItems(prev => {
                                  // Remove any existing site plan items
                                  let filtered = prev.filter(item => item.category !== 'Site Plans');
                                  
                                  if (plan.value === 'none') {
                                    console.log('Removed site plan items, remaining items:', filtered.map(i => i.name));
                                    return filtered;
                                  }
                                  
                                  // Find and add the new site plan item
                                  let targetItem = null;
                                  if (plan.value === 'standard') {
                                    targetItem = masterItems.find(item => 
                                      item.category?.name.toLowerCase().includes('site') &&
                                      item.name.toLowerCase().includes('standard') &&
                                      item.name.toLowerCase().includes('site') &&
                                      item.name.toLowerCase().includes('plan')
                                    );
                                  } else if (plan.value === 'lines_and_grade') {
                                    targetItem = masterItems.find(item => 
                                      item.category?.name.toLowerCase().includes('site') &&
                                      item.name.toLowerCase().includes('lines') &&
                                      item.name.toLowerCase().includes('grades') &&
                                      !item.name.toLowerCase().includes('upgraded')
                                    );
                                  } else if (plan.value === 'upgraded_lines_and_grade') {
                                    targetItem = masterItems.find(item => 
                                      item.category?.name.toLowerCase().includes('site') &&
                                      item.name.toLowerCase().includes('upgraded') &&
                                      item.name.toLowerCase().includes('lines') &&
                                      item.name.toLowerCase().includes('grades')
                                    );
                                  }
                                  
                                  if (targetItem) {
                                    // Use base price without margin since it's already calculated in the display
                                    const sitePlanItem: EstimateLineItem = {
                                      id: `${targetItem.id}_${Date.now()}`,
                                      category: targetItem.category?.name || 'Site Plans',
                                      name: targetItem.name,
                                      quantity: 1,
                                      unit_price: targetItem.base_price,
                                      total: targetItem.base_price,
                                      unit_type: targetItem.unit_type,
                                      has_formula: targetItem.has_formula,
                                      formula_type: targetItem.formula_type,
                                      formula_result: null
                                    };
                                    
                                    filtered.push(sitePlanItem);
                                    console.log('Added site plan item:', sitePlanItem);
                                  }
                                  
                                  return filtered;
                                });
                              }}
                             className="h-4 w-4"
                           />
                            <Label htmlFor={`site-plan-${plan.value}`} className="text-sm cursor-pointer">
                              {plan.label} {plan.price > 0 && `(+${formatCurrency(plan.price)})`}
                            </Label>
                         </div>
                       ))}
                     </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lean-To Addition Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Lean-To Additions
                </CardTitle>
                <p className="text-sm text-muted-foreground">Add lean-to structures to your building</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Lean-To Form */}
                <div className="border rounded-lg p-4 bg-muted/20">
                  <h4 className="font-medium mb-3">Add New Lean-To</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="leanToWidth" className="text-sm">Width (ft)</Label>
                      <Input
                        id="leanToWidth"
                        type="number"
                        placeholder="Width"
                        value={leanToForm.width}
                        onChange={(e) => setLeanToForm(prev => ({ ...prev, width: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="leanToLength" className="text-sm">Length (ft)</Label>
                      <Input
                        id="leanToLength"
                        type="number"
                        placeholder="Length"
                        value={leanToForm.length}
                        onChange={(e) => setLeanToForm(prev => ({ ...prev, length: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="leanToHeight" className="text-sm">Height (ft)</Label>
                      <Input
                        id="leanToHeight"
                        type="number"
                        placeholder="Height"
                        value={leanToForm.height}
                        onChange={(e) => setLeanToForm(prev => ({ ...prev, height: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={addLeanTo}
                        disabled={!leanToForm.width || !leanToForm.length || !leanToForm.height}
                        className="w-full"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Lean-To
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasWraparound"
                        checked={leanToForm.hasWraparound}
                        onCheckedChange={(checked) => setLeanToForm(prev => ({ ...prev, hasWraparound: !!checked }))}
                      />
                      <Label htmlFor="hasWraparound" className="text-sm">Wraparound lean-to</Label>
                    </div>
                  </div>
                </div>

                {/* Current Lean-Tos List */}
                {windowOptions.leanTos.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Current Lean-To Additions ({windowOptions.leanTos.length})</h4>
                    <div className="space-y-2">
                      {windowOptions.leanTos.map((leanTo, index) => (
                        <div key={leanTo.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-medium">Lean-To #{index + 1}</span>
                              <span className="text-muted-foreground">
                                {leanTo.width}' W × {leanTo.length}' L × {leanTo.height}' H
                              </span>
                              <span className="text-muted-foreground">
                                ({(leanTo.width * leanTo.length).toLocaleString()} sq ft)
                              </span>
                              {leanTo.hasWraparound && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                  Wraparound
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const updated = [...windowOptions.leanTos];
                                  updated[index] = { ...updated[index], quantity: Math.max(1, updated[index].quantity - 1) };
                                  setWindowOptions(prev => ({ ...prev, leanTos: updated }));
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="mx-2 text-sm font-medium min-w-[20px] text-center">
                                {leanTo.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const updated = [...windowOptions.leanTos];
                                  updated[index] = { ...updated[index], quantity: updated[index].quantity + 1 };
                                  setWindowOptions(prev => ({ ...prev, leanTos: updated }));
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setWindowOptions(prev => ({
                                  ...prev,
                                  leanTos: prev.leanTos.filter(l => l.id !== leanTo.id)
                                }));
                              }}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lean-To Options */}
                {windowOptions.leanTos.length > 0 && (
                  <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                    <h4 className="font-medium mb-3 text-primary">Lean-To Options</h4>
                    <p className="text-sm text-muted-foreground mb-3">Choose between these popular lean-to configurations:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {masterItems
                        .filter(item => item.category?.name === 'Building Shell Addons')
                        .filter(item => item.name.toLowerCase().includes('lt open') || 
                                       item.name.toLowerCase().includes('lean') ||
                                       item.name.toLowerCase().includes('addition'))
                        .map(item => (
                          <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg bg-background hover:bg-muted/30 transition-colors">
                            <Checkbox
                              id={`leanto_option_${item.id}`}
                              checked={estimateItems.some(estItem => estItem.id.includes(item.id))}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  addItemToEstimate(item);
                                } else {
                                  setEstimateItems(prev => 
                                    prev.filter(estItem => !estItem.id.includes(item.id))
                                  );
                                }
                              }}
                            />
                            <div className="flex-1">
                              <Label htmlFor={`leanto_option_${item.id}`} className="font-medium cursor-pointer text-sm leading-tight">
                                {item.name}
                              </Label>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-1 leading-tight">{item.description}</p>
                              )}
                              <div className="text-xs text-muted-foreground mt-1">
                                {(() => {
                                  let totalPrice = 0;
                                  let quantity = 1;
                                  
                                  if (item.has_formula && item.formula_type && dimensions.width && dimensions.length) {
                                    const formulaDimensions = getFormulaDimensions();
                                    const formulaResult = FormulaService.calculatePrice(item, formulaDimensions);
                                    
                                    if (formulaResult) {
                                      totalPrice = formulaResult.totalPrice;
                                    }
                                  } else {
                                    // For lean-to items, calculate based on lean-to dimensions
                                    if (item.unit_type === 'sq ft') {
                                      quantity = windowOptions.leanTos.reduce((total, leanto) => 
                                        total + (leanto.width * leanto.length * leanto.quantity), 0);
                                    } else if (item.unit_type === 'linear ft') {
                                      quantity = windowOptions.leanTos.reduce((total, leanto) => 
                                        total + (2 * (leanto.width + leanto.length) * leanto.quantity), 0);
                                    } else {
                                      quantity = windowOptions.leanTos.reduce((sum, l) => sum + l.quantity, 0);
                                    }
                                    totalPrice = item.base_price * quantity;
                                  }
                                  
                                  // Apply margin
                                  const marginMultiplier = 1 / (1 - marginPercentage / 100);
                                  const finalPrice = totalPrice * marginMultiplier;
                                  
                                   return finalPrice > 0 ? 
                                      `Upgrade: +${formatCurrency(finalPrice)}` : 
                                      `${formatCurrency(item.base_price)} per ${item.unit_type}`;
                                })()}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Building Features & Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {buildingType === 'barndominium' ? 'Barndominium' : 
                   buildingType === 'residential_garage' ? 'Residential Garage' : 'Commercial Building'} Features & Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Removed hardcoded garage doors, entry doors, and windows sections - using master pricing instead */}

                {/* Master Pricing Options */}
                <div className="space-y-4">
                  <div className="mb-4">
                    <h4 className="font-medium text-base mb-2">Additional Features & Options</h4>
                    <p className="text-sm text-muted-foreground">Select from available options pulled from master pricing</p>
                  </div>
                  
                  {getFilteredCategories().map(category => (
                    <Collapsible key={category.id} defaultOpen={false}>
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-between p-3 h-auto border rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                        >
                          <span className="font-medium text-sm text-primary">{category.name}</span>
                          <ChevronDown className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                        </Button>
                      </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3">
                        {/* Special handling for Concrete/Foundation category to add thickness selector */}
                        {(category.name === 'Foundation' || category.name.toLowerCase().includes('concrete')) && (
                          <div className="mb-4 p-4 border rounded-lg bg-background" key={`concrete-${JSON.stringify(windowOptions.entryDoors)}-${JSON.stringify(windowOptions.garageDoors)}-${renderKey}`}>
                            <h4 className="font-medium text-sm mb-3">Concrete & Site Options</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label className="text-sm font-medium mb-2 block">
                                  {buildingType === 'barndominium' ? 'House' : 'Building'}
                                </Label>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="house-no-concrete"
                                   checked={windowOptions.concrete_thickness === 'none'}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setWindowOptions(prev => ({ ...prev, concrete_thickness: 'none', site_prep_house: false }));
                                            setEstimateItems(prev => prev.filter(item => !item.id.includes('house_concrete') && !item.id.includes('house_site_prep')));
                                          }
                                        }}
                                    />
                                    <Label htmlFor="house-no-concrete" className="text-sm cursor-pointer">
                                      No Concrete
                                    </Label>
                                  </div>
                                   {['4', '5', '6'].map(thickness => (
                                     <div key={`house-${thickness}`} className="flex items-center space-x-2">
                                       <Checkbox
                                         id={`house-concrete-${thickness}`}
                                         checked={windowOptions.concrete_thickness === thickness}
                                               onCheckedChange={(checked) => {
                                                 if (checked) {
                                                   setWindowOptions(prev => ({ ...prev, concrete_thickness: thickness, site_prep_house: true }));
                                                   // Remove any existing concrete items first
                                                   setEstimateItems(prev => prev.filter(item => !item.name.toLowerCase().includes('concrete') && !item.id.includes('site_prep')));
                                                   // Then add the new concrete and site prep items
                                                   addConcreteToEstimate(thickness, 'house');
                                                   addSitePrepToEstimate('house');
                                                 } else {
                                                   setWindowOptions(prev => ({ ...prev, concrete_thickness: 'none', site_prep_house: false }));
                                                   setEstimateItems(prev => prev.filter(item => !item.name.toLowerCase().includes('concrete') && !item.id.includes('site_prep')));
                                                 }
                                               }}
                                       />
                                         <Label htmlFor={`house-concrete-${thickness}`} className="text-sm cursor-pointer">
                                            {(() => {
                                              const concreteItem = masterItems.find(item => 
                                                item.name.toLowerCase().includes('concrete') && 
                                                item.name.includes(`${thickness}"`)
                                              );
                                              if (concreteItem && dimensions.width && dimensions.length) {
                                                const sqFt = parseFloat(dimensions.width) * parseFloat(dimensions.length);
                                                
                                                // Add door concrete - aggregate from both estimateItems and windowOptions (fallback)
                                                let additionalSqFt = 0;

                                                // 1) From estimateItems if present
                                                const normalize = (s: string) => s.toLowerCase();

                                                const entryDoorsFromItems = estimateItems.filter(i => {
                                                  const n = normalize(i.name || '');
                                                  return n.includes('entry door') || n.includes("solid entry") || n.includes("9-lite entry") || n.includes("glass sliding door");
                                                });
                                                entryDoorsFromItems.forEach(door => {
                                                  const qty = Number(door.quantity) || 0;
                                                  if (qty > 0) {
                                                    additionalSqFt += 16 * qty;
                                                    console.log(`[Concrete] Entry door from estimateItems: ${door.name} x${qty} => +${16 * qty} sq ft`);
                                                  }
                                                });

                                                const garageDoorsFromItems = estimateItems.filter(i => normalize(i.name || '').includes('garage door'));
                                                garageDoorsFromItems.forEach(door => {
                                                  const qty = Number(door.quantity) || 0;
                                                  const width = extractGarageDoorWidth(door.name);
                                                  if (qty > 0 && width > 0) {
                                                    const sq = (width + 2) * 6 * qty;
                                                    additionalSqFt += sq;
                                                    console.log(`[Concrete] Garage door from estimateItems: ${door.name} (w=${width}) x${qty} => +${sq} sq ft`);
                                                  }
                                                });

                                                // 2) Also include selections from master item quantities (new UI)
                                                const entryDoorItemsForLabel = getEntryDoorItems();
                                                entryDoorItemsForLabel.forEach(mi => {
                                                  const qty = Number(masterItemQuantities[mi.id]) || 0;
                                                  if (qty > 0) {
                                                    const name = mi.name.toLowerCase();
                                                    const isSix = /(^|[^0-9])6(['’]|\s*x)/i.test(mi.name) || name.includes("6'") || name.includes('6’');
                                                    additionalSqFt += (isSix ? 32 : 16) * qty;
                                                  }
                                                });
                                                const garageDoorItemsForLabel = getGarageDoorItems();
                                                garageDoorItemsForLabel.forEach(mi => {
                                                  const qty = Number(masterItemQuantities[mi.id]) || 0;
                                                  if (qty > 0) {
                                                    const w = extractGarageDoorWidth(mi.name);
                                                    additionalSqFt += (w + 2) * 6 * qty;
                                                  }
                                                });

                                                // 3) Finally, fallback to windowOptions if still nothing found
                                                if (additionalSqFt === 0) {
                                                  // Entry doors: 16 sq ft each
                                                  const entryQty = (windowOptions.entryDoors || []).reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
                                                  if (entryQty > 0) {
                                                    additionalSqFt += 16 * entryQty;
                                                    console.log(`[Concrete] Fallback entry doors from windowOptions: qty=${entryQty} => +${16 * entryQty} sq ft`);
                                                  }

                                                  // Garage doors using selected master item to parse width
                                                  (windowOptions.garageDoors || []).forEach(d => {
                                                    const selectedItem = masterItems.find(m => m.id === d.selectedItemId);
                                                    const qty = Number(d.quantity) || 0;
                                                    if (selectedItem && qty > 0) {
                                                      const w = extractGarageDoorWidth(selectedItem.name);
                                                      if (w > 0) {
                                                        const sq = (w + 2) * 6 * qty;
                                                        additionalSqFt += sq;
                                                        console.log(`[Concrete] Fallback garage door from windowOptions: ${selectedItem.name} (w=${w}) x${qty} => +${sq} sq ft`);
                                                      }
                                                    }
                                                  });
                                                }
                                                
                                                console.log(`Concrete calculation: Base ${sqFt} sq ft + ${additionalSqFt} door concrete = ${sqFt + additionalSqFt} total`);
                                                const totalSqFt = sqFt + additionalSqFt;
                                                const marginMultiplier = 1 / (1 - marginPercentage / 100);
                                                const priceWithMargin = concreteItem.base_price * marginMultiplier;
                                                const concreteTotal = totalSqFt * priceWithMargin;
                                                
                                                return `${thickness}" Thick Concrete - ${concreteTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}`;
                                              }
                                              return `${thickness}" Thick Concrete`;
                                            })()}
                                         </Label>
                                     </div>
                                   ))}
                                  <div className="flex items-center space-x-2">
                                     <Checkbox
                                       id="house-site-prep"
                                       checked={windowOptions.site_prep_house || false}
                                       disabled={windowOptions.concrete_thickness !== 'none'}
                                       onCheckedChange={(checked) => {
                                         if (checked) {
                                           setWindowOptions(prev => ({ ...prev, site_prep_house: checked as boolean }));
                                           addSitePrepToEstimate('house');
                                         } else {
                                           setWindowOptions(prev => ({ ...prev, site_prep_house: checked as boolean }));
                                           setEstimateItems(prev => prev.filter(item => !item.id.includes('house_site_prep')));
                                         }
                                       }}
                                    />
                                     <Label htmlFor="house-site-prep" className="text-sm cursor-pointer">
                                       Site Prep ${(() => {
                                         const sitePrepItem = masterItems.find(item => 
                                           item.name.toLowerCase().includes('site') && item.name.toLowerCase().includes('prep')
                                         );
                                         if (sitePrepItem && dimensions.width && dimensions.length) {
                                           const sqFt = parseFloat(dimensions.width) * parseFloat(dimensions.length);
                                           const marginMultiplier = 1 / (1 - marginPercentage / 100);
                                           const priceWithMargin = sitePrepItem.base_price * marginMultiplier;
                                            const total = sqFt * priceWithMargin;
                                            return `- ${total.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}`;
                                         }
                                         return '';
                                       })()}
                                     </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="house-perimeter-insulation"
                                      checked={windowOptions.perimeter_insulation_house || false}
                                       onCheckedChange={(checked) => {
                                         if (checked) {
                                           setWindowOptions(prev => ({ ...prev, perimeter_insulation_house: checked as boolean }));
                                           addPerimeterInsulationToEstimate('house');
                                         } else {
                                           setWindowOptions(prev => ({ ...prev, perimeter_insulation_house: checked as boolean }));
                                           setEstimateItems(prev => prev.filter(item => !item.id.includes('house_perimeter_insulation')));
                                         }
                                       }}
                                    />
                                     <Label htmlFor="house-perimeter-insulation" className="text-sm cursor-pointer">
                                       Perimeter Insulation ${(() => {
                                         const perimeterItem = masterItems.find(item => 
                                           item.name.toLowerCase().includes('perimeter') && 
                                           item.name.toLowerCase().includes('insulation')
                                         );
                                         if (perimeterItem && dimensions.width && dimensions.length) {
                                           const perimeter = 2 * (parseFloat(dimensions.width) + parseFloat(dimensions.length));
                                           const marginMultiplier = 1 / (1 - marginPercentage / 100);
                                           const priceWithMargin = perimeterItem.base_price * marginMultiplier;
                                            const total = perimeter * priceWithMargin;
                                            return `- ${total.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}`;
                                         }
                                         return '';
                                       })()}
                                     </Label>
                                  </div>
                                </div>
                              </div>
                              
                              {(buildingType === 'barndominium' || windowOptions.connect_second_building) && (
                                <div>
                                  <Label className="text-sm font-medium mb-2 block">
                                    {buildingType === 'barndominium' ? 'Garage' : '2nd Building'}
                                  </Label>
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id="second-no-concrete"
                                        checked={buildingType === 'barndominium' ? 
                                          windowOptions.garage_concrete_thickness === 'none' :
                                          windowOptions.second_building_concrete_thickness === 'none'}
                                          onCheckedChange={(checked) => {
                                             if (checked) {
                                               const field = buildingType === 'barndominium' ? 'garage_concrete_thickness' : 'second_building_concrete_thickness';
                                               setWindowOptions(prev => ({ ...prev, [field]: 'none' }));
                                               setEstimateItems(prev => prev.filter(item => !item.id.includes('garage_concrete')));
                                             }
                                           }}
                                      />
                                      <Label htmlFor="garage-no-concrete" className="text-sm cursor-pointer">
                                        No Concrete
                                      </Label>
                                    </div>
                                    {['4', '5', '6'].map(thickness => (
                                      <div key={`garage-${thickness}`} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`second-concrete-${thickness}`}
                                          checked={buildingType === 'barndominium' ? 
                                            windowOptions.garage_concrete_thickness === thickness :
                                            windowOptions.second_building_concrete_thickness === thickness}
                                           onCheckedChange={(checked) => {
                                               if (checked) {
                                                 const field = buildingType === 'barndominium' ? 'garage_concrete_thickness' : 'second_building_concrete_thickness';
                                                 setWindowOptions(prev => ({ ...prev, [field]: thickness }));
                                                 addConcreteToEstimate(thickness, 'garage');
                                               } else {
                                                 const field = buildingType === 'barndominium' ? 'garage_concrete_thickness' : 'second_building_concrete_thickness';
                                                 setWindowOptions(prev => ({ ...prev, [field]: 'none' }));
                                                 setEstimateItems(prev => prev.filter(item => !item.id.includes('garage_concrete')));
                                               }
                                             }}
                                        />
                                        <Label htmlFor={`garage-concrete-${thickness}`} className="text-sm cursor-pointer">
                                          {thickness}" Thick Concrete
                                        </Label>
                                      </div>
                                    ))}
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id="second-site-prep"
                                        checked={buildingType === 'barndominium' ? 
                                          (windowOptions.site_prep_garage || false) :
                                          (windowOptions.site_prep_second_building || false)}
                                         onCheckedChange={(checked) => {
                                           if (checked) {
                                             const field = buildingType === 'barndominium' ? 'site_prep_garage' : 'site_prep_second_building';
                                             setWindowOptions(prev => ({ ...prev, [field]: checked as boolean }));
                                             addSitePrepToEstimate('garage');
                                           } else {
                                             const field = buildingType === 'barndominium' ? 'site_prep_garage' : 'site_prep_second_building';
                                             setWindowOptions(prev => ({ ...prev, [field]: checked as boolean }));
                                             setEstimateItems(prev => prev.filter(item => !item.id.includes('garage_site_prep')));
                                           }
                                         }}
                                      />
                                      <Label htmlFor="garage-site-prep" className="text-sm cursor-pointer">
                                        Site Prep
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id="garage-perimeter-insulation"
                                        checked={windowOptions.perimeter_insulation_garage || false}
                                         onCheckedChange={(checked) => {
                                           if (checked) {
                                             setWindowOptions(prev => ({ ...prev, perimeter_insulation_garage: checked as boolean }));
                                             addPerimeterInsulationToEstimate('garage');
                                           } else {
                                             setWindowOptions(prev => ({ ...prev, perimeter_insulation_garage: checked as boolean }));
                                             setEstimateItems(prev => prev.filter(item => !item.id.includes('garage_perimeter_insulation')));
                                           }
                                         }}
                                      />
                                      <Label htmlFor="garage-perimeter-insulation" className="text-sm cursor-pointer">
                                        Perimeter Insulation
                                      </Label>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {windowOptions.leanTos.length > 0 && windowOptions.leanTos.map((leanTo, index) => (
                                <div key={`leanto-${index}`}>
                                  <Label className="text-sm font-medium mb-2 block">
                                    {windowOptions.leanTos.length > 1 ? `Lean-To ${index + 1}` : 'Lean-To'}
                                  </Label>
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`leanto-${index}-no-concrete`}
                                        checked={
                                          windowOptions.leanTos.length > 1 
                                            ? (index === 0 ? windowOptions.leanto1_concrete_thickness === 'none' : windowOptions.leanto2_concrete_thickness === 'none')
                                            : windowOptions.leanto_concrete_thickness === 'none'
                                        }
                                          onCheckedChange={(checked) => {
                                             if (checked) {
                                               if (windowOptions.leanTos.length > 1) {
                                                 const field = index === 0 ? 'leanto1_concrete_thickness' : 'leanto2_concrete_thickness';
                                                 setWindowOptions(prev => ({ ...prev, [field]: 'none' }));
                                                 setEstimateItems(prev => prev.filter(item => !item.id.includes(`leanto${index + 1}_concrete`)));
                                               } else {
                                                 setWindowOptions(prev => ({ ...prev, leanto_concrete_thickness: 'none' }));
                                                 setEstimateItems(prev => prev.filter(item => !item.id.includes('leanto_concrete')));
                                               }
                                             }
                                           }}
                                      />
                                      <Label htmlFor={`leanto-${index}-no-concrete`} className="text-sm cursor-pointer">
                                        No Concrete
                                      </Label>
                                    </div>
                                    {['4', '5', '6'].map(thickness => (
                                      <div key={`leanto-${index}-${thickness}`} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`leanto-${index}-concrete-${thickness}`}
                                          checked={
                                            windowOptions.leanTos.length > 1
                                              ? (index === 0 ? windowOptions.leanto1_concrete_thickness === thickness : windowOptions.leanto2_concrete_thickness === thickness)
                                              : windowOptions.leanto_concrete_thickness === thickness
                                          }
                                             onCheckedChange={(checked) => {
                                               if (checked) {
                                                 if (windowOptions.leanTos.length > 1) {
                                                   const field = index === 0 ? 'leanto1_concrete_thickness' : 'leanto2_concrete_thickness';
                                                   setWindowOptions(prev => ({ ...prev, [field]: thickness }));
                                                   addConcreteToEstimate(thickness, index === 0 ? 'leanto1' : 'leanto2');
                                                 } else {
                                                   setWindowOptions(prev => ({ ...prev, leanto_concrete_thickness: thickness }));
                                                   addConcreteToEstimate(thickness, 'leanto');
                                                 }
                                               } else {
                                                 if (windowOptions.leanTos.length > 1) {
                                                   const field = index === 0 ? 'leanto1_concrete_thickness' : 'leanto2_concrete_thickness';
                                                   setWindowOptions(prev => ({ ...prev, [field]: 'none' }));
                                                   setEstimateItems(prev => prev.filter(item => !item.id.includes(`leanto${index + 1}_concrete`)));
                                                 } else {
                                                   setWindowOptions(prev => ({ ...prev, leanto_concrete_thickness: 'none' }));
                                                   setEstimateItems(prev => prev.filter(item => !item.id.includes('leanto_concrete')));
                                                 }
                                               }
                                             }}
                                        />
                                        <Label htmlFor={`leanto-${index}-concrete-${thickness}`} className="text-sm cursor-pointer">
                                          {thickness}" Thick Concrete
                                        </Label>
                                      </div>
                                    ))}
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`leanto-${index}-site-prep`}
                                        checked={
                                          windowOptions.leanTos.length > 1
                                            ? (index === 0 ? windowOptions.site_prep_leanto1 || false : windowOptions.site_prep_leanto2 || false)
                                            : windowOptions.site_prep_leanto || false
                                        }
                                         onCheckedChange={(checked) => {
                                           if (checked) {
                                             if (windowOptions.leanTos.length > 1) {
                                               const field = index === 0 ? 'site_prep_leanto1' : 'site_prep_leanto2';
                                               setWindowOptions(prev => ({ ...prev, [field]: checked as boolean }));
                                               addSitePrepToEstimate(index === 0 ? 'leanto1' : 'leanto2');
                                             } else {
                                               setWindowOptions(prev => ({ ...prev, site_prep_leanto: checked as boolean }));
                                               addSitePrepToEstimate('leanto');
                                             }
                                           } else {
                                             if (windowOptions.leanTos.length > 1) {
                                               const field = index === 0 ? 'site_prep_leanto1' : 'site_prep_leanto2';
                                               setWindowOptions(prev => ({ ...prev, [field]: checked as boolean }));
                                               setEstimateItems(prev => prev.filter(item => !item.id.includes(`leanto${index + 1}_site_prep`)));
                                             } else {
                                               setWindowOptions(prev => ({ ...prev, site_prep_leanto: checked as boolean }));
                                               setEstimateItems(prev => prev.filter(item => !item.id.includes('leanto_site_prep')));
                                             }
                                           }
                                         }}
                                      />
                                      <Label htmlFor={`leanto-${index}-site-prep`} className="text-sm cursor-pointer">
                                        Site Prep
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`leanto-${index}-perimeter-insulation`}
                                        checked={
                                          windowOptions.leanTos.length > 1
                                            ? (index === 0 ? windowOptions.perimeter_insulation_leanto1 || false : windowOptions.perimeter_insulation_leanto2 || false)
                                            : windowOptions.perimeter_insulation_leanto || false
                                        }
                                         onCheckedChange={(checked) => {
                                           if (checked) {
                                             if (windowOptions.leanTos.length > 1) {
                                               const field = index === 0 ? 'perimeter_insulation_leanto1' : 'perimeter_insulation_leanto2';
                                               setWindowOptions(prev => ({ ...prev, [field]: checked as boolean }));
                                               addPerimeterInsulationToEstimate(index === 0 ? 'leanto1' : 'leanto2');
                                             } else {
                                               setWindowOptions(prev => ({ ...prev, perimeter_insulation_leanto: checked as boolean }));
                                               addPerimeterInsulationToEstimate('leanto');
                                             }
                                           } else {
                                             if (windowOptions.leanTos.length > 1) {
                                               const field = index === 0 ? 'perimeter_insulation_leanto1' : 'perimeter_insulation_leanto2';
                                               setWindowOptions(prev => ({ ...prev, [field]: checked as boolean }));
                                               setEstimateItems(prev => prev.filter(item => !item.id.includes(`leanto${index + 1}_perimeter_insulation`)));
                                             } else {
                                               setWindowOptions(prev => ({ ...prev, perimeter_insulation_leanto: checked as boolean }));
                                               setEstimateItems(prev => prev.filter(item => !item.id.includes('leanto_perimeter_insulation')));
                                             }
                                           }
                                         }}
                                      />
                                      <Label htmlFor={`leanto-${index}-perimeter-insulation`} className="text-sm cursor-pointer">
                                        Perimeter Insulation
                                      </Label>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                              Select concrete thickness and additional options for each building area. Choose "No Concrete" to exclude concrete from that area.
                            </p>
                          </div>
                         )}
                        
                        {/* Special handling for Mechanicals category to add plumbing calculator */}
                        {category.name === 'Mechanicals' && (buildingType === 'barndominium' || buildingType === 'commercial') && (
                          <div className="mb-4 p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-sm">Plumbing Calculator</h4>
                                <p className="text-xs text-muted-foreground">Use our detailed plumbing calculator for accurate estimates</p>
                              </div>
                              <Button
                                onClick={() => setShowPlumbingCalculator(true)}
                                className="flex items-center gap-2"
                                size="sm"
                              >
                                <Calculator className="h-4 w-4" />
                                Calculate Plumbing
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {getFilteredItems(category.id).map(item => (
                            <div key={item.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                               <div className="space-y-3">
                                 {/* Master item display - checkbox removed, now auto-includes based on quantity */}
                                 <div className="flex items-start space-x-3">
                                   <div className="flex-1">
                                     <Label className="font-medium cursor-pointer text-sm leading-tight">
                                       {item.name}
                                     </Label>
                                     {item.description && (
                                       <p className="text-xs text-muted-foreground mt-1 leading-tight">{item.description}</p>
                                     )}
                                      <div className="text-xs text-muted-foreground mt-1">
                                       {(() => {
                                          // Check if this is a lean-to item and if lean-tos exist
                                          const isLeanToItem = item.name.toLowerCase().includes('lean') || item.name.toLowerCase().includes('addition') || item.name.toLowerCase().startsWith('lt ');
                                          console.log(`Item: ${item.name}, isLeanToItem: ${isLeanToItem}, leanTos.length: ${windowOptions.leanTos.length}`);
                                          if (isLeanToItem && windowOptions.leanTos.length === 0) {
                                            return '';
                                          }
                                         
                                         // Calculate total price with margin for upgrade options
                                         let totalPrice = 0;
                                         let quantity = 1;
                                         
                                          if (item.has_formula && item.formula_type && dimensions.width && dimensions.length) {
                                            const formulaDimensions = getFormulaDimensions();
                                            const formulaResult = FormulaService.calculatePrice(item, formulaDimensions);
                                            
                                            if (formulaResult) {
                                              totalPrice = formulaResult.totalPrice;
                                            }
                                          } else {
                                            // For lean-to items, calculate based on lean-to dimensions only if lean-tos exist
                                            if (isLeanToItem && windowOptions.leanTos.length > 0) {
                                              if (item.unit_type === 'sq ft') {
                                                quantity = windowOptions.leanTos.reduce((total, leanto) => 
                                                  total + (leanto.width * leanto.length * leanto.quantity), 0);
                                              } else if (item.unit_type === 'linear ft') {
                                                quantity = windowOptions.leanTos.reduce((total, leanto) => 
                                                  total + (2 * (leanto.width + leanto.length) * leanto.quantity), 0);
                                              } else {
                                                quantity = windowOptions.leanTos.reduce((sum, l) => sum + l.quantity, 0);
                                              }
                                              totalPrice = item.base_price * quantity;
                                              console.log(`Lean-to calculation for ${item.name}: base_price=${item.base_price}, quantity=${quantity}, totalPrice=${totalPrice}`);
                                            } else if (!isLeanToItem) {
                                              // For non-lean-to items, use main building dimensions
                                              if (item.unit_type === 'sq ft' && dimensions.width && dimensions.length) {
                                                quantity = parseFloat(dimensions.width) * parseFloat(dimensions.length);
                                              } else if (item.unit_type === 'linear ft' && dimensions.width && dimensions.length) {
                                                quantity = 2 * (parseFloat(dimensions.width) + parseFloat(dimensions.length));
                                              }
                                              totalPrice = item.base_price * quantity;
                                            }
                                            // For lean-to items with no lean-tos added, totalPrice stays 0 and will show base price
                                         }
                                         
                                         // Apply margin
                                         const marginMultiplier = 1 / (1 - marginPercentage / 100);
                                         const finalPrice = totalPrice * marginMultiplier;
                                         
                                           return finalPrice > 0 ? 
                                              `Upgrade: +${formatCurrency(finalPrice)}` : 
                                              `${formatCurrency(item.base_price)} per ${item.unit_type}`;
                                       })()}
                                     </div>
                                  </div>
                                </div>
                                
                                {/* Quantity input for doors and windows */}
                                {isDoorOrWindow(item) && (
                                  <div className="space-y-3 pl-6">
                                    <div className="flex items-center gap-2">
                                      <Label htmlFor={`qty_${item.id}`} className="text-xs font-medium">Qty:</Label>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => updateMasterItemQuantity(item.id, (masterItemQuantities[item.id] || 0) - 1)}
                                          className="h-6 w-6 p-0"
                                          disabled={(masterItemQuantities[item.id] || 0) <= 0}
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                        <Input
                                          id={`qty_${item.id}`}
                                          type="number"
                                          value={masterItemQuantities[item.id] || 0}
                                          onChange={(e) => updateMasterItemQuantity(item.id, Number(e.target.value))}
                                          className="w-14 h-6 text-xs text-center"
                                          min="0"
                                          step="1"
                                        />
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => updateMasterItemQuantity(item.id, (masterItemQuantities[item.id] || 0) + 1)}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Garage Door specific options */}
                                    {isGarageDoor(item) && masterItemQuantities[item.id] > 0 && (
                                      <div className="space-y-3 p-3 bg-muted/30 rounded border">
                                        <div className="text-xs font-medium">Garage Door Options:</div>
                                        
                                        <div className="grid grid-cols-1 gap-3">
                                          {/* Row of Windows */}
                                          <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                              <Checkbox
                                                id={`windows_${item.id}`}
                                                checked={garageDoorOptions[item.id]?.hasWindows || false}
                                                onCheckedChange={(checked) => 
                                                  updateGarageDoorOptions(item.id, { 
                                                    hasWindows: checked as boolean,
                                                    windowQuantity: checked ? (garageDoorOptions[item.id]?.windowQuantity || 1) : 0
                                                  })
                                                }
                                              />
                                              <Label htmlFor={`windows_${item.id}`} className="text-xs">
                                                Add Row of Windows ({formatCurrency(200)} each)
                                              </Label>
                                            </div>
                                            {garageDoorOptions[item.id]?.hasWindows && (
                                              <div className="flex items-center gap-2 ml-6">
                                                <Label className="text-xs">Qty:</Label>
                                                <div className="flex items-center gap-1">
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => updateGarageDoorOptions(item.id, { 
                                                      windowQuantity: Math.max(0, (garageDoorOptions[item.id]?.windowQuantity || 1) - 1),
                                                      hasWindows: (garageDoorOptions[item.id]?.windowQuantity || 1) > 1
                                                    })}
                                                    className="h-5 w-5 p-0"
                                                    disabled={(garageDoorOptions[item.id]?.windowQuantity || 0) <= 1}
                                                  >
                                                    <Minus className="h-2 w-2" />
                                                  </Button>
                                                  <Input
                                                    type="number"
                                                    value={garageDoorOptions[item.id]?.windowQuantity || 1}
                                                    onChange={(e) => updateGarageDoorOptions(item.id, { 
                                                      windowQuantity: Math.max(1, Number(e.target.value))
                                                    })}
                                                    className="w-10 h-5 text-xs text-center"
                                                    min="1"
                                                    step="1"
                                                  />
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => updateGarageDoorOptions(item.id, { 
                                                      windowQuantity: (garageDoorOptions[item.id]?.windowQuantity || 1) + 1
                                                    })}
                                                    className="h-5 w-5 p-0"
                                                  >
                                                    <Plus className="h-2 w-2" />
                                                  </Button>
                                                </div>
                                                 <span className="text-xs text-muted-foreground">
                                                   = {formatCurrency((garageDoorOptions[item.id]?.windowQuantity || 1) * 200)}
                                                 </span>
                                              </div>
                                            )}
                                          </div>
                                          
                                          {/* Garage Door Opener */}
                                          <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                              <Checkbox
                                                id={`opener_${item.id}`}
                                                checked={garageDoorOptions[item.id]?.hasOpener || false}
                                                onCheckedChange={(checked) => 
                                                  updateGarageDoorOptions(item.id, { 
                                                    hasOpener: checked as boolean,
                                                    openerQuantity: checked ? Math.max(1, garageDoorOptions[item.id]?.openerQuantity || 1) : 0
                                                  })
                                                }
                                              />
                                              <Label htmlFor={`opener_${item.id}`} className="text-xs">
                                                Add Opener (${getOpenerPrice(item.name)} each)
                                              </Label>
                                            </div>
                                            {garageDoorOptions[item.id]?.hasOpener && (
                                              <div className="flex items-center gap-2 ml-6">
                                                <Label className="text-xs">Qty:</Label>
                                                <div className="flex items-center gap-1">
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => updateGarageDoorOptions(item.id, { 
                                                      openerQuantity: Math.max(0, (garageDoorOptions[item.id]?.openerQuantity || 1) - 1),
                                                      hasOpener: (garageDoorOptions[item.id]?.openerQuantity || 1) > 1
                                                    })}
                                                    className="h-5 w-5 p-0"
                                                    disabled={(garageDoorOptions[item.id]?.openerQuantity || 0) <= 1}
                                                  >
                                                    <Minus className="h-2 w-2" />
                                                  </Button>
                                                   <Input
                                                     type="number"
                                                     value={garageDoorOptions[item.id]?.openerQuantity ?? 1}
                                                     onChange={(e) => updateGarageDoorOptions(item.id, { 
                                                       openerQuantity: Math.max(1, Number(e.target.value) || 1)
                                                     })}
                                                     className="w-10 h-5 text-xs text-center"
                                                     min="1"
                                                     step="1"
                                                   />
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => updateGarageDoorOptions(item.id, { 
                                                      openerQuantity: (garageDoorOptions[item.id]?.openerQuantity || 1) + 1
                                                    })}
                                                    className="h-5 w-5 p-0"
                                                  >
                                                    <Plus className="h-2 w-2" />
                                                  </Button>
                                                </div>
                                                 <span className="text-xs text-muted-foreground">
                                                   = {formatCurrency((garageDoorOptions[item.id]?.openerQuantity || 1) * getOpenerPrice(item.name))}
                                                 </span>
                                              </div>
                                            )}
                                          </div>
                                          
                                          <div className="space-y-1">
                                            <Label className="text-xs font-medium">Track Type:</Label>
                                            <div className="w-full text-xs p-2 border border-input rounded bg-muted">
                                              {(() => {
                                                const trackType = getTrackType(item.name);
                                                const buildingHeight = getTallestBuildingHeight();
                                                const doorHeight = getGarageDoorHeight(item.name);
                                                const heightDiff = buildingHeight - doorHeight;
                                                
                                                if (trackType === 'high_lift') {
                                                  return `High Lift Track (+${formatCurrency(250)}) - Building ${heightDiff.toFixed(1)}' taller than door`;
                                                } else if (trackType === 'low_headroom') {
                                                  return `Low Headroom Track (+${formatCurrency(300)}) - Building ${Math.abs(heightDiff).toFixed(1)}' shorter than standard`;
                                                } else {
                                                  return `Standard Track - Building exactly 2' taller than door`;
                                                }
                                              })()}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Total display */}
                                    {masterItemQuantities[item.id] > 0 && (
                                      <div className="text-xs font-medium">
                                         <span className="text-primary">
                                            Total: {(() => {
                                              if (isGarageDoor(item)) {
                                                const total = calculateGarageDoorTotal(item);
                                                console.log(`Garage door total calculation for ${item.name}: total=${total}`);
                                                return formatCurrency(total);
                                              } else {
                                                const baseTotal = item.base_price * masterItemQuantities[item.id];
                                                const marginMultiplier = 1 / (1 - marginPercentage / 100);
                                                const finalTotal = baseTotal * marginMultiplier;
                                                console.log(`Window total calculation for ${item.name}: base_price=${item.base_price}, quantity=${masterItemQuantities[item.id]}, baseTotal=${baseTotal}, marginMultiplier=${marginMultiplier}, finalTotal=${finalTotal}`);
                                                return formatCurrency(finalTotal);
                                              }
                                            })()}
                                         </span>
                                         {isGarageDoor(item) && (
                                            <span className="text-muted-foreground ml-2">
                                              (Base: {formatCurrency(item.base_price * masterItemQuantities[item.id])})
                                            </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </CardContent>
            </Card>


            {/* Custom Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Auto-generated:</strong> {generateDescription()}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="customDescription">Custom Description (Optional)</Label>
                    <Textarea
                      id="customDescription"
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      placeholder="Override the auto-generated description with your own..."
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSaveEstimate}>
              Save Estimate
            </Button>
            <Button variant="outline" onClick={handleCreateQuickEstimate} className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Estimate
            </Button>
            <Button onClick={handleCreateWrittenEstimate} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Written Estimate
            </Button>
          </div>
        </div>
      </DialogContent>
      
    </Dialog>
    
    {/* Plumbing Calculator Dialog - Separate from main dialog to avoid nesting */}
    <Dialog open={showPlumbingCalculator} onOpenChange={setShowPlumbingCalculator}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <PlumbingCalculator
          onCalculationComplete={handlePlumbingCalculated}
        />
      </DialogContent>
    </Dialog>
  </>
  );
};

export default UnifiedEstimateForm;