import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";

export type StickyNote = Tables<"sticky_notes">;
export type CreateStickyNote = TablesInsert<"sticky_notes">;

export const stickyNotesService = {
  async getStickyNotes(attachedToType?: string, attachedToId?: string): Promise<StickyNote[]> {
    console.log('getStickyNotes called with:', { attachedToType, attachedToId });
    
    let query = supabase
      .from('sticky_notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (attachedToType && attachedToId) {
      console.log('Filtering by attachment:', attachedToType, attachedToId);
      query = query
        .eq('attached_to_type', attachedToType)
        .eq('attached_to_id', attachedToId);
    } else if (!attachedToType) {
      // Get all notes for general bulletin board (both attached and unattached)
      console.log('Getting all bulletin board notes');
      // Don't filter - show all notes
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching sticky notes:', error);
      throw error;
    }
    
    console.log('Fetched sticky notes from DB:', data);
    return data || [];
  },

  async createStickyNote(note: CreateStickyNote): Promise<StickyNote> {
    console.log('Creating sticky note:', note);
    
    const { data, error } = await supabase
      .from('sticky_notes')
      .insert(note)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating sticky note:', error);
      throw error;
    }
    
    console.log('Created sticky note:', data);
    return data;
  },

  async updateStickyNote(id: string, updates: Partial<StickyNote>): Promise<StickyNote> {
    const { data, error } = await supabase
      .from('sticky_notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating sticky note:', error);
      throw error;
    }
    
    return data;
  },

  async deleteStickyNote(id: string): Promise<void> {
    const { error } = await supabase
      .from('sticky_notes')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting sticky note:', error);
      throw error;
    }
  }
};