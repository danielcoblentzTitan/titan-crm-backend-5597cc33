-- Add cover_photo_url column to projects table
ALTER TABLE public.projects 
ADD COLUMN cover_photo_url TEXT;