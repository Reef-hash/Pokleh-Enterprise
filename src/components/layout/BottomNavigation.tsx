import { useState } from "react";
import { Home, Package, DollarSign, Users, MoreVertical, ChevronRight, ClipboardList, ArrowLeftRight, RotateCcw, BookOpen, HandCoins, FileSpreadsheet, Truck, Building2, Clock, Receipt, TrendingUp, CalendarCheck, Tag, Shield, Droplet, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLanguage } from "@/lib/i18n";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: Array<{ id: string; label: string; icon?: React.ComponentType<{ className?: string }> }>;
}

interface BottomNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const BottomNavigation = ({
  currentPage,
  onNavigate,
}: BottomNavigationProps) => {
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const { t } = useLanguage();

  const mainItems: NavItem[] = [
    {
      id: "dashboard",
      label: t('nav.dashboard'),
      icon: Home,
    },
    {
      id: "stock",
      label: t('nav.stock'),
      icon: Package,
      subItems: [
        { id: "truck-stock", label: t('nav.truck-stock'), icon: Truck },
        { id: "stock-intake", label: t('nav.stock-intake'), icon: ClipboardList },
        { id: "stock-distribution", label: t('nav.stock-distribution'), icon: ArrowLeftRight },
        { id: "stock-return", label: t('nav.stock-return'), icon: RotateCcw },
        { id: "record-wastage", label: t('nav.record-wastage'), icon: Droplet },
        { id: "daily-bills", label: t('nav.daily-bills'), icon: Receipt },
      ],
    },
    {
      id: "sales",
      label: t('nav.sales-debt'),
      icon: DollarSign,
      subItems: [
        { id: "sales", label: t('nav.sales'), icon: DollarSign },
        { id: "debt-ledger", label: t('nav.debt-ledger'), icon: BookOpen },
        { id: "debt-collection", label: t('nav.debt-collection'), icon: HandCoins },
      ],
    },
    {
      id: "customers",
      label: t('nav.customers'),
      icon: Users,
    },
  ];

  const moreItems = [
    { id: "settlements", label: t('nav.settlements'), icon: FileSpreadsheet },
    { id: "wastage-adjustments", label: t('nav.wastage-adjustments'), icon: TrendingDown },
    { id: "trucks", label: t('nav.trucks'), icon: Truck },
    { id: "suppliers", label: t('nav.suppliers'), icon: Building2 },
    { id: "staff-assignments", label: t('nav.staff-assignments'), icon: Users },
    { id: "price-history", label: t('nav.price-history'), icon: Clock },
    { id: "selling-prices", label: t('nav.selling-prices'), icon: Tag },
    { id: "expenses", label: t('nav.expenses'), icon: Receipt },
    { id: "pokleh-reports", label: t('nav.pokleh-reports'), icon: TrendingUp },
    { id: "daily-closing", label: t('nav.daily-closing'), icon: CalendarCheck },
    { id: "audit-logs", label: t('nav.audit-logs'), icon: Shield },
    { id: "staff-accounts", label: t('nav.staff-accounts'), icon: Users },
  ];

  const handleNavigation = (pageId: string) => {
    onNavigate(pageId);
    setOpenPopover(null);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-card/95 backdrop-blur-sm border-t border-border px-1 py-2 z-30 pb-safe-inset-bottom">
      <div className="flex items-center justify-between gap-0.5 max-w-full">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id || (item.subItems?.some(sub => currentPage === sub.id));

          // Items with sub-menu
          if (item.subItems) {
            return (
              <Popover key={item.id} open={openPopover === item.id} onOpenChange={(open) => setOpenPopover(open ? item.id : null)}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-[background-color,color] duration-150 ease-out active:scale-90",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium leading-none">{item.label}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="center" side="top" className="w-56 p-0 mb-2">
                  <div className="space-y-1 p-2">
                    {item.subItems.map((subItem) => {
                      const SubIcon = subItem.icon || ChevronRight;
                      return (
                        <button
                          key={subItem.id}
                          onClick={() => handleNavigation(subItem.id)}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 active:scale-95 transition-all duration-150"
                        >
                          <span className="flex items-center gap-2">
                            <SubIcon className="h-4 w-4" />
                            {subItem.label}
                          </span>
                          <ChevronRight className="h-4 w-4 opacity-50" />
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            );
          }

          // Regular items without sub-menu
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-[background-color,color] duration-150 ease-out active:scale-90",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium leading-none">{item.label}</span>
            </button>
          );
        })}

        {/* More Menu */}
        <Popover open={openPopover === "more"} onOpenChange={(open) => setOpenPopover(open ? "more" : null)}>
          <PopoverTrigger asChild>
            <button className="flex-1 flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-[background-color,color] duration-150 ease-out active:scale-90">
              <MoreVertical className="h-5 w-5" />
              <span className="text-xs font-medium leading-none">{t('nav.more')}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="center" side="top" className="w-56 p-0 mb-2">
            <div className="space-y-1 p-2">
              {moreItems.map((item) => {
                const ItemIcon = item.icon || ChevronRight;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 active:scale-95 transition-all duration-150"
                  >
                    <span className="flex items-center gap-2">
                      <ItemIcon className="h-4 w-4" />
                      {item.label}
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  );
};
