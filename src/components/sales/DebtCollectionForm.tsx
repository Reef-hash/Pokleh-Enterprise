import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Wallet } from "lucide-react";
import { useDebtCollection } from "@/hooks/useDebtCollection";
import { useCustomers } from "@/hooks/useCustomers";
import { formatCurrency } from "@/lib/currency";

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

  const activeDebtors = customers.filter((c) => c.debt_balance > 0);

  const handleAdd = async () => {
    if (!form.customer_id || form.amount <= 0) return;
    await addCollection(form);
    setForm({ customer_id: "", amount: 0, collection_date: new Date().toISOString().split("T")[0], notes: "" });
    setIsOpen(false);
  };

  const totalCollected = collections.reduce((s, c) => s + c.amount, 0);
  const totalOutstanding = customers.reduce((s, c) => s + c.debt_balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Debt Collection</h2>
          <p className="text-muted-foreground">Record payments received from debtors</p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Record Collection
        </Button>
      </div>

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
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Debt Collection</DialogTitle>
            <DialogDescription>Record a debt payment from a customer</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select debtor" /></SelectTrigger>
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
            <div className="space-y-2">
              <Label>Amount (RM)</Label>
              <Input type="number" step="0.01" min={0.01} value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.collection_date} onChange={(e) => setForm({ ...form, collection_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Record Collection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
