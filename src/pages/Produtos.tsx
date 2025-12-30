import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ERPLayout } from '@/components/erp/ERPLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Loader2, Plus, Search, Edit, Trash2, Package, AlertTriangle, ExternalLink } from 'lucide-react';

interface Produto {
  id: string;
  codigo: string | null;
  nome: string;
  descricao: string | null;
  preco_custo: number;
  preco_venda: number;
  estoque_atual: number;
  estoque_minimo: number;
  unidade: string;
  ncm: string | null;
  cest: string | null;
  cfop_padrao: string | null;
  unidade_comercial: string | null;
  origem_mercadoria: number | null;
}

const ProdutosPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    descricao: '',
    preco_custo: '',
    preco_venda: '',
    estoque_atual: '',
    estoque_minimo: '',
    unidade: 'UN',
    ncm: '',
    cest: '',
    cfop_padrao: '5102',
    unidade_comercial: 'UN',
    origem_mercadoria: '0',
  });

  useEffect(() => {
    if (user) loadProdutos();
  }, [user]);

  const loadProdutos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('user_id', user?.id)
        .order('nome');

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error('Error loading produtos:', error);
      toast({ title: 'Erro', description: 'Não foi possível carregar os produtos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const produtoData = {
        codigo: formData.codigo || null,
        nome: formData.nome,
        descricao: formData.descricao || null,
        preco_custo: parseFloat(formData.preco_custo) || 0,
        preco_venda: parseFloat(formData.preco_venda) || 0,
        estoque_atual: parseInt(formData.estoque_atual) || 0,
        estoque_minimo: parseInt(formData.estoque_minimo) || 0,
        unidade: formData.unidade,
        ncm: formData.ncm || null,
        cest: formData.cest || null,
        cfop_padrao: formData.cfop_padrao || '5102',
        unidade_comercial: formData.unidade_comercial || 'UN',
        origem_mercadoria: parseInt(formData.origem_mercadoria) || 0,
      };

      if (editingProduto) {
        const { error } = await supabase.from('produtos').update(produtoData).eq('id', editingProduto.id);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Produto atualizado!' });
      } else {
        const { error } = await supabase.from('produtos').insert({ ...produtoData, user_id: user?.id });
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Produto cadastrado!' });
      }
      setShowDialog(false);
      resetForm();
      loadProdutos();
    } catch (error) {
      console.error('Error saving produto:', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar o produto', variant: 'destructive' });
    }
  };

  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto);
    setFormData({
      codigo: produto.codigo || '',
      nome: produto.nome,
      descricao: produto.descricao || '',
      preco_custo: produto.preco_custo.toString(),
      preco_venda: produto.preco_venda.toString(),
      estoque_atual: produto.estoque_atual.toString(),
      estoque_minimo: produto.estoque_minimo.toString(),
      unidade: produto.unidade,
      ncm: produto.ncm || '',
      cest: produto.cest || '',
      cfop_padrao: produto.cfop_padrao || '5102',
      unidade_comercial: produto.unidade_comercial || 'UN',
      origem_mercadoria: (produto.origem_mercadoria ?? 0).toString(),
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Produto removido!' });
      loadProdutos();
    } catch (error) {
      console.error('Error deleting produto:', error);
      toast({ title: 'Erro', description: 'Não foi possível remover o produto', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setEditingProduto(null);
    setFormData({ codigo: '', nome: '', descricao: '', preco_custo: '', preco_venda: '', estoque_atual: '', estoque_minimo: '', unidade: 'UN', ncm: '', cest: '', cfop_padrao: '5102', unidade_comercial: 'UN', origem_mercadoria: '0' });
  };

  const filteredProdutos = produtos.filter((p) =>
    p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.codigo?.includes(searchQuery)
  );

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
            <Package className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Produtos</h1>
              <p className="text-muted-foreground">{produtos.length} produtos cadastrados</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button onClick={() => { resetForm(); setShowDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </div>

        <Card className="glass-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/20">
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Venda</TableHead>
                <TableHead className="text-center">Estoque</TableHead>
                <TableHead>Unidade</TableHead>
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
              ) : filteredProdutos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredProdutos.map((produto) => (
                  <TableRow key={produto.id} className="hover:bg-muted/50">
                    <TableCell>{produto.codigo || '-'}</TableCell>
                    <TableCell className="font-medium">{produto.nome}</TableCell>
                    <TableCell className="text-right">R$ {Number(produto.preco_custo).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium text-success">
                      R$ {Number(produto.preco_venda).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {produto.estoque_atual <= produto.estoque_minimo && (
                          <AlertTriangle className="w-4 h-4 text-warning" />
                        )}
                        <Badge variant={produto.estoque_atual <= produto.estoque_minimo ? 'destructive' : 'default'}>
                          {produto.estoque_atual}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{produto.unidade}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(produto)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(produto.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduto ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
              </TabsList>
              <TabsContent value="geral" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Código</Label>
                    <Input value={formData.codigo} onChange={(e) => setFormData((p) => ({ ...p, codigo: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Unidade</Label>
                    <Input value={formData.unidade} onChange={(e) => setFormData((p) => ({ ...p, unidade: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <Label>Nome *</Label>
                    <Input value={formData.nome} onChange={(e) => setFormData((p) => ({ ...p, nome: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <Label>Descrição</Label>
                    <Input value={formData.descricao} onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Preço de Custo (R$)</Label>
                    <Input type="number" step="0.01" value={formData.preco_custo} onChange={(e) => setFormData((p) => ({ ...p, preco_custo: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Preço de Venda (R$)</Label>
                    <Input type="number" step="0.01" value={formData.preco_venda} onChange={(e) => setFormData((p) => ({ ...p, preco_venda: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Estoque Atual</Label>
                    <Input type="number" value={formData.estoque_atual} onChange={(e) => setFormData((p) => ({ ...p, estoque_atual: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Estoque Mínimo</Label>
                    <Input type="number" value={formData.estoque_minimo} onChange={(e) => setFormData((p) => ({ ...p, estoque_minimo: e.target.value }))} />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="fiscal" className="space-y-4 mt-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
                  <p className="text-sm text-amber-500">Preencha os dados fiscais para emitir NF-e/NFC-e</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      NCM
                      <a href="https://www.ibpt.com.br/tabelas/ncm" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-xs">
                        Consultar <ExternalLink className="w-3 h-3" />
                      </a>
                    </Label>
                    <Input placeholder="12345678" maxLength={8} value={formData.ncm} onChange={(e) => setFormData((p) => ({ ...p, ncm: e.target.value.replace(/\D/g, '') }))} />
                  </div>
                  <div>
                    <Label>CEST</Label>
                    <Input placeholder="1234567" maxLength={7} value={formData.cest} onChange={(e) => setFormData((p) => ({ ...p, cest: e.target.value.replace(/\D/g, '') }))} />
                  </div>
                  <div>
                    <Label>CFOP Padrão</Label>
                    <Select value={formData.cfop_padrao} onValueChange={(v) => setFormData((p) => ({ ...p, cfop_padrao: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5102">5102 - Venda Mercadoria</SelectItem>
                        <SelectItem value="5405">5405 - Venda ST</SelectItem>
                        <SelectItem value="5949">5949 - Outras Saídas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Unidade Comercial</Label>
                    <Select value={formData.unidade_comercial} onValueChange={(v) => setFormData((p) => ({ ...p, unidade_comercial: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UN">UN - Unidade</SelectItem>
                        <SelectItem value="KG">KG - Quilograma</SelectItem>
                        <SelectItem value="CX">CX - Caixa</SelectItem>
                        <SelectItem value="PC">PC - Peça</SelectItem>
                        <SelectItem value="LT">LT - Litro</SelectItem>
                        <SelectItem value="MT">MT - Metro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Origem da Mercadoria</Label>
                    <Select value={formData.origem_mercadoria} onValueChange={(v) => setFormData((p) => ({ ...p, origem_mercadoria: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0 - Nacional</SelectItem>
                        <SelectItem value="1">1 - Estrangeira (Import. Direta)</SelectItem>
                        <SelectItem value="2">2 - Estrangeira (Adq. Mercado Interno)</SelectItem>
                        <SelectItem value="3">3 - Nacional (Conteúdo Import. &gt; 40%)</SelectItem>
                        <SelectItem value="5">5 - Nacional (Conteúdo Import. &lt;= 40%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
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

export default ProdutosPage;
