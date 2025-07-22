-- Fix RLS policies to allow admin operations on clients table
DROP POLICY IF EXISTS "Clientes podem ser visualizados publicamente" ON public.clients;

-- Allow all operations on clients table for now (admin functionality)
CREATE POLICY "Admin can manage clients" 
ON public.clients 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Update function to set search_path for security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;