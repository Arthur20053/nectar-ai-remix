import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ERPLayout } from '@/components/erp/ERPLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, Building2, Upload, Shield, Check, ChevronRight, ChevronLeft, 
  HelpCircle, FileKey, AlertCircle, CheckCircle2, ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FiscalConfig {
  id?: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_estadual: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  telefone: string;
  certificado_url: string | null;
  certificado_senha: string;
  certificado_validade: string | null;
  ambiente: 'homologacao' | 'producao';
  serie_nfe: number;
  proximo_numero_nfe: number;
  serie_nfce: number;
  proximo_numero_nfce: number;
  csc_id: string;
  csc_token: string;
  regime_tributario: 'simples_nacional' | 'lucro_presumido' | 'lucro_real';
  configuracao_completa: boolean;
}

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 
  'SP', 'SE', 'TO'
];

const ConfiguracaoFiscalPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadingCert, setUploadingCert] = useState(false);
  
  const [config, setConfig] = useState<FiscalConfig>({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    inscricao_estadual: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
    telefone: '',
    certificado_url: null,
    certificado_senha: '',
    certificado_validade: null,
    ambiente: 'homologacao',
    serie_nfe: 1,
    proximo_numero_nfe: 1,
    serie_nfce: 1,
    proximo_numero_nfce: 1,
    csc_id: '',
    csc_token: '',
    regime_tributario: 'simples_nacional',
    configuracao_completa: false,
  });

  useEffect(() => {
    if (user) loadConfig();
  }, [user]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fiscal_config')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setConfig({
          id: data.id,
          razao_social: data.razao_social || '',
          nome_fantasia: data.nome_fantasia || '',
          cnpj: data.cnpj || '',
          inscricao_estadual: data.inscricao_estadual || '',
          endereco: data.endereco || '',
          numero: data.numero || '',
          bairro: data.bairro || '',
          cidade: data.cidade || '',
          uf: data.uf || '',
          cep: data.cep || '',
          telefone: data.telefone || '',
          certificado_url: data.certificado_url,
          certificado_senha: data.certificado_senha || '',
          certificado_validade: data.certificado_validade,
          ambiente: data.ambiente as 'homologacao' | 'producao',
          serie_nfe: data.serie_nfe,
          proximo_numero_nfe: data.proximo_numero_nfe,
          serie_nfce: data.serie_nfce,
          proximo_numero_nfce: data.proximo_numero_nfce,
          csc_id: data.csc_id || '',
          csc_token: data.csc_token || '',
          regime_tributario: data.regime_tributario as 'simples_nacional' | 'lucro_presumido' | 'lucro_real',
          configuracao_completa: data.configuracao_completa,
        });
      }
    } catch (error) {
      console.error('Error loading fiscal config:', error);
      toast({ title: 'Erro', description: 'Não foi possível carregar as configurações', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCertificado = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pfx')) {
      toast({ title: 'Erro', description: 'O arquivo deve ser um certificado .pfx', variant: 'destructive' });
      return;
    }

    try {
      setUploadingCert(true);
      const filePath = `${user?.id}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setConfig(prev => ({ ...prev, certificado_url: filePath }));
      toast({ title: 'Sucesso', description: 'Certificado enviado com sucesso!' });
    } catch (error) {
      console.error('Error uploading certificate:', error);
      toast({ title: 'Erro', description: 'Não foi possível enviar o certificado', variant: 'destructive' });
    } finally {
      setUploadingCert(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const configData = {
        user_id: user?.id,
        razao_social: config.razao_social,
        nome_fantasia: config.nome_fantasia,
        cnpj: config.cnpj.replace(/\D/g, ''),
        inscricao_estadual: config.inscricao_estadual,
        endereco: config.endereco,
        numero: config.numero,
        bairro: config.bairro,
        cidade: config.cidade,
        uf: config.uf,
        cep: config.cep.replace(/\D/g, ''),
        telefone: config.telefone,
        certificado_url: config.certificado_url,
        certificado_senha: config.certificado_senha,
        ambiente: config.ambiente,
        serie_nfe: config.serie_nfe,
        proximo_numero_nfe: config.proximo_numero_nfe,
        serie_nfce: config.serie_nfce,
        proximo_numero_nfce: config.proximo_numero_nfce,
        csc_id: config.csc_id,
        csc_token: config.csc_token,
        regime_tributario: config.regime_tributario,
        configuracao_completa: Boolean(currentStep === 3 && config.certificado_url && config.csc_token),
      };

      if (config.id) {
        const { error } = await supabase
          .from('fiscal_config')
          .update(configData)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fiscal_config')
          .insert(configData);
        if (error) throw error;
      }

      toast({ title: 'Sucesso', description: 'Configurações salvas com sucesso!' });
      loadConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar as configurações', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const steps = [
    { number: 1, title: 'Dados da Empresa', icon: Building2 },
    { number: 2, title: 'Certificado Digital', icon: FileKey },
    { number: 3, title: 'Configuração Técnica', icon: Shield },
  ];

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return config.razao_social && config.cnpj && config.inscricao_estadual && config.uf;
      case 2:
        return config.certificado_url && config.certificado_senha;
      case 3:
        return config.csc_id && config.csc_token;
      default:
        return false;
    }
  };

  if (authLoading || loading) {
    return (
      <ERPLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ERPLayout>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <ERPLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Configuração Fiscal</h1>
            <p className="text-muted-foreground">Configure sua empresa para emitir NF-e e NFC-e</p>
          </div>
          {config.configuracao_completa && (
            <Badge className="ml-auto bg-green-500/20 text-green-500 border-green-500/30">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Configurado
            </Badge>
          )}
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between px-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.number)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  currentStep === step.number
                    ? 'bg-primary text-primary-foreground'
                    : isStepComplete(step.number)
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {isStepComplete(step.number) ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
                <span className="hidden sm:inline font-medium">{step.title}</span>
                <span className="sm:hidden font-medium">{step.number}</span>
              </button>
              {index < steps.length - 1 && (
                <ChevronRight className="w-5 h-5 mx-2 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 1 && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Dados da Empresa
                  </CardTitle>
                  <CardDescription>
                    Preencha os dados cadastrais da sua empresa. Essas informações aparecerão nas notas fiscais.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label>Razão Social *</Label>
                      <Input
                        placeholder="Empresa Exemplo LTDA"
                        value={config.razao_social}
                        onChange={(e) => setConfig(prev => ({ ...prev, razao_social: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Nome Fantasia</Label>
                      <Input
                        placeholder="Minha Loja"
                        value={config.nome_fantasia}
                        onChange={(e) => setConfig(prev => ({ ...prev, nome_fantasia: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>CNPJ *</Label>
                      <Input
                        placeholder="00.000.000/0001-00"
                        value={formatCNPJ(config.cnpj)}
                        onChange={(e) => setConfig(prev => ({ ...prev, cnpj: e.target.value }))}
                        maxLength={18}
                      />
                    </div>
                    <div>
                      <Label>Inscrição Estadual *</Label>
                      <Input
                        placeholder="123456789"
                        value={config.inscricao_estadual}
                        onChange={(e) => setConfig(prev => ({ ...prev, inscricao_estadual: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Regime Tributário *</Label>
                      <Select
                        value={config.regime_tributario}
                        onValueChange={(value: 'simples_nacional' | 'lucro_presumido' | 'lucro_real') => 
                          setConfig(prev => ({ ...prev, regime_tributario: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                          <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                          <SelectItem value="lucro_real">Lucro Real</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <Input
                        placeholder="(11) 99999-9999"
                        value={config.telefone}
                        onChange={(e) => setConfig(prev => ({ ...prev, telefone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-3">Endereço</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <Label>Logradouro</Label>
                        <Input
                          placeholder="Rua das Flores"
                          value={config.endereco}
                          onChange={(e) => setConfig(prev => ({ ...prev, endereco: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Número</Label>
                        <Input
                          placeholder="123"
                          value={config.numero}
                          onChange={(e) => setConfig(prev => ({ ...prev, numero: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>CEP</Label>
                        <Input
                          placeholder="01234-567"
                          value={formatCEP(config.cep)}
                          onChange={(e) => setConfig(prev => ({ ...prev, cep: e.target.value }))}
                          maxLength={9}
                        />
                      </div>
                      <div>
                        <Label>Bairro</Label>
                        <Input
                          placeholder="Centro"
                          value={config.bairro}
                          onChange={(e) => setConfig(prev => ({ ...prev, bairro: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Cidade</Label>
                        <Input
                          placeholder="São Paulo"
                          value={config.cidade}
                          onChange={(e) => setConfig(prev => ({ ...prev, cidade: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>UF *</Label>
                        <Select
                          value={config.uf}
                          onValueChange={(value) => setConfig(prev => ({ ...prev, uf: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {ESTADOS_BR.map(uf => (
                              <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileKey className="w-5 h-5" />
                    Certificado Digital A1
                  </CardTitle>
                  <CardDescription>
                    O certificado digital é obrigatório para assinar as notas fiscais. 
                    Certifique-se de usar um certificado A1 válido (arquivo .pfx).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                    {config.certificado_url ? (
                      <div className="space-y-3">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                        <p className="font-medium text-green-500">Certificado enviado</p>
                        <p className="text-sm text-muted-foreground">
                          {config.certificado_url.split('/').pop()}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setConfig(prev => ({ ...prev, certificado_url: null }))}
                        >
                          Enviar outro certificado
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                        <div>
                          <p className="font-medium">Arraste o arquivo .pfx ou clique para selecionar</p>
                          <p className="text-sm text-muted-foreground">
                            Apenas arquivos .pfx são aceitos
                          </p>
                        </div>
                        <input
                          type="file"
                          accept=".pfx"
                          className="hidden"
                          id="cert-upload"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadCertificado(file);
                          }}
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => document.getElementById('cert-upload')?.click()}
                          disabled={uploadingCert}
                        >
                          {uploadingCert ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Selecionar arquivo
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Senha do Certificado *</Label>
                    <Input
                      type="password"
                      placeholder="Digite a senha do certificado"
                      value={config.certificado_senha}
                      onChange={(e) => setConfig(prev => ({ ...prev, certificado_senha: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      A senha é fornecida pela Autoridade Certificadora no momento da aquisição do certificado.
                    </p>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-500">Importante</p>
                        <p className="text-sm text-muted-foreground">
                          O certificado e a senha são armazenados de forma segura e criptografada. 
                          Nunca compartilhe seu certificado ou senha com terceiros.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Configuração Técnica
                  </CardTitle>
                  <CardDescription>
                    Configure os parâmetros técnicos para emissão de notas fiscais.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Ambiente</Label>
                      <Select
                        value={config.ambiente}
                        onValueChange={(value: 'homologacao' | 'producao') => 
                          setConfig(prev => ({ ...prev, ambiente: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="homologacao">Homologação (Testes)</SelectItem>
                          <SelectItem value="producao">Produção</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Use Homologação para testes antes de ir para Produção
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      Token CSC (NFC-e)
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-4 h-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>
                              O CSC (Código de Segurança do Contribuinte) é necessário para emitir NFC-e (Cupom Fiscal).
                              Você deve obtê-lo no site da SEFAZ do seu estado.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>ID do CSC *</Label>
                        <Input
                          placeholder="1"
                          value={config.csc_id}
                          onChange={(e) => setConfig(prev => ({ ...prev, csc_id: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Token CSC *</Label>
                        <Input
                          type="password"
                          placeholder="Seu token CSC"
                          value={config.csc_token}
                          onChange={(e) => setConfig(prev => ({ ...prev, csc_token: e.target.value }))}
                        />
                      </div>
                    </div>
                    <a
                      href="https://www.google.com/search?q=como+obter+csc+nfce+sefaz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-2"
                    >
                      Como obter o CSC?
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Séries e Numeração</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label>Série NF-e</Label>
                        <Input
                          type="number"
                          min="1"
                          value={config.serie_nfe}
                          onChange={(e) => setConfig(prev => ({ ...prev, serie_nfe: parseInt(e.target.value) || 1 }))}
                        />
                      </div>
                      <div>
                        <Label>Próximo Nº NF-e</Label>
                        <Input
                          type="number"
                          min="1"
                          value={config.proximo_numero_nfe}
                          onChange={(e) => setConfig(prev => ({ ...prev, proximo_numero_nfe: parseInt(e.target.value) || 1 }))}
                        />
                      </div>
                      <div>
                        <Label>Série NFC-e</Label>
                        <Input
                          type="number"
                          min="1"
                          value={config.serie_nfce}
                          onChange={(e) => setConfig(prev => ({ ...prev, serie_nfce: parseInt(e.target.value) || 1 }))}
                        />
                      </div>
                      <div>
                        <Label>Próximo Nº NFC-e</Label>
                        <Input
                          type="number"
                          min="1"
                          value={config.proximo_numero_nfce}
                          onChange={(e) => setConfig(prev => ({ ...prev, proximo_numero_nfce: parseInt(e.target.value) || 1 }))}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Configurações'
              )}
            </Button>
            
            {currentStep < 3 && (
              <Button onClick={() => setCurrentStep(prev => prev + 1)}>
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </ERPLayout>
  );
};

export default ConfiguracaoFiscalPage;
