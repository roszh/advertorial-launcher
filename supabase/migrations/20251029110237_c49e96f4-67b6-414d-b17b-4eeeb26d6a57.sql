-- Make tracking_script_set_id nullable to allow drafts without country setup
ALTER TABLE pages 
ALTER COLUMN tracking_script_set_id DROP NOT NULL;