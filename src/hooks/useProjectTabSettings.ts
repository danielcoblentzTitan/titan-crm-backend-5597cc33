import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TabSetting {
  id: string;
  tab_name: string;
  is_enabled: boolean;
  tab_type: string;
  parent_tab: string | null;
  sort_order: number;
}

export const useProjectTabSettings = (projectId: string) => {
  const [tabSettings, setTabSettings] = useState<TabSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadTabSettings();
    }
  }, [projectId]);

  const loadTabSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('project_tab_settings')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setTabSettings(data || []);
    } catch (error) {
      console.error('Error loading tab settings:', error);
      // Use default settings if none exist
      setTabSettings([]);
    } finally {
      setLoading(false);
    }
  };

  const isTabEnabled = (tabName: string, parentTab?: string) => {
    const setting = tabSettings.find(s => 
      s.tab_name === tabName && 
      (parentTab ? s.parent_tab === parentTab : true)
    );
    
    // Default to enabled if no setting found
    return setting ? setting.is_enabled : true;
  };

  const getEnabledMainTabs = () => {
    return tabSettings
      .filter(s => s.tab_type === 'main' && s.is_enabled)
      .map(s => s.tab_name);
  };

  const getEnabledDesignSubTabs = () => {
    return tabSettings
      .filter(s => s.tab_type === 'sub' && s.parent_tab === 'design' && s.is_enabled)
      .map(s => s.tab_name);
  };

  return {
    tabSettings,
    loading,
    isTabEnabled,
    getEnabledMainTabs,
    getEnabledDesignSubTabs,
    refreshSettings: loadTabSettings
  };
};