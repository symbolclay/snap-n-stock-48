-- Fix the search_path for the function
CREATE OR REPLACE FUNCTION public.update_campaign_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.campaigns 
  SET updated_at = now() 
  WHERE id = COALESCE(NEW.campaign_id, OLD.campaign_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;