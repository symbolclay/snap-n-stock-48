-- Add webhook field to clients table
ALTER TABLE public.clients 
ADD COLUMN webhook_url TEXT;