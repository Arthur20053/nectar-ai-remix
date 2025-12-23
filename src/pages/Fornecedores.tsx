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
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Loader2, Plus, Search, Edit, Trash2, Truck } from 'lucide-react';

interface Fornecedor {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
}

const FornecedoresPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [formData, setFormData] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
  });

  useEffect(() => {
    if (user) loadFornecedores();
  }, [user]);

  const loadFornecedores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('user_id', user?.id)
        .order('razao_social');

      if (error) throw error;
      setFornecedores(data || []);
    } catch (error) {
      console.error('Error loading fornecedores:', error);
      toast({ title: 'Erro', description: 'Não foi possível carregar os fornecedores', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingFornecedor) {
        const { error } = await supabase.from('fornecedores').update({ ...formData }).eq('id', editingFornecedor.id);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Fornecedor atualizado!' });
      } else {
        const { error } = await supabase.from('fornecedores').insert({ ...formData, user_id: user?.id });
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Fornecedor cadastrado!' });
      }
      setShowDialog(false);
      resetForm();
      loadFornecedores();
    } catch (error) {
      console.error('Error saving fornecedor:', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar o fornecedor', variant: 'destructive' });
    }
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
    setFormData({
      razao_social: fornecedor.razao_social,
      nome_fantasia: fornecedor.nome_fantasia || '',
      cnpj: fornecedor.cnpj || '',
      telefone: fornecedor.telefone || '',
      email: fornecedor.email || '',
      endereco: fornecedor.endereco || '',
      cidade: fornecedor.cidade || '',
      estado: fornecedor.estado || '',
      cep: fornecedor.cep || '',
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('fornecedores').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Fornecedor removido!' });
      loadFornecedores();
    } catch (error) {
      console.error('Error deleting fornecedor:', error);
      toast({ title: 'Erro', description: 'Não foi possível remover o fornecedor', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setEditingFornecedor(null);
    setFormData({ razao_social: '', nome_fantasia: '', cnpj: '', telefone: '', email: '', endereco: '', cidade: '', estado: '', cep: '' });
  };

  const filteredFornecedores = fornecedores.filter((f) =>
    f.razao_social.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.nome_fantasia?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.cnpj?.includes(searchQuery)
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
            <Truck className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Fornecedores</h1>
              <p className="text-muted-foreground">{fornecedores.length} fornecedores cadastrados</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar fornecedor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button onClick={() => { resetForm(); setShowDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Fornecedor
            </Button>
          </div>
        </div>

        <Card className="glass-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/20">
                <TableHead>Razão Social</TableHead>
                <TableHead>Nome Fantasia</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredFornecedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum fornecedor encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredFornecedores.map((fornecedor) => (
                  <TableRow key={fornecedor.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{fornecedor.razao_social}</TableCell>
                    <TableCell>{fornecedor.nome_fantasia || '-'}</TableCell>
                    <TableCell>{fornecedor.cnpj || '-'}</TableCell>
                    <TableCell>{fornecedor.telefone || '-'}</TableCell>
                    <TableCell>{fornecedor.cidade ? `${fornecedor.cidade}/${fornecedor.estado}` : '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(fornecedor)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(fornecedor.id)}>
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Razão Social *</Label>
                <Input value={formData.razao_social} onChange={(e) => setFormData((p) => ({ ...p, razao_social: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Nome Fantasia</Label>
                <Input value={formData.nome_fantasia} onChange={(e) => setFormData((p) => ({ ...p, nome_fantasia: e.target.value }))} />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input value={formData.cnpj} onChange={(e) => setFormData((p) => ({ ...p, cnpj: e.target.value }))} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={formData.telefone} onChange={(e) => setFormData((p) => ({ ...p, telefone: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Endereço</Label>
                <Input value={formData.endereco} onChange={(e) => setFormData((p) => ({ ...p, endereco: e.target.value }))} />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input value={formData.cidade} onChange={(e) => setFormData((p) => ({ ...p, cidade: e.target.value }))} />
              </div>
              <div>
                <Label>Estado</Label>
                <Input value={formData.estado} onChange={(e) => setFormData((p) => ({ ...p, estado: e.target.value }))} maxLength={2} />
              </div>
              <div>
                <Label>CEP</Label>
                <Input value={formData.cep} onChange={(e) => setFormData((p) => ({ ...p, cep: e.target.value }))} />
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

export default FornecedoresPage;
