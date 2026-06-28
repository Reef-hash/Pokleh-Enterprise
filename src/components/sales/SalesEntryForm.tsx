import { useState, useMemo } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import { FormModal } from "@/components/ui/FormModal";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuantityInput, CurrencyInput } from "@/components/ui/MobileOptimizedInputs";
import { Plus, DollarSign, RotateCcw, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSales } from "@/hooks/useSales";
import { useCustomers } from "@/hooks/useCustomers";
import { useTrucks } from "@/hooks/useTrucks";
import { useStaffAssignments } from "@/hooks/useStaffAssignments";
import { useSellingPrices } from "@/hooks/useSellingPrices";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PRODUCT_TYPES, type ProductType } from "@/types/pokleh";

interface SalesEntryFormProps {
  userRole: "admin" | "staff";
}

const emptyForm = () => ({
  customer_id: "",
  truck_id: "",
  product_type: "Air Batu Besar" as ProductType,
  quantity: 0,
  selling_price: 0,
  payment_type: "cash" as "cash" | "debt",
  sale_date: new Date().toISOString().split("T")[0],
  notes: "",
});

export const SalesEntryForm = ({ userRole }: SalesEntryFormProps) => {
  const { sales, loading, addSale } = useSales();
  const { customers } = useCustomers();
  const { trucks } = useTrucks();
  const { assignments } = useStaffAssignments();
  const { lookupPrice } = useSellingPrices();
  const user = useAuthStore((s) => s.user);
  const [isOpen, setIsOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [overrideTruck, setOverrideTruck] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  // Staff are auto-assigned to their active truck so they skip a step at point-of-sale
  const myTruckId = useMemo(() => {
    if (!user) return null;
    return assignments.find((a) => a.staff_id === user.id && !a.ended_date)?.truck_id ?? null;
  }, [assignments, user]);

  const truckLocked = userRole === "staff" && !!myTruckId && !overrideTruck;
  const resolvedTruckId = truckLocked ? myTruckId : form.truck_id;
  const myTruckName = trucks.find((t) => t.id === myTruckId)?.name;

  const selectedCustomer = customers.find((c) => c.id === form.customer_id);
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => c.active)
      .filter((c) => !resolvedTruckId || c.truck_id === resolvedTruckId)
      .filter((c) => !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()));
  }, [customers, resolvedTruckId, customerSearch]);

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

  const resetForm = () => {
    setForm(emptyForm());
    setCustomerSearch("");
    setOverrideTruck(false);
  };

  const handleAdd = async () => {
    if (!form.customer_id || !resolvedTruckId || form.quantity <= 0 || form.selling_price <= 0 || submitting) { toast.error("Please select a customer, truck, and enter valid quantity and price."); return; }
    setSubmitting(true);
    try {
      const result = await addSale({ ...form, truck_id: resolvedTruckId });
      if (result.success) {
        resetForm();
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

      <FormModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Record Sale"
        description="Record an ice sale to a customer"
        submitLabel="Save Sale"
        submitDisabled={!form.customer_id || !resolvedTruckId || form.quantity <= 0 || form.selling_price <= 0}
        isSubmitting={submitting}
        onSubmit={handleAdd}
        onCancel={resetForm}
      >
        <div className="space-y-4">
          {/* Truck — auto-resolved for staff with an active assignment */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Truck</Label>
            {truckLocked ? (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <Badge>{myTruckName}</Badge>
                  <span className="text-xs text-muted-foreground">Truck anda</span>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setOverrideTruck(true)}>
                  Tukar
                </Button>
              </div>
            ) : (
              <Select
                value={form.truck_id}
                onValueChange={(v) => setForm((f) => ({ ...f, truck_id: v, customer_id: "" }))}
              >
                <SelectTrigger><SelectValue placeholder="Select truck" /></SelectTrigger>
                <SelectContent>
                  {trucks.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Customer — search + tap, filtered to the active truck */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Customer</Label>
            {selectedCustomer ? (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-2.5">
                <div>
                  <p className="text-sm font-semibold">{selectedCustomer.name}</p>
                  {selectedCustomer.debt_balance > 0 && (
                    <p className="text-xs text-destructive font-medium">Debt: {formatCurrency(selectedCustomer.debt_balance)}</p>
                  )}
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, customer_id: "" }))}>
                  Tukar
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="Cari nama pelanggan..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-44 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                  {filteredCustomers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No customers found</p>
                  ) : (
                    filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setForm((f) => ({ ...f, customer_id: c.id })); setCustomerSearch(""); }}
                        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left hover:bg-accent/60 active:bg-accent transition-colors"
                      >
                        <span className="text-sm font-medium">{c.name}</span>
                        {c.debt_balance > 0 && (
                          <span className="text-xs text-destructive font-medium">{formatCurrency(c.debt_balance)}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Product — tap to select */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Jenis Produk</Label>
            <div className="grid grid-cols-3 gap-2">
              {PRODUCT_TYPES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, product_type: p }))}
                  className={cn(
                    "rounded-xl border px-2 py-3 text-xs sm:text-sm font-semibold text-center transition-colors",
                    form.product_type === p
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-muted/30 hover:bg-accent/60"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity + Price */}
          <div className="grid grid-cols-2 gap-2">
            <QuantityInput
              label="Quantity (pax)"
              value={form.quantity || ""}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
              min={1}
            />

            <CurrencyInput
              label="Selling Price"
              currency="RM"
              value={form.selling_price || ""}
              onChange={(e) => setForm({ ...form, selling_price: parseFloat(e.target.value) || 0 })}
            />
          </div>

          {suggested && (
            <div className="bg-accent/30 p-2.5 rounded-lg">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className={suggested.isCustomerSpecific ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                  {suggested.isCustomerSpecific ? "Harga khusus" : "Harga biasa"}: {formatCurrency(suggested.perPax)}/pax
                </span>
                {form.selling_price !== suggested.total && (
                  <button type="button" onClick={applysuggested} className="inline-flex items-center gap-1 text-primary text-xs hover:underline font-medium">
                    <RotateCcw className="h-3 w-3" /> Guna
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total: {formatCurrency(suggested.total)}</p>
            </div>
          )}

          {/* Payment type — segmented toggle */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Payment Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, payment_type: "cash" }))}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                  form.payment_type === "cash"
                    ? "border-green-600 bg-green-600 text-white shadow-sm"
                    : "border-border bg-muted/30 hover:bg-accent/60"
                )}
              >
                Cash
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, payment_type: "debt" }))}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                  form.payment_type === "debt"
                    ? "border-destructive bg-destructive text-destructive-foreground shadow-sm"
                    : "border-border bg-muted/30 hover:bg-accent/60"
                )}
              >
                Debt
              </button>
            </div>
          </div>

          {/* Secondary fields — rarely changed from their defaults */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <Label htmlFor="sale_date" className="text-xs font-medium text-muted-foreground">Date</Label>
              <Input
                id="sale_date"
                type="date"
                value={form.sale_date}
                onChange={(e) => setForm({ ...form, sale_date: e.target.value })}
                className="h-10 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="notes" className="text-xs font-medium text-muted-foreground">Notes</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional"
                className="h-10 text-sm"
              />
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  );
};

