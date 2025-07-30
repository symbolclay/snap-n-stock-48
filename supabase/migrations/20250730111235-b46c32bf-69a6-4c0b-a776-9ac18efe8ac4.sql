-- Criar tabela de gestores
CREATE TABLE public.gestores (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar coluna gestor_id na tabela clients
ALTER TABLE public.clients 
ADD COLUMN gestor_id UUID REFERENCES public.gestores(id);

-- Adicionar índice para melhor performance
CREATE INDEX idx_clients_gestor_id ON public.clients(gestor_id);

-- Habilitar RLS na tabela gestores
ALTER TABLE public.gestores ENABLE ROW LEVEL SECURITY;

-- Política para gestores (mesmo padrão admin das outras tabelas)
CREATE POLICY "Admin can manage gestores" 
ON public.gestores 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Trigger para atualizar updated_at em gestores
CREATE TRIGGER update_gestores_updated_at
    BEFORE UPDATE ON public.gestores
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar coluna para rastrear última atividade de foto do cliente
ALTER TABLE public.clients 
ADD COLUMN ultima_foto_em TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Função para atualizar ultima_foto_em quando um produto é criado
CREATE OR REPLACE FUNCTION public.update_client_ultima_foto()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.clients 
    SET ultima_foto_em = now() 
    WHERE id = NEW.client_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar ultima_foto_em quando produto é inserido
CREATE TRIGGER update_client_ultima_foto_trigger
    AFTER INSERT ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_client_ultima_foto();