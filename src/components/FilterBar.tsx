import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Category {
  id: string;
  name: string;
  type: string;
}

interface FilterBarProps {
  onFilterChange: (filters: {
    dateRange: 'all' | 'thisMonth' | 'lastMonth' | 'custom';
    category: string;
    type: 'all' | 'receita' | 'despesa';
    customStartDate?: Date;
    customEndDate?: Date;
  }) => void;
}

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [dateRange, setDateRange] = useState<'all' | 'thisMonth' | 'lastMonth' | 'custom'>('all');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState<'all' | 'receita' | 'despesa'>('all');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user]);

  useEffect(() => {
    onFilterChange({
      dateRange,
      category,
      type,
      customStartDate,
      customEndDate,
    });
  }, [dateRange, category, type, customStartDate, customEndDate]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${user?.id}`);
    setCategories(data || []);
  };

  return (
    <Card className="glass-card p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Filtros</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
          <SelectTrigger className="bg-secondary/50">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent className="bg-card backdrop-blur-md border-border">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="thisMonth">Este Mês</SelectItem>
            <SelectItem value="lastMonth">Mês Passado</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>

        {dateRange === 'custom' && (
          <div className="flex gap-2 md:col-span-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full bg-secondary/50">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customStartDate ? format(customStartDate, 'dd/MM/yyyy') : 'Início'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 glass-card">
                <Calendar
                  mode="single"
                  selected={customStartDate}
                  onSelect={setCustomStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full bg-secondary/50">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customEndDate ? format(customEndDate, 'dd/MM/yyyy') : 'Fim'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 glass-card">
                <Calendar
                  mode="single"
                  selected={customEndDate}
                  onSelect={setCustomEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="bg-secondary/50">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent className="bg-card backdrop-blur-md border-border">
            <SelectItem value="all">Todas Categorias</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={(v: any) => setType(v)}>
          <SelectTrigger className="bg-secondary/50">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent className="bg-card backdrop-blur-md border-border">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="receita">Receitas</SelectItem>
            <SelectItem value="despesa">Despesas</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}