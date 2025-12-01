import { FormulaService, type FormulaDimensions } from "@/services/formulaService";
import { PostCalculationService } from "@/services/postCalculationService";
import { pricingService, type PricingItemWithCategory } from "@/services/pricingService";

export interface EstimateItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  formula?: string;
  isFormula?: boolean;
}

export interface EstimateOptions {
  concrete_thickness: string;
  post_sizing: string;
  truss_pitch: string;
  truss_spacing: string;
  exterior_siding_gauge: string;
  moisture_barrier: string;
  insulation_wall_finish: string;
}

export interface BuildingDimensions {
  width: number;
  length: number;
  wallHeight: number;
  roofPitch: number;
  buildingType: string;
}

export class EstimateCalculator {
  private masterItems: PricingItemWithCategory[] = [];
  private marginPercentage: number = 0;

  constructor(masterItems: PricingItemWithCategory[], marginPercentage: number = 0) {
    this.masterItems = masterItems;
    this.marginPercentage = marginPercentage;
  }

  calculateCompleteEstimate(
    dimensions: BuildingDimensions,
    options: EstimateOptions
  ): EstimateItem[] {
    const items: EstimateItem[] = [];
    const formulaDimensions = this.getFormulaDimensions(dimensions);

    // Base structural pricing
    items.push(...this.calculateBaseStructural(dimensions, formulaDimensions));

    // Optional items based on selections
    if (options.concrete_thickness !== 'none') {
      items.push(...this.calculateConcrete(dimensions, options.concrete_thickness));
    }

    if (options.post_sizing !== 'standard') {
      items.push(...this.calculatePostUpgrade(dimensions, options.post_sizing));
    }

    if (options.truss_pitch !== 'none') {
      items.push(...this.calculateTrussPitch(dimensions, options.truss_pitch));
    }

    if (options.truss_spacing !== 'none') {
      items.push(...this.calculateTrussSpacing(dimensions, options.truss_spacing));
    }

    if (options.exterior_siding_gauge !== 'none') {
      items.push(...this.calculateSidingGauge(dimensions, options.exterior_siding_gauge));
    }

    if (options.moisture_barrier !== 'none') {
      items.push(...this.calculateMoistureBarrier(dimensions, options.moisture_barrier));
    }

    if (options.insulation_wall_finish !== 'none') {
      items.push(...this.calculateInsulationWallFinish(dimensions, options.insulation_wall_finish));
    }

    return items;
  }

  private getFormulaDimensions(dimensions: BuildingDimensions): FormulaDimensions {
    const { width, length, wallHeight, roofPitch } = dimensions;
    const roofArea = this.calculateRoofArea(width, length, roofPitch);
    const wallArea = this.calculateWallArea(width, length, wallHeight);

    return {
      width,
      length,
      height: wallHeight,
      pitch: roofPitch,
      roofArea
    };
  }

  private calculateRoofArea(width: number, length: number, pitch: number): number {
    const pitchFactor = Math.sqrt(1 + Math.pow(pitch / 12, 2));
    return width * length * pitchFactor;
  }

  private calculateWallArea(width: number, length: number, wallHeight: number): number {
    const perimeter = 2 * (width + length);
    return perimeter * wallHeight;
  }

  private calculateBaseStructural(
    dimensions: BuildingDimensions,
    formulaDimensions: FormulaDimensions
  ): EstimateItem[] {
    const items: EstimateItem[] = [];

    // Add base building structural cost using the same formula as BuildingPriceCalculator
    const basePricePerSqFt = this.calculateBasePricePerSqFt(dimensions);
    const totalSqFt = dimensions.width * dimensions.length;
    const baseStructuralCost = basePricePerSqFt * totalSqFt;

    items.push({
      id: 'base-structural',
      name: 'Base Building Structure',
      quantity: totalSqFt,
      unit: 'sq ft',
      unitPrice: basePricePerSqFt,
      totalPrice: baseStructuralCost,
      category: 'Structural',
      formula: `${totalSqFt} sq ft × $${basePricePerSqFt.toFixed(2)}/sq ft`,
      isFormula: true
    });

    // Process all formula-based items for additional components
    this.masterItems.forEach(item => {
      if (item.has_formula && item.formula_type) {
        const result = FormulaService.calculatePrice(item, formulaDimensions, this.marginPercentage);
        if (result) {
          items.push({
            id: `formula-${item.id}`,
            name: item.name,
            quantity: result.quantity,
            unit: item.unit_type,
            unitPrice: result.calculatedPrice,
            totalPrice: result.totalPrice,
            category: item.category?.name,
            formula: result.formula,
            isFormula: true
          });
        }
      }
    });

    return items;
  }

