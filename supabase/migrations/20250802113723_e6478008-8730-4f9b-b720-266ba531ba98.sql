-- Add categoria column to products table
ALTER TABLE public.products 
ADD COLUMN categoria TEXT DEFAULT 'CATEGORIA';