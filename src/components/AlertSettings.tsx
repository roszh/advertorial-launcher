import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Bell, Save } from "lucide-react";

interface AlertConfig {
  id?: string;
  alert_type: string;
  threshold_value: number | null;
  is_enabled: boolean;
}

interface AlertSettingsProps {
  pageId: string;
  userId: string;
}

export default function AlertSettings({ pageId, userId }: AlertSettingsProps) {
  const [configs, setConfigs] = useState<Record<string, AlertConfig>>({
    missing_utm: { alert_type: 'missing_utm', threshold_value: null, is_enabled: false },
    ctr_threshold: { alert_type: 'ctr_threshold', threshold_value: 5, is_enabled: false },
    clicks_threshold: { alert_type: 'clicks_threshold', threshold_value: 100, is_enabled: false },
    views_threshold: { alert_type: 'views_threshold', threshold_value: 1000, is_enabled: false },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, [pageId]);

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('alert_configs')
        .select('*')
        .eq('page_id', pageId);

      if (error) throw error;

      if (data && data.length > 0) {
        const configMap = { ...configs };
        data.forEach((config) => {
          configMap[config.alert_type] = {
            id: config.id,
            alert_type: config.alert_type,
            threshold_value: config.threshold_value,
            is_enabled: config.is_enabled,
          };
        });
        setConfigs(configMap);
      }
    } catch (error) {
      console.error('Error fetching alert configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const operations = Object.values(configs).map(async (config) => {
        if (config.id) {
          // Update existing
          return supabase
            .from('alert_configs')
            .update({
              threshold_value: config.threshold_value,
              is_enabled: config.is_enabled,
            })
            .eq('id', config.id);
        } else if (config.is_enabled) {
          // Insert new (only if enabled)
          return supabase
            .from('alert_configs')
            .insert({
              user_id: userId,
              page_id: pageId,
              alert_type: config.alert_type,
              threshold_value: config.threshold_value,
              is_enabled: config.is_enabled,
            });
        }
      });

      const results = await Promise.all(operations);
      const hasError = results.some((result) => result?.error);

      if (hasError) {
        throw new Error('Failed to save some configurations');
      }

      toast({
        title: "Alert settings saved",
        description: "Your alert configurations have been updated.",
      });

      fetchConfigs();
    } catch (error) {
      console.error('Error saving alert configs:', error);
      toast({
        title: "Error",
        description: "Failed to save alert settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (type: string, updates: Partial<AlertConfig>) => {
    setConfigs((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...updates },
    }));
  };

  if (loading) {
    return <div className="animate-pulse">Loading alert settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Alert Settings
        </CardTitle>
        <CardDescription>
          Configure automated alerts for this page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Missing UTM Alert */}
        <div className="space-y-3 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Missing UTM Parameters</Label>
              <p className="text-sm text-muted-foreground">
                Alert when visitors arrive without UTM tracking parameters
              </p>
            </div>
            <Switch
              checked={configs.missing_utm.is_enabled}
              onCheckedChange={(checked) =>
                updateConfig('missing_utm', { is_enabled: checked })
              }
            />
          </div>
        </div>

        {/* CTR Threshold Alert */}
        <div className="space-y-3 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <Label className="text-base font-medium">CTR Threshold</Label>
              <p className="text-sm text-muted-foreground">
                Alert when click-through rate exceeds this percentage
              </p>
            </div>
            <Switch
              checked={configs.ctr_threshold.is_enabled}
              onCheckedChange={(checked) =>
                updateConfig('ctr_threshold', { is_enabled: checked })
              }
            />
          </div>
          {configs.ctr_threshold.is_enabled && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={configs.ctr_threshold.threshold_value || ''}
                onChange={(e) =>
                  updateConfig('ctr_threshold', {
                    threshold_value: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          )}
        </div>

        {/* Clicks Threshold Alert */}
        <div className="space-y-3 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <Label className="text-base font-medium">Total Clicks Threshold</Label>
              <p className="text-sm text-muted-foreground">
                Alert when total clicks exceed this number
              </p>
            </div>
            <Switch
              checked={configs.clicks_threshold.is_enabled}
              onCheckedChange={(checked) =>
                updateConfig('clicks_threshold', { is_enabled: checked })
              }
            />
          </div>
          {configs.clicks_threshold.is_enabled && (
            <Input
              type="number"
              min="0"
              step="1"
              value={configs.clicks_threshold.threshold_value || ''}
              onChange={(e) =>
                updateConfig('clicks_threshold', {
                  threshold_value: parseInt(e.target.value) || 0,
                })
              }
              className="w-32"
            />
          )}
        </div>

        {/* Views Threshold Alert */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <Label className="text-base font-medium">Total Views Threshold</Label>
              <p className="text-sm text-muted-foreground">
                Alert when total views exceed this number
              </p>
            </div>
            <Switch
              checked={configs.views_threshold.is_enabled}
              onCheckedChange={(checked) =>
                updateConfig('views_threshold', { is_enabled: checked })
              }
            />
          </div>
          {configs.views_threshold.is_enabled && (
            <Input
              type="number"
              min="0"
              step="1"
              value={configs.views_threshold.threshold_value || ''}
              onChange={(e) =>
                updateConfig('views_threshold', {
                  threshold_value: parseInt(e.target.value) || 0,
                })
              }
              className="w-32"
            />
          )}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Alert Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
