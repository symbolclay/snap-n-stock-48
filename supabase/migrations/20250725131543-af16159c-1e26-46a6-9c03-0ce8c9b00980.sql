-- Update products to require campaign_id and add indexes
ALTER TABLE public.products 
ALTER COLUMN campaign_id SET NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_campaign_id ON public.products(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_client_id ON public.campaigns(client_id);

-- Create trigger to update campaign updated_at when products are added/modified
CREATE OR REPLACE FUNCTION public.update_campaign_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.campaigns 
  SET updated_at = now() 
  WHERE id = COALESCE(NEW.campaign_id, OLD.campaign_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_campaign_on_product_change ON public.products;
CREATE TRIGGER update_campaign_on_product_change
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_campaign_updated_at();