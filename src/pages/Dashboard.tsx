import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, LogOut, Plus, TrendingDown, TrendingUp, Wallet, Sparkles, CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TransactionList } from '@/components/TransactionList';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { AIAnalysis } from '@/components/AIAnalysis';
import { useToast } from '@/hooks/use-toast';

interface Stats {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
}

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ totalReceitas: 0, totalDespesas: 0, saldo: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadStats();
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                FinanceFlow
              </h1>
              <p className="text-sm text-muted-foreground">Bem-vindo de volta!</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => signOut()}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="p-6 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Receitas</span>
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <p className="text-3xl font-bold text-success">
              R$ {stats.totalReceitas.toFixed(2)}
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Despesas</span>
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-3xl font-bold text-destructive">
              R$ {stats.totalDespesas.toFixed(2)}
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Saldo</span>
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <p className={`text-3xl font-bold ${stats.saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
              R$ {stats.saldo.toFixed(2)}
            </p>
          </Card>
        </div>

        <div className="flex gap-3 mb-6">
          <Button onClick={() => setShowAddDialog(true)} size="lg">
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

        <TransactionList onUpdate={loadStats} />
        <AddTransactionDialog 
          open={showAddDialog} 
          onOpenChange={setShowAddDialog}
          onSuccess={loadStats}
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
