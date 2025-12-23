import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ERPLayout } from '@/components/erp/ERPLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Loader2, Plus, Search, Edit, Trash2, Printer, RefreshCw, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Caixa {
  id: string;
  numero: number;
  data_abertura: string;
  data_fechamento: string | null;
  saldo_inicial: number;
  saldo_final: number | null;
  status: string;
  observacao: string | null;
}

interface MovimentoCaixa {
  id: string;
  caixa_id: string;
  origem: string;
  tipo: string;
  valor: number;
  forma_pagamento: string;
  descricao: string | null;
  data_lancamento: string;
  observacao: string | null;
}

const CaixaPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [caixaAtual, setCaixaAtual] = useState<Caixa | null>(null);
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>([]);
  const [statusFilter, setStatusFilter] = useState('ABERTO');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNovoLancamento, setShowNovoLancamento] = useState(false);
  const [showAbrirCaixa, setShowAbrirCaixa] = useState(false);

  // Form states
  const [novoMovimento, setNovoMovimento] = useState({
    tipo: 'CREDITO',
    valor: '',
    forma_pagamento: 'DINHEIRO',
    descricao: '',
    observacao: '',
  });

  const [novoCaixa, setNovoCaixa] = useState({
    saldo_inicial: '',
    observacao: '',
  });

  useEffect(() => {
    if (user) {
      loadCaixas();
    }
  }, [user, statusFilter]);

  const loadCaixas = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('caixa')
        .select('*')
        .eq('user_id', user?.id)
        .order('data_abertura', { ascending: false });

      if (statusFilter !== 'TODOS') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCaixas(data || []);

      // Load current open caixa
      const caixaAberto = data?.find((c) => c.status === 'ABERTO');
      if (caixaAberto) {
        setCaixaAtual(caixaAberto);
        loadMovimentos(caixaAberto.id);
      } else {
        setCaixaAtual(null);
        setMovimentos([]);
      }
    } catch (error) {
      console.error('Error loading caixas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os caixas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMovimentos = async (caixaId: string) => {
    try {
      const { data, error } = await supabase
        .from('movimentos_caixa')
        .select('*')
        .eq('caixa_id', caixaId)
        .order('data_lancamento', { ascending: false });

      if (error) throw error;
      setMovimentos(data || []);
    } catch (error) {
      console.error('Error loading movimentos:', error);
    }
  };

  const handleAbrirCaixa = async () => {
    try {
      const proximoNumero = caixas.length > 0 ? Math.max(...caixas.map((c) => c.numero)) + 1 : 1;

      const { data, error } = await supabase.from('caixa').insert({
        user_id: user?.id,
        numero: proximoNumero,
        saldo_inicial: parseFloat(novoCaixa.saldo_inicial) || 0,
        observacao: novoCaixa.observacao || null,
        status: 'ABERTO',
      }).select().single();

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Caixa aberto com sucesso!' });
      setShowAbrirCaixa(false);
      setNovoCaixa({ saldo_inicial: '', observacao: '' });
      loadCaixas();
    } catch (error) {
      console.error('Error opening caixa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível abrir o caixa',
        variant: 'destructive',
      });
    }
  };

  const handleFecharCaixa = async () => {
    if (!caixaAtual) return;

    try {
      const totalCredito = movimentos
        .filter((m) => m.tipo === 'CREDITO')
        .reduce((sum, m) => sum + Number(m.valor), 0);
      const totalDebito = movimentos
        .filter((m) => m.tipo === 'DEBITO')
        .reduce((sum, m) => sum + Number(m.valor), 0);
      const saldoFinal = Number(caixaAtual.saldo_inicial) + totalCredito - totalDebito;

      const { error } = await supabase
        .from('caixa')
        .update({
          status: 'FECHADO',
          data_fechamento: new Date().toISOString(),
          saldo_final: saldoFinal,
        })
        .eq('id', caixaAtual.id);

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Caixa fechado com sucesso!' });
      loadCaixas();
    } catch (error) {
      console.error('Error closing caixa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível fechar o caixa',
        variant: 'destructive',
      });
    }
  };

  const handleNovoLancamento = async () => {
    if (!caixaAtual) return;

    try {
      const { error } = await supabase.from('movimentos_caixa').insert({
        user_id: user?.id,
        caixa_id: caixaAtual.id,
        origem: 'MANUAL',
        tipo: novoMovimento.tipo,
        valor: parseFloat(novoMovimento.valor),
        forma_pagamento: novoMovimento.forma_pagamento,
        descricao: novoMovimento.descricao || null,
        observacao: novoMovimento.observacao || null,
      });

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Lançamento adicionado!' });
      setShowNovoLancamento(false);
      setNovoMovimento({
        tipo: 'CREDITO',
        valor: '',
        forma_pagamento: 'DINHEIRO',
        descricao: '',
        observacao: '',
      });
      loadMovimentos(caixaAtual.id);
    } catch (error) {
      console.error('Error adding lancamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o lançamento',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMovimento = async (id: string) => {
    try {
      const { error } = await supabase.from('movimentos_caixa').delete().eq('id', id);
      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Lançamento removido!' });
      if (caixaAtual) loadMovimentos(caixaAtual.id);
    } catch (error) {
      console.error('Error deleting movimento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o lançamento',
        variant: 'destructive',
      });
    }
  };

  const totalCredito = movimentos
    .filter((m) => m.tipo === 'CREDITO')
    .reduce((sum, m) => sum + Number(m.valor), 0);
  const totalDebito = movimentos
    .filter((m) => m.tipo === 'DEBITO')
    .reduce((sum, m) => sum + Number(m.valor), 0);
  const saldo = (caixaAtual ? Number(caixaAtual.saldo_inicial) : 0) + totalCredito - totalDebito;

  if (authLoading) {
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
            <h1 className="text-2xl font-bold">Mov. Caixa</h1>
            <p className="text-muted-foreground">
              {caixaAtual
                ? `Caixa #${caixaAtual.numero} - ${caixaAtual.status}`
                : 'Nenhum caixa aberto'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ABERTO">Aberto</SelectItem>
                <SelectItem value="FECHADO">Fechado</SelectItem>
                <SelectItem value="TODOS">Todos</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48"
              />
            </div>

            <Badge variant={caixaAtual?.status === 'ABERTO' ? 'default' : 'secondary'}>
              Situação: {caixaAtual?.status || 'SEM CAIXA'}
            </Badge>
          </div>
        </div>

        {/* Table */}
        <Card className="glass-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/20">
                  <TableHead>Origem</TableHead>
                  <TableHead>Nº Caixa</TableHead>
                  <TableHead>Status Caixa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Lançamento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Forma de Pagamento</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : movimentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Nenhum lançamento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  movimentos.map((mov) => (
                    <TableRow key={mov.id} className="hover:bg-muted/50">
                      <TableCell>{mov.origem}</TableCell>
                      <TableCell>{caixaAtual?.numero}</TableCell>
                      <TableCell>
                        <Badge variant={caixaAtual?.status === 'ABERTO' ? 'default' : 'secondary'}>
                          {caixaAtual?.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={mov.tipo === 'CREDITO' ? 'default' : 'destructive'}>
                          {mov.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(mov.data_lancamento), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{mov.descricao || '-'}</TableCell>
                      <TableCell className={`text-right font-medium ${mov.tipo === 'CREDITO' ? 'text-success' : 'text-destructive'}`}>
                        {mov.tipo === 'CREDITO' ? '+' : '-'} R$ {Number(mov.valor).toFixed(2)}
                      </TableCell>
                      <TableCell>{mov.forma_pagamento}</TableCell>
                      <TableCell className="max-w-32 truncate">{mov.observacao || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteMovimento(mov.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Resumo */}
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Resumo</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Crédito</span>
              <span className="text-xl font-bold text-success">R$ {totalCredito.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Débito</span>
              <span className="text-xl font-bold text-destructive">R$ {totalDebito.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Saldo</span>
              <span className={`text-xl font-bold ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                R$ {saldo.toFixed(2)}
              </span>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => loadCaixas()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Outros Caixas
          </Button>

          <div className="flex items-center gap-2">
            {caixaAtual && (
              <>
                <Button variant="outline" onClick={() => setShowNovoLancamento(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Alterar Lançamento
                </Button>
                <Button onClick={() => setShowNovoLancamento(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  F4 | Novo Lançamento
                </Button>
              </>
            )}
            {!caixaAtual && (
              <Button onClick={() => setShowAbrirCaixa(true)}>
                <DollarSign className="w-4 h-4 mr-2" />
                Abrir Caixa
              </Button>
            )}
            {caixaAtual && (
              <Button variant="outline" onClick={handleFecharCaixa}>
                F5 | Caixa Diário
              </Button>
            )}
            <Button variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground border-t border-border pt-4">
          <span className="font-medium">Empresa</span>
        </div>
      </motion.div>

      {/* Dialog: Novo Lançamento */}
      <Dialog open={showNovoLancamento} onOpenChange={setShowNovoLancamento}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select
                value={novoMovimento.tipo}
                onValueChange={(v) => setNovoMovimento((p) => ({ ...p, tipo: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDITO">Crédito (Entrada)</SelectItem>
                  <SelectItem value="DEBITO">Débito (Saída)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={novoMovimento.valor}
                onChange={(e) => setNovoMovimento((p) => ({ ...p, valor: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Select
                value={novoMovimento.forma_pagamento}
                onValueChange={(v) => setNovoMovimento((p) => ({ ...p, forma_pagamento: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="CARTAO_DEBITO">Cartão Débito</SelectItem>
                  <SelectItem value="CARTAO_CREDITO">Cartão Crédito</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                  <SelectItem value="BOLETO">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={novoMovimento.descricao}
                onChange={(e) => setNovoMovimento((p) => ({ ...p, descricao: e.target.value }))}
                placeholder="Descrição do lançamento"
              />
            </div>
            <div>
              <Label>Observação</Label>
              <Textarea
                value={novoMovimento.observacao}
                onChange={(e) => setNovoMovimento((p) => ({ ...p, observacao: e.target.value }))}
                placeholder="Observações adicionais"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNovoLancamento(false)}>
              Cancelar
            </Button>
            <Button onClick={handleNovoLancamento}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Abrir Caixa */}
      <Dialog open={showAbrirCaixa} onOpenChange={setShowAbrirCaixa}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Saldo Inicial (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={novoCaixa.saldo_inicial}
                onChange={(e) => setNovoCaixa((p) => ({ ...p, saldo_inicial: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Observação</Label>
              <Textarea
                value={novoCaixa.observacao}
                onChange={(e) => setNovoCaixa((p) => ({ ...p, observacao: e.target.value }))}
                placeholder="Observações"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAbrirCaixa(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAbrirCaixa}>Abrir Caixa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ERPLayout>
  );
};

export default CaixaPage;
