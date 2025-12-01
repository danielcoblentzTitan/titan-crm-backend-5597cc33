import { supabase } from "@/integrations/supabase/client";

export interface PricingCategory {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PricingItem {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  unit_type: string;
  base_price: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: PricingCategory;
  has_formula?: boolean;
  formula_type?: string;
  formula_params?: any;
}

export interface PricingItemWithCategory extends PricingItem {
  category: PricingCategory;
}

export interface PricingItemWithFormula extends PricingItemWithCategory {
  has_formula: boolean;
  formula_type?: string;
  formula_params?: any;
}

class PricingService {
  async getCategories(): Promise<PricingCategory[]> {
    const { data, error } = await supabase
      .from('pricing_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching pricing categories:', error);
      throw error;
    }

    return data || [];
  }

  async getItems(): Promise<PricingItemWithCategory[]> {
    const { data, error } = await supabase
      .from('pricing_items')
      .select(`
        *,
        category:pricing_categories(*)
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching pricing items:', error);
      throw error;
    }

    return data || [];
  }

  async getItemsByCategory(categoryId: string): Promise<PricingItem[]> {
    const { data, error } = await supabase
      .from('pricing_items')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching pricing items by category:', error);
      throw error;
    }

    return data || [];
  }

  async createCategory(category: Omit<PricingCategory, 'id' | 'created_at' | 'updated_at'>): Promise<PricingCategory> {
    const { data, error } = await supabase
      .from('pricing_categories')
      .insert(category)
      .select()
      .single();

    if (error) {
      console.error('Error creating pricing category:', error);
      throw error;
    }

    return data;
  }

  async updateCategory(id: string, updates: Partial<PricingCategory>): Promise<PricingCategory> {
    const { data, error } = await supabase
      .from('pricing_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating pricing category:', error);
      throw error;
    }

    return data;
  }

  async createItem(item: Omit<PricingItem, 'id' | 'created_at' | 'updated_at'>): Promise<PricingItem> {
    const { data, error } = await supabase
      .from('pricing_items')
      .insert(item)
      .select()
      .single();

    if (error) {
      console.error('Error creating pricing item:', error);
      throw error;
    }

    return data;
  }

  async updateItem(id: string, updates: Partial<PricingItem>): Promise<PricingItem> {
    const { data, error } = await supabase
      .from('pricing_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating pricing item:', error);
      throw error;
    }

    return data;
  }

  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('pricing_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting pricing item:', error);
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('pricing_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting pricing category:', error);
      throw error;
    }
  }

  async bulkUpdatePrices(updates: { id: string; base_price: number }[]): Promise<void> {
    const promises = updates.map(update => 
      this.updateItem(update.id, { base_price: update.base_price })
    );

    await Promise.all(promises);
  }

  async bulkUpdateCategorySortOrder(updates: { id: string; sort_order: number }[]): Promise<void> {
    const promises = updates.map(update => 
      this.updateCategory(update.id, { sort_order: update.sort_order })
    );

    await Promise.all(promises);
  }
}

export const pricingService = new PricingService();