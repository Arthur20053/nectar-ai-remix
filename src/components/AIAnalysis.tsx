import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';

interface AIAnalysisProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIAnalysis({ open, onOpenChange }: AIAnalysisProps) {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateAnalysis = async () => {
    setLoading(true);
    setAnalysis('');

    try {
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select(`
          amount,
          type,
          date,
          description,
          categories (name)
        `)
        .eq('user_id', user?.id)
        .order('date', { ascending: false })
        .limit(50);

      if (transError) throw transError;

      const { data, error } = await supabase.functions.invoke('analyze-finances', {
        body: { transactions },
      });

      if (error) throw error;

      setAnalysis(data.analysis);
    } catch (error: any) {
      console.error('Erro na análise:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível gerar a análise',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Análise Financeira com IA
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!analysis && !loading && (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                Gere uma análise personalizada das suas finanças usando inteligência artificial
              </p>
              <Button onClick={generateAnalysis} size="lg">
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Análise
              </Button>
            </Card>
          )}

          {loading && (
            <Card className="p-8 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Analisando suas finanças...
              </p>
            </Card>
          )}

          {analysis && (
            <Card className="p-6">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-foreground">{analysis}</div>
              </div>
              <Button
                onClick={generateAnalysis}
                variant="outline"
                className="mt-4"
                disabled={loading}
              >
                Gerar Nova Análise
              </Button>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
