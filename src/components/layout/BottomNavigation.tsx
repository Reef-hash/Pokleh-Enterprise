import { Home, Package, DollarSign, Users, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface BottomNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onMoreClick?: (page: string) => void;
}

export const BottomNavigation = ({
  currentPage,
  onNavigate,
  onMoreClick,
}: BottomNavigationProps) => {
  const mainItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "stock-intake", label: "Stock", icon: Package },
    { id: "sales", label: "Sales", icon: DollarSign },
    { id: "customers", label: "Customers", icon: Users },
  ];

  const moreItems = [
    { id: "stock-distribution", label: "Stock Distribution" },
    { id: "stock-return", label: "Stock Returns" },
    { id: "debt-ledger", label: "Debt Ledger" },
    { id: "debt-collection", label: "Debt Collection" },
    { id: "settlements", label: "Settlements" },
    { id: "trucks", label: "Trucks" },
    { id: "suppliers", label: "Suppliers" },
    { id: "staff-assignments", label: "Staff Assignments" },
    { id: "price-history", label: "Price History" },
    { id: "selling-prices", label: "Harga Jual" },
    { id: "expenses", label: "Expenses" },
    { id: "pokleh-reports", label: "Reports" },
    { id: "daily-closing", label: "Daily Closing" },
    { id: "audit-logs", label: "Audit Logs" },
    { id: "staff-accounts", label: "Staff Accounts" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-card/95 backdrop-blur-sm border-t border-border px-1 py-2 z-30 pb-safe-inset-bottom">
      <div className="flex items-center justify-between gap-0.5 max-w-full">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex-1 flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-[background-color,color] duration-150 ease-out active:scale-90">
              <MoreVertical className="h-5 w-5" />
              <span className="text-xs font-medium leading-none">More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mb-14">
            <DropdownMenuLabel className="text-xs">More Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {moreItems.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => onNavigate(item.id)}
              >
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};
