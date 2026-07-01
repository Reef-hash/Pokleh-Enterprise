import { useState, useMemo } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Droplet } from "lucide-react";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import { RecordWastageForm } from "./RecordWastageForm";
import { useStockWastage } from "@/hooks/useStockWastage";
import { useTrucks } from "@/hooks/useTrucks";
import { useLanguage } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";

interface RecordWastagePageProps {
  userRole: "admin" | "staff";
}

export const RecordWastagePage = ({ userRole }: RecordWastagePageProps) => {
  const { t } = useLanguage();
  const { wastages, addWastage, loading } = useStockWastage();
  const { trucks } = useTrucks();

  const totalWasted = useMemo(() => {
    return wastages.reduce((sum, w) => sum + w.quantity_wasted, 0);
  }, [wastages]);

  const wastedByTruck = useMemo(() => {
    const grouped = new Map<string, number>();
    wastages.forEach((w) => {
      grouped.set(w.truck_id, (grouped.get(w.truck_id) || 0) + w.quantity_wasted);
    });
    return grouped;
  }, [wastages]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t('stock.wastage-title')}</h2>
        <p className="text-muted-foreground">{t('stock.wastage-subtitle')}</p>
      </div>

      <RecordWastageForm trucks={trucks} onSubmit={addWastage} isLoading={loading} />

      {/* Summary Cards */}
      {wastages.length > 0 && (
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('stock.wastage-records')}</p>
                <p className="text-2xl font-bold">{wastages.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Units Wasted</p>
                <p className="text-2xl font-bold text-orange-600">{totalWasted}</p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="text-sm text-muted-foreground">Last 7 Days</p>
                <p className="text-lg font-bold">
                  {wastages.filter(
                    (w) =>
                      new Date(w.waste_date).getTime() >
                      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime()
                  ).length}
                  {" records"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Wastage Records */}
      {wastages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplet className="h-5 w-5 text-orange-500" />
              Recent Wastage Records
            </CardTitle>
            <CardDescription>Last 20 records ({t('common.pax')})</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead>{t('common.truck')}</TableHead>
                    <TableHead>{t('common.product')}</TableHead>
                    <TableHead className="text-right">{t('common.quantity')}</TableHead>
                    <TableHead>{t('common.notes')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wastages.slice(0, 20).map((w) => {
                    const truck = trucks.find((t) => t.id === w.truck_id);
                    return (
                      <TableRow key={w.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {new Date(w.waste_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{truck?.name || "Unknown"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{w.product_type}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-orange-600">
                          {w.quantity_wasted}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {w.notes || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="block md:hidden space-y-3">
              {wastages.slice(0, 20).map((w) => {
                const truck = trucks.find((t) => t.id === w.truck_id);
                return (
                  <ResponsiveCard key={w.id}>
                    <ResponsiveRow label={t('common.date')}>
                      {new Date(w.waste_date).toLocaleDateString()}
                    </ResponsiveRow>
                    <ResponsiveRow label={t('common.truck')}>{truck?.name || "Unknown"}</ResponsiveRow>
                    <ResponsiveRow label={t('common.product')}>
                      <Badge variant="outline">{w.product_type}</Badge>
                    </ResponsiveRow>
                    <ResponsiveRow label={t('common.quantity')}>
                      <span className="font-bold text-orange-600">{w.quantity_wasted}</span>
                    </ResponsiveRow>
                    {w.notes && <ResponsiveRow label={t('common.notes')}>{w.notes}</ResponsiveRow>}
                  </ResponsiveCard>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {wastages.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Droplet className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">{t('empty.no-collections')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
