-- Create clients table
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  nome TEXT NOT NULL,
  cpf_cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table  
CREATE TABLE IF NOT EXISTS public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  codigo TEXT,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_custo NUMERIC DEFAULT 0,
  preco_venda NUMERIC DEFAULT 0,
  estoque_atual INTEGER DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 0,
  unidade TEXT DEFAULT 'UN',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fornecedores table
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create caixa (cash register) table
CREATE TABLE IF NOT EXISTS public.caixa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  numero INTEGER NOT NULL,
  data_abertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_fechamento TIMESTAMP WITH TIME ZONE,
  saldo_inicial NUMERIC DEFAULT 0,
  saldo_final NUMERIC,
  status TEXT DEFAULT 'ABERTO',
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create movimentos_caixa table
CREATE TABLE IF NOT EXISTS public.movimentos_caixa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  caixa_id UUID REFERENCES public.caixa(id),
  origem TEXT DEFAULT 'MANUAL',
  tipo TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  forma_pagamento TEXT DEFAULT 'DINHEIRO',
  descricao TEXT,
  data_lancamento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vendas table
CREATE TABLE IF NOT EXISTS public.vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  cliente_id UUID REFERENCES public.clientes(id),
  numero INTEGER,
  data_venda TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valor_total NUMERIC DEFAULT 0,
  desconto NUMERIC DEFAULT 0,
  valor_final NUMERIC DEFAULT 0,
  forma_pagamento TEXT DEFAULT 'DINHEIRO',
  status TEXT DEFAULT 'PENDENTE',
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vendas_itens table
CREATE TABLE IF NOT EXISTS public.vendas_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID REFERENCES public.vendas(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos(id),
  quantidade INTEGER DEFAULT 1,
  preco_unitario NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contas_receber table
CREATE TABLE IF NOT EXISTS public.contas_receber (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  cliente_id UUID REFERENCES public.clientes(id),
  venda_id UUID REFERENCES public.vendas(id),
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data_vencimento DATE NOT NULL,
  data_recebimento DATE,
  status TEXT DEFAULT 'PENDENTE',
  forma_pagamento TEXT,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contas_pagar table
CREATE TABLE IF NOT EXISTS public.contas_pagar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT DEFAULT 'PENDENTE',
  forma_pagamento TEXT,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentos_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clientes
CREATE POLICY "Users can manage own clientes" ON public.clientes FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for produtos
CREATE POLICY "Users can manage own produtos" ON public.produtos FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for fornecedores
CREATE POLICY "Users can manage own fornecedores" ON public.fornecedores FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for caixa
CREATE POLICY "Users can manage own caixa" ON public.caixa FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for movimentos_caixa
CREATE POLICY "Users can manage own movimentos_caixa" ON public.movimentos_caixa FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for vendas
CREATE POLICY "Users can manage own vendas" ON public.vendas FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for vendas_itens (through venda ownership)
CREATE POLICY "Users can manage vendas_itens" ON public.vendas_itens FOR ALL 
USING (EXISTS (SELECT 1 FROM public.vendas WHERE vendas.id = vendas_itens.venda_id AND vendas.user_id = auth.uid()));

-- Create RLS policies for contas_receber
CREATE POLICY "Users can manage own contas_receber" ON public.contas_receber FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for contas_pagar
CREATE POLICY "Users can manage own contas_pagar" ON public.contas_pagar FOR ALL USING (auth.uid() = user_id);