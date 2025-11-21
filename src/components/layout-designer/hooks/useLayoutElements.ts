import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LayoutElement {
  id: string;
  layout_id: string;
  element_type: string;
  position_data: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  properties: Record<string, any>;
  created_at?: string;
}

export const useLayoutElements = (layoutId: string | null) => {
  const [elements, setElements] = useState<LayoutElement[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadElements = useCallback(async () => {
    if (!layoutId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('layout_elements')
        .select('*')
        .eq('layout_id', layoutId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setElements((data || []).map(item => ({
        ...item,
        position_data: item.position_data as { x: number; y: number; width: number; height: number; },
        properties: item.properties as Record<string, any>
      })));
    } catch (error) {
      console.error('Error loading layout elements:', error);
      toast({
        title: "Error",
        description: "Failed to load layout elements.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [layoutId, toast]);

  const saveElement = useCallback(async (element: Omit<LayoutElement, 'id'>) => {
    if (!layoutId) return null;

    try {
      const { data, error } = await supabase
        .from('layout_elements')
        .insert([{
          layout_id: layoutId,
          element_type: element.element_type,
          position_data: element.position_data,
          properties: element.properties,
        }])
        .select()
        .single();

      if (error) throw error;
      
      const newElement: LayoutElement = {
        ...data,
        position_data: data.position_data as { x: number; y: number; width: number; height: number; },
        properties: data.properties as Record<string, any>
      };
      setElements(prev => [...prev, newElement]);
      return data.id;
    } catch (error) {
      console.error('Error saving element:', error);
      toast({
        title: "Error",
        description: "Failed to save element.",
        variant: "destructive",
      });
      return null;
    }
  }, [layoutId, toast]);

  const updateElement = useCallback(async (id: string, updates: Partial<LayoutElement>) => {
    try {
      const { error } = await supabase
        .from('layout_elements')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setElements(prev => prev.map(el => 
        el.id === id ? { ...el, ...updates } : el
      ));
    } catch (error) {
      console.error('Error updating element:', error);
      toast({
        title: "Error",
        description: "Failed to update element.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const deleteElement = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('layout_elements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setElements(prev => prev.filter(el => el.id !== id));
    } catch (error) {
      console.error('Error deleting element:', error);
      toast({
        title: "Error",
        description: "Failed to delete element.",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    elements,
    loading,
    loadElements,
    saveElement,
    updateElement,
    deleteElement,
  };
};