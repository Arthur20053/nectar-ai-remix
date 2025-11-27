import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, LogOut, Plus, TrendingDown, TrendingUp, Wallet, Sparkles, CalendarIcon, Tag } from 'lucide-react';
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

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ totalReceitas: 0, totalDespesas: 0, saldo: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadStats();
      loadChartData();
    }
  }, [user]);

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
      // Load category distribution
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('amount, type, category_id, date, categories(name, color)')
        .eq('user_id', user?.id);

      if (transError) throw transError;

      // Process category data
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

      // Load monthly comparison (last 6 months)
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center neon-glow">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
                FinanceFlow
              </h1>
              <p className="text-sm text-muted-foreground">Command Center</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/categories')} variant="outline" size="sm">
              <Tag className="w-4 h-4 mr-2" />
              Categorias
            </Button>
            <Button variant="outline" onClick={() => signOut()} size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="glass-card p-6 hover:neon-glow transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Receitas</span>
                <TrendingUp className="w-5 h-5" style={{ color: 'hsl(var(--success))' }} />
              </div>
              <p className="text-3xl font-bold" style={{ color: 'hsl(var(--success))' }}>
                R$ {stats.totalReceitas.toFixed(2)}
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="glass-card p-6 hover:neon-glow transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Despesas</span>
                <TrendingDown className="w-5 h-5" style={{ color: 'hsl(var(--destructive))' }} />
              </div>
              <p className="text-3xl font-bold" style={{ color: 'hsl(var(--destructive))' }}>
                R$ {stats.totalDespesas.toFixed(2)}
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="glass-card p-6 hover:neon-glow transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Saldo</span>
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <p className={`text-3xl font-bold ${stats.saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                R$ {stats.saldo.toFixed(2)}
              </p>
            </Card>
          </motion.div>
        </div>

        <div className="flex gap-3 mb-6">
          <Button onClick={() => setShowAddDialog(true)} size="lg" className="gradient-primary neon-glow">
            <Plus className="w-5 h-5 mr-2" />
            Nova Transação
          </Button>
          <Button onClick={() => navigate('/calendar')} variant="outline" size="lg">
            <CalendarIcon className="w-5 h-5 mr-2" />
            Calendário
          </Button>
          <Button onClick={() => setShowAIAnalysis(true)} variant="outline" size="lg">
            <Sparkles className="w-5 h-5 mr-2" />
            Análise com IA
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
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
          </motion.div>
        </div>

        {categoryData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mb-6"
          >
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
          </motion.div>
        )}

        <TransactionList onUpdate={() => { loadStats(); loadChartData(); }} />
        <AddTransactionDialog 
          open={showAddDialog} 
          onOpenChange={setShowAddDialog}
          onSuccess={() => { loadStats(); loadChartData(); }}
        />
        <AIAnalysis 
          open={showAIAnalysis}
          onOpenChange={setShowAIAnalysis}
        />
      </div>
    </div>
  );
};

export default Dashboard;
