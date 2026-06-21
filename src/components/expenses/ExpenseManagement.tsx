import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Receipt } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { formatCurrency } from "@/lib/currency";

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

  const handleAdd = async () => {
    if (!form.category || form.amount <= 0) return;
    await addExpense(form);
    setForm({ category: "", amount: 0, expense_date: new Date().toISOString().split("T")[0], notes: "" });
    setIsOpen(false);
  };

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
          <p className="text-muted-foreground">Track operational expenses</p>
        </div>
        {userRole === "admin" && (
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        )}
      </div>

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
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Record a new operational expense</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (RM)</Label>
              <Input type="number" step="0.01" min={0.01} value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
