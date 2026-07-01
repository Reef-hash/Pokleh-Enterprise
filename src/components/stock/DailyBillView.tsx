import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, FileDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import type { DailyBillSummary } from "@/hooks/useDailyBill";

interface DailyBillViewProps {
  dailyBills: DailyBillSummary[];
  isLoading?: boolean;
}

export const DailyBillView = ({ dailyBills, isLoading }: DailyBillViewProps) => {
  const [filterDate, setFilterDate] = useState("");
  const [filterTruck, setFilterTruck] = useState("");

  const filtered = useMemo(() => {
    return dailyBills.filter((bill) => {
      if (filterDate && bill.date !== filterDate) return false;
      if (filterTruck && bill.truckId !== filterTruck) return false;
      return true;
    });
  }, [dailyBills, filterDate, filterTruck]);

  const trucks = useMemo(() => {
    return Array.from(new Set(dailyBills.map((b) => b.truckId))).map((id) => {
      const bill = dailyBills.find((b) => b.truckId === id);
      return { id, name: bill?.truckName || "Unknown" };
    });
  }, [dailyBills]);

  const totalAmount = filtered.reduce((sum, bill) => sum + bill.totalAmount, 0);

  if (isLoading) {
    return <div className="text-center py-8">Loading daily bills...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Daily Bills</h2>
        <p className="text-muted-foreground">
          Track daily wastage and payable amounts to suppliers
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-date">Date</Label>
              <Input
                id="filter-date"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-truck">Truck</Label>
              <Select value={filterTruck} onValueChange={setFilterTruck}>
                <SelectTrigger id="filter-truck">
                  <SelectValue placeholder="All trucks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All trucks</SelectItem>
                  {trucks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {filtered.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Bills</p>
                <p className="text-2xl font-bold">{filtered.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Units Sold</p>
                <p className="text-2xl font-bold">{filtered.reduce((s, b) => s + b.totalSold, 0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Wasted</p>
                <p className="text-2xl font-bold text-orange-600">
                  {filtered.reduce((s, b) => s + b.totalWasted, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Payable</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Bills Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No bills found</p>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Truck</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Sold</TableHead>
                      <TableHead className="text-right">Wasted</TableHead>
                      <TableHead className="text-right">Reduction</TableHead>
                      <TableHead className="text-right">Payable Qty</TableHead>
                      <TableHead className="text-right">Cost/Pax</TableHead>
                      <TableHead className="text-right">Amount (RM)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((bill) => (
                      <TableRow key={bill.date + bill.truckId} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {new Date(bill.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{bill.truckName}</TableCell>
                        <TableCell>
                          {bill.lines.map((l, idx) => (
                            <div key={idx} className="text-sm">
                              {l.productType}
                            </div>
                          ))}
                        </TableCell>
                        <TableCell className="text-right">
                          {bill.lines.map((l, idx) => (
                            <div key={idx}>{l.quantitySold}</div>
                          ))}
                        </TableCell>
                        <TableCell className="text-right">
                          {bill.lines.map((l, idx) => (
                            <div key={idx} className="text-orange-600 font-medium">
                              {l.quantityWasted}
                            </div>
                          ))}
                        </TableCell>
                        <TableCell className="text-right">
                          {bill.lines.map((l, idx) => (
                            <div key={idx} className="text-green-600">
                              {l.wastageReduction > 0 ? `-${l.wastageReduction}` : "—"}
                            </div>
                          ))}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {bill.lines.map((l, idx) => (
                            <div key={idx}>{l.payableQuantity}</div>
                          ))}
                        </TableCell>
                        <TableCell className="text-right">
                          {bill.lines.map((l, idx) => (
                            <div key={idx}>{formatCurrency(l.costPerPax)}</div>
                          ))}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {bill.lines.map((l, idx) => (
                            <div key={idx}>{formatCurrency(l.payableAmount)}</div>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={3}>TOTAL</TableCell>
                      <TableCell className="text-right">{filtered.reduce((s, b) => s + b.totalSold, 0)}</TableCell>
                      <TableCell className="text-right text-orange-600">
                        {filtered.reduce((s, b) => s + b.totalWasted, 0)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {filtered.reduce((s, b) => s + b.totalReduction, 0)}
                      </TableCell>
                      <TableCell className="text-right">{filtered.reduce((s, b) => s + b.totalPayable, 0)}</TableCell>
                      <TableCell />
                      <TableCell className="text-right text-green-600">{formatCurrency(totalAmount)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="block md:hidden space-y-3">
                {filtered.map((bill) => (
                  <ResponsiveCard key={bill.date + bill.truckId}>
                    <ResponsiveRow label="Date">{new Date(bill.date).toLocaleDateString()}</ResponsiveRow>
                    <ResponsiveRow label="Truck">
                      <span className="font-medium">{bill.truckName}</span>
                    </ResponsiveRow>
                    {bill.lines.map((line, idx) => (
                      <div key={idx} className="space-y-2 py-2 border-t">
                        <ResponsiveRow label="Product">{line.productType}</ResponsiveRow>
                        <ResponsiveRow label="Sold">{line.quantitySold}</ResponsiveRow>
                        <ResponsiveRow label="Wasted">
                          <span className="text-orange-600 font-medium">{line.quantityWasted}</span>
                        </ResponsiveRow>
                        {line.wastageReduction > 0 && (
                          <ResponsiveRow label="Reduction">
                            <span className="text-green-600">-{line.wastageReduction}</span>
                          </ResponsiveRow>
                        )}
                        <ResponsiveRow label="Payable Qty">
                          <span className="font-bold">{line.payableQuantity}</span>
                        </ResponsiveRow>
                        <ResponsiveRow label="Cost/Pax">{formatCurrency(line.costPerPax)}</ResponsiveRow>
                        <ResponsiveRow label="Amount">
                          <span className="font-bold">{formatCurrency(line.payableAmount)}</span>
                        </ResponsiveRow>
                      </div>
                    ))}
                  </ResponsiveCard>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
