import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, CheckCircle2, Calendar, DollarSign } from "lucide-react";

interface ProjectTypeConfigurationProps {
  projectId: string;
  projectName: string;
}

interface ProjectTypeConfig {
  id: string;
  name: string;
  description: string;
}

interface AddonPackage {
  id: string;
  name: string;
  description: string;
  category: string;
  phase_count?: number;
}

export const ProjectTypeConfiguration = ({ projectId }: ProjectTypeConfigurationProps) => {
  const [configs, setConfigs] = useState<ProjectTypeConfig[]>([]);
  const [addons, setAddons] = useState<AddonPackage[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string>("");
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [currentConfig, setCurrentConfig] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load current project configuration
      const { data: project } = await supabase
        .from('projects')
        .select('project_type_config_id')
        .eq('id', projectId)
        .single();

      if (project?.project_type_config_id) {
        setCurrentConfig(project.project_type_config_id);
        setSelectedConfig(project.project_type_config_id);
      }

      // Load available project type configs, then filter client-side to 3 canonical types
      const { data: configsData, error: configsError } = await supabase
        .from('project_type_configs')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');

      if (configsError) throw configsError;

      const pickFirstMatch = (keywords: string[]) => {
        const list = (configsData || []).filter((c: ProjectTypeConfig) =>
          keywords.some(k => c.name.toLowerCase().includes(k))
        );
        if (list.length === 0) return null;
        // Prefer the shortest name (likely the base config)
        return list.sort((a: ProjectTypeConfig, b: ProjectTypeConfig) => a.name.length - b.name.length)[0];
      };

      const allowed: ProjectTypeConfig[] = [];
      const res = pickFirstMatch(['residential']);
      if (res) allowed.push(res);
      const com = pickFirstMatch(['commercial']);
      if (com) allowed.push(com);
      const barn = pickFirstMatch(['barndominium', 'barndo']);
      if (barn) allowed.push(barn);

      setConfigs(allowed);

      // If the current selection isn't among allowed, clear it so the user picks one
      if (project?.project_type_config_id && !allowed.some(c => c.id === project.project_type_config_id)) {
        setSelectedConfig("");
      }

      // Load available addon packages with phase counts
      const { data: addonsData, error: addonsError } = await supabase
        .from('phase_addon_packages')
        .select('id, name, description, category')
        .eq('is_active', true)
        .order('category')
        .order('sort_order');

      if (addonsError) throw addonsError;
      
      // Get phase counts separately
      const addonsWithCounts = await Promise.all(
        (addonsData || []).map(async (addon) => {
          const { count } = await supabase
            .from('phase_addon_items')
            .select('*', { count: 'exact', head: true })
            .eq('addon_package_id', addon.id);
          
          return {
            ...addon,
            phase_count: count || 0
          };
        })
      );
      
      setAddons(addonsWithCounts);

      // Load currently selected addons for this project
      const { data: selectionsData } = await supabase
        .from('project_addon_selections')
        .select('addon_package_id')
        .eq('project_id', projectId);

      if (selectionsData) {
        setSelectedAddons(new Set(selectionsData.map(s => s.addon_package_id)));
      }

    } catch (error) {
      console.error('Error loading configuration data:', error);
      toast({
        title: "Error",
        description: "Failed to load configuration options",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAddon = (addonId: string) => {
    const newSelected = new Set(selectedAddons);
    if (newSelected.has(addonId)) {
      newSelected.delete(addonId);
    } else {
      newSelected.add(addonId);
    }
    setSelectedAddons(newSelected);
  };

  const handleApplyConfiguration = async () => {
    try {
      setLoading(true);

      // Update project with selected config
      const { error: projectError } = await supabase
        .from('projects')
        .update({ project_type_config_id: selectedConfig })
        .eq('id', projectId);

      if (projectError) throw projectError;

      // Delete existing addon selections
      await supabase
        .from('project_addon_selections')
        .delete()
        .eq('project_id', projectId);

      // Insert new addon selections
      if (selectedAddons.size > 0) {
        const selections = Array.from(selectedAddons).map(addonId => ({
          project_id: projectId,
          addon_package_id: addonId
        }));

        const { error: selectionsError } = await supabase
          .from('project_addon_selections')
          .insert(selections);

        if (selectionsError) throw selectionsError;
      }

      setCurrentConfig(selectedConfig);

      toast({
        title: "Configuration Updated",
        description: "Project configuration has been saved successfully"
      });

    } catch (error) {
      console.error('Error applying configuration:', error);
      toast({
        title: "Error",
        description: "Failed to apply configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTotalPhases = () => {
    let total = 0;
    selectedAddons.forEach(addonId => {
      const addon = addons.find(a => a.id === addonId);
      if (addon) total += addon.phase_count || 0;
    });
    return total;
  };

  const groupedAddons = addons.reduce((acc, addon) => {
    if (!acc[addon.category]) {
      acc[addon.category] = [];
    }
    acc[addon.category].push(addon);
    return acc;
  }, {} as Record<string, AddonPackage[]>);

  const hasChanges = currentConfig !== selectedConfig || 
    JSON.stringify(Array.from(selectedAddons).sort()) !== JSON.stringify(Array.from(selectedAddons).sort());

  if (loading && configs.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Project Type Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Select a base configuration and add optional packages to customize phases and payment schedule
        </p>
      </div>

      {/* Project Type Selector */}
      <div className="space-y-3">
        <Label>Base Project Type</Label>
        <Select value={selectedConfig} onValueChange={setSelectedConfig}>
          <SelectTrigger>
            <SelectValue placeholder="Select project type..." />
          </SelectTrigger>
          <SelectContent>
            {configs.map(config => (
              <SelectItem key={config.id} value={config.id}>
                {config.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedConfig && configs.find(c => c.id === selectedConfig)?.description && (
          <p className="text-xs text-muted-foreground mt-1">
            {configs.find(c => c.id === selectedConfig)?.description}
          </p>
        )}
      </div>

      {/* Add-on Packages */}
      <div className="space-y-4">
        <div>
          <Label>Optional Add-on Packages</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Select additional packages to include in your project
          </p>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedAddons).map(([category, categoryAddons]) => (
            <div key={category} className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
              <div className="space-y-2">
                {categoryAddons.map(addon => (
                  <div key={addon.id} className="flex items-start space-x-3 p-3 rounded-lg border bg-card">
                    <Checkbox
                      id={addon.id}
                      checked={selectedAddons.has(addon.id)}
                      onCheckedChange={() => handleToggleAddon(addon.id)}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={addon.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {addon.name}
                      </Label>
                      {addon.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {addon.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Package className="h-3 w-3" />
                        {addon.phase_count} phases
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-muted/50 p-4 rounded-lg space-y-3">
        <h4 className="font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Configuration Summary
        </h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Total Phases
            </div>
            <div className="text-lg font-semibold">{getTotalPhases()}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Package className="h-3 w-3" />
              Add-ons Selected
            </div>
            <div className="text-lg font-semibold">{selectedAddons.size}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              Payment Schedule
            </div>
            <div className="text-sm font-medium">Based on config</div>
          </div>
        </div>
      </div>

      {/* Apply Button */}
      <div className="flex justify-end gap-2">
        {hasChanges && (
          <Button
            onClick={loadData}
            variant="outline"
            disabled={loading}
          >
            Reset
          </Button>
        )}
        <Button
          onClick={handleApplyConfiguration}
          disabled={!selectedConfig || loading || !hasChanges}
        >
          {loading ? "Applying..." : "Apply Configuration"}
        </Button>
      </div>
    </div>
  );
};
