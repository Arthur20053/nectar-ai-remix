import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Package, Calendar, DollarSign, CheckCircle, X } from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'estoque_baixo' | 'estoque_zerado' | 'conta_vencida' | 'conta_vencendo';
  title: string;
  description: string;
  severity: 'warning' | 'error' | 'info';
  date: Date;
  read: boolean;
  link?: string;
}

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNotificationCountChange?: (count: number) => void;
}

export function NotificationsPanel({ open, onOpenChange, onNotificationCountChange }: NotificationsPanelProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && open) {
      loadNotifications();
    }
  }, [user, open]);

  useEffect(() => {
    if (user) {
      // Load notifications on mount to get count
      loadNotifications();

      // Set up interval to check for new notifications every 5 minutes
      const interval = setInterval(loadNotifications, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const notifs: Notification[] = [];
      const today = new Date();
      const nextWeek = addDays(today, 7);

      // Check products with low or zero stock
      const { data: produtos, error: produtosError } = await supabase
        .from('produtos')
        .select('id, nome, codigo, estoque_atual, estoque_minimo')
        .eq('user_id', user.id);

      if (!produtosError && produtos) {
        produtos.forEach((produto) => {
          const estoqueAtual = produto.estoque_atual || 0;
          const estoqueMinimo = produto.estoque_minimo || 0;

          if (estoqueAtual === 0) {
            notifs.push({
              id: `estoque-zerado-${produto.id}`,
              type: 'estoque_zerado',
              title: 'Estoque Zerado',
              description: `${produto.nome} (${produto.codigo || 'Sem código'}) está com estoque zerado.`,
              severity: 'error',
              date: new Date(),
              read: false,
              link: '/produtos',
            });
          } else if (estoqueMinimo > 0 && estoqueAtual <= estoqueMinimo) {
            notifs.push({
              id: `estoque-baixo-${produto.id}`,
              type: 'estoque_baixo',
              title: 'Estoque Baixo',
              description: `${produto.nome} está com ${estoqueAtual} unidades (mínimo: ${estoqueMinimo}).`,
              severity: 'warning',
              date: new Date(),
              read: false,
              link: '/produtos',
            });
          }
        });
      }

      // Check accounts payable (contas a pagar) with due dates
      const { data: contasPagar, error: contasPagarError } = await supabase
        .from('contas_pagar')
        .select('id, descricao, valor, data_vencimento, status')
        .eq('user_id', user.id)
        .eq('status', 'PENDENTE');

      if (!contasPagarError && contasPagar) {
        contasPagar.forEach((conta) => {
          const vencimento = new Date(conta.data_vencimento);

          if (isBefore(vencimento, today)) {
            notifs.push({
              id: `conta-vencida-${conta.id}`,
              type: 'conta_vencida',
              title: 'Conta Vencida',
              description: `${conta.descricao} - R$ ${Number(conta.valor).toFixed(2)} venceu em ${format(vencimento, 'dd/MM/yyyy', { locale: ptBR })}.`,
              severity: 'error',
              date: vencimento,
              read: false,
              link: '/contas-pagar',
            });
          } else if (isBefore(vencimento, nextWeek)) {
            notifs.push({
              id: `conta-vencendo-${conta.id}`,
              type: 'conta_vencendo',
              title: 'Conta Próxima do Vencimento',
              description: `${conta.descricao} - R$ ${Number(conta.valor).toFixed(2)} vence em ${format(vencimento, 'dd/MM/yyyy', { locale: ptBR })}.`,
              severity: 'warning',
              date: vencimento,
              read: false,
              link: '/contas-pagar',
            });
          }
        });
      }

      // Check accounts receivable (contas a receber) with due dates
      const { data: contasReceber, error: contasReceberError } = await supabase
        .from('contas_receber')
        .select('id, descricao, valor, data_vencimento, status')
        .eq('user_id', user.id)
        .eq('status', 'PENDENTE');

      if (!contasReceberError && contasReceber) {
        contasReceber.forEach((conta) => {
          const vencimento = new Date(conta.data_vencimento);

          if (isBefore(vencimento, today)) {
            notifs.push({
              id: `receber-vencida-${conta.id}`,
              type: 'conta_vencida',
              title: 'Conta a Receber Vencida',
              description: `${conta.descricao} - R$ ${Number(conta.valor).toFixed(2)} venceu em ${format(vencimento, 'dd/MM/yyyy', { locale: ptBR })}.`,
              severity: 'error',
              date: vencimento,
              read: false,
              link: '/contas-receber',
            });
          } else if (isBefore(vencimento, nextWeek)) {
            notifs.push({
              id: `receber-vencendo-${conta.id}`,
              type: 'conta_vencendo',
              title: 'Conta a Receber Vencendo',
              description: `${conta.descricao} - R$ ${Number(conta.valor).toFixed(2)} vence em ${format(vencimento, 'dd/MM/yyyy', { locale: ptBR })}.`,
              severity: 'warning',
              date: vencimento,
              read: false,
              link: '/contas-receber',
            });
          }
        });
      }

      // Sort by severity (error first) then by date
      notifs.sort((a, b) => {
        if (a.severity === 'error' && b.severity !== 'error') return -1;
        if (a.severity !== 'error' && b.severity === 'error') return 1;
        return b.date.getTime() - a.date.getTime();
      });

      setNotifications(notifs);
      onNotificationCountChange?.(notifs.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'estoque_baixo':
      case 'estoque_zerado':
        return <Package className="w-5 h-5" />;
      case 'conta_vencida':
      case 'conta_vencendo':
        return <DollarSign className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity: Notification['severity']) => {
    switch (severity) {
      case 'error':
        return 'bg-destructive/10 border-destructive/30 text-destructive';
      case 'warning':
        return 'bg-warning/10 border-warning/30 text-warning';
      default:
        return 'bg-primary/10 border-primary/30 text-primary';
    }
  };

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    onNotificationCountChange?.(notifications.length - 1);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Notificações
            {notifications.length > 0 && (
              <Badge variant="destructive">{notifications.length}</Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Alertas de estoque, vencimentos e lembretes importantes.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="w-12 h-12 text-success mb-4" />
              <h3 className="font-semibold text-lg">Tudo em dia!</h3>
              <p className="text-muted-foreground text-sm">
                Não há alertas ou notificações pendentes.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-180px)]">
              <div className="space-y-3 pr-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${getSeverityColor(notification.severity)} relative`}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => handleDismiss(notification.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex items-start gap-3 pr-6">
                      <div className={`p-2 rounded-full ${
                        notification.severity === 'error' 
                          ? 'bg-destructive/20' 
                          : 'bg-warning/20'
                      }`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.description}
                        </p>
                        {notification.link && (
                          <Button
                            variant="link"
                            className="p-0 h-auto mt-2 text-sm"
                            onClick={() => {
                              window.location.href = notification.link!;
                              onOpenChange(false);
                            }}
                          >
                            Ver detalhes →
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {notifications.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setNotifications([]);
                  onNotificationCountChange?.(0);
                }}
              >
                Limpar todas as notificações
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
