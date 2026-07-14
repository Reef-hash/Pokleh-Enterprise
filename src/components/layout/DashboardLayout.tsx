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
  UserCheck,
  ClipboardList,
  Truck,
  ArrowLeftRight,
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
  RefreshCw,
  Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { HelpButton } from "@/components/help/HelpButton";
import { HelpSlidePanel } from "@/components/help/HelpSlidePanel";
import { Logo } from "@/components/ui/Logo";
import { getHelpContent } from "@/lib/help-content";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { useSyncStore } from "@/stores/syncStore";
import { BottomNavigation } from "./BottomNavigation";
import { BillingLockBanner } from "./BillingLockBanner";

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
      trucks: t('nav.trucks'),
      customers: t('nav.customers'),
      suppliers: t('nav.suppliers'),
      'staff-assignments': t('nav.staff-assignments'),
      'price-history': t('nav.price-history'),
      'selling-prices': t('nav.selling-prices'),
      expenses: t('nav.expenses'),
      'pokleh-reports': t('nav.pokleh-reports'),
      'truck-stock': t('nav.truck-stock'),
      'daily-closing': t('nav.daily-closing'),
      'audit-logs': t('nav.audit-logs'),
      'staff-accounts': t('nav.staff-accounts'),
    };
    return map[id] ?? id;
  };

  const adminNavGroups: NavGroup[] = [
    {
      label: null, key: 'main',
      items: [{ id: 'dashboard', label: t('nav.dashboard'), icon: Home }]
    },
    {
      label: t('nav.stock'), key: 'stock',
      items: [
        { id: 'truck-stock', label: t('nav.truck-stock'), icon: Truck },
        { id: 'stock-intake', label: t('nav.stock-intake'), icon: ClipboardList },
        { id: 'stock-distribution', label: t('nav.stock-distribution'), icon: ArrowLeftRight },
        { id: 'stock-return', label: t('nav.stock-return'), icon: RotateCcw },
      ]
    },
    {
      label: t('nav.sales-debt'), key: 'sales-debt',
      items: [
        { id: 'sales', label: t('nav.sales'), icon: DollarSign },
        { id: 'debt-ledger', label: t('nav.debt-ledger'), icon: BookOpen },
        { id: 'debt-collection', label: t('nav.debt-collection'), icon: HandCoins },
        { id: 'settlements', label: t('nav.settlements'), icon: FileSpreadsheet },
      ]
    },
    {
      label: t('nav.management'), key: 'management',
      items: [
        { id: 'trucks', label: t('nav.trucks'), icon: Truck },
        { id: 'customers', label: t('nav.customers'), icon: Users },
        { id: 'suppliers', label: t('nav.suppliers'), icon: Building2 },
        { id: 'staff-assignments', label: t('nav.staff-assignments'), icon: UserCheck },
        { id: 'price-history', label: t('nav.price-history'), icon: Clock },
        { id: 'selling-prices', label: t('nav.selling-prices'), icon: Tag },
        { id: 'expenses', label: t('nav.expenses'), icon: Receipt },
      ]
    },
    {
      label: t('nav.reports-operations'), key: 'reports',
      items: [
        { id: 'pokleh-reports', label: t('nav.pokleh-reports'), icon: TrendingUp },
        { id: 'daily-closing', label: t('nav.daily-closing'), icon: CalendarCheck },
      ]
    },
    {
      label: t('nav.admin'), key: 'admin',
      items: [
        { id: 'staff-accounts', label: t('nav.staff-accounts'), icon: Users },
        { id: 'audit-logs', label: t('nav.audit-logs'), icon: Shield },
      ]
    },
  ];

  const staffNavGroups: NavGroup[] = [
    {
      label: null, key: 'main',
      items: [{ id: 'dashboard', label: t('nav.dashboard'), icon: Home }]
    },
    {
      label: t('nav.stock'), key: 'stock',
      items: [
        { id: 'truck-stock', label: t('nav.truck-stock'), icon: Truck },
        { id: 'stock-distribution', label: t('nav.stock-distribution'), icon: ArrowLeftRight },
        { id: 'stock-return', label: t('nav.stock-return'), icon: RotateCcw },
      ]
    },
    {
      label: t('nav.sales-debt'), key: 'sales-debt',
      items: [
        { id: 'sales', label: t('nav.sales'), icon: DollarSign },
        { id: 'debt-collection', label: t('nav.debt-collection'), icon: HandCoins },
      ]
    },
    {
      label: t('nav.management'), key: 'management',
      items: [
        { id: 'customers', label: t('nav.customers'), icon: Users },
        { id: 'expenses', label: t('nav.expenses'), icon: Receipt },
      ]
    },
    {
      label: t('nav.reports-operations'), key: 'reports',
      items: [
        { id: 'pokleh-reports', label: t('nav.pokleh-reports'), icon: TrendingUp },
        { id: 'daily-closing', label: t('nav.daily-closing'), icon: CalendarCheck },
      ]
    },
  ];

  const navGroups = user.role === 'admin' ? adminNavGroups : staffNavGroups;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-[transform] duration-200 ease-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col shadow-2xl lg:shadow-none",
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
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setSidebarOpen(false);
                      }}
                      className={cn(
                        "group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98]",
                        currentPage === item.id
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                      )}
                    >
                      <Icon className={cn(
                        "h-4 w-4 shrink-0 transition-transform duration-150",
                        currentPage === item.id && "text-primary"
                      )} />
                      {itemLabel(item.id)}
                    </button>
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
        <header className="h-auto sm:h-16 bg-card/95 backdrop-blur-sm border-b flex flex-wrap items-center justify-between px-3 sm:px-4 gap-2 py-2 sm:py-0 sticky top-0 z-30 transition-[background] duration-200 min-h-[3.5rem]">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden transition-[transform] duration-150 ease-out active:scale-90 shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className={cn(
              "h-4 w-4 transition-transform duration-200 ease-out",
              sidebarOpen && "rotate-90"
            )} />
          </Button>
          <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-none">
            <h1 className="text-base sm:text-xl font-bold capitalize text-foreground truncate">
              {currentPage === 'dashboard'
                ? (user.role === 'admin' ? t('dashboard.admin') : t('dashboard.staff'))
                : itemLabel(currentPage)}
            </h1>
            <button
              onClick={() => setHelpOpen(true)}
              className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold shrink-0"
              aria-label="Page help"
              title={t('common.help')}
            >
              ?
            </button>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 ml-auto sm:ml-0">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              title={t('common.action')}
              className="px-1.5 sm:px-2"
            >
              <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
            </Button>
            <HelpButton />
          </div>
        </header>

        <BillingLockBanner />

        {/* Page content */}
        <main className="flex-1 min-h-0 flex flex-col">
          <PullToRefresh onRefresh={handleSync} className="flex-1 overflow-auto p-4 pb-24 lg:pb-4 content-scroll">
            <div className="animate-fade-in-up">
              {children}
            </div>
          </PullToRefresh>
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Bottom Navigation (Mobile only) */}
      <BottomNavigation
        currentPage={currentPage}
        onNavigate={onNavigate}
      />
    </div>
  );
};