-- Create enum for ambiente fiscal
CREATE TYPE public.ambiente_fiscal AS ENUM ('homologacao', 'producao');

-- Create enum for regime tributario
CREATE TYPE public.regime_tributario AS ENUM ('simples_nacional', 'lucro_presumido', 'lucro_real');

-- Create enum for invoice status
CREATE TYPE public.invoice_status AS ENUM ('pendente', 'processando', 'autorizada', 'rejeitada', 'cancelada');

-- Table: fiscal_config (Configurações fiscais da loja)
CREATE TABLE public.fiscal_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  -- Dados da empresa
  razao_social TEXT,
  nome_fantasia TEXT,
  cnpj TEXT,
  inscricao_estadual TEXT,
  endereco TEXT,
  numero TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  cep TEXT,
  telefone TEXT,
  -- Certificado digital
  certificado_url TEXT,
  certificado_senha TEXT,
  certificado_validade TIMESTAMP WITH TIME ZONE,
  -- Configurações técnicas
  ambiente ambiente_fiscal NOT NULL DEFAULT 'homologacao',
  serie_nfe INTEGER NOT NULL DEFAULT 1,
  proximo_numero_nfe INTEGER NOT NULL DEFAULT 1,
  serie_nfce INTEGER NOT NULL DEFAULT 1,
  proximo_numero_nfce INTEGER NOT NULL DEFAULT 1,
  csc_id TEXT,
  csc_token TEXT,
  -- Regime tributário
  regime_tributario regime_tributario NOT NULL DEFAULT 'simples_nacional',
  -- Controle
  configuracao_completa BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fiscal_config_user_unique UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.fiscal_config ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage own fiscal_config"
ON public.fiscal_config
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Table: invoices (Histórico de notas fiscais)
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  venda_id UUID REFERENCES public.vendas(id) ON DELETE SET NULL,
  -- Tipo e série
  tipo TEXT NOT NULL DEFAULT 'nfce', -- 'nfe' ou 'nfce'
  serie INTEGER NOT NULL,
  numero INTEGER NOT NULL,
  -- Status e resposta SEFAZ
  status invoice_status NOT NULL DEFAULT 'pendente',
  chave_acesso TEXT,
  protocolo_autorizacao TEXT,
  data_autorizacao TIMESTAMP WITH TIME ZONE,
  mensagem_sefaz TEXT,
  codigo_status_sefaz INTEGER,
  -- Arquivos
  xml_url TEXT,
  pdf_url TEXT,
  -- Valores
  valor_total NUMERIC NOT NULL DEFAULT 0,
  -- Dados do cliente (se houver)
  cliente_nome TEXT,
  cliente_cpf_cnpj TEXT,
  -- Controle
  ambiente ambiente_fiscal NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage own invoices"
ON public.invoices
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_chave_acesso ON public.invoices(chave_acesso);

-- Add fiscal columns to produtos table
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS ncm TEXT,
ADD COLUMN IF NOT EXISTS cest TEXT,
ADD COLUMN IF NOT EXISTS cfop_padrao TEXT DEFAULT '5102',
ADD COLUMN IF NOT EXISTS unidade_comercial TEXT DEFAULT 'UN',
ADD COLUMN IF NOT EXISTS origem_mercadoria INTEGER DEFAULT 0;

-- Trigger for updated_at on fiscal_config
CREATE TRIGGER update_fiscal_config_updated_at
BEFORE UPDATE ON public.fiscal_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updated_at on invoices
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create storage bucket for certificates
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for certificates (private, only owner can access)
CREATE POLICY "Users can upload own certificates"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own certificates"
ON storage.objects
FOR SELECT
USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own certificates"
ON storage.objects
FOR DELETE
USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage bucket for invoices (XML and PDF)
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for invoices
CREATE POLICY "Users can upload own invoices files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own invoices files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);