import { useState, useMemo, Fragment } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, FileDown, TrendingUp, Download } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import { generateDetailedBillPDF } from "@/lib/pdf-utils";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";
import type { DailyBillSummary } from "@/hooks/useDailyBill";

interface DailyBillViewProps {
  dailyBills: DailyBillSummary[];
  isLoading?: boolean;
}

export const DailyBillView = ({ dailyBills, isLoading }: DailyBillViewProps) => {
  const { t } = useLanguage();
  const [filterDate, setFilterDate] = useState("");
  const [filterTruck, setFilterTruck] = useState("all");
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const filtered = useMemo(() => {
    return dailyBills.filter((bill) => {
      if (filterDate && bill.date !== filterDate) return false;
      if (filterTruck && filterTruck !== "all" && bill.truckId !== filterTruck) return false;
      return true;
    });
  }, [dailyBills, filterDate, filterTruck]);

  const trucks = useMemo(() => {
    return Array.from(new Set(dailyBills.map((b) => b.truckId))).map((id) => {
      const bill = dailyBills.find((b) => b.truckId === id);
      return { id, name: bill?.truckName || t('wastage-adj.unknown') };
    });
  }, [dailyBills, t]);

  const totalAmount = filtered.reduce((sum, bill) => sum + bill.totalAmount, 0);

  const handleExportPDF = async () => {
    try {
      setGeneratingPDF(true);
      generateDetailedBillPDF(filtered, "POKLEH ENTERPRISE");
      toast.success(t('common.success'));
    } catch (error) {
      toast.error(t('common.error'));
      console.error(error);
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t('stock.daily-bills-title')}</h2>
          <p className="text-muted-foreground">
            {t('stock.daily-bills-subtitle')}
          </p>
        </div>
        {filtered.length > 0 && (
          <Button
            onClick={handleExportPDF}
            disabled={generatingPDF}
            variant="default"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {generatingPDF ? t('common.loading') : t('stock.export-pdf')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('stock.filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-date">{t('common.date')}</Label>
              <Input
                id="filter-date"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-truck">{t('common.truck')}</Label>
              <Select value={filterTruck} onValueChange={setFilterTruck}>
                <SelectTrigger id="filter-truck">
                  <SelectValue placeholder={t('customer.all-trucks')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('customer.all-trucks')}</SelectItem>
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
                <p className="text-sm text-muted-foreground">{t('stock.total-bills')}</p>
                <p className="text-2xl font-bold">{filtered.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('sales.total-sold')}</p>
                <p className="text-2xl font-bold">{filtered.reduce((s, b) => s + b.totalSold, 0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('stock.reason-damaged')}</p>
                <p className="text-2xl font-bold text-orange-600">
                  {filtered.reduce((s, b) => s + b.totalWasted, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('supplier.table-payable')}</p>
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
            {t('stock.daily-bills-breakdown')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('empty.no-collections')}</p>
          ) : (
            <>
              {/* Desktop Table — grouped rows: one group per bill (date+truck) */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('common.date')}</TableHead>
                      <TableHead>{t('common.truck')}</TableHead>
                      <TableHead>{t('supplier.title')}</TableHead>
                      <TableHead>{t('common.product')}</TableHead>
                      <TableHead className="text-right">{t('closing.sold')}</TableHead>
                      <TableHead className="text-right">{t('stock.reason-damaged')}</TableHead>
                      <TableHead className="text-right">{t('supplier.table-reduction')}</TableHead>
                      <TableHead className="text-right">{t('supplier.table-payable-qty')}</TableHead>
                      <TableHead className="text-right">{t('supplier.cost-per-pax')}</TableHead>
                      <TableHead className="text-right">{t('common.amount')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((bill) => (
                      <Fragment key={bill.date + bill.truckId}>
                        {/* Group header — date + truck */}
                        <TableRow className="bg-blue-50 dark:bg-blue-950/40 border-y-2 border-blue-200 dark:border-blue-800">
                          <TableCell colSpan={10} className="font-bold text-blue-700 dark:text-blue-300 py-2">
                            {new Date(bill.date).toLocaleDateString()} — {bill.truckName}
                          </TableCell>
                        </TableRow>
                        {/* Line rows — one row per product */}
                        {bill.lines.map((line, idx) => (
                          <TableRow key={idx} className="hover:bg-muted/50">
                            <TableCell className="text-muted-foreground">—</TableCell>
                            <TableCell className="text-muted-foreground">—</TableCell>
                            <TableCell>{line.supplierName}</TableCell>
                            <TableCell className="font-medium">{line.productType}</TableCell>
                            <TableCell className="text-right">{line.quantitySold}</TableCell>
                            <TableCell className="text-right text-orange-600 font-medium">
                              {line.quantityWasted}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              {line.wastageReduction > 0 ? `-${line.wastageReduction}` : "—"}
                            </TableCell>
                            <TableCell className="text-right font-bold">{line.payableQuantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(line.costPerPax)}</TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(line.payableAmount)}</TableCell>
                          </TableRow>
                        ))}
                        {/* Subtotal row for this bill */}
                        <TableRow className="bg-muted/40 font-bold border-t border-muted">
                          <TableCell colSpan={4} className="text-muted-foreground">
                            {t('stock.subtotal-truck').replace('{truck}', bill.truckName)}
                          </TableCell>
                          <TableCell className="text-right">{bill.totalSold}</TableCell>
                          <TableCell className="text-right text-orange-600">{bill.totalWasted}</TableCell>
                          <TableCell className="text-right text-green-600">{bill.totalReduction}</TableCell>
                          <TableCell className="text-right">{bill.totalPayable}</TableCell>
                          <TableCell />
                          <TableCell className="text-right text-green-600">{formatCurrency(bill.totalAmount)}</TableCell>
                        </TableRow>
                      </Fragment>
                    ))}
                    {/* Grand total */}
                    <TableRow className="bg-blue-600 hover:bg-blue-600 text-white font-bold border-t-2 border-blue-800">
                      <TableCell colSpan={4}>{t('stock.grand-total-pax').replace('{pax}', t('common.pax'))}</TableCell>
                      <TableCell className="text-right">{filtered.reduce((s, b) => s + b.totalSold, 0)}</TableCell>
                      <TableCell className="text-right">{filtered.reduce((s, b) => s + b.totalWasted, 0)}</TableCell>
                      <TableCell className="text-right">{filtered.reduce((s, b) => s + b.totalReduction, 0)}</TableCell>
                      <TableCell className="text-right">{filtered.reduce((s, b) => s + b.totalPayable, 0)}</TableCell>
                      <TableCell />
                      <TableCell className="text-right">{formatCurrency(totalAmount)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards — grouped per bill with line items */}
              <div className="block md:hidden space-y-4">
                {filtered.map((bill) => (
                  <ResponsiveCard key={bill.date + bill.truckId}>
                    {/* Bill header */}
                    <div className="flex items-center justify-between border-b pb-2 mb-2">
                      <div>
                        <p className="text-sm text-muted-foreground">{new Date(bill.date).toLocaleDateString()}</p>
                        <p className="font-bold text-blue-700 dark:text-blue-300">{bill.truckName}</p>
                      </div>
                      <Badge variant="secondary" className="font-bold">
                        {formatCurrency(bill.totalAmount)}
                      </Badge>
                    </div>
                    {/* Line items */}
                    {bill.lines.map((line, idx) => (
                      <div key={idx} className="space-y-1 py-2 border-t first:border-t-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{line.productType}</span>
                          <span className="text-xs text-muted-foreground">{line.supplierName}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                          <ResponsiveRow label={t('closing.sold')}>
                            <span>{line.quantitySold}</span>
                          </ResponsiveRow>
                          <ResponsiveRow label={t('stock.reason-damaged')}>
                            <span className="text-orange-600 font-medium">{line.quantityWasted}</span>
                          </ResponsiveRow>
                          {line.wastageReduction > 0 && (
                            <ResponsiveRow label={t('supplier.table-reduction')}>
                              <span className="text-green-600">-{line.wastageReduction}</span>
                            </ResponsiveRow>
                          )}
                          <ResponsiveRow label={t('supplier.table-payable-qty')}>
                            <span className="font-bold">{line.payableQuantity}</span>
                          </ResponsiveRow>
                          <ResponsiveRow label={t('supplier.cost-per-pax')}>
                            {formatCurrency(line.costPerPax)}
                          </ResponsiveRow>
                          <ResponsiveRow label={t('common.amount')}>
                            <span className="font-bold">{formatCurrency(line.payableAmount)}</span>
                          </ResponsiveRow>
                        </div>
                      </div>
                    ))}
                    {/* Bill subtotal */}
                    <div className="border-t pt-2 mt-1 space-y-1 text-sm">
                      <ResponsiveRow label={`${t('closing.sold')}`}>
                        <span className="font-bold">{bill.totalSold}</span>
                      </ResponsiveRow>
                      <ResponsiveRow label={t('stock.reason-damaged')}>
                        <span className="font-bold text-orange-600">{bill.totalWasted}</span>
                      </ResponsiveRow>
                      <ResponsiveRow label={t('supplier.table-payable-qty')}>
                        <span className="font-bold">{bill.totalPayable}</span>
                      </ResponsiveRow>
                      <ResponsiveRow label={t('common.amount')}>
                        <span className="font-bold text-green-600">{formatCurrency(bill.totalAmount)}</span>
                      </ResponsiveRow>
                    </div>
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
