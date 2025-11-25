import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, RepeatIcon, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FilterBar } from './FilterBar';
import { ReceiptModal } from './ReceiptModal';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'receita' | 'despesa';
  date: string;
  category_id: string;
  is_recurring: boolean;
  categories: {
    name: string;
    color: string;
  } | null;
}

interface TransactionListProps {
  onUpdate: () => void;
}

export function TransactionList({ onUpdate }: TransactionListProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (
            name,
            color
          )
        `)
        .eq('user_id', user?.id)
        .order('date', { ascending: false })
        .limit(20);

      if (error) throw error;
      const txs = (data || []) as Transaction[];
      setTransactions(txs);
      setFilteredTransactions(txs);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as transações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Transação excluída com sucesso',
      });

      loadTransactions();
      onUpdate();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a transação',
        variant: 'destructive',
      });
    }
  };

  const handleFilterChange = (filters: {
    dateRange: 'all' | 'thisMonth' | 'lastMonth' | 'custom';
    category: string;
    type: 'all' | 'receita' | 'despesa';
    customStartDate?: Date;
    customEndDate?: Date;
  }) => {
    let filtered = [...transactions];

    // Filter by date range
    if (filters.dateRange === 'thisMonth') {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      filtered = filtered.filter(t => {
        const date = new Date(t.date);
        return date >= start && date <= end;
      });
    } else if (filters.dateRange === 'lastMonth') {
      const now = new Date();
      const start = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
      const end = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
      filtered = filtered.filter(t => {
        const date = new Date(t.date);
        return date >= start && date <= end;
      });
    } else if (filters.dateRange === 'custom' && filters.customStartDate && filters.customEndDate) {
      filtered = filtered.filter(t => {
        const date = new Date(t.date);
        return date >= filters.customStartDate! && date <= filters.customEndDate!;
      });
    }

    // Filter by category
    if (filters.category !== 'all') {
      filtered = filtered.filter(t => t.category_id === filters.category);
    }

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    setFilteredTransactions(filtered);
  };

  const totalFiltered = filteredTransactions.reduce((sum, t) => {
    return sum + (t.type === 'receita' ? Number(t.amount) : -Number(t.amount));
  }, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <FilterBar onFilterChange={handleFilterChange} />
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transações</CardTitle>
            <div className="text-sm">
              <span className="text-muted-foreground">Total Selecionado: </span>
              <span className={`font-bold ${totalFiltered >= 0 ? 'text-success' : 'text-destructive'}`}>
                R$ {Math.abs(totalFiltered).toFixed(2)}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma transação encontrada. Adicione sua primeira transação!
          </p>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: transaction.categories?.color + '20' }}
                  >
                    <span
                      className="text-lg font-bold"
                      style={{ color: transaction.categories?.color }}
                    >
                      {transaction.categories?.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{transaction.description}</p>
                      {transaction.is_recurring && (
                        <RepeatIcon className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: transaction.categories?.color,
                          color: transaction.categories?.color,
                        }}
                      >
                        {transaction.categories?.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-lg font-bold ${
                        transaction.type === 'receita' ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {transaction.type === 'receita' ? '+' : '-'} R${' '}
                      {Number(transaction.amount).toFixed(2)}
                    </p>
                    {transaction.type === 'receita' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setReceiptTransaction(transaction);
                          setShowReceipt(true);
                        }}
                        title="Gerar Recibo"
                      >
                        <Receipt className="w-4 h-4 text-success" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTransaction(transaction.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </CardContent>
      </Card>

      <ReceiptModal
        open={showReceipt}
        onOpenChange={setShowReceipt}
        transaction={receiptTransaction}
      />
    </>
  );
}
