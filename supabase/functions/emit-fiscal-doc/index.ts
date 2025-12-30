import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmitRequest {
  venda_id: string;
  tipo: 'nfe' | 'nfce';
  cliente_cpf_cnpj?: string;
  cliente_nome?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { venda_id, tipo, cliente_cpf_cnpj, cliente_nome }: EmitRequest = await req.json();

    console.log(`[emit-fiscal-doc] Iniciando emissão de ${tipo.toUpperCase()} para venda ${venda_id}`);

    // 1. Buscar configuração fiscal do usuário
    const { data: fiscalConfig, error: configError } = await supabase
      .from('fiscal_config')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (configError || !fiscalConfig) {
      console.error('[emit-fiscal-doc] Configuração fiscal não encontrada:', configError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Configuração fiscal não encontrada. Acesse Configuração Fiscal e complete o cadastro.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validar se a configuração está completa
    if (!fiscalConfig.certificado_url || !fiscalConfig.certificado_senha) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Certificado digital não configurado. Acesse Configuração Fiscal e envie seu certificado A1.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (tipo === 'nfce' && (!fiscalConfig.csc_id || !fiscalConfig.csc_token)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token CSC não configurado. Para emitir NFC-e, configure o CSC na Configuração Fiscal.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Buscar dados da venda
    const { data: venda, error: vendaError } = await supabase
      .from('vendas')
      .select('*')
      .eq('id', venda_id)
      .eq('user_id', user.id)
      .single();

    if (vendaError || !venda) {
      console.error('[emit-fiscal-doc] Venda não encontrada:', vendaError);
      return new Response(
        JSON.stringify({ success: false, error: 'Venda não encontrada.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Buscar itens da venda
    const { data: itensVenda, error: itensError } = await supabase
      .from('vendas_itens')
      .select(`
        *,
        produto:produtos(*)
      `)
      .eq('venda_id', venda_id);

    if (itensError || !itensVenda || itensVenda.length === 0) {
      console.error('[emit-fiscal-doc] Itens da venda não encontrados:', itensError);
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhum item encontrado nesta venda.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Validar se todos os produtos têm NCM
    const produtosSemNCM: string[] = [];
    for (const item of itensVenda) {
      if (!item.produto?.ncm) {
        produtosSemNCM.push(item.produto?.nome || 'Produto desconhecido');
      }
    }

    if (produtosSemNCM.length > 0) {
      console.error('[emit-fiscal-doc] Produtos sem NCM:', produtosSemNCM);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Os seguintes produtos estão sem NCM: ${produtosSemNCM.join(', ')}. Acesse o cadastro de produtos e preencha o campo NCM na aba Fiscal.` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Determinar série e número
    const serie = tipo === 'nfe' ? fiscalConfig.serie_nfe : fiscalConfig.serie_nfce;
    const numero = tipo === 'nfe' ? fiscalConfig.proximo_numero_nfe : fiscalConfig.proximo_numero_nfce;

    // 7. Criar registro da nota no banco (status: processando)
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        venda_id: venda_id,
        tipo: tipo,
        serie: serie,
        numero: numero,
        status: 'processando',
        valor_total: venda.valor_final,
        cliente_nome: cliente_nome || null,
        cliente_cpf_cnpj: cliente_cpf_cnpj?.replace(/\D/g, '') || null,
        ambiente: fiscalConfig.ambiente,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('[emit-fiscal-doc] Erro ao criar registro da nota:', invoiceError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao registrar a nota fiscal.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[emit-fiscal-doc] Nota ${invoice.id} criada com status 'processando'`);

    // 8. Preparar dados para o nfewizard-io
    // TODO: Implementar integração com nfewizard-io
    // 
    // Exemplo de estrutura que será enviada:
    // 
    // const nfeData = {
    //   emit: {
    //     CNPJ: fiscalConfig.cnpj,
    //     xNome: fiscalConfig.razao_social,
    //     xFant: fiscalConfig.nome_fantasia,
    //     IE: fiscalConfig.inscricao_estadual,
    //     CRT: fiscalConfig.regime_tributario === 'simples_nacional' ? '1' : '3',
    //     enderEmit: {
    //       xLgr: fiscalConfig.endereco,
    //       nro: fiscalConfig.numero,
    //       xBairro: fiscalConfig.bairro,
    //       cMun: '3550308', // Código IBGE da cidade
    //       xMun: fiscalConfig.cidade,
    //       UF: fiscalConfig.uf,
    //       CEP: fiscalConfig.cep,
    //     }
    //   },
    //   dest: cliente_cpf_cnpj ? {
    //     CPF: cliente_cpf_cnpj.length === 11 ? cliente_cpf_cnpj : null,
    //     CNPJ: cliente_cpf_cnpj.length === 14 ? cliente_cpf_cnpj : null,
    //     xNome: cliente_nome,
    //   } : null,
    //   det: itensVenda.map((item, index) => ({
    //     nItem: index + 1,
    //     prod: {
    //       cProd: item.produto.codigo,
    //       xProd: item.produto.nome,
    //       NCM: item.produto.ncm,
    //       CEST: item.produto.cest,
    //       CFOP: item.produto.cfop_padrao,
    //       uCom: item.produto.unidade_comercial,
    //       qCom: item.quantidade,
    //       vUnCom: item.preco_unitario,
    //       vProd: item.subtotal,
    //       indTot: '1',
    //       cEAN: 'SEM GTIN',
    //       cEANTrib: 'SEM GTIN',
    //     },
    //     imposto: {
    //       // Configurar impostos baseado no regime tributário
    //       // Para Simples Nacional: CSOSN
    //       // Para Lucro Presumido/Real: CST
    //     }
    //   })),
    //   total: {
    //     vProd: venda.valor_total,
    //     vDesc: venda.desconto,
    //     vNF: venda.valor_final,
    //   },
    //   pag: [{
    //     tPag: mapFormaPagamento(venda.forma_pagamento),
    //     vPag: venda.valor_final,
    //   }],
    // };
    //
    // const nfewizard = new NFEWizard({
    //   certificado: await downloadCertificado(fiscalConfig.certificado_url),
    //   senha: fiscalConfig.certificado_senha,
    //   ambiente: fiscalConfig.ambiente === 'producao' ? 1 : 2,
    // });
    //
    // const resultado = await nfewizard.emitir(nfeData);

    // 9. Simular resposta (remover quando implementar nfewizard-io)
    // Em produção, essa parte será substituída pela resposta real da SEFAZ
    const simulatedResponse = {
      success: true,
      chaveAcesso: `${fiscalConfig.uf === 'SP' ? '35' : '00'}${new Date().toISOString().slice(0,7).replace('-','')}${fiscalConfig.cnpj?.replace(/\D/g, '')}55${serie.toString().padStart(3,'0')}${numero.toString().padStart(9,'0')}1${Math.floor(Math.random() * 100000000).toString().padStart(8,'0')}`,
      protocolo: `1${Date.now()}`,
      mensagem: 'Autorizado o uso da NF-e',
    };

    // 10. Atualizar registro da nota com o resultado
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: simulatedResponse.success ? 'autorizada' : 'rejeitada',
        chave_acesso: simulatedResponse.chaveAcesso,
        protocolo_autorizacao: simulatedResponse.protocolo,
        mensagem_sefaz: simulatedResponse.mensagem,
        data_autorizacao: simulatedResponse.success ? new Date().toISOString() : null,
        // xml_url e pdf_url serão preenchidos após gerar os arquivos
      })
      .eq('id', invoice.id);

    if (updateError) {
      console.error('[emit-fiscal-doc] Erro ao atualizar nota:', updateError);
    }

    // 11. Incrementar número da nota
    const updateField = tipo === 'nfe' ? 'proximo_numero_nfe' : 'proximo_numero_nfce';
    await supabase
      .from('fiscal_config')
      .update({ [updateField]: numero + 1 })
      .eq('user_id', user.id);

    console.log(`[emit-fiscal-doc] Nota ${invoice.id} processada com sucesso`);

    return new Response(
      JSON.stringify({ 
        success: true,
        invoice_id: invoice.id,
        chave_acesso: simulatedResponse.chaveAcesso,
        status: simulatedResponse.success ? 'autorizada' : 'rejeitada',
        mensagem: simulatedResponse.mensagem,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[emit-fiscal-doc] Erro não tratado:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno ao processar a nota fiscal. Tente novamente.' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
