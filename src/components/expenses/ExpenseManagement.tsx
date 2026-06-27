import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormModal } from "@/components/ui/FormModal";
import { CurrencyInput, NumberInput, PhoneInput } from "@/components/ui/MobileOptimizedInputs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Receipt } from "lucide-react";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { useExpenses } from "@/hooks/useExpenses";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";

const EXPENSE_CATEGORIES = [
  "Transportation", "Meals", "Utilities", "Maintenance",
  "Packaging", "Marketing", "Rental", "Salaries", "Other"
];

interface ExpenseManagementProps {
  userRole: "admin" | "staff";
}

export const ExpenseManagement = ({ userRole }: ExpenseManagementProps) => {
  const { expenses, loading, addExpense } = useExpenses();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    category: "",
    amount: 0,
    expense_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!form.category || form.amount <= 0 || submitting) { toast.error("Please select a category and enter a valid amount."); return; }
    setSubmitting(true);
    try {
      const result = await addExpense(form);
      if (result.success) {
        setForm({ category: "", amount: 0, expense_date: new Date().toISOString().split("T")[0], notes: "" });
        setIsOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        subtitle="Track operational expenses"
      >
        {userRole === "admin" && (
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Expense</span>
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Expenses</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Categories</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(byCategory).map(([cat, amt]) => (
                <span key={cat} className="text-sm bg-muted px-2 py-1 rounded-md">
                  {cat}: {formatCurrency(amt)}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Expenses ({expenses.length})</CardTitle>
          <CardDescription>Recorded expenses</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{new Date(e.expense_date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{e.category}</TableCell>
                  <TableCell className="text-destructive font-medium">{formatCurrency(e.amount)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{e.notes || "—"}</TableCell>
                </TableRow>
              ))}
              {expenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No expenses recorded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3">
            {expenses.map((e) => (
              <ResponsiveCard key={e.id}>
                <ResponsiveRow label="Date">{new Date(e.expense_date).toLocaleDateString()}</ResponsiveRow>
                <ResponsiveRow label="Category"><span className="font-medium">{e.category}</span></ResponsiveRow>
                <ResponsiveRow label="Amount"><span className="text-destructive font-medium">{formatCurrency(e.amount)}</span></ResponsiveRow>
                <ResponsiveRow label="Notes"><span className="text-muted-foreground text-sm">{e.notes || "—"}</span></ResponsiveRow>
              </ResponsiveCard>
            ))}
            {expenses.length === 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">No expenses recorded yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <FormModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Add Expense"
        description="Record a new operational expense"
        submitLabel="Add Expense"
        submitDisabled={!form.category || form.amount <= 0}
        isSubmitting={submitting}
        onSubmit={handleAdd}
        onCancel={() => setForm({ category: "", amount: 0, expense_date: new Date().toISOString().split("T")[0], notes: "" })}
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="category" className="text-sm font-medium">Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger id="category"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
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
            <Label htmlFor="expense_date" className="text-sm font-medium">Date</Label>
            <Input id="expense_date" type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
            <Input id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Add any notes..." />
          </div>
        </div>
      </FormModal>
    </div>
  );
};
