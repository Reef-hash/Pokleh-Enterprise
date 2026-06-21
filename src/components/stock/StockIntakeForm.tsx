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
import { useStockIntake } from "@/hooks/useStockIntake";
import { usePoklehSuppliers } from "@/hooks/usePoklehSuppliers";
import { formatCurrency } from "@/lib/currency";

interface StockIntakeFormProps {
  userRole: "admin" | "staff";
}

export const StockIntakeForm = ({ userRole }: StockIntakeFormProps) => {
  const { intakes, loading, addIntake } = useStockIntake();
  const { suppliers } = usePoklehSuppliers();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    intake_date: new Date().toISOString().split("T")[0],
    supplier_id: "",
    quantity_received: 0,
    cost_per_pax: 0,
    notes: "",
  });

  if (loading) return <PageLoader />;

  const handleAdd = async () => {
    if (!form.supplier_id || form.quantity_received <= 0 || form.cost_per_pax <= 0) return;
    await addIntake(form);
    setForm({ intake_date: new Date().toISOString().split("T")[0], supplier_id: "", quantity_received: 0, cost_per_pax: 0, notes: "" });
    setIsOpen(false);
  };

  const totalCost = intakes.reduce((sum, i) => sum + i.quantity_received * i.cost_per_pax, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Stock Intake</h2>
          <p className="text-muted-foreground">Record incoming stock from suppliers</p>
        </div>
        {userRole === "admin" && (
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Record Intake
          </Button>
        )}
      </div>

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
                <TableHead>Supplier</TableHead>
                <TableHead>Quantity (pax)</TableHead>
                <TableHead>Cost/Pax</TableHead>
                <TableHead>Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {intakes.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{new Date(i.intake_date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{i.supplier?.name || "—"}</TableCell>
                  <TableCell>{i.quantity_received}</TableCell>
                  <TableCell>{formatCurrency(i.cost_per_pax)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(i.quantity_received * i.cost_per_pax)}</TableCell>
                </TableRow>
              ))}
              {intakes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No stock intake recorded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Stock Intake</DialogTitle>
            <DialogDescription>Record incoming ice stock from supplier</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.intake_date} onChange={(e) => setForm({ ...form, intake_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity Received (pax)</Label>
              <Input type="number" min={1} value={form.quantity_received || ""} onChange={(e) => setForm({ ...form, quantity_received: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Cost Per Pax (RM)</Label>
              <Input type="number" step="0.01" min={0} value={form.cost_per_pax || ""} onChange={(e) => setForm({ ...form, cost_per_pax: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Record Intake</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

