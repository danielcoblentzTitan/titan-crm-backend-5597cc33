import { useState, useCallback, useMemo } from "react";
import { FeeItem } from "./CategorySection";

export type ProjectType = 'barndominium' | 'residential_garage' | 'commercial';

export interface ProjectDetails {
  projectType: ProjectType;
  sqft: number; // Auto-calculated from dimensions
  finishedSqft?: number; // Auto-calculated from dimensions
  unfinishedSqft?: number; // Auto-calculated from dimensions
  // Basic dimensions for commercial/residential garage
  width?: number;
  length?: number;
  height?: number;
  // Finished space dimensions (barndominium only)
  finishedWidth?: number;
  finishedLength?: number;
  finishedHeight?: number;
  // Unfinished space dimensions (barndominium only)
  unfinishedWidth?: number;
  unfinishedLength?: number;
  unfinishedHeight?: number;
  floors?: number; // For barndominiums (1 or 2)
  acres: number;
  doors: number;
  walkDoors: number;
  kitchenCabinets: number;
  bathrooms: number;
}

interface SavedStatement {
  projectId: string;
  items: FeeItem[];
  projectDetails: ProjectDetails;
  profitMargin: number;
  lastSaved: string;
  locked?: boolean;
}

// Fee structures for different project types
const BARNDOMINIUM_FEES: Omit<FeeItem, 'id' | 'quantity' | 'total'>[] = [
  // Site Work & Foundation
  { category: "Site Work & Foundation", description: "Site Preparation & Clearing", unit: "acre", unitPrice: 3500 },
  { category: "Site Work & Foundation", description: "Excavation & Grading", unit: "sq ft", unitPrice: 2.50 },
  { category: "Site Work & Foundation", description: "Concrete Slab", unit: "sq ft", unitPrice: 8.50 },
  { category: "Site Work & Foundation", description: "Vapor Barrier & Insulation", unit: "sq ft", unitPrice: 1.75 },
  
  // Structure & Framing
  { category: "Structure & Framing", description: "Lumber Frame Structure", unit: "sq ft", unitPrice: 12.00 },
  { category: "Structure & Framing", description: "Metal Roof System", unit: "sq ft", unitPrice: 6.50 },
  { category: "Structure & Framing", description: "Metal Siding", unit: "sq ft", unitPrice: 5.25 },
  { category: "Structure & Framing", description: "Overhead Doors", unit: "each", unitPrice: 1800 },
  { category: "Structure & Framing", description: "Walk-in Doors", unit: "each", unitPrice: 450 },
  
  // Finished Space (Higher Cost)
  { category: "Finished Space", description: "Electrical Rough-in (Finished)", unit: "finished sq ft", unitPrice: 6.50 },
  { category: "Finished Space", description: "Plumbing Rough-in (Finished)", unit: "finished sq ft", unitPrice: 8.00 },
  { category: "Finished Space", description: "Wall Insulation (R-19)", unit: "finished sq ft", unitPrice: 2.25 },
  { category: "Finished Space", description: "Drywall & Finishing", unit: "finished sq ft", unitPrice: 4.75 },
  { category: "Finished Space", description: "Interior Paint", unit: "finished sq ft", unitPrice: 2.50 },
  { category: "Finished Space", description: "Flooring (LVP)", unit: "finished sq ft", unitPrice: 5.50 },
  { category: "Finished Space", description: "Kitchen Cabinets", unit: "linear ft", unitPrice: 125 },
  { category: "Finished Space", description: "Bathroom Vanities", unit: "each", unitPrice: 850 },
  
  // Unfinished Space (Lower Cost)
  { category: "Unfinished Space", description: "Basic Electrical (Unfinished)", unit: "unfinished sq ft", unitPrice: 2.50 },
  { category: "Unfinished Space", description: "Concrete Sealing", unit: "unfinished sq ft", unitPrice: 1.25 },
  { category: "Unfinished Space", description: "Liner Panel Ceiling", unit: "unfinished sq ft", unitPrice: 3.75 },
  { category: "Unfinished Space", description: "Liner Panel Walls", unit: "unfinished sq ft", unitPrice: 4.25 },
  { category: "Unfinished Space", description: "Drywall Walls", unit: "unfinished sq ft", unitPrice: 3.50 },
  { category: "Unfinished Space", description: "Drywall Ceilings", unit: "unfinished sq ft", unitPrice: 3.25 },
  
  // Stairs (2-Floor Only)
  { category: "Structure & Framing", description: "Interior Stairs", unit: "each", unitPrice: 4500 },
  
  // Permits & Management
  { category: "Permits & Inspections", description: "Delaware Building Permit", unit: "each", unitPrice: 850 },
  { category: "Permits & Inspections", description: "Impact Fees", unit: "each", unitPrice: 1200 },
  { category: "Permits & Inspections", description: "Inspections Package", unit: "each", unitPrice: 650 },
  { category: "Permits & Inspections", description: "Project Manager Fee", unit: "each", unitPrice: 5000 },
  { category: "Permits & Inspections", description: "Septic System Connection", unit: "each", unitPrice: 8500 },
];

