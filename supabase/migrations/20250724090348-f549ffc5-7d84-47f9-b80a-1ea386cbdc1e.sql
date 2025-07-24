-- Criar tabela de campanhas associadas aos clientes
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, slug)
);

-- Enable Row Level Security
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies for campaigns
CREATE POLICY "Admin can manage campaigns" 
ON public.campaigns 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Modificar tabela products para referenciar campanhas ao invés de clientes diretamente
ALTER TABLE public.products 
ADD COLUMN campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE;

-- Migrar dados existentes: criar campanhas padrão para cada cliente
INSERT INTO public.campaigns (client_id, name, slug)
SELECT 
  id as client_id,
  'Campanha Principal' as name,
  'principal' as slug
FROM public.clients;

-- Atualizar produtos existentes para usar a campanha padrão
UPDATE public.products 
SET campaign_id = campaigns.id
FROM public.campaigns
WHERE products.client_id = campaigns.client_id 
AND campaigns.slug = 'principal';

-- Agora que todos os produtos têm campaign_id, tornar a coluna NOT NULL
ALTER TABLE public.products ALTER COLUMN campaign_id SET NOT NULL;

-- Create trigger for automatic timestamp updates on campaigns
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();