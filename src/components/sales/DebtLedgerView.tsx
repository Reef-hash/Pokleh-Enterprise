import { useState } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useDebtLedger } from "@/hooks/useDebtLedger";
import { useCustomers } from "@/hooks/useCustomers";
import { formatCurrency } from "@/lib/currency";

export const DebtLedgerView = () => {
  const { entries, loading } = useDebtLedger();
  const { customers } = useCustomers();
  const [filterCustomer, setFilterCustomer] = useState("all");

  if (loading) return <PageLoader />;

  const filtered = filterCustomer === "all"
    ? entries
    : entries.filter((e) => e.customer_id === filterCustomer);

  const selectedCustomer = customers.find((c) => c.id === filterCustomer);
  const currentBalance = selectedCustomer?.debt_balance ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Debt Ledger</h2>
        <p className="text-muted-foreground">Audit trail of all debt movements</p>
      </div>

      <div className="flex items-end gap-4">
        <div className="space-y-2 w-64">
          <Label>Filter by Customer</Label>
          <Select value={filterCustomer} onValueChange={setFilterCustomer}>
            <SelectTrigger><SelectValue placeholder="All customers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {customers.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        {filterCustomer !== "all" && (
          <Card className="flex-1">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Current Balance</CardTitle></CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${currentBalance > 0 ? "text-destructive" : "text-green-600"}`}>
                {formatCurrency(currentBalance)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger Entries ({filtered.length})</CardTitle>
          <CardDescription>Append-only record; entries are never modified</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance Before</TableHead>
                  <TableHead>Balance After</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{new Date(e.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{e.customer?.name || "—"}</TableCell>
                    <TableCell>
                      <span className={
                        e.entry_type === "sale" ? "text-destructive" :
                        e.entry_type === "payment" ? "text-green-600" : "text-muted-foreground"
                      }>
                        {e.entry_type}
                      </span>
                    </TableCell>
                    <TableCell>{formatCurrency(e.amount)}</TableCell>
                    <TableCell>{formatCurrency(e.balance_before)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(e.balance_after)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{e.reference_type}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No ledger entries found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3">
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No ledger entries found</p>
            ) : (
              filtered.map((e) => (
                <ResponsiveCard key={e.id}>
                  <ResponsiveRow label="Date">{new Date(e.created_at).toLocaleDateString()}</ResponsiveRow>
                  <ResponsiveRow label="Customer">{e.customer?.name || "—"}</ResponsiveRow>
                  <ResponsiveRow label="Type">
                    <span className={
                      e.entry_type === "sale" ? "text-destructive" :
                      e.entry_type === "payment" ? "text-green-600" : "text-muted-foreground"
                    }>
                      {e.entry_type}
                    </span>
                  </ResponsiveRow>
                  <ResponsiveRow label="Amount">{formatCurrency(e.amount)}</ResponsiveRow>
                  <ResponsiveRow label="Balance Before">{formatCurrency(e.balance_before)}</ResponsiveRow>
                  <ResponsiveRow label="Balance After">{formatCurrency(e.balance_after)}</ResponsiveRow>
                  <ResponsiveRow label="Reference">{e.reference_type}</ResponsiveRow>
                </ResponsiveCard>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

