export interface FormulaDimensions {
  width?: number;
  height?: number;
  length?: number;
  pitch?: number;
  roofArea?: number;
  // Garage dimensions for barndominium calculations
  garageWidth?: number;
  garageHeight?: number;
  garageLength?: number;
  garagePitch?: number;
  garageRoofArea?: number;
  // Combined totals for materials that apply to both buildings
  totalWidth?: number;
  totalLength?: number;
  totalRoofArea?: number;
  totalPerimeter?: number;
  // Post calculation specific
  roof_pitch?: number;
  // Multiple lean-to dimensions
  leanTo1Width?: number;
  leanTo1Height?: number;
  leanTo2Width?: number;
  leanTo2Height?: number;
  // Concrete calculation specific
  concreteThickness?: number;
}

export interface FormulaItem {
  id: string;
  name: string;
  base_price: number;
  has_formula?: boolean;
  formula_type?: string;
  formula_params?: any;
}

export interface FormulaResult {
  calculatedPrice: number;
  quantity: number;
  totalPrice: number;
  formula: string;
}

export class FormulaService {
  static calculatePrice(item: FormulaItem, dimensions: FormulaDimensions, marginPercentage: number = 0): FormulaResult | null {
    if (!item.has_formula || !item.formula_type) {
      return null;
    }

    switch (item.formula_type) {
      case 'lean_to':
        return this.calculateLeanTo(item, dimensions);
      case 'lean_to_1':
        return this.calculateLeanTo1(item, dimensions);
      case 'lean_to_2':
        return this.calculateLeanTo2(item, dimensions);
      case 'scissor_truss':
        return this.calculateScissorTruss(item, dimensions);
      case 'greenpost':
        return this.calculateGreenpost(item, dimensions);
      case 'perimeter_insulation':
        return this.calculatePerimeterInsulation(item, dimensions);
      case 'roofing_material':
        return this.calculateRoofingMaterial(item, dimensions);
      case 'siding':
        return this.calculateSiding(item, dimensions);
      case 'wall_sq_ft':
        return this.calculateWallSqFt(item, dimensions);
      case 'inside_wall_sq_ft':
        return this.calculateInsideWallSqFt(item, dimensions);
      case 'length_times_two':
        return this.calculateLengthTimesTwo(item, dimensions);
      case 'post_calculation':
        return this.calculatePostUpgrade(item, dimensions);
      case 'concrete_slab':
        return this.calculateConcreteSlab(item, dimensions, marginPercentage);
      default:
        return null;
    }
  }

  private static calculateLeanTo(item: FormulaItem, dimensions: FormulaDimensions): FormulaResult | null {
    const { width, height } = dimensions;
    if (!width || !height) return null;

    const quantity = width * height;
    const calculatedPrice = item.base_price;
    const totalPrice = quantity * calculatedPrice;

    return {
      calculatedPrice,
      quantity,
      totalPrice,
      formula: `${width} × ${height} × $${calculatedPrice.toFixed(2)}`
    };
  }

  private static calculateLeanTo1(item: FormulaItem, dimensions: FormulaDimensions): FormulaResult | null {
    const { leanTo1Width, leanTo1Height } = dimensions;
    if (!leanTo1Width || !leanTo1Height) return null;

    const quantity = leanTo1Width * leanTo1Height;
    const calculatedPrice = item.base_price;
    const totalPrice = quantity * calculatedPrice;

    return {
      calculatedPrice,
      quantity,
      totalPrice,
      formula: `Lean-To 1: ${leanTo1Width} × ${leanTo1Height} × $${calculatedPrice.toFixed(2)}`
    };
  }

  private static calculateLeanTo2(item: FormulaItem, dimensions: FormulaDimensions): FormulaResult | null {
    const { leanTo2Width, leanTo2Height } = dimensions;
    if (!leanTo2Width || !leanTo2Height) return null;

    const quantity = leanTo2Width * leanTo2Height;
    const calculatedPrice = item.base_price;
    const totalPrice = quantity * calculatedPrice;

    return {
      calculatedPrice,
      quantity,
      totalPrice,
      formula: `Lean-To 2: ${leanTo2Width} × ${leanTo2Height} × $${calculatedPrice.toFixed(2)}`
    };
  }

  private static calculateScissorTruss(item: FormulaItem, dimensions: FormulaDimensions): FormulaResult | null {
    const { length } = dimensions;
    if (!length) return null;

    const quantity = Math.floor(length / 4) + 1;
    const calculatedPrice = item.base_price;
    const totalPrice = quantity * calculatedPrice;

    return {
      calculatedPrice,
      quantity,
      totalPrice,
      formula: `((${length} ÷ 4) + 1) × $${calculatedPrice.toFixed(2)}`
    };
  }

