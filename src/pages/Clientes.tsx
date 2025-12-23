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
import { Loader2, Plus, Search, Edit, Trash2, Users } from 'lucide-react';

interface Cliente {
  id: string;
  nome: string;
  cpf_cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
}

const ClientesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cpf_cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
  });

  useEffect(() => {
    if (user) loadClientes();
  }, [user]);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', user?.id)
        .order('nome');

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error loading clientes:', error);
      toast({ title: 'Erro', description: 'Não foi possível carregar os clientes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingCliente) {
        const { error } = await supabase
          .from('clientes')
          .update({ ...formData })
          .eq('id', editingCliente.id);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Cliente atualizado!' });
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert({ ...formData, user_id: user?.id });
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Cliente cadastrado!' });
      }
      setShowDialog(false);
      resetForm();
      loadClientes();
    } catch (error) {
      console.error('Error saving cliente:', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar o cliente', variant: 'destructive' });
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome,
      cpf_cnpj: cliente.cpf_cnpj || '',
      telefone: cliente.telefone || '',
      email: cliente.email || '',
      endereco: cliente.endereco || '',
      cidade: cliente.cidade || '',
      estado: cliente.estado || '',
      cep: cliente.cep || '',
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Cliente removido!' });
      loadClientes();
    } catch (error) {
      console.error('Error deleting cliente:', error);
      toast({ title: 'Erro', description: 'Não foi possível remover o cliente', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setEditingCliente(null);
    setFormData({ nome: '', cpf_cnpj: '', telefone: '', email: '', endereco: '', cidade: '', estado: '', cep: '' });
  };

  const filteredClientes = clientes.filter((c) =>
    c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.cpf_cnpj?.includes(searchQuery)
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
            <Users className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Clientes</h1>
              <p className="text-muted-foreground">{clientes.length} clientes cadastrados</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button onClick={() => { resetForm(); setShowDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </div>

        <Card className="glass-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/20">
                <TableHead>Nome</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
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
              ) : filteredClientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredClientes.map((cliente) => (
                  <TableRow key={cliente.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{cliente.nome}</TableCell>
                    <TableCell>{cliente.cpf_cnpj || '-'}</TableCell>
                    <TableCell>{cliente.telefone || '-'}</TableCell>
                    <TableCell>{cliente.email || '-'}</TableCell>
                    <TableCell>{cliente.cidade ? `${cliente.cidade}/${cliente.estado}` : '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(cliente)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cliente.id)}>
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
              <DialogTitle>{editingCliente ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome *</Label>
                <Input value={formData.nome} onChange={(e) => setFormData((p) => ({ ...p, nome: e.target.value }))} />
              </div>
              <div>
                <Label>CPF/CNPJ</Label>
                <Input value={formData.cpf_cnpj} onChange={(e) => setFormData((p) => ({ ...p, cpf_cnpj: e.target.value }))} />
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

export default ClientesPage;
