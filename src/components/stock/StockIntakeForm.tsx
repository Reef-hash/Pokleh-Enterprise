import { useState } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormModal } from "@/components/ui/FormModal";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberInput, CurrencyInput } from "@/components/ui/MobileOptimizedInputs";
import { Plus, Package } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useStockIntake } from "@/hooks/useStockIntake";
import { usePoklehSuppliers } from "@/hooks/usePoklehSuppliers";
import { useTrucks } from "@/hooks/useTrucks";
import { formatCurrency } from "@/lib/currency";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";
import { PRODUCT_TYPES, type ProductType } from "@/types/pokleh";

interface StockIntakeFormProps {
  userRole: "admin" | "staff";
}

type LineState = Record<ProductType, { quantity_received: string; cost_per_pax: string }>;

const emptyLines = (): LineState =>
  PRODUCT_TYPES.reduce((acc, p) => {
    acc[p] = { quantity_received: "", cost_per_pax: "" };
    return acc;
  }, {} as LineState);

export const StockIntakeForm = ({ userRole }: StockIntakeFormProps) => {
  const { t } = useLanguage();
  const { intakes, loading, addIntake } = useStockIntake();
  const { suppliers } = usePoklehSuppliers();
  const { trucks } = useTrucks();
  const [isOpen, setIsOpen] = useState(false);
  const [intakeDate, setIntakeDate] = useState(new Date().toISOString().split("T")[0]);
  const [supplierId, setSupplierId] = useState("");
  const [truckId, setTruckId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineState>(emptyLines());
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <PageLoader />;

  const resetForm = () => {
    setIntakeDate(new Date().toISOString().split("T")[0]);
    setSupplierId("");
    setTruckId("");
    setNotes("");
    setLines(emptyLines());
  };

  const updateLine = (product: ProductType, field: "quantity_received" | "cost_per_pax", value: string) => {
    setLines((prev) => ({ ...prev, [product]: { ...prev[product], [field]: value } }));
  };

  const handleAdd = async () => {
    const activeLines = PRODUCT_TYPES.map((p) => ({
      product_type: p,
      quantity_received: parseInt(lines[p].quantity_received) || 0,
      cost_per_pax: parseFloat(lines[p].cost_per_pax) || 0,
    })).filter((l) => l.quantity_received > 0 && l.cost_per_pax > 0);

    if (!supplierId || !truckId || activeLines.length === 0 || submitting) {
      toast.error(t('intake.error-required'));
      return;
    }
    setSubmitting(true);
    try {
      const result = await addIntake({
        intake_date: intakeDate,
        supplier_id: supplierId,
        truck_id: truckId,
        lines: activeLines,
        notes: notes || undefined,
      });
      if (result.success) {
        resetForm();
        setIsOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const totalCost = intakes.reduce((sum, i) => sum + i.quantity_received * i.cost_per_pax, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('intake.title')}
        subtitle={t('intake.subtitle')}
      >
        {userRole === "admin" && (
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('intake.record')}</span>
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('intake.history').replace('{count}', intakes.length.toString())}</CardTitle>
          <CardDescription>{t('intake.total-cost')} {formatCurrency(totalCost)}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.date')}</TableHead>
                <TableHead>{t('common.truck')}</TableHead>
                <TableHead>{t('common.supplier')}</TableHead>
                <TableHead>{t('common.product')}</TableHead>
                <TableHead>{t('intake.qty-label')}</TableHead>
                <TableHead>{t('intake.cost-label')}</TableHead>
                <TableHead>{t('common.amount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {intakes.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{new Date(i.intake_date).toLocaleDateString()}</TableCell>
                  <TableCell>{i.truck?.name || "—"}</TableCell>
                  <TableCell className="font-medium">{i.supplier?.name || "—"}</TableCell>
                  <TableCell><span className="text-sm font-medium">{i.product_type}</span></TableCell>
                  <TableCell>{i.quantity_received}</TableCell>
                  <TableCell>{formatCurrency(i.cost_per_pax)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(i.quantity_received * i.cost_per_pax)}</TableCell>
                </TableRow>
              ))}
              {intakes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {t('intake.no-intake')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <FormModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title={t('intake.modal-title')}
        description={t('intake.modal-desc')}
        submitLabel={t('intake.modal-button')}
        submitDisabled={!supplierId || !truckId}
        isSubmitting={submitting}
        onSubmit={handleAdd}
        onCancel={resetForm}
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="intake_date" className="text-sm font-medium">{t('intake.date-label')}</Label>
            <Input
              id="intake_date"
              type="date"
              value={intakeDate}
              onChange={(e) => setIntakeDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="truck" className="text-sm font-medium">{t('intake.truck-label')}</Label>
            <Select value={truckId} onValueChange={setTruckId}>
              <SelectTrigger id="truck"><SelectValue placeholder={t('intake.truck-select')} /></SelectTrigger>
              <SelectContent>
                {trucks.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="supplier" className="text-sm font-medium">{t('intake.supplier-label')}</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger id="supplier"><SelectValue placeholder={t('intake.supplier-select')} /></SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4" />
              {t('intake.products-label')}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('intake.products-hint')}
            </p>
            <div className="space-y-3">
              {PRODUCT_TYPES.map((p) => (
                <div key={p} className="rounded-xl border border-border bg-muted/30 p-3 space-y-2.5">
                  <p className="text-sm font-semibold">{p}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <NumberInput
                      label={t('intake.qty-label')}
                      min={0}
                      value={lines[p].quantity_received}
                      onChange={(e) => updateLine(p, "quantity_received", e.target.value)}
                    />
                    <CurrencyInput
                      label={t('intake.cost-label')}
                      currency="RM"
                      value={lines[p].cost_per_pax}
                      onChange={(e) => updateLine(p, "cost_per_pax", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium">{t('intake.notes-label')}</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('intake.notes-placeholder')}
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
};
