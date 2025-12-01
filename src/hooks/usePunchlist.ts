import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Photo {
  url: string;
  type: 'general' | 'before' | 'after';
  uploaded_at: string;
  description?: string;
}

export interface PunchlistItem {
  id: string;
  project_id: string;
  location: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  photo_url?: string;
  photos?: Photo[];
  before_photos?: Photo[];
  after_photos?: Photo[];
  assigned_to_user_id?: string;
  assigned_to_vendor?: string;
  due_date?: string;
  status: 'Open' | 'In Progress' | 'Completed';
  source: 'customer' | 'internal';
  created_by?: string;
  created_at: string;
  completed_by?: string;
  completed_at?: string;
  updated_at: string;
  overdue_notification_sent?: boolean;
  last_comment_at?: string;
}

export interface BulkUpdateData {
  status?: 'Open' | 'In Progress' | 'Completed';
  priority?: 'Low' | 'Medium' | 'High';
  assigned_to_vendor?: string;
  assigned_to_user_id?: string;
  due_date?: string;
}

export interface CreatePunchlistItemData {
  project_id: string;
  location: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  photo_url?: string;
  assigned_to_user_id?: string;
  assigned_to_vendor?: string;
  due_date?: string;
  source: 'customer' | 'internal';
}

export function usePunchlist(projectId?: string) {
  const [items, setItems] = useState<PunchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchItems = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('punchlist_items')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .returns<PunchlistItem[]>();

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching punchlist items:', error);
      toast({
        title: "Error",
        description: "Failed to load punchlist items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (itemData: CreatePunchlistItemData) => {
    try {
      const { data, error } = await supabase
        .from('punchlist_items')
        .insert(itemData)
        .select()
        .single()
        .returns<PunchlistItem>();

      if (error) throw error;
      
      setItems(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Punchlist item created",
      });
      
      return data;
    } catch (error) {
      console.error('Error creating punchlist item:', error);
      toast({
        title: "Error",
        description: "Failed to create punchlist item",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateItem = async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('punchlist_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setItems(prev => prev.map(item => item.id === id ? { ...item, ...data } as unknown as PunchlistItem : item));
      toast({
        title: "Success",
        description: "Punchlist item updated",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating punchlist item:', error);
      toast({
        title: "Error",
        description: "Failed to update punchlist item",
        variant: "destructive",
      });
      throw error;
    }
  };

  const markComplete = async (id: string) => {
    const updates = {
      status: 'Completed' as const,
      completed_at: new Date().toISOString(),
    };
    
    return updateItem(id, updates);
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('punchlist_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setItems(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Success",
        description: "Punchlist item deleted",
      });
    } catch (error) {
      console.error('Error deleting punchlist item:', error);
      toast({
        title: "Error",
        description: "Failed to delete punchlist item",
        variant: "destructive",
      });
      throw error;
    }
  };

  const bulkUpdate = async (ids: string[], updates: BulkUpdateData) => {
    try {
      const { data, error } = await supabase
        .from('punchlist_items')
        .update(updates)
        .in('id', ids)
        .select();

      if (error) throw error;
      
      setItems(prev => prev.map(item => {
        const updatedItem = data?.find(d => d.id === item.id);
        return updatedItem ? { ...item, ...updatedItem } as unknown as PunchlistItem : item;
      }));
      
      toast({
        title: "Success",
        description: `${ids.length} item${ids.length > 1 ? 's' : ''} updated`,
      });
      
      return data;
    } catch (error) {
      console.error('Error bulk updating punchlist items:', error);
      toast({
        title: "Error",
        description: "Failed to update punchlist items",
        variant: "destructive",
      });
      throw error;
    }
  };

  const bulkDelete = async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('punchlist_items')
        .delete()
        .in('id', ids);

      if (error) throw error;
      
      setItems(prev => prev.filter(item => !ids.includes(item.id)));
      toast({
        title: "Success",
        description: `${ids.length} item${ids.length > 1 ? 's' : ''} deleted`,
      });
    } catch (error) {
      console.error('Error bulk deleting punchlist items:', error);
      toast({
        title: "Error",
        description: "Failed to delete punchlist items",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getOverdueItems = () => {
    if (!items.length) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return items.filter(item => {
      if (!item.due_date || item.status === 'Completed') return false;
      const dueDate = new Date(item.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    });
  };

  const updatePhotos = async (id: string, photos: Photo[], photoType: 'general' | 'before' | 'after') => {
    try {
      const columnName = photoType === 'general' ? 'photos' : 
                        photoType === 'before' ? 'before_photos' : 'after_photos';
      
      const { data, error } = await supabase
        .from('punchlist_items')
        .update({ [columnName]: photos })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setItems(prev => prev.map(item => item.id === id ? { ...item, ...data } as unknown as PunchlistItem : item));
      toast({
        title: "Success",
        description: "Photos updated",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating photos:', error);
      toast({
        title: "Error",
        description: "Failed to update photos",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getDueSoonItems = (days: number = 3) => {
    if (!items.length) return [];
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    return items.filter(item => {
      if (!item.due_date || item.status === 'Completed') return false;
      const dueDate = new Date(item.due_date);
      return dueDate >= today && dueDate <= futureDate;
    });
  };

  const getCompletionPercentage = () => {
    if (items.length === 0) return 0;
    const completedItems = items.filter(item => item.status === 'Completed');
    return Math.round((completedItems.length / items.length) * 100);
  };

  // Real-time subscription with optimized updates
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel('punchlist-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'punchlist_items',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('New punchlist item added:', payload.new);
          const newItem = payload.new as PunchlistItem;
          setItems(prev => [newItem, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'punchlist_items',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('Punchlist item updated:', payload.new);
          const updatedItem = payload.new as PunchlistItem;
          setItems(prev => prev.map(item => 
            item.id === updatedItem.id ? updatedItem : item
          ));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'punchlist_items',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('Punchlist item deleted:', payload.old);
          const deletedItem = payload.old as PunchlistItem;
          setItems(prev => prev.filter(item => item.id !== deletedItem.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  useEffect(() => {
    fetchItems();
  }, [projectId]);

  return {
    items,
    loading,
    createItem,
    updateItem,
    markComplete,
    deleteItem,
    bulkUpdate,
    bulkDelete,
    updatePhotos,
    getOverdueItems,
    getDueSoonItems,
    getCompletionPercentage,
    refetch: fetchItems,
  };
}