import { supabase } from "@/integrations/supabase/client";

export interface RoomTypeRule {
  room_type: string;
  display_name: string;
  json_rules: {
    default_items: Array<{
      category: string;
      label: string;
      uses_master_default?: boolean;
      master_field?: string;
      master_source?: 'interior' | 'exterior';
      visual_selector?: string;
      type?: string;
      default?: any;
      options?: string[];
      description?: string;
    }>;
  };
}

export const roomInitializationService = {
  async getRoomTypeRules(roomType: string): Promise<RoomTypeRule | null> {
    const { data, error } = await supabase
      .from('room_type_rules')
      .select('*')
      .eq('room_type', roomType.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching room type rules:', error);
      return null;
    }

    return {
      ...data,
      json_rules: data.json_rules as RoomTypeRule['json_rules']
    };
  },

  async getMasterInteriorDefaults(projectId: string) {
    const { data, error } = await supabase
      .from('master_interior_selections')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching master interior defaults:', error);
      return null;
    }

    return data;
  },

  async getMasterExteriorDefaults(projectId: string) {
    const { data, error } = await supabase
      .from('master_exterior_selections')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching master exterior defaults:', error);
      return null;
    }

    return data;
  },

  async getFlooringProduct(productId: string) {
    const { data, error } = await supabase
      .from('flooring_products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Error fetching flooring product:', error);
      return null;
    }

    return data;
  },

  async initializeRoomSelections(
    projectId: string,
    roomId: string,
    roomType: string,
    categoryMap: Record<string, string>
  ) {
    // Get room type rules
    const rules = await this.getRoomTypeRules(roomType);
    if (!rules) {
      console.warn(`No rules found for room type: ${roomType}`);
      return [];
    }

    // Get master defaults
    const masterInterior = await this.getMasterInteriorDefaults(projectId);
    const masterExterior = await this.getMasterExteriorDefaults(projectId);

    const selectionItems = [];

    for (const item of rules.json_rules.default_items) {
      const categoryId = categoryMap[item.category];
      if (!categoryId) {
        console.warn(`Category not found: ${item.category}`);
        continue;
      }

      const selectionItem: any = {
        project_id: projectId,
        room_id: roomId,
        category_id: categoryId,
        label: item.label,
        description: item.description || '',
        trade: item.category,
        uses_master_default: item.uses_master_default || false,
        master_field_name: item.master_field || null,
      };

      // Apply master defaults if specified
      if (item.uses_master_default && item.master_field) {
        const masterData = item.master_source === 'interior' ? masterInterior : masterExterior;
        
        if (masterData && masterData[item.master_field]) {
          // Check if it's a product ID reference
          if (item.visual_selector === 'flooring_gallery' && item.master_field === 'default_flooring_product_id') {
            const product = await this.getFlooringProduct(masterData[item.master_field]);
            if (product) {
              selectionItem.product_id = product.id;
              selectionItem.product_type = 'flooring';
              selectionItem.material_type = product.name;
              selectionItem.image_url = product.room_image_url;
            }
          } else {
            // It's a text field
            selectionItem.color_name = masterData[item.master_field];
          }
        }
      }

      selectionItems.push(selectionItem);
    }

    // Insert all selection items
    const { data, error } = await supabase
      .from('selection_items')
      .insert(selectionItems)
      .select();

    if (error) {
      console.error('Error creating selection items:', error);
      throw error;
    }

    return data;
  }
};
