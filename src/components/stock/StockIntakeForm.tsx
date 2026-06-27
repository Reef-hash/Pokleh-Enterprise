import { useState } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useStockIntake } from "@/hooks/useStockIntake";
import { usePoklehSuppliers } from "@/hooks/usePoklehSuppliers";
import { useTrucks } from "@/hooks/useTrucks";
import { formatCurrency } from "@/lib/currency";
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
      toast.error("Please select a supplier, a truck, and enter quantity and cost for at least one product.");
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
        title="Stock Intake"
        subtitle="Record incoming stock from suppliers"
      >
        {userRole === "admin" && (
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Record Intake</span>
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Intake History ({intakes.length})</CardTitle>
          <CardDescription>Total cost: {formatCurrency(totalCost)}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Truck</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity (pax)</TableHead>
                <TableHead>Cost/Pax</TableHead>
                <TableHead>Total Cost</TableHead>
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
                    No stock intake recorded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Stock Intake</DialogTitle>
            <DialogDescription>Record incoming ice stock from supplier. Enter quantity and cost for each product type collected on this trip.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={intakeDate} onChange={(e) => setIntakeDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Truck</Label>
              <Select value={truckId} onValueChange={setTruckId}>
                <SelectTrigger><SelectValue placeholder="Select truck" /></SelectTrigger>
                <SelectContent>
                  {trucks.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Package className="h-4 w-4" />
                Products (leave blank to skip)
              </div>
              {PRODUCT_TYPES.map((p) => (
                <div key={p} className="grid grid-cols-3 items-end gap-2">
                  <Label className="col-span-3 text-xs text-muted-foreground">{p}</Label>
                  <div className="space-y-1">
                    <Label className="text-xs">Qty (pax)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={lines[p].quantity_received}
                      onChange={(e) => updateLine(p, "quantity_received", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Cost/Pax (RM)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={lines[p].cost_per_pax}
                      onChange={(e) => updateLine(p, "cost_per_pax", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={submitting}>{submitting ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
