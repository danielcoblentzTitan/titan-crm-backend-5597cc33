-- Add parcel information fields to leads table
ALTER TABLE public.leads
ADD COLUMN parcel_id TEXT,
ADD COLUMN map_number TEXT,
ADD COLUMN grid_number TEXT,
ADD COLUMN parcel_number TEXT,
ADD COLUMN jurisdiction_name TEXT,
ADD COLUMN parcel_lookup_timestamp TIMESTAMP WITH TIME ZONE;