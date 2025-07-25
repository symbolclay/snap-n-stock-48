-- Create a separate campaigns table with proper relationships
-- First, update the campaigns table to have proper foreign key to clients
ALTER TABLE public.campaigns 
ADD CONSTRAINT campaigns_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

-- Update products to reference campaigns instead of clients directly
-- We'll make campaign_id required and remove client_id dependency for products
ALTER TABLE public.products 
ALTER COLUMN campaign_id SET NOT NULL;

-- Add index for better performance
CREATE INDEX idx_products_campaign_id ON public.products(campaign_id);
CREATE INDEX idx_campaigns_client_id ON public.campaigns(client_id);

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

CREATE TRIGGER update_campaign_on_product_change
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_campaign_updated_at();