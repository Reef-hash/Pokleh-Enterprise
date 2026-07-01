import { useState, useEffect } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormModal } from "@/components/ui/FormModal";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { QuantityInput } from "@/components/ui/MobileOptimizedInputs";
import { Plus, ArrowRight } from "lucide-react";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { useStockDistribution } from "@/hooks/useStockDistribution";
import { useStockIntake } from "@/hooks/useStockIntake";
import { useTrucks } from "@/hooks/useTrucks";
import { stockRpc } from "@/repositories/stockRepo";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";
import { PRODUCT_TYPES, type ProductType } from "@/types/pokleh";

interface StockDistributionFormProps {
  userRole: "admin" | "staff";
}

export const StockDistributionForm = ({ userRole }: StockDistributionFormProps) => {
  const { t } = useLanguage();
  const { distributions, loading, addDistribution } = useStockDistribution();
  const { intakes } = useStockIntake();
  const { trucks } = useTrucks();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    from_truck_id: "",
    to_truck_id: "",
    product_type: "Air Batu Besar" as ProductType,
    quantity_assigned: 0,
    intake_id: "",
  });
  const [available, setAvailable] = useState<number | null>(null);
  const [checkingAvailable, setCheckingAvailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!form.from_truck_id || !form.product_type) {
      setAvailable(null);
      return;
    }
    let cancelled = false;
    setCheckingAvailable(true);
    const today = new Date().toISOString().split("T")[0];
    stockRpc.getAvailableStock(form.from_truck_id, form.product_type, today).then(({ data, error }) => {
      if (cancelled) return;
      setAvailable(error ? null : (data as number));
      setCheckingAvailable(false);
    });
    return () => { cancelled = true; };
  }, [form.from_truck_id, form.product_type]);

  if (loading) return <PageLoader />;

  const truckIntakes = intakes.filter((i) => i.truck_id === form.from_truck_id);
  const overLimit = available !== null && form.quantity_assigned > available;

  const handleAdd = async () => {
    if (!form.from_truck_id || !form.to_truck_id || form.quantity_assigned <= 0 || submitting) {
      toast.error(t("stock.error-required"));
      return;
    }
    if (form.from_truck_id === form.to_truck_id) { toast.error(t("stock.error-same-truck")); return; }
    if (overLimit) return;
    setSubmitting(true);
    try {
      const result = await addDistribution({
        from_truck_id: form.from_truck_id,
        to_truck_id: form.to_truck_id,
        product_type: form.product_type,
        quantity_assigned: form.quantity_assigned,
        intake_id: form.intake_id || undefined,
      });
      if (result.success) {
        setForm({ from_truck_id: "", to_truck_id: "", product_type: "Air Batu Besar", quantity_assigned: 0, intake_id: "" });
        setIsOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('stock.distribution-title')}
        subtitle={t('stock.distribution-subtitle')}
      >
        {userRole === "admin" && (
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('stock.distribute')}</span>
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('stock.distribution-records')} ({distributions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.date')}</TableHead>
                <TableHead>{t('stock.from')}</TableHead>
                <TableHead>{t('stock.to')}</TableHead>
                <TableHead>{t('common.product')}</TableHead>
                <TableHead>{t('stock.qty-assigned')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {distributions.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</TableCell>
                  <TableCell><Badge variant="secondary">{d.from_truck?.name}</Badge></TableCell>
                  <TableCell className="flex items-center gap-1"><ArrowRight className="h-3 w-3 text-muted-foreground" /><Badge variant="secondary">{d.to_truck?.name}</Badge></TableCell>
                  <TableCell className="text-sm font-medium">{d.product_type}</TableCell>
                  <TableCell className="font-medium">{d.quantity_assigned} {t('common.pax')}</TableCell>
                </TableRow>
              ))}
              {distributions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {t('empty.no-stock-distribution')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3">
            {distributions.map((d) => (
              <ResponsiveCard key={d.id}>
                <ResponsiveRow label={t('common.date')}><span className="text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span></ResponsiveRow>
                <ResponsiveRow label={t('stock.from')}><Badge variant="secondary">{d.from_truck?.name}</Badge></ResponsiveRow>
                <ResponsiveRow label={t('stock.to')}><Badge variant="secondary">{d.to_truck?.name}</Badge></ResponsiveRow>
                <ResponsiveRow label={t('common.product')}>{d.product_type}</ResponsiveRow>
                <ResponsiveRow label={t('stock.qty-assigned')}><span className="font-medium">{d.quantity_assigned} {t('common.pax')}</span></ResponsiveRow>
              </ResponsiveCard>
            ))}
            {distributions.length === 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">{t('empty.no-stock-distribution')}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <FormModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title={t('stock.distribution-title')}
        description={t('stock.distribution-desc')}
        submitLabel={t('stock.distribute')}
        submitDisabled={!form.from_truck_id || !form.to_truck_id || form.quantity_assigned <= 0 || overLimit}
        isSubmitting={submitting}
        onSubmit={handleAdd}
        onCancel={() => setForm({ from_truck_id: "", to_truck_id: "", product_type: "Air Batu Besar", quantity_assigned: 0, intake_id: "" })}
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="from_truck" className="text-sm font-medium">{t('stock.from-truck')}</Label>
            <Select value={form.from_truck_id} onValueChange={(v) => setForm({ ...form, from_truck_id: v, intake_id: "" })}>
              <SelectTrigger id="from_truck"><SelectValue placeholder={t('stock.select-source')} /></SelectTrigger>
              <SelectContent>
                {trucks.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="to_truck" className="text-sm font-medium">{t('stock.to-truck')}</Label>
            <Select value={form.to_truck_id} onValueChange={(v) => setForm({ ...form, to_truck_id: v })}>
              <SelectTrigger id="to_truck"><SelectValue placeholder={t('stock.select-dest')} /></SelectTrigger>
              <SelectContent>
                {trucks.filter((t) => t.id !== form.from_truck_id).map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="product" className="text-sm font-medium">{t('common.product')}</Label>
            <Select value={form.product_type} onValueChange={(v) => setForm({ ...form, product_type: v as ProductType })}>
              <SelectTrigger id="product"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPES.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
              </SelectContent>
            </Select>
            {form.from_truck_id && (
              <p className="text-xs text-muted-foreground mt-1.5">
                {checkingAvailable ? t('stock.checking-stock') : available !== null ? `${t('stock.available')}: ${available} ${t('common.pax')}` : ""}
              </p>
            )}
          </div>

          {truckIntakes.length > 0 && (
            <div>
              <Label htmlFor="intake_ref" className="text-sm font-medium">{t('stock.intake-ref')} ({t('common.optional')})</Label>
              <Select value={form.intake_id || "none"} onValueChange={(v) => setForm({ ...form, intake_id: v === "none" ? "" : v })}>
                <SelectTrigger id="intake_ref"><SelectValue placeholder={t('stock.tag-intake')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('common.none')}</SelectItem>
                  {truckIntakes.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.product_type} — {new Date(i.intake_date).toLocaleDateString()} ({i.quantity_received} pax)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <QuantityInput
            label={t('stock.quantity-pax')}
            value={form.quantity_assigned || ""}
            onChange={(e) => setForm({ ...form, quantity_assigned: parseInt(e.target.value) || 0 })}
            min={1}
            max={available || undefined}
          />

          {overLimit && (
            <div className="bg-destructive/10 text-destructive text-xs p-2 rounded">
              {t('stock.error-exceeds')} ({available} {t('common.pax')})
            </div>
          )}
        </div>
      </FormModal>
    </div>
  );
};
