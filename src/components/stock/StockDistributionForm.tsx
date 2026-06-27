import { useState, useEffect } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight } from "lucide-react";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { useStockDistribution } from "@/hooks/useStockDistribution";
import { useStockIntake } from "@/hooks/useStockIntake";
import { useTrucks } from "@/hooks/useTrucks";
import { stockRpc } from "@/repositories/stockRepo";
import { toast } from "sonner";
import { PRODUCT_TYPES, type ProductType } from "@/types/pokleh";

interface StockDistributionFormProps {
  userRole: "admin" | "staff";
}

export const StockDistributionForm = ({ userRole }: StockDistributionFormProps) => {
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
      toast.error("Please select a from-truck, a to-truck, and enter a valid quantity.");
      return;
    }
    if (form.from_truck_id === form.to_truck_id) { toast.error("From-truck and to-truck must be different."); return; }
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
        title="Stock Distribution"
        subtitle="Transfer stock between trucks"
      >
        {userRole === "admin" && (
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Distribute</span>
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Distribution Records ({distributions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Qty Assigned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {distributions.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</TableCell>
                  <TableCell><Badge variant="secondary">{d.from_truck?.name}</Badge></TableCell>
                  <TableCell className="flex items-center gap-1"><ArrowRight className="h-3 w-3 text-muted-foreground" /><Badge variant="secondary">{d.to_truck?.name}</Badge></TableCell>
                  <TableCell className="text-sm font-medium">{d.product_type}</TableCell>
                  <TableCell className="font-medium">{d.quantity_assigned} pax</TableCell>
                </TableRow>
              ))}
              {distributions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No distributions yet
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
                <ResponsiveRow label="Date"><span className="text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span></ResponsiveRow>
                <ResponsiveRow label="From"><Badge variant="secondary">{d.from_truck?.name}</Badge></ResponsiveRow>
                <ResponsiveRow label="To"><Badge variant="secondary">{d.to_truck?.name}</Badge></ResponsiveRow>
                <ResponsiveRow label="Product">{d.product_type}</ResponsiveRow>
                <ResponsiveRow label="Qty Assigned"><span className="font-medium">{d.quantity_assigned} pax</span></ResponsiveRow>
              </ResponsiveCard>
            ))}
            {distributions.length === 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">No distributions yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Distribute Stock</DialogTitle>
            <DialogDescription>Transfer stock from one truck to another</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>From Truck</Label>
              <Select value={form.from_truck_id} onValueChange={(v) => setForm({ ...form, from_truck_id: v, intake_id: "" })}>
                <SelectTrigger><SelectValue placeholder="Select source truck" /></SelectTrigger>
                <SelectContent>
                  {trucks.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To Truck</Label>
              <Select value={form.to_truck_id} onValueChange={(v) => setForm({ ...form, to_truck_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select destination truck" /></SelectTrigger>
                <SelectContent>
                  {trucks.filter((t) => t.id !== form.from_truck_id).map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={form.product_type} onValueChange={(v) => setForm({ ...form, product_type: v as ProductType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                </SelectContent>
              </Select>
              {form.from_truck_id && (
                <p className="text-sm text-muted-foreground">
                  {checkingAvailable ? "Checking available stock…" : available !== null ? `Available: ${available} pax` : ""}
                </p>
              )}
            </div>
            {truckIntakes.length > 0 && (
              <div className="space-y-2">
                <Label>Intake Reference (optional)</Label>
                <Select value={form.intake_id || "none"} onValueChange={(v) => setForm({ ...form, intake_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Tag to a specific intake batch" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {truckIntakes.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.product_type} — {new Date(i.intake_date).toLocaleDateString()} ({i.quantity_received} pax)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Quantity (pax)</Label>
              <Input
                type="number"
                min={1}
                value={form.quantity_assigned || ""}
                onChange={(e) => setForm({ ...form, quantity_assigned: parseInt(e.target.value) || 0 })}
              />
              {overLimit && (
                <p className="text-sm text-destructive">Cannot exceed available stock ({available} pax)</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={submitting || overLimit}>{submitting ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
