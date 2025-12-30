import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ERPLayout } from '@/components/erp/ERPLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { 
  Loader2, FileText, Search, Download, Eye, RefreshCw, 
  CheckCircle2, XCircle, Clock, AlertCircle, Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Invoice {
  id: string;
  tipo: string;
  serie: number;
  numero: number;
  status: 'pendente' | 'processando' | 'autorizada' | 'rejeitada' | 'cancelada';
  chave_acesso: string | null;
  valor_total: number;
  cliente_nome: string | null;
  cliente_cpf_cnpj: string | null;
  mensagem_sefaz: string | null;
  xml_url: string | null;
  pdf_url: string | null;
  ambiente: 'homologacao' | 'producao';
  created_at: string;
}

const statusConfig = {
  pendente: { label: 'Pendente', icon: Clock, color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' },
  processando: { label: 'Processando', icon: RefreshCw, color: 'bg-blue-500/20 text-blue-500 border-blue-500/30' },
  autorizada: { label: 'Autorizada', icon: CheckCircle2, color: 'bg-green-500/20 text-green-500 border-green-500/30' },
  rejeitada: { label: 'Rejeitada', icon: XCircle, color: 'bg-red-500/20 text-red-500 border-red-500/30' },
  cancelada: { label: 'Cancelada', icon: AlertCircle, color: 'bg-muted text-muted-foreground border-muted' },
};

const HistoricoNotasPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');

  useEffect(() => {
    if (user) loadInvoices();
  }, [user]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices((data || []) as Invoice[]);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast({ title: 'Erro', description: 'Não foi possível carregar as notas', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string | null, type: 'xml' | 'pdf') => {
    if (!url) {
      toast({ title: 'Erro', description: `${type.toUpperCase()} não disponível`, variant: 'destructive' });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('invoices')
        .download(url);

      if (error) throw error;

      const blob = new Blob([data], { type: type === 'xml' ? 'application/xml' : 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = url.split('/').pop() || `nota.${type}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({ title: 'Erro', description: 'Não foi possível baixar o arquivo', variant: 'destructive' });
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = 
      invoice.numero.toString().includes(searchQuery) ||
      invoice.chave_acesso?.includes(searchQuery) ||
      invoice.cliente_nome?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesTipo = tipoFilter === 'all' || invoice.tipo === tipoFilter;

    return matchesSearch && matchesStatus && matchesTipo;
  });

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Histórico de Notas</h1>
              <p className="text-muted-foreground">
                {invoices.length} notas emitidas
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={loadInvoices}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = invoices.filter(i => i.status === status).length;
            const StatusIcon = config.icon;
            return (
              <Card 
                key={status}
                className={`p-4 cursor-pointer transition-all hover:scale-[1.02] ${
                  statusFilter === status ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground">{config.label}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, chave ou cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="nfe">NF-e</SelectItem>
                  <SelectItem value="nfce">NFC-e</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/20">
                <TableHead>Tipo</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Status</TableHead>
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
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {invoices.length === 0 
                      ? 'Nenhuma nota fiscal emitida ainda'
                      : 'Nenhuma nota encontrada com os filtros aplicados'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => {
                  const statusInfo = statusConfig[invoice.status];
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <TableRow key={invoice.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Badge variant="outline" className="uppercase">
                          {invoice.tipo}
                        </Badge>
                        {invoice.ambiente === 'homologacao' && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            Teste
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono">
                        {invoice.serie.toString().padStart(3, '0')}/{invoice.numero.toString().padStart(9, '0')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {invoice.cliente_nome || (
                          <span className="text-muted-foreground">Consumidor Final</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {Number(invoice.valor_total).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        {invoice.status === 'rejeitada' && invoice.mensagem_sefaz && (
                          <p className="text-xs text-red-500 mt-1 max-w-xs truncate">
                            {invoice.mensagem_sefaz}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {invoice.chave_acesso && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Ver chave de acesso"
                              onClick={() => {
                                navigator.clipboard.writeText(invoice.chave_acesso || '');
                                toast({ title: 'Copiado!', description: 'Chave de acesso copiada' });
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Baixar XML"
                            onClick={() => handleDownload(invoice.xml_url, 'xml')}
                            disabled={!invoice.xml_url}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Baixar PDF (DANFE)"
                            onClick={() => handleDownload(invoice.pdf_url, 'pdf')}
                            disabled={!invoice.pdf_url}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>
    </ERPLayout>
  );
};

export default HistoricoNotasPage;
