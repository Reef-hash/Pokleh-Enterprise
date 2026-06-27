import { useState } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import { FormModal } from "@/components/ui/FormModal";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/MobileOptimizedInputs";
import { Plus, Wallet } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useDebtCollection } from "@/hooks/useDebtCollection";
import { useCustomers } from "@/hooks/useCustomers";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";

interface DebtCollectionFormProps {
  userRole: "admin" | "staff";
}

export const DebtCollectionForm = ({ userRole }: DebtCollectionFormProps) => {
  const { collections, loading, addCollection } = useDebtCollection();
  const { customers } = useCustomers();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    amount: 0,
    collection_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <PageLoader />;

  const activeDebtors = customers.filter((c) => c.debt_balance > 0);

  const handleAdd = async () => {
    if (!form.customer_id || form.amount <= 0 || submitting) { toast.error("Please select a customer and enter a valid amount."); return; }
    setSubmitting(true);
    try {
      const result = await addCollection(form);
      if (result.success) {
        setForm({ customer_id: "", amount: 0, collection_date: new Date().toISOString().split("T")[0], notes: "" });
        setIsOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const totalCollected = collections.reduce((s, c) => s + c.amount, 0);
  const totalOutstanding = customers.reduce((s, c) => s + c.debt_balance, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Debt Collection"
        subtitle="Record payments received from debtors"
        actionLabel="Record Collection"
        actionIcon={Plus}
        onAction={() => setIsOpen(true)}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Collected</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(totalCollected)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Outstanding Debt</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">{formatCurrency(totalOutstanding)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collections ({collections.length})</CardTitle>
          <CardDescription>Debt payment records</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collections.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{new Date(c.collection_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{c.customer?.name || "—"}</TableCell>
                    <TableCell className="text-green-600 font-medium">{formatCurrency(c.amount)}</TableCell>
                    <TableCell>{c.staff?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{c.notes || "—"}</TableCell>
                  </TableRow>
                ))}
                {collections.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No collections recorded yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3">
            {collections.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No collections recorded yet</p>
            ) : (
              collections.map((c) => (
                <ResponsiveCard key={c.id}>
                  <ResponsiveRow label="Date">{new Date(c.collection_date).toLocaleDateString()}</ResponsiveRow>
                  <ResponsiveRow label="Customer">{c.customer?.name || "—"}</ResponsiveRow>
                  <ResponsiveRow label="Amount" className="text-green-600 font-medium">{formatCurrency(c.amount)}</ResponsiveRow>
                  <ResponsiveRow label="Staff">{c.staff?.name || "—"}</ResponsiveRow>
                  <ResponsiveRow label="Notes">{c.notes || "—"}</ResponsiveRow>
                </ResponsiveCard>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <FormModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Record Debt Collection"
        description="Record a debt payment from a customer"
        submitLabel="Record Payment"
        submitDisabled={!form.customer_id || form.amount <= 0}
        isSubmitting={submitting}
        onSubmit={handleAdd}
        onCancel={() => setForm({ customer_id: "", amount: 0, collection_date: new Date().toISOString().split("T")[0], notes: "" })}
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="customer" className="text-sm font-medium">Customer</Label>
            <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
              <SelectTrigger id="customer"><SelectValue placeholder="Select debtor" /></SelectTrigger>
              <SelectContent>
                {activeDebtors.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({formatCurrency(c.debt_balance)})
                  </SelectItem>
                ))}
                {activeDebtors.length === 0 && (
                  <SelectItem value="__none__" disabled>No debtors</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <CurrencyInput
            label="Amount"
            currency="RM"
            value={form.amount || ""}
            onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
          />

          <div>
            <Label htmlFor="collection_date" className="text-sm font-medium">Date</Label>
            <Input
              id="collection_date"
              type="date"
              value={form.collection_date}
              onChange={(e) => setForm({ ...form, collection_date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
            <Input
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Add any notes..."
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
};

