import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { quickEstimateService, type QuickEstimateSettings } from '@/services/quickEstimateService';
import { useToast } from '@/hooks/use-toast';

export function QuickEstimateSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<QuickEstimateSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await quickEstimateService.loadSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quick estimate settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      // Update all settings
      await Promise.all(
        Object.entries(settings).map(([key, value]) =>
          quickEstimateService.updateSetting(key, value)
        )
      );

      toast({
        title: 'Success',
        description: 'Quick estimate settings saved',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof QuickEstimateSettings, value: number) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Quick Estimate Settings</h2>
        <p className="text-muted-foreground">
          Configure pricing rates for barndominium quick estimates. These rates apply team-wide.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Shell Only */}
        <Card>
          <CardHeader>
            <CardTitle>Shell Only</CardTitle>
            <CardDescription>Base structure only</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Low Rate ($/sq ft)</Label>
              <Input
                type="number"
                value={settings.shell_rate_low}
                onChange={(e) => updateSetting('shell_rate_low', Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>High Rate ($/sq ft)</Label>
              <Input
                type="number"
                value={settings.shell_rate_high}
                onChange={(e) => updateSetting('shell_rate_high', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Dried-In */}
        <Card>
          <CardHeader>
            <CardTitle>Dried-In</CardTitle>
            <CardDescription>Weatherproof structure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Low Rate ($/sq ft)</Label>
              <Input
                type="number"
                value={settings.dried_in_rate_low}
                onChange={(e) => updateSetting('dried_in_rate_low', Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>High Rate ($/sq ft)</Label>
              <Input
                type="number"
                value={settings.dried_in_rate_high}
                onChange={(e) => updateSetting('dried_in_rate_high', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Turnkey */}
        <Card>
          <CardHeader>
            <CardTitle>Turnkey</CardTitle>
            <CardDescription>Move-in ready</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Low Rate ($/sq ft)</Label>
              <Input
                type="number"
                value={settings.turnkey_rate_low}
                onChange={(e) => updateSetting('turnkey_rate_low', Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>High Rate ($/sq ft)</Label>
              <Input
                type="number"
                value={settings.turnkey_rate_high}
                onChange={(e) => updateSetting('turnkey_rate_high', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Custom */}
        <Card>
          <CardHeader>
            <CardTitle>Custom</CardTitle>
            <CardDescription>Fully customized build</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Low Rate ($/sq ft)</Label>
              <Input
                type="number"
                value={settings.custom_rate_low}
                onChange={(e) => updateSetting('custom_rate_low', Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>High Rate ($/sq ft)</Label>
              <Input
                type="number"
                value={settings.custom_rate_high}
                onChange={(e) => updateSetting('custom_rate_high', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Shop/Garage */}
        <Card>
          <CardHeader>
            <CardTitle>Shop/Garage</CardTitle>
            <CardDescription>Additional shop space</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Rate ($/sq ft)</Label>
              <Input
                type="number"
                value={settings.shop_rate}
                onChange={(e) => updateSetting('shop_rate', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Site & Utilities */}
        <Card>
          <CardHeader>
            <CardTitle>Site & Utilities</CardTitle>
            <CardDescription>Allowance for site work</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Low Allowance ($)</Label>
              <Input
                type="number"
                value={settings.site_utilities_low}
                onChange={(e) => updateSetting('site_utilities_low', Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>High Allowance ($)</Label>
              <Input
                type="number"
                value={settings.site_utilities_high}
                onChange={(e) => updateSetting('site_utilities_high', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
