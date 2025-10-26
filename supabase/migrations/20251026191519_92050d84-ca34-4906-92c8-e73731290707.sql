-- Create storage bucket for page images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'page-images',
  'page-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- RLS policies for page images
CREATE POLICY "Anyone can view page images"
ON storage.objects FOR SELECT
USING (bucket_id = 'page-images');

CREATE POLICY "Authenticated users can upload page images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'page-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own page images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'page-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own page images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'page-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add image_url column to pages table
ALTER TABLE pages ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add template column to pages table
ALTER TABLE pages ADD COLUMN IF NOT EXISTS template VARCHAR(50) DEFAULT 'magazine';

-- Add index for faster template queries
CREATE INDEX IF NOT EXISTS idx_pages_template ON pages(template);