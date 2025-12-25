import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ERPLayout } from '@/components/erp/ERPLayout';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FluxoItem {
  data: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

const FluxoCaixaPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mesAtual, setMesAtual] = useState(format(new Date(), 'yyyy-MM'));
  const [fluxo, setFluxo] = useState<FluxoItem[]>([]);
  const [totais, setTotais] = useState({ entradas: 0, saidas: 0, saldo: 0 });

  useEffect(() => {
    if (user) loadFluxo();
  }, [user, mesAtual]);

  const loadFluxo = async () => {
    try {
      setLoading(true);
      const [ano, mes] = mesAtual.split('-').map(Number);
      const dataInicio = startOfMonth(new Date(ano, mes - 1));
      const dataFim = endOfMonth(new Date(ano, mes - 1));

      // Load recebimentos (contas recebidas)
      const { data: recebimentos } = await supabase
        .from('contas_receber')
        .select('valor, data_recebimento')
        .eq('user_id', user?.id)
        .eq('status', 'RECEBIDO')
        .gte('data_recebimento', format(dataInicio, 'yyyy-MM-dd'))
        .lte('data_recebimento', format(dataFim, 'yyyy-MM-dd'));

      // Load pagamentos (contas pagas)
      const { data: pagamentos } = await supabase
        .from('contas_pagar')
        .select('valor, data_pagamento')
        .eq('user_id', user?.id)
        .eq('status', 'PAGO')
        .gte('data_pagamento', format(dataInicio, 'yyyy-MM-dd'))
        .lte('data_pagamento', format(dataFim, 'yyyy-MM-dd'));

      // Load vendas
      const { data: vendas } = await supabase
        .from('vendas')
        .select('valor_final, data_venda')
        .eq('user_id', user?.id)
        .eq('status', 'FINALIZADA')
        .gte('data_venda', dataInicio.toISOString())
        .lte('data_venda', dataFim.toISOString());

      // Create daily flow
      const diasDoMes = eachDayOfInterval({ start: dataInicio, end: dataFim });
      const fluxoDiario: FluxoItem[] = [];
      let saldoAcumulado = 0;
      let totalEntradas = 0;
      let totalSaidas = 0;

      diasDoMes.forEach((dia) => {
        const diaStr = format(dia, 'yyyy-MM-dd');

        const entradasDia =
          (recebimentos?.filter((r) => r.data_recebimento === diaStr).reduce((s, r) => s + Number(r.valor), 0) || 0) +
          (vendas?.filter((v) => format(parseISO(v.data_venda), 'yyyy-MM-dd') === diaStr).reduce((s, v) => s + Number(v.valor_final), 0) || 0);

        const saidasDia = pagamentos?.filter((p) => p.data_pagamento === diaStr).reduce((s, p) => s + Number(p.valor), 0) || 0;

        saldoAcumulado += entradasDia - saidasDia;
        totalEntradas += entradasDia;
        totalSaidas += saidasDia;

        if (entradasDia > 0 || saidasDia > 0) {
          fluxoDiario.push({
            data: diaStr,
            entradas: entradasDia,
            saidas: saidasDia,
            saldo: saldoAcumulado,
          });
        }
      });

      setFluxo(fluxoDiario);
      setTotais({ entradas: totalEntradas, saidas: totalSaidas, saldo: totalEntradas - totalSaidas });
    } catch (error) {
      console.error('Error loading fluxo:', error);
    } finally {
      setLoading(false);
    }
  };

  const meses = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2025, i, 1);
    return { value: format(date, 'yyyy-MM'), label: format(date, 'MMMM yyyy', { locale: ptBR }) };
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <ERPLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Fluxo de Caixa</h1>
              <p className="text-muted-foreground">Análise de entradas e saídas</p>
            </div>
          </div>
          <Select value={mesAtual} onValueChange={setMesAtual}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meses.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/20">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Entradas</p>
                <p className="text-2xl font-bold text-success">R$ {totais.entradas.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-destructive/20">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Saídas</p>
                <p className="text-2xl font-bold text-destructive">R$ {totais.saidas.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${totais.saldo >= 0 ? 'bg-success/20' : 'bg-destructive/20'}`}>
                <DollarSign className={`w-6 h-6 ${totais.saldo >= 0 ? 'text-success' : 'text-destructive'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo do Período</p>
                <p className={`text-2xl font-bold ${totais.saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                  R$ {totais.saldo.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabela */}
        <Card className="glass-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/20">
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Entradas</TableHead>
                <TableHead className="text-right">Saídas</TableHead>
                <TableHead className="text-right">Saldo Acumulado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : fluxo.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum movimento no período
                  </TableCell>
                </TableRow>
              ) : (
                fluxo.map((item) => (
                  <TableRow key={item.data} className="hover:bg-muted/50">
                    <TableCell>{format(parseISO(item.data), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell className="text-right text-success font-medium">
                      {item.entradas > 0 ? `R$ ${item.entradas.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right text-destructive font-medium">
                      {item.saidas > 0 ? `R$ ${item.saidas.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={item.saldo >= 0 ? 'bg-success' : 'bg-destructive'}>
                        R$ {item.saldo.toFixed(2)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>
    </ERPLayout>
  );
};

export default FluxoCaixaPage;