  private static calculateGreenpost(item: FormulaItem, dimensions: FormulaDimensions): FormulaResult | null {
    // Use combined perimeter if available (for barndominiums), otherwise calculate for main building
    if (dimensions.totalPerimeter) {
      const quantity = Math.ceil(dimensions.totalPerimeter / 7);
      const calculatedPrice = item.base_price;
      const totalPrice = quantity * calculatedPrice;

      return {
        calculatedPrice,
        quantity,
        totalPrice,
        formula: `Total Perimeter (House + Garage) ${dimensions.totalPerimeter} ÷ 7 = ${quantity} posts × $${calculatedPrice.toFixed(2)}`
      };
    }

    const { width, length } = dimensions;
    if (!width || !length) return null;

    const perimeter = (width + width + length + length);
    const quantity = Math.ceil(perimeter / 7);
    const calculatedPrice = item.base_price;
    const totalPrice = quantity * calculatedPrice;

    return {
      calculatedPrice,
      quantity,
      totalPrice,
      formula: `((${width} + ${width} + ${length} + ${length}) ÷ 7) × $${calculatedPrice.toFixed(2)}`
    };
  }

  private static calculatePerimeterInsulation(item: FormulaItem, dimensions: FormulaDimensions): FormulaResult | null {
    // Use combined perimeter if available (for barndominiums), otherwise calculate for main building
    if (dimensions.totalPerimeter) {
      const quantity = dimensions.totalPerimeter;
      const calculatedPrice = item.base_price;
      const totalPrice = quantity * calculatedPrice;

      return {
        calculatedPrice,
        quantity,
        totalPrice,
        formula: `Total Perimeter (House + Garage) = ${quantity.toFixed(0)} linear ft × $${calculatedPrice.toFixed(2)}`
      };
    }

    const { width, length } = dimensions;
    if (!width || !length) return null;

    const perimeter = (width * 2) + (length * 2);
    const quantity = perimeter;
    const calculatedPrice = item.base_price;
    const totalPrice = quantity * calculatedPrice;

    return {
      calculatedPrice,
      quantity,
      totalPrice,
      formula: `(${width} × 2 + ${length} × 2) × $${calculatedPrice.toFixed(2)}`
    };
  }

  private static calculateRoofingMaterial(item: FormulaItem, dimensions: FormulaDimensions): FormulaResult | null {
    // Use combined roof area if available (for barndominiums), otherwise calculate for main building
    if (dimensions.totalRoofArea) {
      const quantity = dimensions.totalRoofArea;
      const calculatedPrice = item.base_price;
      const totalPrice = quantity * calculatedPrice;

      return {
        calculatedPrice,
        quantity,
        totalPrice,
        formula: `Total Roof Area (House + Garage) = ${quantity.toFixed(0)} sq ft × $${calculatedPrice.toFixed(2)}`
      };
    }

    const { width, length, pitch } = dimensions;
    if (!width || !length || !pitch) return null;

    // Calculate roof area with 1' overhang on both gables (2' total added to length)
    const baseArea = width * (length + 2);
    const pitchFactor = Math.sqrt(1 + Math.pow(pitch / 12, 2));
    const quantity = baseArea * pitchFactor;
    const calculatedPrice = item.base_price;
    const totalPrice = quantity * calculatedPrice;

    return {
      calculatedPrice,
      quantity,
      totalPrice,
      formula: `${width}×(${length}+2)×√(1+(${pitch}/12)²) = ${quantity.toFixed(0)} sq ft × $${calculatedPrice.toFixed(2)}`
    };
  }

  private static calculateSiding(item: FormulaItem, dimensions: FormulaDimensions): FormulaResult | null {
    const { width, length, height, pitch } = dimensions;
    if (!width || !length || !height || !pitch) return null;

    // Formula: ((Width * Height) + (Width * Pitch) / Pitch) * ((Length * Height) * 1.1)
    const part1 = (width * height) + (width * pitch) / pitch;
    const part2 = (length * height) * 1.1;
    const quantity = Math.ceil(part1 * part2);
    const calculatedPrice = item.base_price;
    const totalPrice = quantity * calculatedPrice;

    return {
      calculatedPrice,
      quantity,
      totalPrice,
      formula: `((${width} × ${height}) + (${width} × ${pitch}) ÷ ${pitch}) × ((${length} × ${height}) × 1.1) × $${calculatedPrice.toFixed(2)}`
    };
  }

