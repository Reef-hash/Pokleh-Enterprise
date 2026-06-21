import { useCustomers } from "@/hooks/useCustomers";
import { useAreas } from "@/hooks/useAreas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, MapPin, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface PoklehDashboardProps {
  user: { id: string; email: string; role: string; name: string };
  onNavigate: (page: string) => void;
}

export const PoklehDashboard = ({ user, onNavigate }: PoklehDashboardProps) => {
  const { customers } = useCustomers();
  const { areas } = useAreas();

  const activeCustomers = customers.filter(c => c.active !== false).length;
  const totalDebt = customers.reduce((sum, c) => sum + Number(c.debt_balance || 0), 0);

  const quickLinks = [
    { id: 'stock-intake', label: 'Stock Intake', icon: Package, desc: 'Record incoming stock from suppliers' },
    { id: 'stock-distribution', label: 'Stock Distribution', icon: MapPin, desc: 'Assign stock to delivery areas' },
    { id: 'sales', label: 'Sales Entry', icon: DollarSign, desc: 'Record ice sales (cash or debt)' },
    { id: 'customers', label: 'Customers', icon: Users, desc: 'Manage customer accounts and debts' },
    { id: 'daily-closing', label: 'Daily Closing', icon: DollarSign, desc: 'End-of-day reconciliation' },
    { id: 'pokleh-reports', label: 'Reports', icon: DollarSign, desc: 'View sales, expenses, and analytics' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Welcome, {user.name}</h2>
        <p className="text-muted-foreground">
          {user.role === 'admin' ? 'Overview of your ice distribution system' : 'Your ice distribution dashboard'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeCustomers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Service Areas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{areas.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Debt</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalDebt)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{customers.length}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Card key={link.id} className="cursor-pointer hover:bg-accent transition-colors" onClick={() => onNavigate(link.id)}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <link.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{link.label}</CardTitle>
                    <p className="text-xs text-muted-foreground">{link.desc}</p>
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
