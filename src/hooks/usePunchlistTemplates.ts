import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TemplateItem {
  location: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  assigned_to_vendor?: string;
  due_date?: string;
}

export interface PunchlistTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'room' | 'trade' | 'general';
  template_items: TemplateItem[];
  is_active: boolean;
  is_public: boolean;
  project_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  category: 'room' | 'trade' | 'general';
  template_items: TemplateItem[];
  is_public?: boolean;
  project_id?: string;
}

export function usePunchlistTemplates(projectId?: string) {
  const [templates, setTemplates] = useState<PunchlistTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('punchlist_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      // Get both public templates and project-specific templates
      if (projectId) {
        query = query.or(`is_public.eq.true,project_id.eq.${projectId}`);
      } else {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTemplates(data as unknown as PunchlistTemplate[] || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (templateData: CreateTemplateData) => {
    try {
      const { data, error } = await supabase
        .from('punchlist_templates')
        .insert({
          ...templateData,
          template_items: templateData.template_items as any,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setTemplates(prev => [...prev, data as unknown as PunchlistTemplate]);
      toast({
        title: "Success",
        description: "Template created successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<CreateTemplateData>) => {
    try {
      const updateData: any = { ...updates };
      if (updateData.template_items) {
        updateData.template_items = updateData.template_items as any;
      }
      
      const { data, error } = await supabase
        .from('punchlist_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTemplates(prev => prev.map(template => template.id === id ? data as unknown as PunchlistTemplate : template));
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('punchlist_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      
      setTemplates(prev => prev.filter(template => template.id !== id));
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getTemplatesByCategory = (category: string) => {
    return templates.filter(template => template.category === category);
  };

  useEffect(() => {
    fetchTemplates();
  }, [projectId]);

  return {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplatesByCategory,
    refetch: fetchTemplates,
  };
}