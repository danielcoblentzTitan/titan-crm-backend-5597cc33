import { EstimateCalculator, type EstimateOptions, type BuildingDimensions, type EstimateItem } from '@/utils/estimateCalculations';
import { pricingService } from './pricingService';
import { estimatesService } from './estimatesService';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from './supabaseService';

export interface AutoEstimateResult {
  estimatedPrice: number;
  breakdown: EstimateItem[];
  estimate?: any;
}

export class AutoEstimateService {
  private static instance: AutoEstimateService;
  
  static getInstance(): AutoEstimateService {
    if (!AutoEstimateService.instance) {
      AutoEstimateService.instance = new AutoEstimateService();
    }
    return AutoEstimateService.instance;
  }

  /**
   * Convert lead building specifications to BuildingDimensions
   */
  private mapToBuildingDimensions(lead: Lead): BuildingDimensions | null {
    const buildingSpecs = (lead as any).building_specifications;
    
    if (!buildingSpecs || !buildingSpecs.dimensions) {
      return null;
    }

    const { dimensions } = buildingSpecs;
    
    // Parse dimensions from string format like "30'" to number
    const parseNumber = (value: string | number): number => {
      if (typeof value === 'number') return value;
      return parseFloat(value?.toString().replace(/['"]/g, '') || '0');
    };

    return {
      width: parseNumber(dimensions.width),
      length: parseNumber(dimensions.length),
      wallHeight: parseNumber(dimensions.height),
      roofPitch: 4, // Default roof pitch (4:12 ratio)
      buildingType: buildingSpecs.building_use || 'Residential'
    };
  }

  /**
   * Generate smart defaults for EstimateOptions based on building specs
   */
  private mapToEstimateOptions(lead: Lead): EstimateOptions {
    const buildingSpecs = (lead as any).building_specifications;
    const buildingUse = buildingSpecs?.building_use || 'Residential';
    
    // Smart defaults based on building use
    const isCommercial = buildingUse.toLowerCase().includes('commercial');
    const isAgricultural = buildingUse.toLowerCase().includes('agriculture') || buildingUse.toLowerCase().includes('farm');
    
    return {
      concrete_thickness: isCommercial ? '6"' : '4"',
      post_sizing: isCommercial ? '6x6' : '4x6',
      truss_pitch: '4:12',
      truss_spacing: '4\' OC',
      exterior_siding_gauge: '26 Gauge',
      moisture_barrier: 'Standard',
      insulation_wall_finish: isCommercial ? 'Insulated with Drywall' : 'Unfinished'
    };
  }

  /**
   * Simple estimate calculation based on building type
   */
  private calculateSimpleEstimate(lead: Lead): number {
    const buildingSpecs = (lead as any).building_specifications;
    if (!buildingSpecs?.dimensions) return 0;

    const parseNumber = (value: string | number): number => {
      if (typeof value === 'number') return value;
      return parseFloat(value?.toString().replace(/['"]/g, '') || '0');
    };

    const width = parseNumber(buildingSpecs.dimensions.width);
    const length = parseNumber(buildingSpecs.dimensions.length);
    const sqft = width * length;

    const buildingType = buildingSpecs.building_use || lead.building_type || '';
    const typeLower = buildingType.toLowerCase();

    let pricePerSqft = 50; // Default to residential
    if (typeLower.includes('barndo') || typeLower.includes('barndominium')) {
      pricePerSqft = 145;
    } else if (typeLower.includes('commercial')) {
      pricePerSqft = 75;
    }

    return sqft * pricePerSqft;
  }

  /**
   * Generate automatic estimate for a lead
   */
  async generateAutoEstimate(lead: Lead): Promise<AutoEstimateResult | null> {
    try {
      // Use simple calculation
      const estimatedPrice = this.calculateSimpleEstimate(lead);
      if (estimatedPrice === 0) {
        console.log('Cannot generate estimate: missing building dimensions');
        return null;
      }

      const dimensions = this.mapToBuildingDimensions(lead);
      if (!dimensions) {
        return null;
      }

      const options = this.mapToEstimateOptions(lead);

      // Create simple breakdown
      const breakdown: EstimateItem[] = [{
        id: 'building-estimate',
        name: 'Building Estimate',
        quantity: 1,
        unit: 'complete',
        unitPrice: estimatedPrice,
        totalPrice: estimatedPrice,
        category: 'Complete Package',
        isFormula: false
      }];

      // Create estimate record
      const estimateData = {
        buildingType: dimensions.buildingType,
        dimensions: `${dimensions.width}' × ${dimensions.length}' × ${dimensions.wallHeight}'`,
        wallHeight: dimensions.wallHeight.toString(),
        estimatedPrice,
        description: this.generateDescription(lead, dimensions),
        scope: this.generateScope(lead, options),
        timeline: '90-120 days',
        notes: 'Auto-generated estimate based on building specifications',
        detailedBreakdown: {
          items: breakdown,
          options: options,
          dimensions: dimensions
        }
      };

      // Save estimate to database with auto-generated flag
      const estimate = await estimatesService.createEstimate(lead, estimateData, true);

      return {
        estimatedPrice,
        breakdown,
        estimate
      };
    } catch (error) {
      console.error('Error generating auto estimate:', error);
      return null;
    }
  }

  /**
   * Calculate doors and windows pricing
   * Note: Gutters are included in base price and should not be added separately
   */
  private calculateDoorsAndWindows(lead: Lead, masterItems: any[]): EstimateItem[] {
    const items: EstimateItem[] = [];
    const buildingSpecs = (lead as any).building_specifications;

    if (!buildingSpecs) return items;

    // Entry doors
    if (buildingSpecs.doors?.entry_count) {
      const entryDoorPrice = 800; // Default price per entry door
      const quantity = parseInt(buildingSpecs.doors.entry_count);
      
      items.push({
        id: `entry-doors-${Date.now()}`,
        name: 'Entry Doors',
        quantity,
        unit: 'each',
        unitPrice: entryDoorPrice,
        totalPrice: quantity * entryDoorPrice,
        category: 'Doors',
        isFormula: false
      });
    }

    // Overhead doors
    if (buildingSpecs.doors?.overhead_count) {
      const overheadDoorPrice = 1200; // Default price per overhead door
      const quantity = parseInt(buildingSpecs.doors.overhead_count);
      
      items.push({
        id: `overhead-doors-${Date.now()}`,
        name: 'Overhead Doors',
        quantity,
        unit: 'each',
        unitPrice: overheadDoorPrice,
        totalPrice: quantity * overheadDoorPrice,
        category: 'Doors',
        isFormula: false
      });
    }

    // Windows
    if (buildingSpecs.windows?.count) {
      const windowPrice = 400; // Default price per window
      const quantity = parseInt(buildingSpecs.windows.count);
      
      items.push({
        id: `windows-${Date.now()}`,
        name: 'Windows',
        quantity,
        unit: 'each',
        unitPrice: windowPrice,
        totalPrice: quantity * windowPrice,
        category: 'Windows',
        isFormula: false
      });
    }

    return items;
  }

  /**
   * Generate description based on lead data
   */
  private generateDescription(lead: Lead, dimensions: BuildingDimensions): string {
    const buildingSpecs = (lead as any).building_specifications;
    const use = buildingSpecs?.building_use || 'building';
    
    return `${dimensions.width}' × ${dimensions.length}' ${use.toLowerCase()} with ${dimensions.wallHeight}' sidewall height`;
  }

  /**
   * Generate scope based on options
   */
  private generateScope(lead: Lead, options: EstimateOptions): string {
    const buildingSpecs = (lead as any).building_specifications;
    const features = [];
    
    features.push(`${options.concrete_thickness} concrete slab`);
    features.push(`${options.post_sizing} posts`);
    features.push(`${options.exterior_siding_gauge} exterior siding`);
    
    if (buildingSpecs?.doors?.entry_count) {
      features.push(`${buildingSpecs.doors.entry_count} entry door(s)`);
    }
    
    if (buildingSpecs?.doors?.overhead_count) {
      features.push(`${buildingSpecs.doors.overhead_count} overhead door(s)`);
    }
    
    if (buildingSpecs?.windows?.count) {
      features.push(`${buildingSpecs.windows.count} window(s)`);
    }

    return `Complete building package including: ${features.join(', ')}.`;
  }

  /**
   * Update lead's estimated value with auto-generated price
   */
  async updateLeadEstimatedValue(leadId: string, estimatedPrice: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          estimated_value: estimatedPrice,
          notes: `Auto-generated estimate: $${estimatedPrice.toLocaleString()} (${new Date().toLocaleDateString()})`
        })
        .eq('id', leadId);

      if (error) {
        console.error('Error updating lead estimated value:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating lead estimated value:', error);
      throw error;
    }
  }
}

export const autoEstimateService = AutoEstimateService.getInstance();