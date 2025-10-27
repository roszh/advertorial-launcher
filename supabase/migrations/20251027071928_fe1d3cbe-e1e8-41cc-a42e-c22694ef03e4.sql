-- Add Microsoft Clarity tracking ID to profiles table
ALTER TABLE public.profiles 
ADD COLUMN microsoft_clarity_id text;