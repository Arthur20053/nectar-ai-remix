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
import { Loader2, Plus, Search, ShoppingCart, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Venda {
  id: string;
  numero: number | null;
  cliente_id: string | null;
  data_venda: string;
  valor_total: number;
  desconto: number;
  valor_final: number;
  forma_pagamento: string;
  status: string;
  observacao: string | null;
  clientes?: { nome: string } | null;
}

interface Cliente {
  id: string;
  nome: string;
}

interface Produto {
  id: string;
  nome: string;
  preco_venda: number;
  estoque_atual: number;
}

interface ItemVenda {
  produto_id: string;
  nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

const VendasPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [itensVenda, setItensVenda] = useState<ItemVenda[]>([]);
  const [formData, setFormData] = useState({
    cliente_id: '',
    forma_pagamento: 'DINHEIRO',
    desconto: '0',
    observacao: '',
  });
  const [novoProduto, setNovoProduto] = useState({ produto_id: '', quantidade: '1' });

  useEffect(() => {
    if (user) {
      loadVendas();
      loadClientes();
      loadProdutos();
    }
  }, [user]);

  const loadVendas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendas')
        .select('*, clientes(nome)')
        .eq('user_id', user?.id)
        .order('data_venda', { ascending: false });

      if (error) throw error;
      setVendas(data || []);
    } catch (error) {
      console.error('Error loading vendas:', error);
      toast({ title: 'Erro', description: 'Não foi possível carregar as vendas', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadClientes = async () => {
    const { data } = await supabase.from('clientes').select('id, nome').eq('user_id', user?.id);
    setClientes(data || []);
  };

  const loadProdutos = async () => {
    const { data } = await supabase.from('produtos').select('id, nome, preco_venda, estoque_atual').eq('user_id', user?.id);
    setProdutos(data || []);
  };

  const handleAddItem = () => {
    const produto = produtos.find((p) => p.id === novoProduto.produto_id);
    if (!produto) return;

    const quantidade = parseInt(novoProduto.quantidade) || 1;
    const subtotal = quantidade * Number(produto.preco_venda);

    setItensVenda((prev) => [
      ...prev,
      {
        produto_id: produto.id,
        nome: produto.nome,
        quantidade,
        preco_unitario: Number(produto.preco_venda),
        subtotal,
      },
    ]);
    setNovoProduto({ produto_id: '', quantidade: '1' });
  };

  const handleRemoveItem = (index: number) => {
    setItensVenda((prev) => prev.filter((_, i) => i !== index));
  };

  const valorTotal = itensVenda.reduce((sum, item) => sum + item.subtotal, 0);
  const desconto = parseFloat(formData.desconto) || 0;
  const valorFinal = valorTotal - desconto;

  const handleSave = async () => {
    if (itensVenda.length === 0) {
      toast({ title: 'Erro', description: 'Adicione pelo menos um produto', variant: 'destructive' });
      return;
    }

    try {
      // Get next venda number
      const { data: lastVenda } = await supabase
        .from('vendas')
        .select('numero')
        .eq('user_id', user?.id)
        .order('numero', { ascending: false })
        .limit(1);

      const proximoNumero = lastVenda && lastVenda.length > 0 ? (lastVenda[0].numero || 0) + 1 : 1;

      // Create venda
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          user_id: user?.id,
          numero: proximoNumero,
          cliente_id: formData.cliente_id || null,
          valor_total: valorTotal,
          desconto,
          valor_final: valorFinal,
          forma_pagamento: formData.forma_pagamento,
          status: 'FINALIZADA',
          observacao: formData.observacao || null,
        })
        .select()
        .single();

      if (vendaError) throw vendaError;

      // Create venda items
      const itensData = itensVenda.map((item) => ({
        venda_id: venda.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal,
      }));

      const { error: itensError } = await supabase.from('vendas_itens').insert(itensData);
      if (itensError) throw itensError;

      // Update stock
      for (const item of itensVenda) {
        await supabase
          .from('produtos')
          .update({
            estoque_atual: (produtos.find((p) => p.id === item.produto_id)?.estoque_atual || 0) - item.quantidade,
          })
          .eq('id', item.produto_id);
      }

      toast({ title: 'Sucesso', description: `Venda #${proximoNumero} realizada!` });
      setShowDialog(false);
      resetForm();
      loadVendas();
      loadProdutos();
    } catch (error) {
      console.error('Error saving venda:', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar a venda', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({ cliente_id: '', forma_pagamento: 'DINHEIRO', desconto: '0', observacao: '' });
    setItensVenda([]);
    setNovoProduto({ produto_id: '', quantidade: '1' });
  };

  const totalVendas = vendas.reduce((sum, v) => sum + Number(v.valor_final), 0);

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
            <ShoppingCart className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Vendas</h1>
              <p className="text-muted-foreground">{vendas.length} vendas | Total: R$ {totalVendas.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button onClick={() => { resetForm(); setShowDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Venda
            </Button>
          </div>
        </div>

        <Card className="glass-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/20">
                <TableHead>Nº</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
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
              ) : vendas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma venda encontrada
                  </TableCell>
                </TableRow>
              ) : (
                vendas.map((venda) => (
                  <TableRow key={venda.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">#{venda.numero}</TableCell>
                    <TableCell>{venda.clientes?.nome || 'Cliente Avulso'}</TableCell>
                    <TableCell>{format(new Date(venda.data_venda), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                    <TableCell className="text-right font-medium text-success">
                      R$ {Number(venda.valor_final).toFixed(2)}
                    </TableCell>
                    <TableCell>{venda.forma_pagamento}</TableCell>
                    <TableCell>
                      <Badge className="bg-success">{venda.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Nova Venda</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cliente</Label>
                  <Select value={formData.cliente_id} onValueChange={(v) => setFormData((p) => ({ ...p, cliente_id: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cliente Avulso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Cliente Avulso</SelectItem>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="CARTAO_DEBITO">Cartão Débito</SelectItem>
                      <SelectItem value="CARTAO_CREDITO">Cartão Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-semibold">Adicionar Produtos</h4>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Select value={novoProduto.produto_id} onValueChange={(v) => setNovoProduto((p) => ({ ...p, produto_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {produtos.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome} - R$ {Number(p.preco_venda).toFixed(2)} (Est: {p.estoque_atual})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="number"
                    placeholder="Qtd"
                    value={novoProduto.quantidade}
                    onChange={(e) => setNovoProduto((p) => ({ ...p, quantidade: e.target.value }))}
                    className="w-20"
                  />
                  <Button onClick={handleAddItem} disabled={!novoProduto.produto_id}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {itensVenda.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-center">Qtd</TableHead>
                        <TableHead className="text-right">Unitário</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itensVenda.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.nome}</TableCell>
                          <TableCell className="text-center">{item.quantidade}</TableCell>
                          <TableCell className="text-right">R$ {item.preco_unitario.toFixed(2)}</TableCell>
                          <TableCell className="text-right">R$ {item.subtotal.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <Label>Desconto (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.desconto}
                    onChange={(e) => setFormData((p) => ({ ...p, desconto: e.target.value }))}
                  />
                </div>
                <div className="text-right">
                  <Label>Subtotal</Label>
                  <p className="text-xl font-bold">R$ {valorTotal.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <Label>Total</Label>
                  <p className="text-2xl font-bold text-success">R$ {valorFinal.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Finalizar Venda</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </ERPLayout>
  );
};

export default VendasPage;
