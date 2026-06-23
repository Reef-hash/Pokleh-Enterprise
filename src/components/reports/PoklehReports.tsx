import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useSales } from "@/hooks/useSales";
import { useExpenses } from "@/hooks/useExpenses";
import { useDebtCollection } from "@/hooks/useDebtCollection";
import { useStockIntake } from "@/hooks/useStockIntake";
import { useAreas } from "@/hooks/useAreas";
import { formatCurrency } from "@/lib/currency";

const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#f59e0b", "#8b5cf6", "#ec4899"];

interface PoklehReportsProps {
  userRole: "admin" | "staff";
}

export const PoklehReports = ({ userRole }: PoklehReportsProps) => {
  const { sales } = useSales();
  const { expenses } = useExpenses();
  const { collections } = useDebtCollection();
  const { intakes } = useStockIntake();
  const { areas } = useAreas();

  const dailyData = useMemo(() => {
    const map = new Map<string, { date: string; sold: number; cash: number; debt: number; collected: number; expenses: number; received: number }>();
    const add = (date: string) => { if (!map.has(date)) map.set(date, { date, sold: 0, cash: 0, debt: 0, collected: 0, expenses: 0, received: 0 }); };
    sales.forEach((s) => { add(s.sale_date); const d = map.get(s.sale_date)!; d.sold += s.quantity; if (s.payment_type === "cash") d.cash += s.selling_price; else d.debt += s.selling_price; });
    collections.forEach((c) => { add(c.collection_date); map.get(c.collection_date)!.collected += c.amount; });
    expenses.forEach((e) => { add(e.expense_date); map.get(e.expense_date)!.expenses += e.amount; });
    intakes.forEach((i) => { add(i.intake_date); map.get(i.intake_date)!.received += i.quantity_received; });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  }, [sales, collections, expenses, intakes]);

  const areaData = useMemo(() => {
    const map = new Map<string, { area: string; sold: number; revenue: number }>();
    areas.forEach((a) => { if (!map.has(a.id)) map.set(a.id, { area: a.name, sold: 0, revenue: 0 }); });
    sales.forEach((s) => {
      if (map.has(s.area_id)) { const d = map.get(s.area_id)!; d.sold += s.quantity; d.revenue += s.selling_price; }
    });
    return Array.from(map.values());
  }, [sales, areas]);

  const totalRevenue = useMemo(() => sales.reduce((s, x) => s + x.selling_price, 0), [sales]);
  const totalExpenses = useMemo(() => expenses.reduce((s, x) => s + x.amount, 0), [expenses]);
  const totalCollected = useMemo(() => collections.reduce((s, x) => s + x.amount, 0), [collections]);
  const totalCashSales = useMemo(() => sales.filter((s) => s.payment_type === "cash").reduce((s, x) => s + x.selling_price, 0), [sales]);
  const totalDebtSales = useMemo(() => sales.filter((s) => s.payment_type === "debt").reduce((s, x) => s + x.selling_price, 0), [sales]);
  const profit = totalRevenue - totalExpenses;

  const pieData = useMemo(() => [
    { name: "Cash Sales", value: totalCashSales },
    { name: "Debt Sales", value: totalDebtSales },
    { name: "Expenses", value: totalExpenses },
  ], [totalCashSales, totalDebtSales, totalExpenses]);

  const staffData = useMemo(() => {
    const map = new Map<string, { staff: string; sales: number; revenue: number; collections: number }>();
    sales.forEach((s) => {
      const name = s.staff?.name || "Unknown";
      if (!map.has(s.staff_id)) map.set(s.staff_id, { staff: name, sales: 0, revenue: 0, collections: 0 });
      const d = map.get(s.staff_id)!; d.sales += s.quantity; d.revenue += s.selling_price;
    });
    collections.forEach((c) => {
      const name = c.staff?.name || "Unknown";
      if (!map.has(c.staff_id)) map.set(c.staff_id, { staff: name, sales: 0, revenue: 0, collections: 0 });
      map.get(c.staff_id)!.collections += c.amount;
    });
    return Array.from(map.values());
  }, [sales, collections]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Pokleh Reports</h2>
        <p className="text-muted-foreground">Sales, expenses, collections and profit analytics</p>
      </div>

      {userRole === "admin" && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Revenue</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Expenses</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Profit</CardTitle></CardHeader><CardContent><p className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-destructive"}`}>{formatCurrency(profit)}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Collections</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(totalCollected)}</p></CardContent></Card>
        </div>
      )}

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily Trends</TabsTrigger>
          {userRole === "admin" && <TabsTrigger value="area">By Area</TabsTrigger>}
          {userRole === "admin" && <TabsTrigger value="staff">By Staff</TabsTrigger>}
          {userRole === "admin" && <TabsTrigger value="company">Company Overview</TabsTrigger>}
        </TabsList>

        <TabsContent value="daily" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Daily Sales & Collections (Last 30 days)</CardTitle><CardDescription>Cash sales, debt sales, and collections over time</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cash" stroke="#16a34a" name="Cash Sales" strokeWidth={2} />
                  <Line type="monotone" dataKey="debt" stroke="#dc2626" name="Debt Sales" strokeWidth={2} />
                  <Line type="monotone" dataKey="collected" stroke="#2563eb" name="Collections" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Daily Stock Activity</CardTitle><CardDescription>Stock received vs sold vs expenses</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="received" fill="#8b5cf6" name="Received" />
                  <Bar dataKey="sold" fill="#16a34a" name="Sold" />
                  <Bar dataKey="expenses" fill="#dc2626" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {userRole === "admin" && (
          <TabsContent value="area" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle>Sales by Area</CardTitle><CardDescription>Comparison across all areas</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={areaData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="area" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sold" fill="#2563eb" name="Pax Sold" />
                    <Bar dataKey="revenue" fill="#16a34a" name="Revenue (RM)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {userRole === "admin" && (
          <TabsContent value="staff" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle>Staff Performance</CardTitle><CardDescription>Sales and collections by staff member</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={staffData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="staff" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#2563eb" name="Pax Sold" />
                    <Bar dataKey="revenue" fill="#16a34a" name="Revenue (RM)" />
                    <Bar dataKey="collections" fill="#f59e0b" name="Collections (RM)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {userRole === "admin" && (
          <TabsContent value="company" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Revenue Breakdown</CardTitle><CardDescription>Cash vs Debt vs Expenses</CardDescription></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" labelLine label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="value">
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Summary</CardTitle><CardDescription>Overall company metrics</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Total Revenue", value: totalRevenue, color: "text-green-600" },
                    { label: "Cash Sales", value: totalCashSales, color: "" },
                    { label: "Debt Sales", value: totalDebtSales, color: "text-destructive" },
                    { label: "Total Collections", value: totalCollected, color: "" },
                    { label: "Total Expenses", value: totalExpenses, color: "text-destructive" },
                    { label: "Net Profit", value: profit, color: profit >= 0 ? "text-green-600" : "text-destructive" },
                    { label: "Total Pax Sold", value: sales.reduce((s, x) => s + x.quantity, 0), color: "" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className={`font-bold ${color}`}>{typeof value === "number" ? formatCurrency(value) : value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
