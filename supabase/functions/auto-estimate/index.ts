import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BuildingDimensions {
  width: number;
  length: number;
  wallHeight: number;
  roofPitch: number;
  buildingType: string;
}

interface EstimateOptions {
  concrete_thickness: string;
  post_sizing: string;
  truss_pitch: string;
  truss_spacing: string;
  exterior_siding_gauge: string;
  moisture_barrier: string;
  insulation_wall_finish: string;
}

interface EstimateItem {
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { leadId, lead } = await req.json();

    if (!leadId || !lead) {
      return new Response(
        JSON.stringify({ error: 'Missing leadId or lead data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing auto-estimate for lead:', leadId);

    // Map lead data to estimate format
    const dimensions = mapToBuildingDimensions(lead);
    if (!dimensions) {
      console.log('Cannot generate estimate: missing building dimensions');
      return new Response(
        JSON.stringify({ error: 'Missing building dimensions' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const options = mapToEstimateOptions(lead);

    // Get pricing data
    const { data: masterItems, error: pricingError } = await supabase
      .from('pricing_items')
      .select(`
        *,
        category:pricing_categories(*)
      `)
      .eq('is_active', true)
      .order('sort_order');

    if (pricingError) {
      console.error('Error fetching pricing items:', pricingError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pricing data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate estimate
    const breakdown = calculateEstimate(dimensions, options, masterItems || []);
    
    // Add doors and windows
    const doorsAndWindows = calculateDoorsAndWindows(lead, masterItems || []);
    breakdown.push(...doorsAndWindows);

    const estimatedPrice = breakdown.reduce((total, item) => total + item.totalPrice, 0);

    // Create estimate record
    const estimateData = {
      lead_id: leadId,
      lead_name: `${lead.first_name} ${lead.last_name}`,
      building_type: dimensions.buildingType,
      dimensions: `${dimensions.width}' × ${dimensions.length}' × ${dimensions.wallHeight}'`,
      wall_height: dimensions.wallHeight.toString(),
      estimated_price: estimatedPrice,
      description: generateDescription(lead, dimensions),
      scope: generateScope(lead, options),
      timeline: '90-120 days',
      notes: 'Auto-generated estimate based on building specifications',
      detailed_breakdown: {
        items: breakdown,
        options: options,
        dimensions: dimensions
      },
      status: 'Auto-Generated',
      is_written_estimate: false
    };

    // Save estimate
    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .insert(estimateData)
      .select()
      .single();

    if (estimateError) {
      console.error('Error creating estimate:', estimateError);
      return new Response(
        JSON.stringify({ error: 'Failed to create estimate' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update lead's estimated value
    const { error: updateError } = await supabase
      .from('leads')
      .update({ 
        estimated_value: estimatedPrice
      })
      .eq('id', leadId);

    if (updateError) {
      console.error('Error updating lead estimated value:', updateError);
    }

    console.log('Auto estimate completed successfully:', {
      leadId,
      estimatedPrice,
      estimateId: estimate.id
    });

    return new Response(
      JSON.stringify({
        success: true,
        estimatedPrice,
        breakdown,
        estimate
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in auto-estimate function:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function mapToBuildingDimensions(lead: any): BuildingDimensions | null {
  const buildingSpecs = lead.building_specifications;
  
  if (!buildingSpecs || !buildingSpecs.dimensions) {
    return null;
  }

  const { dimensions } = buildingSpecs;
  
  const parseNumber = (value: string | number): number => {
    if (typeof value === 'number') return value;
    return parseFloat(value?.toString().replace(/['"]/g, '') || '0');
  };

  return {
    width: parseNumber(dimensions.width),
    length: parseNumber(dimensions.length),
    wallHeight: parseNumber(dimensions.height),
    roofPitch: 4/12,
    buildingType: buildingSpecs.building_use || 'Residential'
  };
}

function mapToEstimateOptions(lead: any): EstimateOptions {
  const buildingSpecs = lead.building_specifications;
  const buildingUse = buildingSpecs?.building_use || 'Residential';
  
  const isCommercial = buildingUse.toLowerCase().includes('commercial');
  
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

function calculateEstimate(dimensions: BuildingDimensions, options: EstimateOptions, masterItems: any[]): EstimateItem[] {
  const items: EstimateItem[] = [];
  
  if (!masterItems || masterItems.length === 0) {
    console.log('No master pricing items available, using fallback calculation');
    // Fallback to basic calculation if no pricing data
    const squareFootage = dimensions.width * dimensions.length;
    const basePricePerSqFt = dimensions.buildingType.toLowerCase().includes('commercial') ? 35 : 25;
    
    items.push({
      id: `base-building-${Date.now()}`,
      name: 'Base Building Package (Fallback)',
      quantity: squareFootage,
      unit: 'sq ft',
      unitPrice: basePricePerSqFt,
      totalPrice: squareFootage * basePricePerSqFt,
      category: 'Structure',
      isFormula: false
    });
    
    return items;
  }

  // Use the actual estimate calculator logic similar to the UnifiedEstimateForm
  const formulaDimensions = {
    width: dimensions.width,
    length: dimensions.length,
    wallHeight: dimensions.wallHeight,
    roofArea: calculateRoofArea(dimensions.width, dimensions.length, dimensions.roofPitch),
    wallArea: calculateWallArea(dimensions.width, dimensions.length, dimensions.wallHeight),
    pitch: dimensions.roofPitch
  };

  // Calculate base structural items with formulas
  masterItems.forEach(item => {
    if (item.has_formula && item.formula_type && item.is_active) {
      const quantity = calculateFormulaQuantity(item.formula_type, formulaDimensions, item.formula_params || {});
      
      if (quantity > 0) {
        items.push({
          id: item.id,
          name: item.name,
          quantity: Math.round(quantity * 100) / 100,
          unit: item.unit_type,
          unitPrice: parseFloat(item.base_price),
          totalPrice: Math.round(quantity * parseFloat(item.base_price) * 100) / 100,
          category: item.category?.name || 'Other',
          formula: item.formula_type,
          isFormula: true
        });
      }
    }
  });

  // Add concrete slab calculation
  const concreteThickness = options.concrete_thickness;
  const concreteItem = masterItems.find(item => 
    item.name.toLowerCase().includes('concrete') && 
    item.name.toLowerCase().includes('slab') &&
    item.name.includes(concreteThickness)
  );
  
  if (concreteItem) {
    const squareFootage = dimensions.width * dimensions.length;
    items.push({
      id: concreteItem.id,
      name: concreteItem.name,
      quantity: squareFootage,
      unit: concreteItem.unit_type,
      unitPrice: parseFloat(concreteItem.base_price),
      totalPrice: Math.round(squareFootage * parseFloat(concreteItem.base_price) * 100) / 100,
      category: concreteItem.category?.name || 'Foundation',
      isFormula: false
    });
  }

  return items;
}

function calculateRoofArea(width: number, length: number, pitch: number): number {
  // Calculate roof area based on pitch
  const pitchMultiplier = Math.sqrt(1 + Math.pow(pitch, 2));
  return width * length * pitchMultiplier;
}

function calculateWallArea(width: number, length: number, height: number): number {
  // Calculate total wall area (perimeter × height)
  const perimeter = 2 * (width + length);
  return perimeter * height;
}

function calculateFormulaQuantity(formulaType: string, dimensions: any, params: any): number {
  const { width, length, wallHeight, roofArea, wallArea } = dimensions;
  
  switch (formulaType) {
    case 'wall_area':
      return wallArea;
    case 'roof_area':
      return roofArea;
    case 'perimeter':
      return 2 * (width + length);
    case 'square_footage':
      return width * length;
    case 'linear_feet_length':
      return length;
    case 'linear_feet_width':
      return width;
    case 'linear_feet_perimeter':
      return 2 * (width + length);
    case 'wall_height':
      return wallHeight;
    case 'custom':
      // Handle custom formulas based on params
      if (params.formula) {
        try {
          // Simple formula evaluation (you might want to use a safer eval alternative)
          const formula = params.formula
            .replace(/width/g, width.toString())
            .replace(/length/g, length.toString())
            .replace(/height/g, wallHeight.toString())
            .replace(/wallArea/g, wallArea.toString())
            .replace(/roofArea/g, roofArea.toString());
          
          // Basic math evaluation (only allow numbers and basic operators)
          if (/^[\d\s+\-*/.()]+$/.test(formula)) {
            return eval(formula);
          }
        } catch (error) {
          console.error('Error evaluating custom formula:', error);
        }
      }
      return 0;
    default:
      return 0;
  }
}

function calculateDoorsAndWindows(lead: any, masterItems: any[]): EstimateItem[] {
  const items: EstimateItem[] = [];
  const buildingSpecs = lead.building_specifications;

  if (!buildingSpecs || !masterItems || masterItems.length === 0) return items;

  // Entry doors - find actual pricing from master items
  if (buildingSpecs.doors?.entry_count) {
    const quantity = parseInt(buildingSpecs.doors.entry_count);
    const entryDoorItem = masterItems.find(item => 
      item.name.toLowerCase().includes('entry') && 
      item.name.toLowerCase().includes('door') &&
      item.is_active
    );
    
    if (entryDoorItem) {
      items.push({
        id: entryDoorItem.id,
        name: entryDoorItem.name,
        quantity,
        unit: entryDoorItem.unit_type,
        unitPrice: parseFloat(entryDoorItem.base_price),
        totalPrice: quantity * parseFloat(entryDoorItem.base_price),
        category: entryDoorItem.category?.name || 'Doors',
        isFormula: false
      });
    } else {
      // Fallback pricing if no master item found
      const unitPrice = 800;
      items.push({
        id: `entry-doors-${Date.now()}`,
        name: 'Entry Doors (Fallback)',
        quantity,
        unit: 'each',
        unitPrice,
        totalPrice: quantity * unitPrice,
        category: 'Doors',
        isFormula: false
      });
    }
  }

  // Garage/Overhead doors - find actual pricing from master items
  if (buildingSpecs.doors?.overhead_count) {
    const quantity = parseInt(buildingSpecs.doors.overhead_count);
    const garageDoorItem = masterItems.find(item => 
      (item.name.toLowerCase().includes('garage') || item.name.toLowerCase().includes('overhead')) && 
      item.name.toLowerCase().includes('door') &&
      item.is_active
    );
    
    if (garageDoorItem) {
      items.push({
        id: garageDoorItem.id,
        name: garageDoorItem.name,
        quantity,
        unit: garageDoorItem.unit_type,
        unitPrice: parseFloat(garageDoorItem.base_price),
        totalPrice: quantity * parseFloat(garageDoorItem.base_price),
        category: garageDoorItem.category?.name || 'Doors',
        isFormula: false
      });
    } else {
      // Fallback pricing if no master item found
      const unitPrice = 1200;
      items.push({
        id: `overhead-doors-${Date.now()}`,
        name: 'Overhead Doors (Fallback)',
        quantity,
        unit: 'each',
        unitPrice,
        totalPrice: quantity * unitPrice,
        category: 'Doors',
        isFormula: false
      });
    }
  }

  // Windows - find actual pricing from master items
  if (buildingSpecs.windows?.count) {
    const quantity = parseInt(buildingSpecs.windows.count);
    const windowItem = masterItems.find(item => 
      item.name.toLowerCase().includes('window') &&
      item.is_active &&
      !item.name.toLowerCase().includes('door') // Exclude window doors
    );
    
    if (windowItem) {
      items.push({
        id: windowItem.id,
        name: windowItem.name,
        quantity,
        unit: windowItem.unit_type,
        unitPrice: parseFloat(windowItem.base_price),
        totalPrice: quantity * parseFloat(windowItem.base_price),
        category: windowItem.category?.name || 'Windows',
        isFormula: false
      });
    } else {
      // Fallback pricing if no master item found
      const unitPrice = 400;
      items.push({
        id: `windows-${Date.now()}`,
        name: 'Windows (Fallback)',
        quantity,
        unit: 'each',
        unitPrice,
        totalPrice: quantity * unitPrice,
        category: 'Windows',
        isFormula: false
      });
    }
  }

  return items;
}

function generateDescription(lead: any, dimensions: BuildingDimensions): string {
  const buildingSpecs = lead.building_specifications;
  const use = buildingSpecs?.building_use || 'building';
  
  return `${dimensions.width}' × ${dimensions.length}' ${use.toLowerCase()} with ${dimensions.wallHeight}' sidewall height`;
}

function generateScope(lead: any, options: EstimateOptions): string {
  const buildingSpecs = lead.building_specifications;
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