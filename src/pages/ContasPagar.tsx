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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Loader2, Plus, Search, Check, TrendingDown, Calendar } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContaPagar {
  id: string;
  fornecedor_id: string | null;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  forma_pagamento: string | null;
  observacao: string | null;
  fornecedores?: { razao_social: string } | null;
}

const ContasPagarPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data_vencimento: '',
    forma_pagamento: 'DINHEIRO',
    observacao: '',
  });

  useEffect(() => {
    if (user) loadContas();
  }, [user, statusFilter]);

  const loadContas = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('contas_pagar')
        .select('*, fornecedores(razao_social)')
        .eq('user_id', user?.id)
        .order('data_vencimento');

      if (statusFilter !== 'TODOS') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setContas(data || []);
    } catch (error) {
      console.error('Error loading contas:', error);
      toast({ title: 'Erro', description: 'Não foi possível carregar as contas', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.from('contas_pagar').insert({
        user_id: user?.id,
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        data_vencimento: formData.data_vencimento,
        forma_pagamento: formData.forma_pagamento,
        observacao: formData.observacao || null,
        status: 'PENDENTE',
      });

      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Conta a pagar cadastrada!' });
      setShowDialog(false);
      setFormData({ descricao: '', valor: '', data_vencimento: '', forma_pagamento: 'DINHEIRO', observacao: '' });
      loadContas();
    } catch (error) {
      console.error('Error saving conta:', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar a conta', variant: 'destructive' });
    }
  };

  const handleBaixar = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contas_pagar')
        .update({
          status: 'PAGO',
          data_pagamento: new Date().toISOString().split('T')[0],
        })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Conta paga com sucesso!' });
      loadContas();
    } catch (error) {
      console.error('Error pagando conta:', error);
      toast({ title: 'Erro', description: 'Não foi possível pagar a conta', variant: 'destructive' });
    }
  };

  const getStatusBadge = (conta: ContaPagar) => {
    if (conta.status === 'PAGO') {
      return <Badge className="bg-success">Pago</Badge>;
    }
    const vencimento = new Date(conta.data_vencimento);
    if (isPast(vencimento) && !isToday(vencimento)) {
      return <Badge variant="destructive">Vencido</Badge>;
    }
    if (isToday(vencimento)) {
      return <Badge className="bg-warning text-warning-foreground">Vence Hoje</Badge>;
    }
    return <Badge variant="secondary">Pendente</Badge>;
  };

  const totalPendente = contas
    .filter((c) => c.status === 'PENDENTE')
    .reduce((sum, c) => sum + Number(c.valor), 0);

  const totalPago = contas
    .filter((c) => c.status === 'PAGO')
    .reduce((sum, c) => sum + Number(c.valor), 0);

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-8 h-8 text-destructive" />
            <div>
              <h1 className="text-2xl font-bold">Contas a Pagar</h1>
              <p className="text-muted-foreground">{contas.length} contas</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="PENDENTE">Pendentes</SelectItem>
                <SelectItem value="PAGO">Pagos</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="glass-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Pendente</span>
              <span className="text-2xl font-bold text-destructive">R$ {totalPendente.toFixed(2)}</span>
            </div>
          </Card>
          <Card className="glass-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Pago</span>
              <span className="text-2xl font-bold text-success">R$ {totalPago.toFixed(2)}</span>
            </div>
          </Card>
        </div>

        <Card className="glass-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/20">
                <TableHead>Descrição</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : contas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma conta encontrada
                  </TableCell>
                </TableRow>
              ) : (
                contas.map((conta) => (
                  <TableRow key={conta.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{conta.descricao}</TableCell>
                    <TableCell>{conta.fornecedores?.razao_social || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(conta.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      R$ {Number(conta.valor).toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(conta)}</TableCell>
                    <TableCell>{conta.forma_pagamento || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {conta.status === 'PENDENTE' && (
                          <Button variant="ghost" size="sm" onClick={() => handleBaixar(conta.id)}>
                            <Check className="w-4 h-4 mr-1" />
                            Pagar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Conta a Pagar</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Descrição *</Label>
                <Input value={formData.descricao} onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))} />
              </div>
              <div>
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" value={formData.valor} onChange={(e) => setFormData((p) => ({ ...p, valor: e.target.value }))} />
              </div>
              <div>
                <Label>Data de Vencimento *</Label>
                <Input type="date" value={formData.data_vencimento} onChange={(e) => setFormData((p) => ({ ...p, data_vencimento: e.target.value }))} />
              </div>
              <div>
                <Label>Forma de Pagamento</Label>
                <Select value={formData.forma_pagamento} onValueChange={(v) => setFormData((p) => ({ ...p, forma_pagamento: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="CARTAO">Cartão</SelectItem>
                    <SelectItem value="BOLETO">Boleto</SelectItem>
                    <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Observação</Label>
                <Input value={formData.observacao} onChange={(e) => setFormData((p) => ({ ...p, observacao: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </ERPLayout>
  );
};

export default ContasPagarPage;