const RESIDENTIAL_GARAGE_FEES: Omit<FeeItem, 'id' | 'quantity' | 'total'>[] = [
  // Site Work & Foundation
  { category: "Site Work & Foundation", description: "Site Preparation", unit: "sq ft", unitPrice: 1.50 },
  { category: "Site Work & Foundation", description: "Concrete Slab", unit: "sq ft", unitPrice: 7.50 },
  { category: "Site Work & Foundation", description: "Vapor Barrier", unit: "sq ft", unitPrice: 1.25 },
  
  // Structure & Framing
  { category: "Structure & Framing", description: "Lumber Frame Structure", unit: "sq ft", unitPrice: 8.50 },
  { category: "Structure & Framing", description: "Roof System", unit: "sq ft", unitPrice: 5.50 },
  { category: "Structure & Framing", description: "Siding", unit: "sq ft", unitPrice: 4.25 },
  { category: "Structure & Framing", description: "Overhead Doors", unit: "each", unitPrice: 1200 },
  { category: "Structure & Framing", description: "Walk-in Doors", unit: "each", unitPrice: 350 },
  
  // Electrical & Basic Systems
  { category: "Electrical & Systems", description: "Basic Electrical", unit: "sq ft", unitPrice: 2.25 },
  { category: "Electrical & Systems", description: "Electrical Panel", unit: "each", unitPrice: 1800 },
  
  // Permits & Management
  { category: "Permits & Inspections", description: "Building Permit", unit: "each", unitPrice: 450 },
  { category: "Permits & Inspections", description: "Inspections", unit: "each", unitPrice: 350 },
  { category: "Permits & Inspections", description: "Project Management", unit: "each", unitPrice: 2500 },
];

const COMMERCIAL_FEES: Omit<FeeItem, 'id' | 'quantity' | 'total'>[] = [
  // Site Work & Foundation
  { category: "Site Work & Foundation", description: "Site Preparation & Clearing", unit: "acre", unitPrice: 5000 },
  { category: "Site Work & Foundation", description: "Excavation & Grading", unit: "sq ft", unitPrice: 3.50 },
  { category: "Site Work & Foundation", description: "Commercial Concrete Slab", unit: "sq ft", unitPrice: 12.50 },
  { category: "Site Work & Foundation", description: "Vapor Barrier & Insulation", unit: "sq ft", unitPrice: 2.25 },
  
  // Structure & Framing  
  { category: "Structure & Framing", description: "Steel Frame Structure", unit: "sq ft", unitPrice: 18.00 },
  { category: "Structure & Framing", description: "Commercial Roof System", unit: "sq ft", unitPrice: 9.50 },
  { category: "Structure & Framing", description: "Commercial Siding", unit: "sq ft", unitPrice: 7.25 },
  { category: "Structure & Framing", description: "Commercial Overhead Doors", unit: "each", unitPrice: 3500 },
  { category: "Structure & Framing", description: "Commercial Entry Doors", unit: "each", unitPrice: 750 },
  
  // Commercial Systems
  { category: "Commercial Systems", description: "Commercial Electrical", unit: "sq ft", unitPrice: 8.50 },
  { category: "Commercial Systems", description: "Commercial Electrical Panel", unit: "each", unitPrice: 5500 },
  { category: "Commercial Systems", description: "HVAC System", unit: "sq ft", unitPrice: 12.00 },
  { category: "Commercial Systems", description: "Fire Safety Systems", unit: "sq ft", unitPrice: 3.50 },
  
  // Permits & Management
  { category: "Permits & Inspections", description: "Commercial Building Permit", unit: "each", unitPrice: 2500 },
  { category: "Permits & Inspections", description: "Commercial Impact Fees", unit: "each", unitPrice: 5000 },
  { category: "Permits & Inspections", description: "Commercial Inspections", unit: "each", unitPrice: 1500 },
  { category: "Permits & Inspections", description: "Project Manager Fee", unit: "each", unitPrice: 8500 },
];

