import { supabase } from "@/integrations/supabase/client";

export const masterSelectionsService = {
  async createMasterSelectionsForProject(projectId: string) {
    try {
      // Create master interior selections
      const { error: interiorError } = await supabase
        .from('master_interior_selections')
        .insert({ project_id: projectId });

      if (interiorError) throw interiorError;

      // Create master exterior selections
      const { error: exteriorError } = await supabase
        .from('master_exterior_selections')
        .insert({ project_id: projectId });

      if (exteriorError) throw exteriorError;

      return { success: true };
    } catch (error) {
      console.error('Error creating master selections:', error);
      throw error;
    }
  },

  async updateMasterInterior(projectId: string, data: any) {
    const { error } = await supabase
      .from('master_interior_selections')
      .upsert({ project_id: projectId, ...data });

    if (error) {
      console.error('Error updating master interior:', error);
      throw error;
    }

    return { success: true };
  },

  async updateMasterExterior(projectId: string, data: any) {
    const { error } = await supabase
      .from('master_exterior_selections')
      .upsert({ project_id: projectId, ...data });

    if (error) {
      console.error('Error updating master exterior:', error);
      throw error;
    }

    return { success: true };
  },

  async propagateDefaultsToRooms(
    projectId: string,
    options: {
      onlyNonOverridden?: boolean;
      specificField?: string;
      specificValue?: any;
    } = {}
  ) {
    try {
      // Get all rooms for this project
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('id')
        .eq('project_id', projectId);

      if (roomsError) throw roomsError;

      // Get master defaults
      const { data: masterInterior } = await supabase
        .from('master_interior_selections')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (!masterInterior) {
        throw new Error('Master interior selections not found');
      }

      // Update selection items
      let query = supabase
        .from('selection_items')
        .select('*')
        .eq('project_id', projectId)
        .eq('uses_master_default', true);

      if (options.onlyNonOverridden) {
        query = query.eq('is_overridden', false);
      }

      if (options.specificField) {
        query = query.eq('master_field_name', options.specificField);
      }

      const { data: items, error: itemsError } = await query;

      if (itemsError) throw itemsError;

      // Update each item
      const updates = items?.map(item => {
        const masterFieldName = item.master_field_name;
        const masterValue = masterInterior[masterFieldName];

        return supabase
          .from('selection_items')
          .update({
            color_name: masterValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);
      });

      await Promise.all(updates || []);

      return { success: true, updatedCount: items?.length || 0 };
    } catch (error) {
      console.error('Error propagating defaults:', error);
      throw error;
    }
  }
};
