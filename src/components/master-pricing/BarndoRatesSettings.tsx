import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { quickEstimateService, type QuickEstimateSettings } from '@/services/quickEstimateService';
import { useToast } from '@/hooks/use-toast';

export function BarndoRatesSettings() {
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
        description: 'Failed to load barndo rate settings',
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
      await Promise.all(
        Object.entries(settings).map(([key, value]) =>
          quickEstimateService.updateSetting(key, value)
        )
      );

      toast({
        title: 'Success',
        description: 'Barndo rates saved successfully',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save barndo rates',
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
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Barndo Sq Ft Rates</CardTitle>
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Rates
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Shell Only */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Shell Only</h4>
            <div className="space-y-2">
              <Label className="text-xs">Low ($/sq ft)</Label>
              <Input
                type="number"
                step="0.01"
                value={settings.shell_rate_low}
                onChange={(e) => updateSetting('shell_rate_low', Number(e.target.value))}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">High ($/sq ft)</Label>
              <Input
                type="number"
                step="0.01"
                value={settings.shell_rate_high}
                onChange={(e) => updateSetting('shell_rate_high', Number(e.target.value))}
                className="h-9"
              />
            </div>
          </div>

          {/* Dried-In */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Dried-In</h4>
            <div className="space-y-2">
              <Label className="text-xs">Low ($/sq ft)</Label>
              <Input
                type="number"
                step="0.01"
                value={settings.dried_in_rate_low}
                onChange={(e) => updateSetting('dried_in_rate_low', Number(e.target.value))}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">High ($/sq ft)</Label>
              <Input
                type="number"
                step="0.01"
                value={settings.dried_in_rate_high}
                onChange={(e) => updateSetting('dried_in_rate_high', Number(e.target.value))}
                className="h-9"
              />
            </div>
          </div>

          {/* Turnkey */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Turnkey</h4>
            <div className="space-y-2">
              <Label className="text-xs">Low ($/sq ft)</Label>
              <Input
                type="number"
                step="0.01"
                value={settings.turnkey_rate_low}
                onChange={(e) => updateSetting('turnkey_rate_low', Number(e.target.value))}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">High ($/sq ft)</Label>
              <Input
                type="number"
                step="0.01"
                value={settings.turnkey_rate_high}
                onChange={(e) => updateSetting('turnkey_rate_high', Number(e.target.value))}
                className="h-9"
              />
            </div>
          </div>

          {/* Custom */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Custom</h4>
            <div className="space-y-2">
              <Label className="text-xs">Low ($/sq ft)</Label>
              <Input
                type="number"
                step="0.01"
                value={settings.custom_rate_low}
                onChange={(e) => updateSetting('custom_rate_low', Number(e.target.value))}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">High ($/sq ft)</Label>
              <Input
                type="number"
                step="0.01"
                value={settings.custom_rate_high}
                onChange={(e) => updateSetting('custom_rate_high', Number(e.target.value))}
                className="h-9"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
