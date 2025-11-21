import { supabase } from '@/integrations/supabase/client';

export async function bulkUpdateLeadEstimates() {
  try {
    // Fetch all leads
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*');

    if (error) throw error;
    if (!leads) return { success: false, message: 'No leads found' };

    let updated = 0;
    let skipped = 0;

    for (const lead of leads) {
      const specs = lead.building_specifications as any;
      const width = specs?.dimensions?.width;
      const length = specs?.dimensions?.length;

      if (!width || !length) {
        skipped++;
        continue;
      }

      const sqft = width * length;
      let pricePerSqFt = 50; // Default residential

      const buildingType = (lead.building_type || '').toLowerCase();
      
      if (buildingType.includes('barndominium') || buildingType.includes('barndo')) {
        pricePerSqFt = 145;
      } else if (buildingType.includes('commercial')) {
        pricePerSqFt = 75;
      }

      const estimatedValue = sqft * pricePerSqFt;

      // Update the lead
      const { error: updateError } = await supabase
        .from('leads')
        .update({ estimated_value: estimatedValue })
        .eq('id', lead.id);

      if (updateError) {
        console.error(`Failed to update lead ${lead.id}:`, updateError);
      } else {
        updated++;
      }
    }

    return {
      success: true,
      message: `Updated ${updated} leads, skipped ${skipped} leads (missing dimensions)`,
      updated,
      skipped
    };
  } catch (error) {
    console.error('Bulk update failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      updated: 0,
      skipped: 0
    };
  }
}
