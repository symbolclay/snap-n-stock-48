-- Add client_id column to products table for easier querying
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;