import { useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useSales } from "@/hooks/useSales";
import { useExpenses } from "@/hooks/useExpenses";
import { useDebtCollection } from "@/hooks/useDebtCollection";
import { useStockIntake } from "@/hooks/useStockIntake";
import { useTrucks } from "@/hooks/useTrucks";
import { useDailyClosings } from "@/hooks/useDailyClosings";
import { useStockWastage } from "@/hooks/useStockWastage";
import { PRODUCT_TYPES, type ProductType } from "@/types/pokleh";
import { formatCurrency } from "@/lib/currency";
import { useLanguage } from "@/lib/i18n";

const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#f59e0b", "#8b5cf6", "#ec4899"];

interface PoklehReportsProps {
  userRole: "admin" | "staff";
}

export const PoklehReports = ({ userRole }: PoklehReportsProps) => {
  const { t } = useLanguage();
  const { sales } = useSales();
  const { expenses } = useExpenses();
  const { collections } = useDebtCollection();
  const { intakes } = useStockIntake();
  const { trucks } = useTrucks();
  const { closings } = useDailyClosings();
  const { wastages } = useStockWastage();

  const dailyData = useMemo(() => {
    const map = new Map<string, { date: string; sold: number; cash: number; debt: number; collected: number; expenses: number; received: number; wasted: number }>();
    const add = (date: string) => { if (!map.has(date)) map.set(date, { date, sold: 0, cash: 0, debt: 0, collected: 0, expenses: 0, received: 0, wasted: 0 }); };
    sales.forEach((s) => { add(s.sale_date); const d = map.get(s.sale_date)!; d.sold += s.quantity; if (s.payment_type === "cash") d.cash += s.selling_price; else d.debt += s.selling_price; });
    collections.forEach((c) => { add(c.collection_date); map.get(c.collection_date)!.collected += c.amount; });
    expenses.forEach((e) => { add(e.expense_date); map.get(e.expense_date)!.expenses += e.amount; });
    intakes.forEach((i) => { add(i.intake_date); map.get(i.intake_date)!.received += i.quantity_received; });
    wastages.forEach((w) => { add(w.waste_date); map.get(w.waste_date)!.wasted += w.quantity_wasted; });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  }, [sales, collections, expenses, intakes, wastages]);

  const truckData = useMemo(() => {
    const map = new Map<string, { truck: string; sold: number; revenue: number }>();
    trucks.forEach((t) => { if (!map.has(t.id)) map.set(t.id, { truck: t.name, sold: 0, revenue: 0 }); });
    sales.forEach((s) => {
      if (map.has(s.truck_id)) { const d = map.get(s.truck_id)!; d.sold += s.quantity; d.revenue += s.selling_price; }
    });
    return Array.from(map.values());
  }, [sales, trucks]);

  const totalRevenue = useMemo(() => sales.reduce((s, x) => s + x.selling_price, 0), [sales]);
  const totalExpenses = useMemo(() => expenses.reduce((s, x) => s + x.amount, 0), [expenses]);
  const totalCollected = useMemo(() => collections.reduce((s, x) => s + x.amount, 0), [collections]);
  const totalCashSales = useMemo(() => sales.filter((s) => s.payment_type === "cash").reduce((s, x) => s + x.selling_price, 0), [sales]);
  const totalDebtSales = useMemo(() => sales.filter((s) => s.payment_type === "debt").reduce((s, x) => s + x.selling_price, 0), [sales]);

  const soldByKey = useMemo(() => {
    const m = new Map<string, number>();
    sales.forEach((s) => { const k = `${s.sale_date}|${s.truck_id}|${s.product_type}`; m.set(k, (m.get(k) ?? 0) + s.quantity); });
    return m;
  }, [sales]);

  const wastedByKey = useMemo(() => {
    const m = new Map<string, number>();
    wastages.forEach((w) => { const k = `${w.waste_date}|${w.truck_id}|${w.product_type}`; m.set(k, (m.get(k) ?? 0) + w.quantity_wasted); });
    return m;
  }, [wastages]);

  const closingByKey = useMemo(() => {
    const m = new Map<string, typeof closings[number]>();
    closings.forEach((c) => m.set(`${c.closing_date}|${c.truck_id}|${c.product_type}`, c));
    return m;
  }, [closings]);

  const getCostPerPax = useCallback((truckId: string, productType: ProductType, date: string): number => {
    const matching = intakes.filter((i) => i.truck_id === truckId && i.product_type === productType);
    const earlierOrSame = matching.filter((i) => i.intake_date <= date).sort((a, b) => b.intake_date.localeCompare(a.intake_date));
    if (earlierOrSame.length) return earlierOrSame[0].cost_per_pax;
    return matching.length ? matching[0].cost_per_pax : 0;
  }, [intakes]);

  const totalSupplierPayable = useMemo(() => {
    const keys = new Set<string>();
    soldByKey.forEach((_, k) => keys.add(k));
    wastedByKey.forEach((_, k) => keys.add(k));
    closingByKey.forEach((_, k) => keys.add(k));

    let total = 0;
    keys.forEach((key) => {
      const [date, truckId, productType] = key.split("|") as [string, string, ProductType];
      const closing = closingByKey.get(key);
      const value = closing
        ? closing.supplier_payable
        : ((soldByKey.get(key) ?? 0) + (wastedByKey.get(key) ?? 0)) * getCostPerPax(truckId, productType, date);
      total += value;
    });

    return total;
  }, [soldByKey, wastedByKey, closingByKey, getCostPerPax]);

  const profit = totalRevenue - totalSupplierPayable - totalExpenses;

  const pieData = useMemo(() => [
    { name: t('report.cash-sales'), value: totalCashSales },
    { name: t('report.debt-sales'), value: totalDebtSales },
    { name: t('report.expenses'), value: totalExpenses },
  ], [totalCashSales, totalDebtSales, totalExpenses, t]);

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

  const productData = useMemo(() => {
    const map = new Map<ProductType, { product: ProductType; sold: number; revenue: number; wasted: number }>();
    PRODUCT_TYPES.forEach((p) => map.set(p, { product: p, sold: 0, revenue: 0, wasted: 0 }));
    sales.forEach((s) => { const d = map.get(s.product_type)!; d.sold += s.quantity; d.revenue += s.selling_price; });
    wastages.forEach((w) => { map.get(w.product_type)!.wasted += w.quantity_wasted; });
    return Array.from(map.values());
  }, [sales, wastages]);

  const closingRows = useMemo(
    () => [...closings].sort((a, b) => b.closing_date.localeCompare(a.closing_date)),
    [closings]
  );

  const closingTrend = useMemo(() => {
    const map = new Map<string, { date: string; profit: number; payable: number; cash: number }>();
    closings.forEach((c) => {
      if (!map.has(c.closing_date)) map.set(c.closing_date, { date: c.closing_date, profit: 0, payable: 0, cash: 0 });
      const d = map.get(c.closing_date)!;
      d.profit += c.profit_estimate;
      d.payable += c.supplier_payable;
      d.cash += c.cash_sales;
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [closings]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t('report.title')}</h2>
        <p className="text-muted-foreground">{t('report.subtitle')}</p>
      </div>

      {userRole === "admin" && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t('report.revenue')}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t('report.expenses')}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t('report.profit')}</CardTitle></CardHeader><CardContent><p className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-destructive"}`}>{formatCurrency(profit)}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t('report.collections')}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(totalCollected)}</p></CardContent></Card>
        </div>
      )}

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">{t('report.daily-trends')}</TabsTrigger>
          {userRole === "admin" && <TabsTrigger value="truck">{t('report.by-truck')}</TabsTrigger>}
          {userRole === "admin" && <TabsTrigger value="staff">{t('report.by-staff')}</TabsTrigger>}
          {userRole === "admin" && <TabsTrigger value="company">{t('report.company-overview')}</TabsTrigger>}
          {userRole === "admin" && <TabsTrigger value="closing-summary">{t('report.closing-summary')}</TabsTrigger>}
        </TabsList>

        <TabsContent value="daily" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>{t('report.daily-sales-collections')}</CardTitle><CardDescription>{t('report.cash-debt-collections')}</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cash" stroke="#16a34a" name={t('report.cash-sales')} strokeWidth={2} />
                  <Line type="monotone" dataKey="debt" stroke="#dc2626" name={t('report.debt-sales')} strokeWidth={2} />
                  <Line type="monotone" dataKey="collected" stroke="#2563eb" name={t('report.collections')} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t('report.daily-stock')}</CardTitle><CardDescription>{t('report.stock-received-sold-expenses')}</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="received" fill="#8b5cf6" name={t('report.received')} />
                  <Bar dataKey="sold" fill="#16a34a" name={t('report.sold')} />
                  <Bar dataKey="expenses" fill="#dc2626" name={t('report.expenses')} />
                  <Bar dataKey="wasted" fill="#ec4899" name={t('report.wasted')} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {userRole === "admin" && (
          <TabsContent value="truck" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle>{t('report.sales-by-truck')}</CardTitle><CardDescription>{t('report.comparison-trucks')}</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={truckData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="truck" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sold" fill="#2563eb" name={t('report.pax-sold')} />
                    <Bar dataKey="revenue" fill="#16a34a" name={t('report.revenue-rm')} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {userRole === "admin" && (
          <TabsContent value="staff" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle>{t('report.staff-performance')}</CardTitle><CardDescription>{t('report.sales-collections-staff')}</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={staffData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="staff" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#2563eb" name={t('report.pax-sold')} />
                    <Bar dataKey="revenue" fill="#16a34a" name={t('report.revenue-rm')} />
                    <Bar dataKey="collections" fill="#f59e0b" name={t('report.collections-rm')} />
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
                <CardHeader><CardTitle>{t('report.revenue-breakdown')}</CardTitle><CardDescription>{t('report.cash-debt-breakdown')}</CardDescription></CardHeader>
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
                <CardHeader><CardTitle>{t('report.summary')}</CardTitle><CardDescription>{t('report.overall-metrics')}</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: t('report.revenue'), value: totalRevenue, color: "text-green-600" },
                    { label: t('report.cash-sales'), value: totalCashSales, color: "" },
                    { label: t('report.debt-sales'), value: totalDebtSales, color: "text-destructive" },
                    { label: t('report.total-collections'), value: totalCollected, color: "" },
                    { label: t('report.total-expenses'), value: totalExpenses, color: "text-destructive" },
                    { label: t('report.net-profit'), value: profit, color: profit >= 0 ? "text-green-600" : "text-destructive" },
                    { label: t('report.total-pax'), value: sales.reduce((s, x) => s + x.quantity, 0), color: "" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className={`font-bold ${color}`}>{typeof value === "number" ? formatCurrency(value) : value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle>{t('report.product-breakdown')}</CardTitle><CardDescription>{t('report.product-breakdown-desc')}</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={productData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="product" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sold" fill="#2563eb" name={t('report.pax-sold')} />
                    <Bar dataKey="revenue" fill="#16a34a" name={t('report.revenue-rm')} />
                    <Bar dataKey="wasted" fill="#ec4899" name={t('report.wasted')} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {userRole === "admin" && (
          <TabsContent value="closing-summary" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle>{t('report.closing-trend')}</CardTitle><CardDescription>{t('report.closing-trend-desc')}</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={closingTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="profit" stroke="#16a34a" name={t('report.profit')} strokeWidth={2} />
                    <Line type="monotone" dataKey="payable" stroke="#dc2626" name={t('report.supplier-payable')} strokeWidth={2} />
                    <Line type="monotone" dataKey="cash" stroke="#2563eb" name={t('report.cash-sales')} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t('report.closing-summary')}</CardTitle><CardDescription>{t('report.closing-summary-desc')}</CardDescription></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('report.date')}</TableHead>
                      <TableHead>{t('report.truck')}</TableHead>
                      <TableHead>{t('report.product')}</TableHead>
                      <TableHead>{t('report.status')}</TableHead>
                      <TableHead className="text-right">{t('report.sold')}</TableHead>
                      <TableHead className="text-right">{t('report.cash-sales')}</TableHead>
                      <TableHead className="text-right">{t('report.profit')}</TableHead>
                      <TableHead className="text-right">{t('report.supplier-payable')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {closingRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.closing_date}</TableCell>
                        <TableCell>{row.truck?.name ?? "-"}</TableCell>
                        <TableCell>{row.product_type}</TableCell>
                        <TableCell className="capitalize">{row.status}</TableCell>
                        <TableCell className="text-right">{row.total_sold}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.cash_sales)}</TableCell>
                        <TableCell className={`text-right ${row.profit_estimate >= 0 ? "text-green-600" : "text-destructive"}`}>
                          {formatCurrency(row.profit_estimate)}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(row.supplier_payable)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
