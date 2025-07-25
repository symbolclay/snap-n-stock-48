-- Make campaign_id nullable in products table since not all products need to be associated with campaigns
ALTER TABLE public.products 
ALTER COLUMN campaign_id DROP NOT NULL;