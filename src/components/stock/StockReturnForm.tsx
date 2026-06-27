import { useState } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { useStockReturn } from "@/hooks/useStockReturn";
import { useStockDistribution } from "@/hooks/useStockDistribution";
import { useStockIntake } from "@/hooks/useStockIntake";
import { useTrucks } from "@/hooks/useTrucks";
import { toast } from "sonner";

interface StockReturnFormProps {
  userRole: "admin" | "staff";
}

export const StockReturnForm = ({ userRole }: StockReturnFormProps) => {
  const { returns, loading, addReturn } = useStockReturn();
  const { distributions } = useStockDistribution();
  const { intakes } = useStockIntake();
  const { trucks } = useTrucks();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    truck_id: "",
    distribution_id: "",
    intake_id: "",
    quantity_returned: 0,
    return_date: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <PageLoader />;

  const truckDistributions = distributions.filter((d) => d.to_truck_id === form.truck_id);
  const truckIntakes = intakes.filter((i) => i.truck_id === form.truck_id);

  const handleAdd = async () => {
    if (!form.truck_id || form.quantity_returned <= 0 || submitting) { toast.error("Please select a truck and enter a valid quantity."); return; }
    setSubmitting(true);
    try {
      const result = await addReturn({
        truck_id: form.truck_id,
        distribution_id: form.distribution_id || undefined,
        intake_id: form.intake_id || undefined,
        quantity_returned: form.quantity_returned,
        return_date: form.return_date,
      });
      if (result.success) {
        setForm({ truck_id: "", distribution_id: "", intake_id: "", quantity_returned: 0, return_date: new Date().toISOString().split("T")[0] });
        setIsOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Returns"
        subtitle="Record unsold stock returned from a truck"
        actionLabel="Record Return"
        actionIcon={Plus}
        onAction={() => setIsOpen(true)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Return Records ({returns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Truck</TableHead>
                <TableHead>Distribution</TableHead>
                <TableHead>Qty Returned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground">{new Date(r.return_date).toLocaleDateString()}</TableCell>
                  <TableCell><Badge variant="secondary">{r.truck?.name}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.distribution_id ? `${r.distribution_id.substring(0, 8)}...` : "—"}</TableCell>
                  <TableCell className="font-medium">{r.quantity_returned} pax</TableCell>
                </TableRow>
              ))}
              {returns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No returns recorded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3">
            {returns.map((r) => (
              <ResponsiveCard key={r.id}>
                <ResponsiveRow label="Date"><span className="text-muted-foreground">{new Date(r.return_date).toLocaleDateString()}</span></ResponsiveRow>
                <ResponsiveRow label="Truck"><Badge variant="secondary">{r.truck?.name}</Badge></ResponsiveRow>
                <ResponsiveRow label="Distribution"><span className="text-sm text-muted-foreground">{r.distribution_id ? `${r.distribution_id.substring(0, 8)}...` : "—"}</span></ResponsiveRow>
                <ResponsiveRow label="Qty Returned"><span className="font-medium">{r.quantity_returned} pax</span></ResponsiveRow>
              </ResponsiveCard>
            ))}
            {returns.length === 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">No returns recorded yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Stock Return</DialogTitle>
            <DialogDescription>Record unsold stock returned from a truck</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.return_date} onChange={(e) => setForm({ ...form, return_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Truck</Label>
              <Select value={form.truck_id} onValueChange={(v) => setForm({ ...form, truck_id: v, distribution_id: "", intake_id: "" })}>
                <SelectTrigger><SelectValue placeholder="Select truck" /></SelectTrigger>
                <SelectContent>
                  {trucks.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            {truckDistributions.length > 0 && (
              <div className="space-y-2">
                <Label>Distribution (optional)</Label>
                <Select value={form.distribution_id || "none"} onValueChange={(v) => setForm({ ...form, distribution_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Tag to a specific transfer" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {truckDistributions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.from_truck?.name} → {d.to_truck?.name} — {d.product_type} ({d.quantity_assigned} pax)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {truckIntakes.length > 0 && (
              <div className="space-y-2">
                <Label>Intake (optional, for supplier settlement credit)</Label>
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
              <Label>Quantity Returned (pax)</Label>
              <Input type="number" min={0} value={form.quantity_returned || ""} onChange={(e) => setForm({ ...form, quantity_returned: parseInt(e.target.value) || 0 })} />
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
