import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Package,
  Users, 
  LogOut, 
  Menu,
  X,
  Home,
  Building2,
  MapPin,
  UserCheck,
  ClipboardList,
  Truck,
  RotateCcw,
  FileSpreadsheet,
  DollarSign,
  BookOpen,
  HandCoins,
  Receipt,
  TrendingUp,
  Clock,
  Shield,
  CalendarCheck,
  ChevronDown,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { HelpButton } from "@/components/help/HelpButton";
import { HelpSlidePanel } from "@/components/help/HelpSlidePanel";
import { Logo } from "@/components/ui/Logo";
import { getHelpContent } from "@/lib/help-content";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useSyncStore } from "@/stores/syncStore";

interface User {
  id: string;
  email: string;
  role: 'admin' | 'staff';
  name: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string | null;
  key: string;
  items: NavItem[];
}

interface DashboardLayoutProps {
  children: ReactNode;
  user: User;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const DashboardLayout = ({ 
  children, 
  user, 
  onLogout, 
  currentPage, 
  onNavigate 
}: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    stock: true,
    'sales-debt': true,
  });
  const { t } = useLanguage();
  const [helpOpen, setHelpOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const triggerRefresh = useSyncStore((s) => s.triggerRefresh);
  const helpContent = getHelpContent(currentPage);

  const handleSync = async () => {
    setSyncing(true);
    await triggerRefresh();
    setSyncing(false);
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sectionLabel = (key: string): string => {
    const map: Record<string, string> = {
      stock: t('nav.stock'),
      'sales-debt': t('nav.sales-debt'),
      management: t('nav.management'),
      reports: t('nav.reports-operations'),
      admin: t('nav.admin'),
    };
    return map[key] ?? key;
  };

  const itemLabel = (id: string): string => {
    const map: Record<string, string> = {
      dashboard: t('nav.dashboard'),
      'stock-intake': t('nav.stock-intake'),
      'stock-distribution': t('nav.stock-distribution'),
      'stock-return': t('nav.stock-return'),
      sales: t('nav.sales'),
      'debt-ledger': t('nav.debt-ledger'),
      'debt-collection': t('nav.debt-collection'),
      settlements: t('nav.settlements'),
      areas: t('nav.areas'),
      customers: t('nav.customers'),
      suppliers: t('nav.suppliers'),
      'staff-assignments': t('nav.staff-assignments'),
      'price-history': t('nav.price-history'),
      expenses: t('nav.expenses'),
      'pokleh-reports': t('nav.pokleh-reports'),
      'daily-closing': t('nav.daily-closing'),
      'audit-logs': t('nav.audit-logs'),
      'staff-accounts': t('nav.staff-accounts'),
    };
    return map[id] ?? id;
  };

  const adminNavGroups: NavGroup[] = [
    {
      label: null, key: 'main',
      items: [{ id: 'dashboard', label: 'Dashboard', icon: Home }]
    },
    {
      label: 'Stock', key: 'stock',
      items: [
        { id: 'stock-intake', label: 'Stock Intake', icon: ClipboardList },
        { id: 'stock-distribution', label: 'Stock Distribution', icon: Truck },
        { id: 'stock-return', label: 'Stock Returns', icon: RotateCcw },
      ]
    },
    {
      label: 'Sales & Debt', key: 'sales-debt',
      items: [
        { id: 'sales', label: 'Sales Entry', icon: DollarSign },
        { id: 'debt-ledger', label: 'Debt Ledger', icon: BookOpen },
        { id: 'debt-collection', label: 'Debt Collection', icon: HandCoins },
        { id: 'settlements', label: 'Supplier Settlements', icon: FileSpreadsheet },
      ]
    },
    {
      label: 'Management', key: 'management',
      items: [
        { id: 'areas', label: 'Areas', icon: MapPin },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'suppliers', label: 'Suppliers', icon: Building2 },
        { id: 'staff-assignments', label: 'Staff Assignments', icon: UserCheck },
        { id: 'price-history', label: 'Price History', icon: Clock },
        { id: 'expenses', label: 'Expenses', icon: Receipt },
      ]
    },
    {
      label: 'Reports & Operations', key: 'reports',
      items: [
        { id: 'pokleh-reports', label: 'Pokleh Reports', icon: TrendingUp },
        { id: 'daily-closing', label: 'Daily Closing', icon: CalendarCheck },
      ]
    },
    {
      label: 'Admin', key: 'admin',
      items: [
        { id: 'staff-accounts', label: 'Staff Accounts', icon: Users },
        { id: 'audit-logs', label: 'Audit Logs', icon: Shield },
      ]
    },
  ];

  const staffNavGroups: NavGroup[] = [
    {
      label: null, key: 'main',
      items: [{ id: 'dashboard', label: 'Dashboard', icon: Home }]
    },
    {
      label: 'Stock', key: 'stock',
      items: [
        { id: 'stock-distribution', label: 'Stock Distribution', icon: Truck },
        { id: 'stock-return', label: 'Stock Returns', icon: RotateCcw },
      ]
    },
    {
      label: 'Sales & Debt', key: 'sales-debt',
      items: [
        { id: 'sales', label: 'Sales Entry', icon: DollarSign },
        { id: 'debt-collection', label: 'Debt Collection', icon: HandCoins },
      ]
    },
    {
      label: 'Management', key: 'management',
      items: [
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'expenses', label: 'Expenses', icon: Receipt },
      ]
    },
    {
      label: 'Reports & Operations', key: 'reports',
      items: [
        { id: 'pokleh-reports', label: 'Pokleh Reports', icon: TrendingUp },
        { id: 'daily-closing', label: 'Daily Closing', icon: CalendarCheck },
      ]
    },
  ];

  const navGroups = user.role === 'admin' ? adminNavGroups : staffNavGroups;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center space-x-2">
            <Logo variant="icon" />
            <span className="text-lg font-bold text-foreground">Pokleh</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.key} className="mb-3">
              {group.label ? (
                <button
                  onClick={() => toggleSection(group.key)}
                  className="flex items-center w-full px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronDown className={cn(
                    "mr-1 h-3 w-3 transition-transform duration-200",
                    !expandedSections[group.key] && "-rotate-90"
                  )} />
                  {sectionLabel(group.key)}
                </button>
              ) : null}
              <div className={cn(
                "space-y-0.5",
                group.label && !expandedSections[group.key] && "hidden"
              )}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={currentPage === item.id ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "w-full justify-start font-medium",
                        currentPage === item.id && "bg-primary/10 text-primary hover:bg-primary/20 font-semibold"
                      )}
                      onClick={() => {
                        onNavigate(item.id);
                        setSidebarOpen(false);
                      }}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {itemLabel(item.id)}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate capitalize font-medium">{user.role}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={onLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t('common.logout')}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="h-16 bg-card border-b flex items-center justify-between px-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold capitalize text-foreground">
              {currentPage === 'dashboard'
                ? (user.role === 'admin' ? t('dashboard.admin') : t('dashboard.staff'))
                : itemLabel(currentPage)}
            </h1>
            <button
              onClick={() => setHelpOpen(true)}
              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold"
              aria-label="Page help"
              title="Help"
            >
              ?
            </button>
          </div>
          <div className="flex items-center space-x-1">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              title="Sync data dengan server"
              className="px-2"
            >
              <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
            </Button>
            <span className="text-sm text-muted-foreground hidden sm:inline font-medium">
              {t('common.welcome')}, {user.name}
            </span>
            <HelpButton />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>

      <HelpSlidePanel
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title={currentPage === 'dashboard'
          ? (user.role === 'admin' ? t('dashboard.admin') : t('dashboard.staff'))
          : itemLabel(currentPage)}
        content={helpContent}
      />

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};