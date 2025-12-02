import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Save, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TabSetting {
  id: string;
  tab_name: string;
  is_enabled: boolean;
  tab_type: string;
  parent_tab: string | null;
  sort_order: number;
}

interface ProjectTabConfigurationProps {
  projectId: string;
  projectName: string;
}

const MAIN_TAB_CONFIG = [
  { name: 'overview', label: 'Overview', description: 'Project summary and progress' },
  { name: 'schedule', label: 'Schedule', description: 'Timeline and milestones' },
  { name: 'documents', label: 'Documents', description: 'Project files and documents' },
  { name: 'financial', label: 'Financial', description: 'Invoices and payments' },
  { name: 'messages', label: 'Messages', description: 'Project communications' },
  { name: 'design', label: 'Design', description: 'Design selections and options' },
  { name: 'punchlist', label: 'Punchlist', description: 'Final inspection items' },
];

const DESIGN_SUB_TAB_CONFIG = [
  { name: 'exterior', label: 'Exterior', description: 'Building exterior colors and materials' },
  { name: 'garage', label: 'Garage', description: 'Garage door selections' },
  { name: 'entry', label: 'Entry', description: 'Entry doors and hardware' },
  { name: 'interior', label: 'Interior', description: 'Interior finishes and flooring' },
  { name: 'kitchen', label: 'Kitchen', description: 'Kitchen cabinets and countertops' },
  { name: 'bathrooms', label: 'Bathrooms', description: 'Bathroom fixtures and finishes' },
  { name: 'mudroom', label: 'Mudroom', description: 'Mudroom storage and finishes' },
];

