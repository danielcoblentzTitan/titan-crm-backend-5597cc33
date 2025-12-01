import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BuildingLayout {
  id: string;
  customer_id: string;
  name: string;
  building_width: number;
  building_length: number;
  building_height: number;
  layout_data: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface SaveLayoutData {
  name: string;
  elements: any[];
  width: number;
  height: number;
  notes?: string;
}

export const useLayoutPersistence = (customerId: string) => {
  const [layouts, setLayouts] = useState<BuildingLayout[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadLayouts = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('building_layouts')
        .select('*')
        .eq('customer_id', customerId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setLayouts(data || []);
    } catch (error) {
      console.error('Error loading layouts:', error);
      toast({
        title: "Error",
        description: "Failed to load layouts.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [customerId, toast]);

  useEffect(() => {
    if (customerId) {
      loadLayouts();
    }
  }, [customerId, loadLayouts]);

  const saveLayout = useCallback(async (layoutData: SaveLayoutData): Promise<string> => {
    try {
      setIsSaving(true);
      
      const { data, error } = await supabase
        .from('building_layouts')
        .insert([{
          customer_id: customerId,
          name: layoutData.name,
          building_width: layoutData.width,
          building_length: layoutData.height,
          building_height: 12, // Default height
          layout_data: {
            elements: layoutData.elements,
            canvas: { width: layoutData.width, height: layoutData.height }
          },
          notes: layoutData.notes,
        }])
        .select()
        .single();

      if (error) throw error;
      
      setLayouts(prev => [data, ...prev]);
      await loadLayouts(); // Refresh the list
      return data.id;
    } catch (error) {
      console.error('Error saving layout:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [customerId, loadLayouts]);

  const loadLayout = useCallback(async (layoutId: string): Promise<BuildingLayout | null> => {
    try {
      const { data, error } = await supabase
        .from('building_layouts')
        .select('*')
        .eq('id', layoutId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading layout:', error);
      throw error;
    }
  }, []);

  const deleteLayout = useCallback(async (layoutId: string) => {
    try {
      const { error } = await supabase
        .from('building_layouts')
        .delete()
        .eq('id', layoutId);

      if (error) throw error;
      
      setLayouts(prev => prev.filter(layout => layout.id !== layoutId));
      toast({
        title: "Layout deleted",
        description: "Layout has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting layout:', error);
      toast({
        title: "Error",
        description: "Failed to delete layout.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const updateLayout = useCallback(async (layoutId: string, updates: Partial<BuildingLayout>) => {
    try {
      const { error } = await supabase
        .from('building_layouts')
        .update(updates)
        .eq('id', layoutId);

      if (error) throw error;
      
      setLayouts(prev => prev.map(layout => 
        layout.id === layoutId ? { ...layout, ...updates } : layout
      ));
    } catch (error) {
      console.error('Error updating layout:', error);
      throw error;
    }
  }, []);

  return {
    layouts,
    isSaving,
    isLoading,
    saveLayout,
    loadLayout,
    deleteLayout,
    updateLayout,
    loadLayouts,
  };
};