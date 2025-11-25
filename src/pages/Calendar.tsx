import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'receita' | 'despesa';
  date: string;
  is_recurring: boolean;
  categories: {
    name: string;
    color: string;
  } | null;
}

const Calendar = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user, currentDate]);

  const loadTransactions = async () => {
    try {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);

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
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (error) throw error;
      setTransactions((data || []) as Transaction[]);
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

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getTransactionsForDate = (date: Date) => {
    return transactions.filter(t => isSameDay(new Date(t.date), date));
  };

  const selectedDateTransactions = selectedDate ? getTransactionsForDate(selectedDate) : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Calendário
              </h1>
              <p className="text-sm text-muted-foreground">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {daysInMonth.map(day => {
                  const dayTransactions = getTransactionsForDate(day);
                  const hasReceitas = dayTransactions.some(t => t.type === 'receita');
                  const hasDespesas = dayTransactions.some(t => t.type === 'despesa');
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`p-3 rounded-lg border transition-all hover:bg-muted/50 ${
                        isSelected ? 'bg-primary/10 border-primary' : 'border-border'
                      } ${!isSameMonth(day, currentDate) ? 'opacity-50' : ''}`}
                    >
                      <div className="text-sm font-medium mb-1">
                        {format(day, 'd')}
                      </div>
                      {dayTransactions.length > 0 && (
                        <div className="flex gap-1 justify-center">
                          {hasReceitas && (
                            <div className="w-2 h-2 rounded-full bg-success" />
                          )}
                          {hasDespesas && (
                            <div className="w-2 h-2 rounded-full bg-destructive" />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione uma data'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                selectedDateTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateTransactions.map(transaction => (
                      <div
                        key={transaction.id}
                        className="p-3 rounded-lg border"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{transaction.description}</p>
                            {transaction.categories && (
                              <Badge
                                variant="outline"
                                className="text-xs mt-1"
                                style={{
                                  borderColor: transaction.categories.color,
                                  color: transaction.categories.color,
                                }}
                              >
                                {transaction.categories.name}
                              </Badge>
                            )}
                          </div>
                          {transaction.type === 'receita' ? (
                            <TrendingUp className="w-4 h-4 text-success" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-destructive" />
                          )}
                        </div>
                        <p
                          className={`text-lg font-bold ${
                            transaction.type === 'receita' ? 'text-success' : 'text-destructive'
                          }`}
                        >
                          {transaction.type === 'receita' ? '+' : '-'} R$ {Number(transaction.amount).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma transação nesta data
                  </p>
                )
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Clique em uma data para ver as transações
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Calendar;