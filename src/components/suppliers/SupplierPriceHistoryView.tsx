import { useState } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useSupplierPriceHistory } from "@/hooks/useSupplierPriceHistory";
import { usePoklehSuppliers } from "@/hooks/usePoklehSuppliers";
import { formatCurrency } from "@/lib/currency";
import { useLanguage } from "@/lib/i18n";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";

export const SupplierPriceHistoryView = () => {
  const { t } = useLanguage();
  const { history, loading } = useSupplierPriceHistory();
  const { suppliers } = usePoklehSuppliers();
  const [filterSupplier, setFilterSupplier] = useState("all");

  if (loading) return <PageLoader />;

  const filtered = filterSupplier === "all"
    ? history
    : history.filter((h) => h.supplier_id === filterSupplier);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t('supplier.price-history-title')}</h2>
        <p className="text-muted-foreground">{t('supplier.price-history-subtitle')}</p>
      </div>

      <div className="w-64 space-y-2">
        <Label>{t('supplier.filter-by-supplier')}</Label>
        <Select value={filterSupplier} onValueChange={setFilterSupplier}>
          <SelectTrigger><SelectValue placeholder={t('supplier.all-suppliers')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('supplier.all-suppliers')}</SelectItem>
            {suppliers.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('supplier.price-changes')} ({filtered.length})</CardTitle>
          <CardDescription>{t('supplier.append-only-record')}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('supplier.effective-date')}</TableHead>
                <TableHead>{t('supplier.supplier')}</TableHead>
                <TableHead>{t('supplier.cost-per-pax')}</TableHead>
                <TableHead>{t('supplier.recorded-at')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((h) => {
                const supplier = suppliers.find((s) => s.id === h.supplier_id);
                return (
                  <TableRow key={h.id}>
                    <TableCell>{new Date(h.effective_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{supplier?.name || "—"}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(h.cost_per_pax)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(h.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    {t('empty.no-price-history')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3">
            {filtered.map((h) => {
              const supplier = suppliers.find((s) => s.id === h.supplier_id);
              return (
                <ResponsiveCard key={h.id}>
                  <ResponsiveRow label={t('supplier.effective-date')}>{new Date(h.effective_date).toLocaleDateString()}</ResponsiveRow>
                  <ResponsiveRow label={t('supplier.supplier')}><span className="font-medium">{supplier?.name || "—"}</span></ResponsiveRow>
                  <ResponsiveRow label={t('supplier.cost-per-pax')}><span className="font-medium">{formatCurrency(h.cost_per_pax)}</span></ResponsiveRow>
                  <ResponsiveRow label={t('supplier.recorded-at')}><span className="text-muted-foreground text-sm">{new Date(h.created_at).toLocaleDateString()}</span></ResponsiveRow>
                </ResponsiveCard>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">{t('empty.no-price-history')}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

