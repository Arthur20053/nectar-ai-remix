import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactions } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    // Preparar resumo das transações
    const totalReceitas = transactions
      .filter((t: any) => t.type === 'receita')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    const totalDespesas = transactions
      .filter((t: any) => t.type === 'despesa')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    const categorias = transactions.reduce((acc: any, t: any) => {
      const catName = t.categories?.name || 'Sem categoria';
      if (!acc[catName]) {
        acc[catName] = { receitas: 0, despesas: 0 };
      }
      if (t.type === 'receita') {
        acc[catName].receitas += Number(t.amount);
      } else {
        acc[catName].despesas += Number(t.amount);
      }
      return acc;
    }, {});

    const prompt = `Você é um consultor financeiro especializado. Analise os seguintes dados financeiros e forneça uma análise detalhada em português:

Total de Receitas: R$ ${totalReceitas.toFixed(2)}
Total de Despesas: R$ ${totalDespesas.toFixed(2)}
Saldo: R$ ${(totalReceitas - totalDespesas).toFixed(2)}

Distribuição por categorias:
${Object.entries(categorias).map(([cat, values]: [string, any]) => 
  `${cat}: Receitas R$ ${values.receitas.toFixed(2)}, Despesas R$ ${values.despesas.toFixed(2)}`
).join('\n')}

Forneça:
1. Uma visão geral da saúde financeira
2. Identificação dos principais gastos
3. Sugestões específicas para economizar
4. Recomendações para melhorar o controle financeiro
5. Alertas sobre padrões preocupantes (se houver)

Seja objetivo, prático e motivador.`;

    console.log('Chamando API de IA...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Você é um consultor financeiro experiente e empático.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API:', response.status, errorText);
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    console.log('Análise gerada com sucesso');

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
