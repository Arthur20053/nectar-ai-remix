import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ERPSidebar } from './ERPSidebar';
import { ERPTopBar } from './ERPTopBar';

interface Tab {
  id: string;
  label: string;
  path: string;
}

const getTabLabel = (path: string): string => {
  const labels: Record<string, string> = {
    '/dashboard': 'INÍCIO',
    '/caixa': 'CAIXA',
    '/vendas': 'VENDAS',
    '/clientes': 'CLIENTES',
    '/produtos': 'PRODUTOS',
    '/fornecedores': 'FORNECEDORES',
    '/categories': 'CATEGORIAS',
    '/contas-receber': 'C. RECEBER',
    '/contas-pagar': 'C. PAGAR',
    '/fluxo-caixa': 'FLUXO CAIXA',
    '/relatorios': 'RELATÓRIOS',
    '/configuracoes': 'CONFIG',
    '/calendar': 'CALENDÁRIO',
  };
  return labels[path] || 'PÁGINA';
};

interface ERPLayoutProps {
  children: React.ReactNode;
}

export function ERPLayout({ children }: ERPLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'inicio', label: 'INÍCIO', path: '/dashboard' },
  ]);

  useEffect(() => {
    const currentPath = location.pathname;
    const existingTab = tabs.find((tab) => tab.path === currentPath);

    if (!existingTab && currentPath !== '/login' && currentPath !== '/signup' && currentPath !== '/') {
      const newTab: Tab = {
        id: `tab-${Date.now()}`,
        label: getTabLabel(currentPath),
        path: currentPath,
      };
      setTabs((prev) => [...prev, newTab]);
    }
  }, [location.pathname]);

  const handleCloseTab = (id: string) => {
    const tabIndex = tabs.findIndex((tab) => tab.id === id);
    const newTabs = tabs.filter((tab) => tab.id !== id);

    if (newTabs.length === 0) {
      setTabs([{ id: 'inicio', label: 'INÍCIO', path: '/dashboard' }]);
      navigate('/dashboard');
    } else {
      setTabs(newTabs);
      const closedTab = tabs[tabIndex];
      if (location.pathname === closedTab.path) {
        const nextTab = newTabs[Math.min(tabIndex, newTabs.length - 1)];
        navigate(nextTab.path);
      }
    }
  };

  const handleTabClick = (tab: Tab) => {
    navigate(tab.path);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <ERPSidebar />
      <div className="flex-1 lg:ml-64 flex flex-col">
        <ERPTopBar tabs={tabs} onCloseTab={handleCloseTab} onTabClick={handleTabClick} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
