import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'receita' | 'despesa';
}

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

export function ReceiptModal({ open, onOpenChange, transaction }: ReceiptModalProps) {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] print:shadow-none">
        <DialogHeader className="print:hidden">
          <DialogTitle>Recibo de Pagamento</DialogTitle>
        </DialogHeader>
        
        <div className="receipt-content bg-white p-8 rounded-lg border-2 border-border">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">RECIBO</h1>
            <p className="text-muted-foreground">Comprovante de Pagamento</p>
          </div>

          <div className="space-y-6">
            <div className="border-b pb-4">
              <p className="text-sm text-muted-foreground mb-1">Empresa</p>
              <p className="font-semibold text-lg">FinanceFlow</p>
            </div>

            <div className="border-b pb-4">
              <p className="text-sm text-muted-foreground mb-1">Cliente / Descrição</p>
              <p className="font-semibold text-lg">{transaction.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b pb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Data</p>
                <p className="font-semibold">
                  {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">ID da Transação</p>
                <p className="font-mono text-sm">{transaction.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>

            <div className="bg-success/10 p-6 rounded-lg border-2 border-success">
              <p className="text-sm text-muted-foreground mb-2">Valor Total</p>
              <p className="text-4xl font-bold text-success">
                R$ {Number(transaction.amount).toFixed(2)}
              </p>
            </div>

            <div className="pt-4 text-center text-sm text-muted-foreground">
              <p>Este é um documento válido de comprovação de pagamento.</p>
              <p className="mt-2">Emitido em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4 print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Fechar
          </Button>
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}