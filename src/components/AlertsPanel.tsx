import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Eye, MousePointer, AlertCircle, X } from "lucide-react";
import { format } from "date-fns";

interface AlertItem {
  id: string;
  alert_type: string;
  message: string;
  metric_value: number | null;
  triggered_at: string;
}

interface AlertsPanelProps {
  pageId: string;
  summary: {
    total_views: number;
    total_clicks: number;
    ctr_percentage: number;
  };
  missingUtmCount: number;
}

export default function AlertsPanel({ pageId, summary, missingUtmCount }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAlertsAndConfigs();
  }, [pageId]);

  useEffect(() => {
    checkAndTriggerAlerts();
  }, [summary, missingUtmCount, configs]);

  const fetchAlertsAndConfigs = async () => {
    try {
      const [alertsRes, configsRes] = await Promise.all([
        supabase
          .from('alert_history')
          .select('*')
          .eq('page_id', pageId)
          .order('triggered_at', { ascending: false })
          .limit(10),
        supabase
          .from('alert_configs')
          .select('*')
          .eq('page_id', pageId)
          .eq('is_enabled', true),
      ]);

      if (alertsRes.error) throw alertsRes.error;
      if (configsRes.error) throw configsRes.error;

      setAlerts(alertsRes.data || []);
      setConfigs(configsRes.data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndTriggerAlerts = async () => {
    if (configs.length === 0) return;

    const newAlerts: any[] = [];

    for (const config of configs) {
      let shouldTrigger = false;
      let message = '';
      let metricValue = null;

      switch (config.alert_type) {
        case 'missing_utm':
          if (missingUtmCount > 0) {
            shouldTrigger = true;
            message = `${missingUtmCount} visitors arrived without UTM tracking parameters`;
            metricValue = missingUtmCount;
          }
          break;

        case 'ctr_threshold':
          if (summary.ctr_percentage > (config.threshold_value || 0)) {
            shouldTrigger = true;
            message = `CTR (${summary.ctr_percentage.toFixed(2)}%) exceeds threshold of ${config.threshold_value}%`;
            metricValue = summary.ctr_percentage;
          }
          break;

        case 'clicks_threshold':
          if (summary.total_clicks > (config.threshold_value || 0)) {
            shouldTrigger = true;
            message = `Total clicks (${summary.total_clicks}) exceed threshold of ${config.threshold_value}`;
            metricValue = summary.total_clicks;
          }
          break;

        case 'views_threshold':
          if (summary.total_views > (config.threshold_value || 0)) {
            shouldTrigger = true;
            message = `Total views (${summary.total_views}) exceed threshold of ${config.threshold_value}`;
            metricValue = summary.total_views;
          }
          break;
      }

      if (shouldTrigger) {
        // Check if this alert was already triggered recently (within last hour)
        const recentAlert = alerts.find(
          (a) =>
            a.alert_type === config.alert_type &&
            new Date(a.triggered_at).getTime() > Date.now() - 3600000
        );

        if (!recentAlert) {
          newAlerts.push({
            alert_config_id: config.id,
            page_id: pageId,
            alert_type: config.alert_type,
            message,
            metric_value: metricValue,
          });
        }
      }
    }

    // Insert new alerts
    if (newAlerts.length > 0) {
      const { error } = await supabase.from('alert_history').insert(newAlerts);
      if (!error) {
        fetchAlertsAndConfigs();
      }
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'missing_utm':
        return <AlertCircle className="h-4 w-4" />;
      case 'ctr_threshold':
        return <TrendingUp className="h-4 w-4" />;
      case 'clicks_threshold':
        return <MousePointer className="h-4 w-4" />;
      case 'views_threshold':
        return <Eye className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (type: string): "default" | "destructive" => {
    return type === 'missing_utm' ? 'destructive' : 'default';
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(alertId));
  };

  const visibleAlerts = alerts.filter((alert) => !dismissedAlerts.has(alert.id));

  if (loading) {
    return null;
  }

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Active Alerts
        </CardTitle>
        <CardDescription>Performance alerts and tracking warnings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleAlerts.map((alert) => (
          <Alert key={alert.id} variant={getAlertVariant(alert.alert_type)}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                {getAlertIcon(alert.alert_type)}
                <div className="flex-1 space-y-1">
                  <AlertDescription className="font-medium">
                    {alert.message}
                  </AlertDescription>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {alert.alert_type.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(alert.triggered_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => dismissAlert(alert.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
