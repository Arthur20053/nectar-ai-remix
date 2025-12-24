import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ERPLayout } from '@/components/erp/ERPLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Plus, TrendingDown, TrendingUp, Wallet, Sparkles, Users, ShoppingCart, Package, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TransactionList } from '@/components/TransactionList';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { AIAnalysis } from '@/components/AIAnalysis';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Stats {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface MonthlyData {
  month: string;
  receitas: number;
  despesas: number;
}

interface QuickStats {
  clientes: number;
  produtos: number;
  vendas: number;
  vendasHoje: number;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ totalReceitas: 0, totalDespesas: 0, saldo: 0 });
  const [quickStats, setQuickStats] = useState<QuickStats>({ clientes: 0, produtos: 0, vendas: 0, vendasHoje: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadStats();
      loadQuickStats();
      loadChartData();
    }
  }, [user]);

  const loadQuickStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [clientesRes, produtosRes, vendasRes, vendasHojeRes] = await Promise.all([
        supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('user_id', user?.id),
        supabase.from('produtos').select('id', { count: 'exact', head: true }).eq('user_id', user?.id),
        supabase.from('vendas').select('id', { count: 'exact', head: true }).eq('user_id', user?.id),
        supabase.from('vendas').select('valor_final').eq('user_id', user?.id).gte('data_venda', today),
      ]);

      const vendasHojeTotal = vendasHojeRes.data?.reduce((sum, v) => sum + Number(v.valor_final || 0), 0) || 0;

      setQuickStats({
        clientes: clientesRes.count || 0,
        produtos: produtosRes.count || 0,
        vendas: vendasRes.count || 0,
        vendasHoje: vendasHojeTotal,
      });
    } catch (error) {
      console.error('Error loading quick stats:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user?.id);

      if (error) throw error;

      const receitas = data
        ?.filter(t => t.type === 'receita')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const despesas = data
        ?.filter(t => t.type === 'despesa')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      setStats({
        totalReceitas: receitas,
        totalDespesas: despesas,
        saldo: receitas - despesas,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as estatísticas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('amount, type, category_id, date, categories(name, color)')
        .eq('user_id', user?.id);

      if (transError) throw transError;

      const catMap = new Map<string, { value: number; color: string }>();
      transactions?.forEach(t => {
        if (t.type === 'despesa' && t.categories) {
          const cat = t.categories as any;
          const existing = catMap.get(cat.name) || { value: 0, color: cat.color };
          catMap.set(cat.name, {
            value: existing.value + Number(t.amount),
            color: cat.color,
          });
        }
      });

      const catData: CategoryData[] = Array.from(catMap.entries()).map(([name, data]) => ({
        name,
        value: data.value,
        color: data.color,
      }));

      setCategoryData(catData);

      const monthlyMap = new Map<string, { receitas: number; despesas: number }>();
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        monthlyMap.set(monthKey, { receitas: 0, despesas: 0 });
      }

      transactions?.forEach(t => {
        const date = new Date(t.date || '');
        const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        const existing = monthlyMap.get(monthKey);
        if (existing) {
          if (t.type === 'receita') {
            existing.receitas += Number(t.amount);
          } else {
            existing.despesas += Number(t.amount);
          }
        }
      });

      const monthlyArr: MonthlyData[] = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        ...data,
      }));

      setMonthlyData(monthlyArr);
    } catch (error) {
      console.error('Erro ao carregar dados dos gráficos:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ERPLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral do seu negócio</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAIAnalysis(true)} variant="outline" size="sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Análise IA
            </Button>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nova Transação
            </Button>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="glass-card p-4 cursor-pointer hover:border-primary/50 transition-all" onClick={() => navigate('/clientes')}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/20">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clientes</p>
                <p className="text-2xl font-bold">{quickStats.clientes}</p>
              </div>
            </div>
          </Card>
          <Card className="glass-card p-4 cursor-pointer hover:border-primary/50 transition-all" onClick={() => navigate('/produtos')}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/20">
                <Package className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produtos</p>
                <p className="text-2xl font-bold">{quickStats.produtos}</p>
              </div>
            </div>
          </Card>
          <Card className="glass-card p-4 cursor-pointer hover:border-primary/50 transition-all" onClick={() => navigate('/vendas')}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/20">
                <ShoppingCart className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Vendas</p>
                <p className="text-2xl font-bold">{quickStats.vendas}</p>
              </div>
            </div>
          </Card>
          <Card className="glass-card p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-warning/20">
                <DollarSign className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendas Hoje</p>
                <p className="text-2xl font-bold text-success">R$ {quickStats.vendasHoje.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Financial Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Receitas</span>
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <p className="text-3xl font-bold text-success">
              R$ {stats.totalReceitas.toFixed(2)}
            </p>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Despesas</span>
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-3xl font-bold text-destructive">
              R$ {stats.totalDespesas.toFixed(2)}
            </p>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Saldo</span>
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <p className={`text-3xl font-bold ${stats.saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
              R$ {stats.saldo.toFixed(2)}
            </p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">Fluxo de Caixa</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="receitas" 
                  stroke="hsl(var(--success))" 
                  fillOpacity={1} 
                  fill="url(#colorReceitas)"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="despesas" 
                  stroke="hsl(var(--destructive))" 
                  fillOpacity={1} 
                  fill="url(#colorDespesas)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">Comparação Mensal</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Bar dataKey="receitas" fill="hsl(var(--success))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="despesas" fill="hsl(var(--destructive))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Category Distribution */}
        {categoryData.length > 0 && (
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">Distribuição de Gastos</h3>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width="50%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {categoryData.map((cat, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded glass-card">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm">{cat.name}</span>
                    </div>
                    <span className="font-semibold">R$ {cat.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Transaction List */}
        <TransactionList onUpdate={() => { loadStats(); loadChartData(); }} />

        {/* Dialogs */}
        <AddTransactionDialog 
          open={showAddDialog} 
          onOpenChange={setShowAddDialog}
          onSuccess={() => { loadStats(); loadChartData(); }}
        />
        <AIAnalysis 
          open={showAIAnalysis}
          onOpenChange={setShowAIAnalysis}
        />
      </motion.div>
    </ERPLayout>
  );
};

export default Dashboard;
