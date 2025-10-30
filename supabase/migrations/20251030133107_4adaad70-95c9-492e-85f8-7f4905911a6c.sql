-- Add policy to allow anonymous users to view published pages
-- This enables the published_pages view to work for public access
CREATE POLICY "Anyone can view published pages"
ON public.pages
FOR SELECT
TO anon, authenticated
USING (status = 'published');