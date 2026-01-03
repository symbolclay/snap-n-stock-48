-- Add missing columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'CATEGORIA';