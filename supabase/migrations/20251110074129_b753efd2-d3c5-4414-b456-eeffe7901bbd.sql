-- Add page_id column to image_library to track which page the image was uploaded from
ALTER TABLE public.image_library
ADD COLUMN page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL;

-- Add index for faster filtering by page_id
CREATE INDEX idx_image_library_page_id ON public.image_library(page_id);

-- Add index for filtering images by user and page together
CREATE INDEX idx_image_library_user_page ON public.image_library(user_id, page_id);