const getDefaultFeesForType = (projectType: ProjectType): Omit<FeeItem, 'id' | 'quantity' | 'total'>[] => {
  switch (projectType) {
    case 'barndominium':
      return BARNDOMINIUM_FEES;
    case 'residential_garage':
      return RESIDENTIAL_GARAGE_FEES;
    case 'commercial':
      return COMMERCIAL_FEES;
    default:
      return BARNDOMINIUM_FEES;
  }
};

export const useStatementData = (projectId: string, initialProjectType: ProjectType = 'barndominium') => {
  const [items, setItems] = useState<FeeItem[]>(() => {
    const saved = localStorage.getItem(`statement-${projectId}`);
    if (saved) {
      try {
        const parsedSaved: SavedStatement = JSON.parse(saved);
        return parsedSaved.items;
      } catch (error) {
        console.error('Error loading saved statement:', error);
      }
    }
    
    const defaultFees = getDefaultFeesForType(initialProjectType);
    return defaultFees.map((item, index) => ({
      ...item,
      id: `default-${index}`,
      quantity: 0,
      total: 0
    }));
  });
  
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>(() => {
    const saved = localStorage.getItem(`statement-${projectId}`);
    if (saved) {
      try {
        const parsedSaved: SavedStatement = JSON.parse(saved);
        return parsedSaved.projectDetails;
      } catch (error) {
        console.error('Error loading saved project details:', error);
      }
    }
    
    return {
      projectType: initialProjectType,
      sqft: 0,
      finishedSqft: 0,
      unfinishedSqft: 0,
      width: 0,
      length: 0,
      height: initialProjectType === 'commercial' ? 16 : 12,
      finishedWidth: 0,
      finishedLength: 0,
      finishedHeight: 10,
      unfinishedWidth: 0,
      unfinishedLength: 0,
      unfinishedHeight: 14,
      floors: 1,
      acres: 0,
      doors: 1,
      walkDoors: 2,
      kitchenCabinets: 20,
      bathrooms: 2
    };
  });
  
  const [profitMargin, setProfitMargin] = useState(() => {
    const saved = localStorage.getItem(`statement-${projectId}`);
    if (saved) {
      try {
        const parsedSaved: SavedStatement = JSON.parse(saved);
        return parsedSaved.profitMargin;
      } catch (error) {
        console.error('Error loading saved profit margin:', error);
      }
    }
    
    return 20;
  });

  const formatNumber = useCallback((value: number) => {
    return Math.round(value * 100) / 100;
  }, []);

  // Calculate square footage from dimensions
  const calculateSquareFootage = useCallback((details: ProjectDetails): ProjectDetails => {
    if (details.projectType === 'barndominium') {
      // Barndominium uses separate finished/unfinished calculations
      const finishedSqft = (details.finishedWidth || 0) * (details.finishedLength || 0);
      const unfinishedSqft = (details.unfinishedWidth || 0) * (details.unfinishedLength || 0);
      const totalSqft = finishedSqft + unfinishedSqft;

      return {
        ...details,
        finishedSqft: formatNumber(finishedSqft),
        unfinishedSqft: formatNumber(unfinishedSqft),
        sqft: formatNumber(totalSqft)
      };
    } else {
      // Commercial and residential garage use single width x length calculation
      const totalSqft = (details.width || 0) * (details.length || 0);
      
      return {
        ...details,
        sqft: formatNumber(totalSqft)
      };
    }
  }, [formatNumber]);

  const updateItem = useCallback((itemId: string, field: keyof FeeItem, value: number | string) => {
    setItems(prevItems => 
      prevItems.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { 
            ...item, 
            [field]: typeof value === 'number' ? formatNumber(value) : value
          };
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.total = formatNumber(updatedItem.quantity * updatedItem.unitPrice);
          }
          return updatedItem;
        }
        return item;
      })
    );
  }, [formatNumber]);

  const addNewItem = useCallback((category: string) => {
    const newItem: FeeItem = {
      id: `custom-${Date.now()}`,
      category,
      description: "New Item",
      unit: "each",
      quantity: 0,
      unitPrice: 0,
      total: 0
    };
    
    setItems(prevItems => [...prevItems, newItem]);
  }, []);

  const deleteItem = useCallback((itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  }, []);

  const autoCalculateQuantities = useCallback(() => {
    setItems(prevItems => 
      prevItems.map(item => {
        let quantity = item.quantity; // Keep existing quantity by default
        let shouldAutoCalculate = false;
        
        // Auto-calculate based on unit type and project details
        if (item.unit === "sq ft") {
          if (item.description.includes("Lumber Frame") || 
              item.description.includes("Metal Roof") || 
              item.description.includes("Metal Siding") ||
              item.description.includes("Steel Frame") ||
              item.description.includes("Commercial Roof") ||
              item.description.includes("Commercial Siding") ||
              item.description.includes("Roof System") ||
              item.description.includes("Siding")) {
            // Structure items use total building square footage
            quantity = projectDetails.sqft;
            shouldAutoCalculate = true;
          } else if (item.description.includes("Site Preparation")) {
            // Site prep based on total footprint
            quantity = projectDetails.sqft;
            shouldAutoCalculate = true;
          } else if (item.description.includes("Concrete Slab") || item.description.includes("Commercial Concrete Slab")) {
            // Concrete slab uses total sq ft
            quantity = projectDetails.sqft;
            shouldAutoCalculate = true;
          } else if (item.description.includes("Vapor Barrier")) {
            // Vapor barrier uses total sq ft (matches "Vapor Barrier" and "Vapor Barrier & Insulation")
            quantity = projectDetails.sqft;
            shouldAutoCalculate = true;
          } else if (item.description.includes("Basic Electrical") && item.category === "Electrical & Systems") {
            // Basic electrical for garages uses total sq ft
            quantity = projectDetails.sqft;
            shouldAutoCalculate = true;
          } else if (item.description.includes("Commercial Electrical")) {
            // Commercial electrical uses total sq ft
            quantity = projectDetails.sqft;
            shouldAutoCalculate = true;
          } else if (item.description.includes("HVAC System")) {
            // HVAC uses total sq ft
            quantity = projectDetails.sqft;
            shouldAutoCalculate = true;
          } else if (item.description.includes("Fire Safety Systems")) {
            // Fire safety uses total sq ft
            quantity = projectDetails.sqft;
            shouldAutoCalculate = true;
          } else if (item.description.includes("Excavation") || item.description.includes("Grading")) {
            // Excavation and grading use total sq ft with 10% overage
            quantity = projectDetails.sqft * 1.1;
            shouldAutoCalculate = true;
          }
        } else if (item.unit === "finished sq ft") {
          // For 2 floors, interior finishes need to account for both levels
          const baseFinishedSqft = projectDetails.finishedSqft || 0;
          if (projectDetails.floors === 2) {
            // Interior finishes like drywall, paint, flooring are needed on both floors
            if (item.description.includes("Drywall") || 
                item.description.includes("Paint") || 
                item.description.includes("Flooring")) {
              quantity = baseFinishedSqft * 2; // Both floors need these finishes
            } else {
              quantity = baseFinishedSqft; // Electrical/plumbing rough-in, insulation
            }
          } else {
            quantity = baseFinishedSqft;
          }
          shouldAutoCalculate = true;
        } else if (item.unit === "unfinished sq ft") {
          quantity = projectDetails.unfinishedSqft || 0;
          shouldAutoCalculate = true;
        } else if (item.unit === "acre") {
          quantity = projectDetails.acres || 1;
          shouldAutoCalculate = true;
        } else if (item.description.includes("Overhead Doors") || item.description.includes("Commercial Overhead Doors")) {
          quantity = projectDetails.doors;
          shouldAutoCalculate = true;
        } else if (item.description.includes("Walk-in Doors") || item.description.includes("Entry Doors") || item.description.includes("Commercial Entry Doors")) {
          quantity = projectDetails.walkDoors;
          shouldAutoCalculate = true;
        } else if (item.description.includes("Kitchen Cabinets")) {
          quantity = projectDetails.kitchenCabinets;
          shouldAutoCalculate = true;
        } else if (item.description.includes("Bathroom Vanities")) {
          quantity = projectDetails.bathrooms;
          shouldAutoCalculate = true;
        } else if (item.description.includes("Interior Stairs")) {
          quantity = (projectDetails.floors === 2) ? 1 : 0;
          shouldAutoCalculate = true;
        } else if (item.unit === "each" && (
          item.description.includes("Building Permit") ||
          item.description.includes("Impact Fees") ||
          item.description.includes("Inspections") ||
          item.description.includes("Project Manager") ||
          item.description.includes("Project Management") ||
          item.description.includes("Septic System Connection") ||
          item.description.includes("Electrical Panel") ||
          item.description.includes("Commercial Electrical Panel")
        )) {
          quantity = 1;
          shouldAutoCalculate = true;
        } else if (item.description.includes("Concrete Sealing")) {
          // Concrete sealing for unfinished areas only (moved from deleted section)
          quantity = projectDetails.unfinishedSqft || 0;
          shouldAutoCalculate = true;
        }

        // Only update if we should auto-calculate this item
        if (shouldAutoCalculate) {
          return {
            ...item,
            quantity: formatNumber(quantity),
            total: formatNumber(quantity * item.unitPrice)
          };
        }
        
        // Return item unchanged if no auto-calculation rule applies
        return item;
      })
    );
  }, [projectDetails, formatNumber]);

  // Function to change project type and reset items
  const changeProjectType = useCallback((newType: ProjectType) => {
    const newFees = getDefaultFeesForType(newType);
    const newItems = newFees.map((item, index) => ({
      ...item,
      id: `${newType}-${index}`,
      quantity: 0,
      total: 0
    }));
    
    setItems(newItems);
    setProjectDetails(prev => ({
      ...prev,
      projectType: newType,
      finishedSqft: newType === 'barndominium' ? prev.finishedSqft : undefined,
      unfinishedSqft: newType === 'barndominium' ? prev.unfinishedSqft : undefined
    }));
  }, []);

  // Use useMemo for calculations instead of useCallback to prevent dependency issues
  const calculateSubtotal = useMemo(() => {
    return formatNumber(items.reduce((sum, item) => sum + item.total, 0));
  }, [items, formatNumber]);

  const calculateProfit = useMemo(() => {
    return formatNumber(calculateSubtotal * (profitMargin / 100));
  }, [calculateSubtotal, profitMargin, formatNumber]);

  const calculateTotal = useMemo(() => {
    return formatNumber(calculateSubtotal + calculateProfit);
  }, [calculateSubtotal, calculateProfit, formatNumber]);

  const saveStatement = useCallback(() => {
    const statementData: SavedStatement = {
      projectId,
      items,
      projectDetails,
      profitMargin: formatNumber(profitMargin),
      lastSaved: new Date().toISOString()
    };
    
    localStorage.setItem(`statement-${projectId}`, JSON.stringify(statementData));
  }, [projectId, items, projectDetails, profitMargin, formatNumber]);

  // Function to update project details with automatic square footage calculation
  const updateProjectDetails = useCallback((updates: Partial<ProjectDetails>) => {
    setProjectDetails(prev => {
      const updated = { ...prev, ...updates };
      return calculateSquareFootage(updated);
    });
  }, [calculateSquareFootage]);

  // Function to load external data (from versions)
  const loadStatementData = useCallback((statementData: { items: FeeItem[], projectDetails: ProjectDetails, profitMargin: number }) => {
    setItems(statementData.items);
    setProjectDetails(statementData.projectDetails);
    setProfitMargin(statementData.profitMargin);
  }, []);

  return {
    items,
    projectDetails,
    profitMargin,
    setProjectDetails,
    updateProjectDetails,
    setProfitMargin,
    updateItem,
    addNewItem,
    deleteItem,
    autoCalculateQuantities,
    changeProjectType,
    calculateSubtotal: () => calculateSubtotal,
    calculateProfit: () => calculateProfit,
    calculateTotal: () => calculateTotal,
    saveStatement,
    loadStatementData,
    formatNumber
  };
};