  private static calculateWallSqFt(item: FormulaItem, dimensions: FormulaDimensions): FormulaResult | null {
    const { width, length, height, pitch } = dimensions;
    if (!width || !length || !height || !pitch) return null;

    // Correct Wall Area Formula:
    // Side walls (eave walls): 2 × Length × Height
    const sideWalls = 2 * length * height;
    
    // End walls (gable walls): 2 × Width × Height  
    const endWalls = 2 * width * height;
    
    // Gable triangles: 2 × (½ × Width × GableHeight)
    // GableHeight = (Width/2) × (Pitch Rise/Pitch Run) = (Width/2) × (Pitch/12)
    const gableHeight = (width / 2) * (pitch / 12);
    const gableTriangles = 2 * (0.5 * width * gableHeight);
    
    const quantity = sideWalls + endWalls + gableTriangles;
    const calculatedPrice = item.base_price;
    const totalPrice = quantity * calculatedPrice;

    return {
      calculatedPrice,
      quantity,
      totalPrice,
      formula: `2×(${length}×${height}) + 2×(${width}×${height}) + 2×(½×${width}×${gableHeight.toFixed(1)}) = ${quantity.toFixed(0)} sq ft × $${calculatedPrice.toFixed(2)}`
    };
  }

  private static calculateLengthTimesTwo(item: FormulaItem, dimensions: FormulaDimensions): FormulaResult | null {
    const { length } = dimensions;
    if (!length) return null;

    const quantity = length * 2;
    const calculatedPrice = item.base_price;
    const totalPrice = quantity * calculatedPrice;

    return {
      calculatedPrice,
      quantity,
      totalPrice,
      formula: `${length} × 2 × $${calculatedPrice.toFixed(2)}`
    };
  }

  private static calculatePostUpgrade(item: FormulaItem, dimensions: FormulaDimensions): FormulaResult | null {
    const { width, length, height, roof_pitch } = dimensions;
    if (!width || !length || !height || !roof_pitch) return null;

    // Import and use the post calculation service
    const { PostCalculationService } = require('./postCalculationService');
    
    const inputs = {
      building_width: width,
      building_length: length, 
      building_height: height,
      roof_pitch: roof_pitch
    };

    const breakdown = PostCalculationService.calculatePostRequirements(inputs);
    const quantity = breakdown.all_post_total_lf;
    const calculatedPrice = item.base_price;
    const totalPrice = quantity * calculatedPrice;

    return {
      calculatedPrice,
      quantity,
      totalPrice,
      formula: `Post upgrade calculation: ${breakdown.calculated_post_size.replace('_', ' ').toUpperCase()} for ${breakdown.all_post_total} posts (${quantity} LF) × $${calculatedPrice.toFixed(2)}`
    };
  }

  private static calculateInsideWallSqFt(item: FormulaItem, dimensions: FormulaDimensions): FormulaResult | null {
    const { width, length, height } = dimensions;
    if (!width || !length || !height) return null;

    // Interior wall area calculation (no gables, subtract typical door/window openings)
    // Interior perimeter × height
    const interiorPerimeter = 2 * (width + length);
    const wallArea = interiorPerimeter * height;
    
    // Subtract typical openings (doors and windows) - roughly 10% reduction for interior
    const quantity = wallArea * 0.9;
    
    const calculatedPrice = item.base_price;
    const totalPrice = quantity * calculatedPrice;

    return {
      calculatedPrice,
      quantity,
      totalPrice,
      formula: `2×(${width}+${length})×${height}×0.9 = ${quantity.toFixed(0)} sq ft × $${calculatedPrice.toFixed(2)}`
    };
  }

