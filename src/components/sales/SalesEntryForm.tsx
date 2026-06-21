import { useState } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, DollarSign } from "lucide-react";
import { useSales } from "@/hooks/useSales";
import { useCustomers } from "@/hooks/useCustomers";
import { useAreas } from "@/hooks/useAreas";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";

interface SalesEntryFormProps {
  userRole: "admin" | "staff";
}

export const SalesEntryForm = ({ userRole }: SalesEntryFormProps) => {
  const { sales, loading, addSale } = useSales();
  const { customers } = useCustomers();
  const { areas } = useAreas();
  const user = useAuthStore((s) => s.user);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    area_id: "",
    quantity: 0,
    selling_price: 0,
    payment_type: "cash" as "cash" | "debt",
    sale_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <PageLoader />;

  const handleAdd = async () => {
    if (!form.customer_id || !form.area_id || form.quantity <= 0 || form.selling_price <= 0 || submitting) { toast.error("Please select a customer, area, and enter valid quantity and price."); return; }
    setSubmitting(true);
    await addSale(form);
    setSubmitting(false);
    setForm({ customer_id: "", area_id: "", quantity: 0, selling_price: 0, payment_type: "cash", sale_date: new Date().toISOString().split("T")[0], notes: "" });
    setIsOpen(false);
  };

  const totalSales = sales.reduce((s, x) => s + x.quantity, 0);
  const totalRevenue = sales.reduce((s, x) => s + x.selling_price, 0);
  const totalDebt = sales.filter((x) => x.payment_type === "debt").reduce((s, x) => s + x.selling_price, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sales Entry</h2>
          <p className="text-muted-foreground">Record sales (cash or debt)</p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Record Sale
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Sold</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalSales} pax</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Revenue</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Outstanding Debt</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">{formatCurrency(totalDebt)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales History ({sales.length})</CardTitle>
          <CardDescription>All recorded sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{new Date(s.sale_date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{s.customer?.name || "—"}</TableCell>
                  <TableCell>{s.area?.name || "—"}</TableCell>
                  <TableCell>{s.quantity}</TableCell>
                  <TableCell>{formatCurrency(s.selling_price)}</TableCell>
                  <TableCell>
                    <span className={s.payment_type === "debt" ? "text-destructive font-medium" : "text-green-600 font-medium"}>
                      {s.payment_type}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {sales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No sales recorded yet
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
            <DialogTitle>Record Sale</DialogTitle>
            <DialogDescription>Record an ice sale to a customer</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.sale_date} onChange={(e) => setForm({ ...form, sale_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers.filter((c) => c.active).map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Area</Label>
              <Select value={form.area_id} onValueChange={(v) => setForm({ ...form, area_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity (pax)</Label>
              <Input type="number" min={1} value={form.quantity || ""} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Selling Price (RM)</Label>
              <Input type="number" step="0.01" min={0} value={form.selling_price || ""} onChange={(e) => setForm({ ...form, selling_price: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Payment Type</Label>
              <Select value={form.payment_type} onValueChange={(v) => setForm({ ...form, payment_type: v as "cash" | "debt" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="debt">Debt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional" />
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

