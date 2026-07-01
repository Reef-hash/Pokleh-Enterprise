import { useState } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import { useDailyClosings } from "@/hooks/useDailyClosings";
import { useTrucks } from "@/hooks/useTrucks";
import { formatCurrency } from "@/lib/currency";
import { useLanguage } from "@/lib/i18n";
import { PRODUCT_TYPES, type ProductType } from "@/types/pokleh";

interface DailyClosingWorkflowProps {
  userRole: "admin" | "staff";
}

export const DailyClosingWorkflow = ({ userRole }: DailyClosingWorkflowProps) => {
  const { t } = useLanguage();
  const { closings, loading, closeDay, reconcileDay } = useDailyClosings();
  const { trucks } = useTrucks();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [truckId, setTruckId] = useState("");
  const [productType, setProductType] = useState<ProductType>("Air Batu Besar");
  const [action, setAction] = useState<"close" | "reconcile">("close");
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (loading) return <PageLoader />;

  const selectedClosing = closings.find(
    (c) => c.closing_date === date && c.truck_id === truckId && c.product_type === productType
  );
  const selectedTruck = trucks.find((t) => t.id === truckId);

  const handleConfirm = async () => {
    setConfirmOpen(false);
    if (action === "close") {
      await closeDay(date, truckId, productType);
    } else {
      await reconcileDay(date, truckId, productType);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      open: { label: t('closing.status-open'), variant: "secondary" },
      closed: { label: t('closing.status-closed'), variant: "default" },
      reconciled: { label: t('closing.status-reconciled'), variant: "outline" },
    };
    const s = map[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const canClose = selectedClosing?.status === "open" || !selectedClosing;
  const canReconcile = selectedClosing?.status === "closed";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t('closing.title')}</h2>
        <p className="text-muted-foreground">{t('closing.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('closing.close-reconcile')}</CardTitle>
          <CardDescription>{t('closing.close-reconcile-desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{t('closing.date-label')}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('closing.truck-label')}</Label>
              <Select value={truckId} onValueChange={setTruckId}>
                <SelectTrigger><SelectValue placeholder={t('closing.truck-select')} /></SelectTrigger>
                <SelectContent>
                  {trucks.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('closing.product-label')}</Label>
              <Select value={productType} onValueChange={(v) => setProductType(v as ProductType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {truckId && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{selectedTruck?.name} — {productType} — {new Date(date).toLocaleDateString()}</span>
                {selectedClosing ? statusBadge(selectedClosing.status) : <Badge variant="secondary">{t('closing.status-open')} ({t('closing.no-record')})</Badge>}
              </div>
              {selectedClosing && selectedClosing.status !== "open" && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span>{t('closing.intake')}: {selectedClosing.total_intake}</span>
                  <span>{t('closing.transfer-in')}: {selectedClosing.total_transfer_in}</span>
                  <span>{t('closing.sold')}: {selectedClosing.total_sold}</span>
                  <span>{t('closing.transfer-out')}: {selectedClosing.total_transfer_out}</span>
                  <span>{t('closing.returned')}: {selectedClosing.total_returned}</span>
                  <span>{t('closing.carry-forward')}: {selectedClosing.closing_balance}</span>
                  <span>{t('closing.cash')}: {formatCurrency(selectedClosing.cash_sales)}</span>
                  <span>{t('closing.debt')}: {formatCurrency(selectedClosing.debt_sales)}</span>
                  <span>{t('closing.collections')}: {formatCurrency(selectedClosing.debt_collections)}</span>
                  <span>{t('closing.expenses')}: {formatCurrency(selectedClosing.expenses_total)}</span>
                  <span>{t('closing.profit')}: {formatCurrency(selectedClosing.profit_estimate)}</span>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Button
                  disabled={!canClose}
                  onClick={() => { setAction("close"); setConfirmOpen(true); }}
                >
                  <Lock className="mr-2 h-4 w-4" /> {t('closing.close-day')}
                </Button>
                {userRole === "admin" && (
                  <Button
                    variant="outline"
                    disabled={!canReconcile}
                    onClick={() => { setAction("reconcile"); setConfirmOpen(true); }}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> {t('closing.reconcile')}
                  </Button>
                )}
              </div>
              {!canClose && action === "close" && selectedClosing && selectedClosing.status !== "open" && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" /> {t('closing.already-status')} {selectedClosing.status}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('closing.records')} ({closings.length})</CardTitle>
          <CardDescription>{t('closing.all-closed')}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.date')}</TableHead>
                  <TableHead>{t('common.truck')}</TableHead>
                  <TableHead>{t('closing.product')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('closing.intake')}</TableHead>
                  <TableHead>{t('closing.sold')}</TableHead>
                  <TableHead>{t('closing.balance')}</TableHead>
                  <TableHead>{t('closing.cash')}</TableHead>
                  <TableHead>{t('closing.profit')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closings.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{new Date(c.closing_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{c.truck?.name || "—"}</TableCell>
                    <TableCell className="text-sm">{c.product_type}</TableCell>
                    <TableCell>{statusBadge(c.status)}</TableCell>
                    <TableCell>{c.total_intake}</TableCell>
                    <TableCell>{c.total_sold}</TableCell>
                    <TableCell>{c.closing_balance}</TableCell>
                    <TableCell>{formatCurrency(c.cash_sales)}</TableCell>
                    <TableCell className={c.profit_estimate >= 0 ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                      {formatCurrency(c.profit_estimate)}
                    </TableCell>
                  </TableRow>
                ))}
                {closings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      {t('empty.no-closings')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3">
            {closings.map((c) => (
              <ResponsiveCard key={c.id}>
                <ResponsiveRow label={t('common.date')}>
                  {new Date(c.closing_date).toLocaleDateString()}
                </ResponsiveRow>
                <ResponsiveRow label={t('common.truck')}>
                  <span className="font-medium">{c.truck?.name || "—"}</span>
                </ResponsiveRow>
                <ResponsiveRow label={t('closing.product')}>{c.product_type}</ResponsiveRow>
                <ResponsiveRow label={t('common.status')}>{statusBadge(c.status)}</ResponsiveRow>
                <ResponsiveRow label={t('closing.intake')}>{c.total_intake}</ResponsiveRow>
                <ResponsiveRow label={t('closing.sold')}>{c.total_sold}</ResponsiveRow>
                <ResponsiveRow label={t('closing.balance')}>{c.closing_balance}</ResponsiveRow>
                <ResponsiveRow label={t('closing.cash')}>{formatCurrency(c.cash_sales)}</ResponsiveRow>
                <ResponsiveRow label={t('closing.profit')}>
                  <span className={c.profit_estimate >= 0 ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                    {formatCurrency(c.profit_estimate)}
                  </span>
                </ResponsiveRow>
              </ResponsiveCard>
            ))}
            {closings.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {t('empty.no-closings')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('closing.confirm')} {action === "close" ? t('closing.close-day') : t('closing.reconcile')}</DialogTitle>
            <DialogDescription>
              {action === "close"
                ? t('closing.confirm-close-desc')
                : t('closing.confirm-reconcile-desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p><strong>{t('common.date')}:</strong> {new Date(date).toLocaleDateString()}</p>
            <p><strong>{t('common.truck')}:</strong> {selectedTruck?.name}</p>
            <p><strong>{t('closing.product')}:</strong> {productType}</p>
            {action === "close" && (
              <p className="text-sm text-muted-foreground mt-2">
                {t('closing.validation-note')}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleConfirm}>
              {action === "close" ? t('closing.close-day') : t('closing.reconcile')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
