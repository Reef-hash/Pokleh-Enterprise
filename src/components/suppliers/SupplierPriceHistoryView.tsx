import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useSupplierPriceHistory } from "@/hooks/useSupplierPriceHistory";
import { usePoklehSuppliers } from "@/hooks/usePoklehSuppliers";
import { formatCurrency } from "@/lib/currency";

export const SupplierPriceHistoryView = () => {
  const { history } = useSupplierPriceHistory();
  const { suppliers } = usePoklehSuppliers();
  const [filterSupplier, setFilterSupplier] = useState("all");

  const filtered = filterSupplier === "all"
    ? history
    : history.filter((h) => h.supplier_id === filterSupplier);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Supplier Price History</h2>
        <p className="text-muted-foreground">Historical cost per pax from suppliers</p>
      </div>

      <div className="w-64 space-y-2">
        <Label>Filter by Supplier</Label>
        <Select value={filterSupplier} onValueChange={setFilterSupplier}>
          <SelectTrigger><SelectValue placeholder="All suppliers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {suppliers.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Price Changes ({filtered.length})</CardTitle>
          <CardDescription>Append-only record of supplier pricing</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Effective Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Cost / Pax</TableHead>
                <TableHead>Recorded At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((h) => {
                const supplier = suppliers.find((s) => s.id === h.supplier_id);
                return (
                  <TableRow key={h.id}>
                    <TableCell>{new Date(h.effective_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{supplier?.name || "—"}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(h.cost_per_pax)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(h.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No price history recorded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