export const ProjectTabConfiguration = ({ projectId, projectName }: ProjectTabConfigurationProps) => {
  const [tabSettings, setTabSettings] = useState<TabSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTabSettings();
  }, [projectId]);

  const loadTabSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('project_tab_settings')
        .select('*')
        .eq('project_id', projectId)
        .order('tab_type', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      // If no settings exist, initialize with defaults
      if (!data || data.length === 0) {
        console.log('No tab settings found, initializing defaults...');
        await initializeDefaultSettings();
        return;
      }
      
      setTabSettings(data || []);
    } catch (error) {
      console.error('Error loading tab settings:', error);
      toast({
        title: "Error",
        description: "Failed to load tab configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultSettings = async () => {
    try {
      const defaultSettings = [
        // Main tabs
        ...MAIN_TAB_CONFIG.map((tab, index) => ({
          project_id: projectId,
          tab_name: tab.name,
          is_enabled: true, // Enable all by default
          tab_type: 'main',
          parent_tab: null as string | null,
          sort_order: index
        })),
        // Design sub-tabs
        ...DESIGN_SUB_TAB_CONFIG.map((tab, index) => ({
          project_id: projectId,
          tab_name: tab.name,
          is_enabled: false, // Disable sub-tabs by default
          tab_type: 'sub',
          parent_tab: 'design' as string | null,
          sort_order: index
        }))
      ];

      const { error } = await supabase
        .from('project_tab_settings')
        .insert(defaultSettings);

      if (error) throw error;

      toast({
        title: "Initialized",
        description: "Default tab settings have been created",
      });

      // Reload the settings
      loadTabSettings();
    } catch (error) {
      console.error('Error initializing default settings:', error);
      toast({
        title: "Error",
        description: "Failed to initialize default settings",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const updateTabSetting = async (tabName: string, isEnabled: boolean) => {
    setSaving(true);
    try {
      const { error, status } = await supabase
        .from('project_tab_settings')
        .update({ is_enabled: isEnabled })
        .eq('project_id', projectId)
        .eq('tab_name', tabName);

      if (error) {
        console.error('Error updating tab setting:', error);
        
        // Check if it's a permission error
        if (status === 403 || error.message?.includes('permission') || error.message?.includes('policy')) {
          toast({
            title: "Permission Denied",
            description: "You don't have permission to modify tab settings. Builder role required.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: `Failed to update tab setting: ${error.message}`,
            variant: "destructive"
          });
        }
        return;
      }

      // Update local state
      setTabSettings(prev => 
        prev.map(setting => 
          setting.tab_name === tabName 
            ? { ...setting, is_enabled: isEnabled }
            : setting
        )
      );

      // If disabling design tab, also disable all design sub-tabs
      if (tabName === 'design' && !isEnabled) {
        const designSubTabs = tabSettings.filter(
          setting => setting.parent_tab === 'design'
        );
        
        for (const subTab of designSubTabs) {
          await supabase
            .from('project_tab_settings')
            .update({ is_enabled: false })
            .eq('project_id', projectId)
            .eq('tab_name', subTab.tab_name);
        }

        setTabSettings(prev => 
          prev.map(setting => 
            setting.parent_tab === 'design'
              ? { ...setting, is_enabled: false }
              : setting
          )
        );
      }

      toast({
        title: "Updated",
        description: `${tabName} tab ${isEnabled ? 'enabled' : 'disabled'}`,
      });

    } catch (error) {
      console.error('Error updating tab setting:', error);
      toast({
        title: "Error",
        description: "Failed to update tab setting. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      toast({
        title: "Configuration Saved",
        description: "Tab configuration has been updated successfully",
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getTabSetting = (tabName: string) => {
    return tabSettings.find(setting => setting.tab_name === tabName);
  };

  const isDesignEnabled = getTabSetting('design')?.is_enabled || false;
  const enabledMainTabs = tabSettings.filter(s => s.tab_type === 'main' && s.is_enabled).length;
  const enabledSubTabs = tabSettings.filter(s => s.tab_type === 'sub' && s.is_enabled).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading tab configuration...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Customer Portal Tab Configuration
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Configure which tabs are available for {projectName}
            </p>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {enabledMainTabs} of {MAIN_TAB_CONFIG.length} main tabs
              </Badge>
              <Badge variant="outline">
                {enabledSubTabs} design sub-tabs
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Warning if too few tabs enabled */}
      {enabledMainTabs < 2 && (
        <Alert>
          <AlertDescription>
            ⚠️ Warning: At least 2 main tabs should be enabled for a good customer experience.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Main Navigation Tabs</CardTitle>
          <p className="text-sm text-muted-foreground">
            Control which main sections are available in the customer portal
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {MAIN_TAB_CONFIG.map((tab) => {
            const setting = getTabSetting(tab.name);
            const isEnabled = setting?.is_enabled || false;
            
            return (
              <div
                key={tab.name}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {isEnabled ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                    <div>
                      <h4 className="font-medium">{tab.label}</h4>
                      <p className="text-sm text-muted-foreground">{tab.description}</p>
                    </div>
                  </div>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => updateTabSetting(tab.name, checked)}
                  disabled={saving}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Design Sub-Tabs Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Design Selection Sub-Tabs</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure which design selection categories are available
            {!isDesignEnabled && (
              <span className="text-amber-600 ml-2">
                (Design tab must be enabled first)
              </span>
            )}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {DESIGN_SUB_TAB_CONFIG.map((tab) => {
            const setting = getTabSetting(tab.name);
            const isEnabled = setting?.is_enabled || false;
            
            return (
              <div
                key={tab.name}
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  !isDesignEnabled 
                    ? 'opacity-50 bg-gray-50' 
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {isEnabled && isDesignEnabled ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                    <div>
                      <h4 className="font-medium">{tab.label}</h4>
                      <p className="text-sm text-muted-foreground">{tab.description}</p>
                    </div>
                  </div>
                </div>
                <Switch
                  checked={isEnabled && isDesignEnabled}
                  onCheckedChange={(checked) => updateTabSetting(tab.name, checked)}
                  disabled={saving || !isDesignEnabled}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={loadTabSettings} disabled={saving}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button onClick={saveConfiguration} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
};