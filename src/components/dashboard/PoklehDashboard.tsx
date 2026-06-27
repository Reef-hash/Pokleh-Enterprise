import { useCustomers } from "@/hooks/useCustomers";
import { useTrucks } from "@/hooks/useTrucks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, Truck, ArrowLeftRight, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface PoklehDashboardProps {
  user: { id: string; email: string; role: string; name: string };
  onNavigate: (page: string) => void;
}

export const PoklehDashboard = ({ user, onNavigate }: PoklehDashboardProps) => {
  const { customers } = useCustomers();
  const { trucks } = useTrucks();

  const activeCustomers = customers.filter(c => c.active !== false).length;
  const totalDebt = customers.reduce((sum, c) => sum + Number(c.debt_balance || 0), 0);

  const quickLinks = [
    { id: 'stock-intake', label: 'Stock Intake', icon: Package, desc: 'Record incoming stock from suppliers' },
    { id: 'stock-distribution', label: 'Stock Distribution', icon: ArrowLeftRight, desc: 'Transfer stock between trucks' },
    { id: 'sales', label: 'Sales Entry', icon: DollarSign, desc: 'Record ice sales (cash or debt)' },
    { id: 'customers', label: 'Customers', icon: Users, desc: 'Manage customer accounts and debts' },
    { id: 'daily-closing', label: 'Daily Closing', icon: DollarSign, desc: 'End-of-day reconciliation' },
    { id: 'pokleh-reports', label: 'Reports', icon: DollarSign, desc: 'View sales, expenses, and analytics' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="px-1 sm:px-0">
        <h2 className="text-xl sm:text-2xl font-bold">Welcome, {user.name}</h2>
        <p className="text-sm sm:text-base text-muted-foreground hidden sm:block">
          {user.role === 'admin' ? 'Overview of your ice distribution system' : 'Your ice distribution dashboard'}
        </p>
      </div>

      {/* Stat cards with staggered entry */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
        <Card className="order-1 animate-fade-in-up animate-delay-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Outstanding Debt</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <p className="text-lg sm:text-2xl font-bold text-destructive">{formatCurrency(totalDebt)}</p>
          </CardContent>
        </Card>
        <Card className="order-3 sm:order-2 animate-fade-in-up animate-delay-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <p className="text-lg sm:text-2xl font-bold">{activeCustomers}</p>
          </CardContent>
        </Card>
        <Card className="order-4 sm:order-3 animate-fade-in-up animate-delay-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Fleet Size</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <p className="text-lg sm:text-2xl font-bold">{trucks.length}</p>
          </CardContent>
        </Card>
        <Card className="order-2 sm:order-4 animate-fade-in-up animate-delay-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Customers</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <p className="text-lg sm:text-2xl font-bold">{customers.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions with staggered entry */}
      <div className="px-1 sm:px-0 animate-fade-in-up animate-delay-5">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Actions</h3>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link, i) => (
            <Card
              key={link.id}
              className="cursor-pointer transition-[transform,background-color] duration-150 ease-out active:scale-[0.98] hover:bg-accent/50 group"
              onClick={() => onNavigate(link.id)}
            >
              <CardHeader className="p-3 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-150 ease-out">
                    <link.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-medium">{link.label}</CardTitle>
                    <p className="text-xs text-muted-foreground truncate">{link.desc}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
