import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowRightLeft,
  Users,
  Package,
  Truck,
  DollarSign,
  FileText,
  Receipt,
  Settings,
  ChevronDown,
  ChevronRight,
  Calculator,
  ShoppingCart,
  ClipboardList,
  Wallet,
  TrendingUp,
  TrendingDown,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: 'inicio',
    label: 'Início',
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: '/dashboard',
  },
  {
    id: 'movimentos',
    label: 'Movimentos',
    icon: <ArrowRightLeft className="w-5 h-5" />,
    children: [
      { id: 'caixa', label: 'Caixa', icon: <Calculator className="w-4 h-4" />, path: '/caixa' },
      { id: 'vendas', label: 'Vendas', icon: <ShoppingCart className="w-4 h-4" />, path: '/vendas' },
    ],
  },
  {
    id: 'cadastros',
    label: 'Cadastros',
    icon: <ClipboardList className="w-5 h-5" />,
    children: [
      { id: 'clientes', label: 'Clientes', icon: <Users className="w-4 h-4" />, path: '/clientes' },
      { id: 'produtos', label: 'Produtos', icon: <Package className="w-4 h-4" />, path: '/produtos' },
      { id: 'fornecedores', label: 'Fornecedores', icon: <Truck className="w-4 h-4" />, path: '/fornecedores' },
      { id: 'categorias', label: 'Categorias', icon: <Receipt className="w-4 h-4" />, path: '/categories' },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    icon: <DollarSign className="w-5 h-5" />,
    children: [
      { id: 'receber', label: 'Contas a Receber', icon: <TrendingUp className="w-4 h-4" />, path: '/contas-receber' },
      { id: 'pagar', label: 'Contas a Pagar', icon: <TrendingDown className="w-4 h-4" />, path: '/contas-pagar' },
      { id: 'fluxo', label: 'Fluxo de Caixa', icon: <Wallet className="w-4 h-4" />, path: '/fluxo-caixa' },
    ],
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    icon: <FileText className="w-5 h-5" />,
    path: '/relatorios',
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: <Settings className="w-5 h-5" />,
    path: '/configuracoes',
  },
];

export function ERPSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>(['movimentos', 'cadastros', 'financeiro']);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const active = isActive(item.path);

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else if (item.path) {
              navigate(item.path);
              setIsMobileOpen(false);
            }
          }}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all',
            'hover:bg-accent/50',
            active && 'bg-primary/20 text-primary border-l-4 border-primary',
            level > 0 && 'pl-10'
          )}
        >
          <span className={cn(active && 'text-primary')}>{item.icon}</span>
          <span className="flex-1 text-left">{item.label}</span>
          {hasChildren && (
            <span className="text-muted-foreground">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </span>
          )}
        </button>
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {item.children?.map((child) => renderMenuItem(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-primary bg-clip-text text-transparent">
              SUPREME
            </h1>
            <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2 overflow-y-auto">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={() => signOut()}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 h-screen bg-card border-r border-border flex-col fixed left-0 top-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black z-40"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed left-0 top-0 w-64 h-screen bg-card border-r border-border z-50"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
