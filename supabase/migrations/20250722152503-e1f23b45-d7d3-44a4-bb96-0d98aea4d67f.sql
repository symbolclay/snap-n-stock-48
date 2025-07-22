-- Criar tabela de clientes
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de produtos vinculados aos clientes  
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  preco_regular TEXT NOT NULL,
  preco_oferta TEXT,
  descricao TEXT,
  imagem TEXT NOT NULL,
  tags JSONB DEFAULT '{"google": false, "meta": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Políticas para acesso público aos clientes (para validar slugs)
CREATE POLICY "Clientes podem ser visualizados publicamente" 
ON public.clients 
FOR SELECT 
USING (true);

-- Políticas para produtos - acesso público para inserção via slug do cliente
CREATE POLICY "Produtos podem ser visualizados publicamente" 
ON public.products 
FOR SELECT 
USING (true);

CREATE POLICY "Produtos podem ser inseridos por qualquer pessoa" 
ON public.products 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Produtos podem ser atualizados por qualquer pessoa" 
ON public.products 
FOR UPDATE 
USING (true);

CREATE POLICY "Produtos podem ser deletados por qualquer pessoa" 
ON public.products 
FOR DELETE 
USING (true);

-- Funções para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para timestamps automáticos
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at  
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir alguns clientes de exemplo
INSERT INTO public.clients (name, slug) VALUES 
('Cliente A', 'cliente-a'),
('Cliente B', 'cliente-b'),
('Loja do João', 'loja-do-joao');