  private calculateBasePricePerSqFt(dimensions: BuildingDimensions): number {
    const B2 = dimensions.width;   // Width
    const B3 = dimensions.length;  // Length
    const B4 = dimensions.wallHeight;  // Height
    const B5 = dimensions.roofPitch; // Pitch (4, 6, 8, etc.)

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

    return Math.max(30, pricePerSqFt); // Ensure minimum reasonable price
  }

  private calculateConcrete(dimensions: BuildingDimensions, thickness: string): EstimateItem[] {
    const items: EstimateItem[] = [];
    const concreteItem = this.masterItems.find(item => 
      item.name.toLowerCase().includes('concrete') && 
      item.formula_type === 'concrete_slab'
    );

    if (concreteItem) {
      const formulaDimensions = this.getFormulaDimensions(dimensions);
      const concreteFormulaDimensions = {
        ...formulaDimensions,
        concreteThickness: parseFloat(thickness)
      };

      const result = FormulaService.calculatePrice(concreteItem, concreteFormulaDimensions, this.marginPercentage);
      if (result) {
        const itemName = `Concrete Slab (${thickness}")`;
        items.push({
          id: `concrete-${thickness}`,
          name: itemName,
          quantity: result.quantity,
          unit: concreteItem.unit_type,
          unitPrice: result.calculatedPrice,
          totalPrice: result.totalPrice,
          category: concreteItem.category?.name,
          formula: result.formula,
          isFormula: true
        });
      }
    }

    return items;
  }

  private calculatePostUpgrade(dimensions: BuildingDimensions, sizing: string): EstimateItem[] {
    const items: EstimateItem[] = [];
    
    try {
      const inputs = {
        building_width: dimensions.width,
        building_length: dimensions.length,
        building_height: dimensions.wallHeight,
        roof_pitch: dimensions.roofPitch
      };

      const postResult = PostCalculationService.getPostCalculationResult(inputs, this.masterItems);
      const upgradeCost = PostCalculationService.calculatePostUpgradeCost(postResult);

      if (upgradeCost.lineItem && upgradeCost.totalUpgradeCost > 0) {
        items.push({
          id: 'post-upgrade',
          name: upgradeCost.lineItem.name,
          quantity: upgradeCost.lineItem.quantity,
          unit: upgradeCost.lineItem.unit,
          unitPrice: upgradeCost.lineItem.unitPrice,
          totalPrice: upgradeCost.totalUpgradeCost,
          category: 'Post Upgrade',
          isFormula: false
        });
      }
    } catch (error) {
      console.error('Error calculating post upgrade:', error);
    }

    return items;
  }

  private calculateTrussPitch(dimensions: BuildingDimensions, pitch: string): EstimateItem[] {
    // Implementation for truss pitch calculations
    return [];
  }

  private calculateTrussSpacing(dimensions: BuildingDimensions, spacing: string): EstimateItem[] {
    // Implementation for truss spacing calculations
    return [];
  }

  private calculateSidingGauge(dimensions: BuildingDimensions, gauge: string): EstimateItem[] {
    // Implementation for siding gauge calculations
    return [];
  }

  private calculateMoistureBarrier(dimensions: BuildingDimensions, barrier: string): EstimateItem[] {
    // Implementation for moisture barrier calculations
    return [];
  }

  private calculateInsulationWallFinish(dimensions: BuildingDimensions, finish: string): EstimateItem[] {
    // Implementation for insulation wall finish calculations
    return [];
  }
}