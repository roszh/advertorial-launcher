-- Create image_library table for storing user's reusable images
CREATE TABLE public.image_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.image_library ENABLE ROW LEVEL SECURITY;

-- Users can view their own images
CREATE POLICY "Users can view own images"
ON public.image_library
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own images
CREATE POLICY "Users can insert own images"
ON public.image_library
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own images
CREATE POLICY "Users can delete own images"
ON public.image_library
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_image_library_user_id ON public.image_library(user_id);
CREATE INDEX idx_image_library_created_at ON public.image_library(created_at DESC);