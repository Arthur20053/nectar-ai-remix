import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ERPLayout } from '@/components/erp/ERPLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText, Download, TrendingUp, TrendingDown, Package, Users, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

const RelatoriosPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes');
  const [stats, setStats] = useState({
    totalVendas: 0,
    totalReceber: 0,
    totalPagar: 0,
    lucro: 0,
    qtdVendas: 0,
    qtdClientes: 0,
    qtdProdutos: 0,
  });
  const [vendasPorDia, setVendasPorDia] = useState<{ data: string; valor: number }[]>([]);
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState<{ nome: string; quantidade: number }[]>([]);

  useEffect(() => {
    if (user) loadRelatorio();
  }, [user, periodo]);

  const getDataRange = () => {
    const hoje = new Date();
    switch (periodo) {
      case 'semana':
        return { inicio: subDays(hoje, 7), fim: hoje };
      case 'mes':
        return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
      case 'trimestre':
        return { inicio: subDays(hoje, 90), fim: hoje };
      default:
        return { inicio: startOfMonth(hoje), fim: hoje };
    }
  };

  const loadRelatorio = async () => {
    try {
      setLoading(true);
      const { inicio, fim } = getDataRange();

      // Vendas
      const { data: vendas } = await supabase
        .from('vendas')
        .select('valor_final, data_venda')
        .eq('user_id', user?.id)
        .gte('data_venda', inicio.toISOString())
        .lte('data_venda', fim.toISOString());

      // Contas a Receber
      const { data: receber } = await supabase
        .from('contas_receber')
        .select('valor, status')
        .eq('user_id', user?.id)
        .eq('status', 'PENDENTE');

      // Contas a Pagar
      const { data: pagar } = await supabase
        .from('contas_pagar')
        .select('valor, status')
        .eq('user_id', user?.id)
        .eq('status', 'PENDENTE');

      // Clientes
      const { count: qtdClientes } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Produtos
      const { count: qtdProdutos } = await supabase
        .from('produtos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Itens vendidos
      const { data: itensVendidos } = await supabase
        .from('vendas_itens')
        .select('quantidade, produto_id, produtos(nome)')
        .in('venda_id', vendas?.map(v => v.data_venda) || []);

      const totalVendas = vendas?.reduce((s, v) => s + Number(v.valor_final), 0) || 0;
      const totalReceber = receber?.reduce((s, r) => s + Number(r.valor), 0) || 0;
      const totalPagar = pagar?.reduce((s, p) => s + Number(p.valor), 0) || 0;

      setStats({
        totalVendas,
        totalReceber,
        totalPagar,
        lucro: totalVendas - totalPagar,
        qtdVendas: vendas?.length || 0,
        qtdClientes: qtdClientes || 0,
        qtdProdutos: qtdProdutos || 0,
      });

      // Group vendas by day
      const vendasAgrupadas = vendas?.reduce((acc, v) => {
        const dia = format(new Date(v.data_venda), 'dd/MM');
        acc[dia] = (acc[dia] || 0) + Number(v.valor_final);
        return acc;
      }, {} as Record<string, number>) || {};

      setVendasPorDia(Object.entries(vendasAgrupadas).map(([data, valor]) => ({ data, valor })));

      // Produtos mais vendidos (mock data for now)
      setProdutosMaisVendidos([
        { nome: 'Produto A', quantidade: 45 },
        { nome: 'Produto B', quantidade: 32 },
        { nome: 'Produto C', quantidade: 28 },
        { nome: 'Produto D', quantidade: 15 },
        { nome: 'Outros', quantidade: 10 },
      ]);
    } catch (error) {
      console.error('Error loading relatorio:', error);
    } finally {
      setLoading(false);
    }
  };

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
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Relatórios</h1>
              <p className="text-muted-foreground">Análise de desempenho</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semana">Última Semana</SelectItem>
                <SelectItem value="mes">Este Mês</SelectItem>
                <SelectItem value="trimestre">Último Trimestre</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Cards de estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glass-card p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-success/20">
                    <DollarSign className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Vendas</p>
                    <p className="text-2xl font-bold">R$ {stats.totalVendas.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{stats.qtdVendas} vendas</p>
                  </div>
                </div>
              </Card>

              <Card className="glass-card p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/20">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">A Receber</p>
                    <p className="text-2xl font-bold text-primary">R$ {stats.totalReceber.toFixed(2)}</p>
                  </div>
                </div>
              </Card>

              <Card className="glass-card p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-destructive/20">
                    <TrendingDown className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">A Pagar</p>
                    <p className="text-2xl font-bold text-destructive">R$ {stats.totalPagar.toFixed(2)}</p>
                  </div>
                </div>
              </Card>

              <Card className="glass-card p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-success/20">
                    <DollarSign className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lucro Estimado</p>
                    <p className={`text-2xl font-bold ${stats.lucro >= 0 ? 'text-success' : 'text-destructive'}`}>
                      R$ {stats.lucro.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4">Vendas por Dia</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={vendasPorDia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="data" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4">Produtos Mais Vendidos</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={produtosMaisVendidos}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ nome, percent }) => `${nome} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="quantidade"
                    >
                      {produtosMaisVendidos.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass-card p-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/20">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clientes Cadastrados</p>
                  <p className="text-2xl font-bold">{stats.qtdClientes}</p>
                </div>
              </Card>

              <Card className="glass-card p-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/20">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Produtos Cadastrados</p>
                  <p className="text-2xl font-bold">{stats.qtdProdutos}</p>
                </div>
              </Card>

              <Card className="glass-card p-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/20">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-bold">
                    R$ {stats.qtdVendas > 0 ? (stats.totalVendas / stats.qtdVendas).toFixed(2) : '0.00'}
                  </p>
                </div>
              </Card>
            </div>
          </>
        )}
      </motion.div>
    </ERPLayout>
  );
};

export default RelatoriosPage;
