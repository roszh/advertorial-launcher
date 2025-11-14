-- Create alerts configuration table
CREATE TABLE public.alert_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('missing_utm', 'ctr_threshold', 'clicks_threshold', 'views_threshold')),
  threshold_value NUMERIC,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alerts history table
CREATE TABLE public.alert_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_config_id UUID REFERENCES public.alert_configs(id) ON DELETE CASCADE,
  page_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  metric_value NUMERIC,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alert_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for alert_configs
CREATE POLICY "Users can view own alert configs"
  ON public.alert_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alert configs"
  ON public.alert_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alert configs"
  ON public.alert_configs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alert configs"
  ON public.alert_configs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for alert_history
CREATE POLICY "Users can view own alert history"
  ON public.alert_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.pages
    WHERE pages.id = alert_history.page_id
    AND pages.user_id = auth.uid()
  ));

CREATE POLICY "System can insert alert history"
  ON public.alert_history FOR INSERT
  WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_alert_configs_updated_at
  BEFORE UPDATE ON public.alert_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX idx_alert_configs_user_id ON public.alert_configs(user_id);
CREATE INDEX idx_alert_configs_page_id ON public.alert_configs(page_id);
CREATE INDEX idx_alert_history_page_id ON public.alert_history(page_id);
CREATE INDEX idx_alert_history_triggered_at ON public.alert_history(triggered_at DESC);