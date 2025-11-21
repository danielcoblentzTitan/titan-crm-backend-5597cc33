import { supabase } from "@/integrations/supabase/client";
import { masterSelectionsService } from "@/services/masterSelectionsService";

/**
 * Backfill master selections for existing projects that don't have them
 */
export async function backfillMasterSelections(projectId: string) {
  try {
    // Check if master selections already exist
    const { data: existingInterior } = await supabase
      .from('master_interior_selections')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle();

    const { data: existingExterior } = await supabase
      .from('master_exterior_selections')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle();

    // Create if they don't exist
    if (!existingInterior) {
      await supabase
        .from('master_interior_selections')
        .insert({ project_id: projectId });
    }

    if (!existingExterior) {
      await supabase
        .from('master_exterior_selections')
        .insert({ project_id: projectId });
    }

    return { success: true };
  } catch (error) {
    console.error('Error backfilling master selections:', error);
    throw error;
  }
}

/**
 * Backfill master selections for ALL projects
 */
export async function backfillAllProjects() {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id');

    if (error) throw error;

    const results = await Promise.allSettled(
      projects?.map(project => backfillMasterSelections(project.id)) || []
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return {
      success: true,
      total: projects?.length || 0,
      successful,
      failed
    };
  } catch (error) {
    console.error('Error backfilling all projects:', error);
    throw error;
  }
}

/**
 * Convert existing selection items to use master defaults
 * where applicable based on their category and room type
 */
export async function convertSelectionsToMasterDefaults(
  projectId: string,
  roomId: string
) {
  try {
    // Get room type
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('room_type')
      .eq('id', roomId)
      .single();

    if (roomError) throw roomError;

    // Get room type rules
    const { data: rules, error: rulesError } = await supabase
      .from('room_type_rules')
      .select('json_rules')
      .eq('room_type', room.room_type)
      .single();

    if (rulesError || !rules) {
      return { success: true, converted: 0 };
    }

    const jsonRules = rules.json_rules as any;
    const defaultItems = jsonRules.default_items || [];
    let converted = 0;

    // Update selection items that match default rules
    for (const defaultItem of defaultItems) {
      if (defaultItem.uses_master_default) {
        const { error: updateError } = await supabase
          .from('selection_items')
          .update({
            uses_master_default: true,
            master_field_name: defaultItem.master_field,
            is_overridden: false
          })
          .eq('room_id', roomId)
          .eq('label', defaultItem.label);

        if (!updateError) {
          converted++;
        }
      }
    }

    return { success: true, converted };
  } catch (error) {
    console.error('Error converting selections:', error);
    throw error;
  }
}

/**
 * Analyze existing project selections to suggest which items
 * could be standardized as master defaults
 */
export async function analyzeProjectForStandardization(projectId: string) {
  try {
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, room_name, room_type')
      .eq('project_id', projectId);

    if (roomsError) throw roomsError;

    const { data: selections, error: selectionsError } = await supabase
      .from('selection_items')
      .select('label, material_type, color_name, count')
      .eq('project_id', projectId);

    if (selectionsError) throw selectionsError;

    // Group selections by label
    const grouped: Record<string, any[]> = {};
    selections?.forEach(item => {
      if (!grouped[item.label]) {
        grouped[item.label] = [];
      }
      grouped[item.label].push(item);
    });

    // Find items that appear in multiple rooms with same values
    const suggestions = Object.entries(grouped)
      .filter(([_, items]) => items.length >= 3) // Appears in 3+ rooms
      .map(([label, items]) => {
        const uniqueValues = new Set(
          items.map(i => `${i.material_type || ''}-${i.color_name || ''}`)
        );
        
        return {
          label,
          occurrences: items.length,
          isConsistent: uniqueValues.size === 1,
          suggestion: uniqueValues.size === 1
            ? 'Standardize this as a master default'
            : 'Multiple variations - review for standardization'
        };
      });

    return {
      success: true,
      totalRooms: rooms?.length || 0,
      totalSelections: selections?.length || 0,
      suggestions: suggestions.filter(s => s.isConsistent)
    };
  } catch (error) {
    console.error('Error analyzing project:', error);
    throw error;
  }
}
