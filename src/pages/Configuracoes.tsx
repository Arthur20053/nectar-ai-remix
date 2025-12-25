import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ERPLayout } from '@/components/erp/ERPLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Settings, User, Building, Bell, Shield, Palette, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ConfiguracoesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [empresa, setEmpresa] = useState({
    nome: 'Minha Empresa',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
  });

  const [notificacoes, setNotificacoes] = useState({
    emailVendas: true,
    emailContas: true,
    alertaEstoque: true,
    alertaVencimento: true,
  });

  const handleSaveEmpresa = async () => {
    setSaving(true);
    // Simulated save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({ title: 'Sucesso', description: 'Dados da empresa salvos!' });
    setSaving(false);
  };

  const handleSaveNotificacoes = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({ title: 'Sucesso', description: 'Configurações de notificação salvas!' });
    setSaving(false);
  };

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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
          </div>
        </div>

        <Tabs defaultValue="empresa" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="empresa" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="usuario" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Usuário
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Alertas
            </TabsTrigger>
            <TabsTrigger value="sistema" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Sistema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="empresa">
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-6">Dados da Empresa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Nome da Empresa</Label>
                  <Input
                    value={empresa.nome}
                    onChange={(e) => setEmpresa((p) => ({ ...p, nome: e.target.value }))}
                    placeholder="Nome fantasia"
                  />
                </div>
                <div>
                  <Label>CNPJ</Label>
                  <Input
                    value={empresa.cnpj}
                    onChange={(e) => setEmpresa((p) => ({ ...p, cnpj: e.target.value }))}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={empresa.telefone}
                    onChange={(e) => setEmpresa((p) => ({ ...p, telefone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={empresa.email}
                    onChange={(e) => setEmpresa((p) => ({ ...p, email: e.target.value }))}
                    placeholder="empresa@email.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={empresa.endereco}
                    onChange={(e) => setEmpresa((p) => ({ ...p, endereco: e.target.value }))}
                    placeholder="Rua, número, bairro, cidade - UF"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSaveEmpresa} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Dados
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="usuario">
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-6">Informações do Usuário</h3>
              <div className="space-y-4">
                <div>
                  <Label>E-mail</Label>
                  <Input value={user?.email || ''} disabled />
                  <p className="text-xs text-muted-foreground mt-1">O e-mail não pode ser alterado</p>
                </div>
                <div>
                  <Label>ID do Usuário</Label>
                  <Input value={user?.id || ''} disabled />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notificacoes">
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-6">Configurações de Alertas</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificações de Vendas</p>
                    <p className="text-sm text-muted-foreground">Receber e-mail a cada venda realizada</p>
                  </div>
                  <Switch
                    checked={notificacoes.emailVendas}
                    onCheckedChange={(v) => setNotificacoes((p) => ({ ...p, emailVendas: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alertas de Contas</p>
                    <p className="text-sm text-muted-foreground">Receber lembretes de contas a vencer</p>
                  </div>
                  <Switch
                    checked={notificacoes.emailContas}
                    onCheckedChange={(v) => setNotificacoes((p) => ({ ...p, emailContas: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alerta de Estoque Baixo</p>
                    <p className="text-sm text-muted-foreground">Notificar quando estoque estiver abaixo do mínimo</p>
                  </div>
                  <Switch
                    checked={notificacoes.alertaEstoque}
                    onCheckedChange={(v) => setNotificacoes((p) => ({ ...p, alertaEstoque: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alerta de Vencimento</p>
                    <p className="text-sm text-muted-foreground">Notificar contas próximas do vencimento</p>
                  </div>
                  <Switch
                    checked={notificacoes.alertaVencimento}
                    onCheckedChange={(v) => setNotificacoes((p) => ({ ...p, alertaVencimento: v }))}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSaveNotificacoes} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Configurações
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="sistema">
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-6">Configurações do Sistema</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-lg border border-border">
                  <Palette className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium">Tema</p>
                    <p className="text-sm text-muted-foreground">O tema escuro está ativado por padrão</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-border">
                  <p className="font-medium mb-2">Versão do Sistema</p>
                  <p className="text-sm text-muted-foreground">Supreme ERP v1.0.0</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </ERPLayout>
  );
};

export default ConfiguracoesPage;
