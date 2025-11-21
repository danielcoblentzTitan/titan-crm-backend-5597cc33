-- Create weather_snapshots table for storing 7-day forecasts per project
CREATE TABLE IF NOT EXISTS public.weather_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  forecast_json JSONB NOT NULL,
  risk_flag TEXT NOT NULL DEFAULT 'None',
  notes TEXT
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_weather_snapshots_project ON public.weather_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_weather_snapshots_captured_at ON public.weather_snapshots(captured_at DESC);

-- Enable Row Level Security
ALTER TABLE public.weather_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS: Builders can manage weather snapshots (without IF NOT EXISTS)
DROP POLICY IF EXISTS "Builders can manage weather snapshots" ON public.weather_snapshots;
CREATE POLICY "Builders can manage weather snapshots"
ON public.weather_snapshots
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid() AND profiles.role = 'builder'
));