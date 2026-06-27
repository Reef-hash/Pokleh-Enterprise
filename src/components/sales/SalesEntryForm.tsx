import { useState, useMemo } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, DollarSign, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSales } from "@/hooks/useSales";
import { useCustomers } from "@/hooks/useCustomers";
import { useTrucks } from "@/hooks/useTrucks";
import { useSellingPrices } from "@/hooks/useSellingPrices";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";
import { PRODUCT_TYPES, type ProductType } from "@/types/pokleh";

interface SalesEntryFormProps {
  userRole: "admin" | "staff";
}

export const SalesEntryForm = ({ userRole }: SalesEntryFormProps) => {
  const { sales, loading, addSale } = useSales();
  const { customers } = useCustomers();
  const { trucks } = useTrucks();
  const { lookupPrice } = useSellingPrices();
  const user = useAuthStore((s) => s.user);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    truck_id: "",
    product_type: "Air Batu Besar" as ProductType,
    quantity: 0,
    selling_price: 0,
    payment_type: "cash" as "cash" | "debt",
    sale_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Suggested price based on price list (customer-specific or default)
  const suggested = useMemo(() => {
    if (!form.customer_id || !form.product_type || form.quantity <= 0) return null;
    const pricePerPax = lookupPrice(form.customer_id, form.product_type);
    if (pricePerPax === null || pricePerPax === 0) return null;
    const isCustomerSpecific = lookupPrice(form.customer_id, form.product_type) !== lookupPrice(null, form.product_type);
    return { total: pricePerPax * form.quantity, perPax: pricePerPax, isCustomerSpecific };
  }, [form.customer_id, form.product_type, form.quantity, lookupPrice]);

  const applysuggested = () => {
    if (suggested) setForm((f) => ({ ...f, selling_price: suggested.total }));
  };

  // Auto-fill when customer/product/qty changes and price is still 0
  const prevKey = `${form.customer_id}|${form.product_type}|${form.quantity}`;
  const [lastAutoKey, setLastAutoKey] = useState("");
  if (suggested && form.selling_price === 0 && prevKey !== lastAutoKey) {
    setLastAutoKey(prevKey);
    setForm((f) => ({ ...f, selling_price: suggested.total }));
  }

  if (loading) return <PageLoader />;

  const handleAdd = async () => {
    if (!form.customer_id || !form.truck_id || form.quantity <= 0 || form.selling_price <= 0 || submitting) { toast.error("Please select a customer, truck, and enter valid quantity and price."); return; }
    setSubmitting(true);
    try {
      const result = await addSale(form);
      if (result.success) {
        setForm({ customer_id: "", truck_id: "", product_type: "Air Batu Besar", quantity: 0, selling_price: 0, payment_type: "cash", sale_date: new Date().toISOString().split("T")[0], notes: "" });
        setIsOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const totalSales = sales.reduce((s, x) => s + x.quantity, 0);
  const totalRevenue = sales.reduce((s, x) => s + x.selling_price, 0);
  const totalDebt = sales.filter((x) => x.payment_type === "debt").reduce((s, x) => s + x.selling_price, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Entry"
        subtitle="Record sales (cash or debt)"
        actionLabel="Record Sale"
        actionIcon={Plus}
        onAction={() => setIsOpen(true)}
      />

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
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Truck</TableHead>
                  <TableHead>Product</TableHead>
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
                    <TableCell>{s.truck?.name || "—"}</TableCell>                    <TableCell className="text-sm">{s.product_type || "—"}</TableCell>                    <TableCell>{s.quantity}</TableCell>
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
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No sales recorded yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3">
            {sales.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No sales recorded yet</p>
            ) : (
              sales.map((s) => (
                <ResponsiveCard key={s.id}>
                  <ResponsiveRow label="Date">{new Date(s.sale_date).toLocaleDateString()}</ResponsiveRow>
                  <ResponsiveRow label="Customer">{s.customer?.name || "—"}</ResponsiveRow>
                  <ResponsiveRow label="Truck">{s.truck?.name || "—"}</ResponsiveRow>
                  <ResponsiveRow label="Product">{s.product_type || "—"}</ResponsiveRow>
                  <ResponsiveRow label="Qty">{s.quantity}</ResponsiveRow>
                  <ResponsiveRow label="Amount">{formatCurrency(s.selling_price)}</ResponsiveRow>
                  <ResponsiveRow label="Type">
                    <span className={s.payment_type === "debt" ? "text-destructive font-medium" : "text-green-600 font-medium"}>
                      {s.payment_type}
                    </span>
                  </ResponsiveRow>
                </ResponsiveCard>
              ))
            )}
          </div>
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
              <Label>Truck</Label>
              <Select value={form.truck_id} onValueChange={(v) => setForm({ ...form, truck_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select truck" /></SelectTrigger>
                <SelectContent>
                  {trucks.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Jenis Produk</Label>
              <Select value={form.product_type} onValueChange={(v) => setForm({ ...form, product_type: v as ProductType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
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
              {suggested && (
                <div className="flex items-center gap-2 text-sm">
                  <span className={suggested.isCustomerSpecific ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                    {suggested.isCustomerSpecific ? "Harga khusus" : "Harga biasa"}: {formatCurrency(suggested.perPax)}/pax = {formatCurrency(suggested.total)}
                  </span>
                  {form.selling_price !== suggested.total && (
                    <button type="button" onClick={applysuggested} className="inline-flex items-center gap-1 text-primary hover:underline">
                      <RotateCcw className="h-3 w-3" /> Guna harga ini
                    </button>
                  )}
                </div>
              )}
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

