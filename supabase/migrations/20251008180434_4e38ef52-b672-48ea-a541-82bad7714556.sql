-- Add Maryland-specific pricing settings for sprinkler systems
INSERT INTO public.quick_estimate_settings (setting_key, setting_value, description)
VALUES 
  ('maryland_sprinkler_low', 5000, 'Maryland sprinkler system minimum cost'),
  ('maryland_sprinkler_high', 10000, 'Maryland sprinkler system maximum cost'),
  ('maryland_tax_rate', 0.06, 'Maryland sales tax rate (6%)')
ON CONFLICT (setting_key) DO UPDATE 
SET setting_value = EXCLUDED.setting_value,
    description = EXCLUDED.description,
    updated_at = now();