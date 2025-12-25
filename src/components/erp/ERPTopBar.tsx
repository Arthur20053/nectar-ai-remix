import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Search, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { NotificationsPanel } from './NotificationsPanel';

interface Tab {
  id: string;
  label: string;
  path: string;
}

interface ERPTopBarProps {
  tabs: Tab[];
  onCloseTab: (id: string) => void;
  onTabClick: (tab: Tab) => void;
}

export function ERPTopBar({ tabs, onCloseTab, onTabClick }: ERPTopBarProps) {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  return (
    <>
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 sticky top-0 z-30">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer transition-all text-sm',
                location.pathname === tab.path
                  ? 'bg-background border-t border-l border-r border-border text-primary font-medium'
                  : 'hover:bg-muted text-muted-foreground'
              )}
              onClick={() => onTabClick(tab)}
            >
              <span>{tab.label}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="hover:bg-destructive/20 rounded p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64 h-9"
            />
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => setShowNotifications(true)}
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive">
                {notificationCount > 99 ? '99+' : notificationCount}
              </Badge>
            )}
          </Button>

          <Button variant="ghost" size="icon">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <NotificationsPanel
        open={showNotifications}
        onOpenChange={setShowNotifications}
        onNotificationCountChange={setNotificationCount}
      />
    </>
  );
}