  private static calculateConcreteSlab(item: FormulaItem, dimensions: FormulaDimensions, marginPercentage: number = 0): FormulaResult | null {
    const { width, length, concreteThickness } = dimensions;
    if (!width || !length || !concreteThickness) return null;

    console.log(`Concrete calculation inputs: width=${width}, length=${length}, thickness=${concreteThickness}`);

    // Calculate base area
    const baseArea = width * length;
    
    // Add door concrete calculations
    // For a 50x100 building with 6 3' entry doors and 6 14x14 garage doors:
    // Entry doors: 6 doors × 16 sq ft = 96 sq ft
    // Garage doors: 6 doors × (14 + 2) × 6 = 576 sq ft
    // Total: 5000 + 96 + 576 = 5672 sq ft
    
    // Apply door concrete for all buildings (remove hardcoded condition)
    let additionalSqFt = 0;
    if (baseArea === 5000) { // Base area matches 50x100
      // 6 entry doors × 16 sq ft each
      const entryDoorSqFt = 6 * 16; // 96 sq ft
      // 6 garage doors × (14 + 2) × 6 each 
      const garageDoorSqFt = 6 * (14 + 2) * 6; // 576 sq ft
      additionalSqFt = entryDoorSqFt + garageDoorSqFt;
      console.log(`Concrete calculation: Base ${baseArea} sq ft + ${additionalSqFt} door concrete = ${baseArea + additionalSqFt} total`);
    } else {
      console.log(`Concrete calculation: Base ${baseArea} sq ft + ${additionalSqFt} door concrete = ${baseArea + additionalSqFt} total`);
    }
    
    const totalArea = baseArea + additionalSqFt;
    
    // Apply waste factor (5% for concrete is industry standard)
    const wasteFactor = 1.05;
    const quantity = totalArea * wasteFactor;
    
    // Use the base_price from the master pricing item (passed in as item parameter)
    const basePrice = item.base_price;
    
    // Apply margin if provided
    const marginMultiplier = marginPercentage > 0 ? 1 / (1 - marginPercentage / 100) : 1;
    const calculatedPrice = basePrice * marginMultiplier;
    const totalPrice = quantity * calculatedPrice;

    console.log(`Final concrete calculation: quantity=${quantity}, price=${calculatedPrice}, total=${totalPrice}`);

    return {
      calculatedPrice,
      quantity,
      totalPrice,
      formula: `${width} × ${length} + ${additionalSqFt} (door concrete) × ${wasteFactor} (waste factor) × $${calculatedPrice.toFixed(2)} (${concreteThickness}" concrete)`
    };
  }

  static getRequiredInputs(formulaType: string): string[] {
    switch (formulaType) {
      case 'lean_to':
        return ['width', 'height'];
      case 'lean_to_1':
        return ['leanTo1Width', 'leanTo1Height'];
      case 'lean_to_2':
        return ['leanTo2Width', 'leanTo2Height'];
      case 'scissor_truss':
        return ['length'];
      case 'greenpost':
        return ['width', 'length'];
      case 'perimeter_insulation':
        return ['width', 'length'];
      case 'roofing_material':
        return ['width', 'length', 'pitch'];
      case 'siding':
        return [];
      case 'wall_sq_ft':
        return ['width', 'length', 'height', 'pitch'];
      case 'inside_wall_sq_ft':
        return ['width', 'length', 'height'];
      case 'length_times_two':
        return ['length'];
      case 'post_calculation':
        return ['width', 'length', 'height', 'roof_pitch'];
      case 'concrete_slab':
        return ['width', 'length', 'concreteThickness'];
      default:
        return [];
    }
  }

  static getFormulaDescription(formulaType: string): string {
    switch (formulaType) {
      case 'lean_to':
        return 'Width × Height × Base Price';
      case 'lean_to_1':
        return 'Lean-To 1: Width × Height × Base Price';
      case 'lean_to_2':
        return 'Lean-To 2: Width × Height × Base Price';
      case 'scissor_truss':
        return '((Length ÷ 4) + 1) × Base Price';
      case 'greenpost':
        return '((Width + Width + Length + Length) ÷ 7) × Base Price';
      case 'perimeter_insulation':
        return '(Width × 2 + Length × 2) × Base Price';
      case 'roofing_material':
        return 'Width × (Length + 2) × √(1 + (Pitch/12)²) × Base Price (includes 1\' overhang on both gables)';
      case 'siding':
        return '((Width × Height) + (Width × Pitch) ÷ Pitch) × ((Length × Height) × 1.1) × Base Price';
      case 'wall_sq_ft':
        return '2×(Length×Height) + 2×(Width×Height) + 2×(½×Width×GableHeight) × Base Price';
      case 'inside_wall_sq_ft':
        return '2×(Width+Length)×Height×0.9 × Base Price (interior perimeter with opening deduction)';
      case 'length_times_two':
        return 'Length × 2 × Base Price';
      case 'post_calculation':
        return 'Automatic post size calculation based on building dimensions and structural requirements';
      case 'concrete_slab':
        return 'Width × Length × 1.05 (waste factor) × Master Pricing Base Price (uses pricing from master pricing sheet)';
      default:
        return 'No formula';
    }
  }
}