import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, HandshakeIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/lib/i18n";
import type { StockIntake, Truck } from "@/types/pokleh";
import { PRODUCT_TYPES } from "@/types/pokleh";

interface WastageAdjustmentFormProps {
  intakes: StockIntake[];
  trucks: Truck[];
  onSubmit: (data: {
    intake_id: string;
    truck_id: string;
    product_type: string;
    total_wasted: number;
    reduction_quantity: number;
    reason?: string;
    adjustment_date: string;
  }) => Promise<{ success: boolean }>;
  isLoading?: boolean;
}

export const WastageAdjustmentForm = ({
  intakes,
  trucks,
  onSubmit,
  isLoading,
}: WastageAdjustmentFormProps) => {
  const { t } = useLanguage();
  const [intakeId, setIntakeId] = useState("");
  const [totalWasted, setTotalWasted] = useState("");
  const [reduction, setReduction] = useState("");
  const [reason, setReason] = useState("");
  const [adjustmentDate, setAdjustmentDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  const selectedIntake = intakes.find((i) => i.id === intakeId);
  const selectedTruck = trucks.find((t) => t.id === selectedIntake?.truck_id);
  const reductionPercent = totalWasted && reduction ? ((parseInt(reduction) / parseInt(totalWasted)) * 100).toFixed(1) : 0;
  const savingsAmount = selectedIntake && totalWasted && reduction ? parseInt(reduction) * selectedIntake.cost_per_pax : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intakeId || !totalWasted || !reduction || !adjustmentDate) return;

    if (parseInt(reduction) > parseInt(totalWasted)) {
      alert("Reduction cannot exceed total wasted quantity");
      return;
    }

    setSubmitting(true);
    const result = await onSubmit({
      intake_id: intakeId,
      truck_id: selectedIntake?.truck_id || "",
      product_type: selectedIntake?.product_type || "Air Batu Besar",
      total_wasted: parseInt(totalWasted),
      reduction_quantity: parseInt(reduction),
      reason: reason || undefined,
      adjustment_date: adjustmentDate,
    });
    setSubmitting(false);

    if (result.success) {
      setIntakeId("");
      setTotalWasted("");
      setReduction("");
      setReason("");
      setAdjustmentDate(new Date().toISOString().split("T")[0]);
    }
  };

  const validReduction = totalWasted && reduction && parseInt(reduction) <= parseInt(totalWasted);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HandshakeIcon className="h-5 w-5 text-blue-500" />
          Wastage Adjustment
        </CardTitle>
        <CardDescription>
          Record when supplier agrees to reduce charges on damaged/wasted stock
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              When supplier agrees to reduce wastage charges, record the negotiated reduction here.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="intake">Select Intake</Label>
            <Select value={intakeId} onValueChange={setIntakeId}>
              <SelectTrigger id="intake">
                <SelectValue placeholder="Select an intake..." />
              </SelectTrigger>
              <SelectContent>
                {intakes
                  .filter((i) => i.supplier && i.truck)
                  .map((intake) => (
                    <SelectItem key={intake.id} value={intake.id}>
                      {new Date(intake.intake_date).toLocaleDateString()} — {intake.supplier?.name} (
                      {intake.truck?.name}) — {intake.quantity_received} {intake.product_type}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {selectedIntake && (
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-sm space-y-1">
              <p>
                <span className="font-medium">{t('supplier.supplier')}:</span> {selectedIntake.supplier?.name}
              </p>
              <p>
                <span className="font-medium">{t('common.truck')}:</span> {selectedTruck?.name}
              </p>
              <p>
                <span className="font-medium">{t('common.product')}:</span> {selectedIntake.product_type}
              </p>
              <p>
                <span className="font-medium">Cost/Unit:</span> RM {selectedIntake.cost_per_pax.toFixed(2)}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total-wasted">Total {t('stock.reason-damaged')} Units</Label>
              <Input
                id="total-wasted"
                type="number"
                min="1"
                value={totalWasted}
                onChange={(e) => setTotalWasted(e.target.value)}
                placeholder="e.g., 50"
                required
              />
              <p className="text-xs text-muted-foreground">Full wastage amount on invoice</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reduction">Units Reduction (supplier agreed)</Label>
              <Input
                id="reduction"
                type="number"
                min="0"
                max={totalWasted || 999}
                value={reduction}
                onChange={(e) => setReduction(e.target.value)}
                placeholder="e.g., 25"
                disabled={!totalWasted}
                required
              />
              <p className="text-xs text-muted-foreground">We don't pay for these units</p>
            </div>
          </div>

          {totalWasted && reduction && validReduction && (
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg space-y-2">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Reduction %</p>
                  <p className="text-lg font-bold text-green-600">{reductionPercent}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Units Reduction</p>
                  <p className="text-lg font-bold text-green-600">{reduction}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount Saved</p>
                  <p className="text-lg font-bold text-green-600">RM {savingsAmount.toFixed(2)}</p>
                </div>
              </div>
              <p className="text-xs">
                <span className="font-medium">Before:</span> {totalWasted} units × RM {selectedIntake?.cost_per_pax.toFixed(2)} = RM{" "}
                {(parseInt(totalWasted) * (selectedIntake?.cost_per_pax || 0)).toFixed(2)}
              </p>
              <p className="text-xs">
                <span className="font-medium">After:</span> {parseInt(totalWasted) - parseInt(reduction)} units × RM{" "}
                {selectedIntake?.cost_per_pax.toFixed(2)} = RM
                {((parseInt(totalWasted) - parseInt(reduction)) * (selectedIntake?.cost_per_pax || 0)).toFixed(2)}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Quality issue, Customer complaint"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">{t('common.date')}</Label>
            <Input
              id="date"
              type="date"
              value={adjustmentDate}
              onChange={(e) => setAdjustmentDate(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={!intakeId || !totalWasted || !reduction || !validReduction || submitting || isLoading}
            className="w-full"
          >
            {submitting ? t('common.loading') : "Record Adjustment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
