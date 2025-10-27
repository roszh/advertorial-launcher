-- Create tags table
CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS on tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags
CREATE POLICY "Users can view own tags"
  ON public.tags FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
  ON public.tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
  ON public.tags FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON public.tags FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create page_tags junction table
CREATE TABLE public.page_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(page_id, tag_id)
);

-- Enable RLS on page_tags
ALTER TABLE public.page_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for page_tags
CREATE POLICY "Users can view own page tags"
  ON public.page_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pages
      WHERE pages.id = page_tags.page_id
      AND pages.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own page tags"
  ON public.page_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pages
      WHERE pages.id = page_tags.page_id
      AND pages.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own page tags"
  ON public.page_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pages
      WHERE pages.id = page_tags.page_id
      AND pages.user_id = auth.uid()
    )
  );