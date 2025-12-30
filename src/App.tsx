import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Categories from "./pages/Categories";
import Caixa from "./pages/Caixa";
import Clientes from "./pages/Clientes";
import Produtos from "./pages/Produtos";
import Fornecedores from "./pages/Fornecedores";
import Vendas from "./pages/Vendas";
import ContasReceber from "./pages/ContasReceber";
import ContasPagar from "./pages/ContasPagar";
import FluxoCaixa from "./pages/FluxoCaixa";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import ConfiguracaoFiscal from "./pages/ConfiguracaoFiscal";
import HistoricoNotas from "./pages/HistoricoNotas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/caixa" element={<Caixa />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/fornecedores" element={<Fornecedores />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/contas-receber" element={<ContasReceber />} />
            <Route path="/contas-pagar" element={<ContasPagar />} />
            <Route path="/fluxo-caixa" element={<FluxoCaixa />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/configuracao-fiscal" element={<ConfiguracaoFiscal />} />
            <Route path="/historico-notas" element={<HistoricoNotas />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
