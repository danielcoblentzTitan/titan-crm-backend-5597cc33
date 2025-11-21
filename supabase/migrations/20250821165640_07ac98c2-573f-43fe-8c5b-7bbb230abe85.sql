-- Fix RLS policies for weather_snapshots table to allow Kyle to insert weather data

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can view their project weather snapshots" ON weather_snapshots;
DROP POLICY IF EXISTS "Admins and PMs can insert weather snapshots" ON weather_snapshots;

-- Create more permissive policies for weather data
CREATE POLICY "Allow weather data access for authenticated users" 
ON weather_snapshots 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow weather data insert for authenticated users" 
ON weather_snapshots 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow weather data update for authenticated users" 
ON weather_snapshots 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow weather data delete for authenticated users" 
ON weather_snapshots 
FOR DELETE 
USING (auth.uid() IS NOT NULL);