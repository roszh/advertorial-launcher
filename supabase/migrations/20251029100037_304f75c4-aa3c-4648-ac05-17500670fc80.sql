-- Ensure all existing pages have a Country Setup assigned
-- Create a default setup for users who have pages without one
DO $$
BEGIN
  -- Create default setups for users with pages that lack a tracking_script_set_id
  INSERT INTO public.tracking_script_sets (user_id, name)
  SELECT DISTINCT p.user_id, 'Default'
  FROM public.pages p
  WHERE p.tracking_script_set_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.tracking_script_sets ts 
      WHERE ts.user_id = p.user_id AND ts.name = 'Default'
    );

  -- Assign the default setup to any pages without one
  UPDATE public.pages p
  SET tracking_script_set_id = ts.id
  FROM public.tracking_script_sets ts
  WHERE p.user_id = ts.user_id 
    AND ts.name = 'Default'
    AND p.tracking_script_set_id IS NULL;
END $$;

-- Now make the column NOT NULL to enforce data integrity
ALTER TABLE public.pages 
ALTER COLUMN tracking_script_set_id SET NOT NULL;