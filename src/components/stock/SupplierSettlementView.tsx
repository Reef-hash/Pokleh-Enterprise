import { useState } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calculator, CheckCircle } from "lucide-react";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import { useSettlements } from "@/hooks/useSettlement";
import { useStockIntake } from "@/hooks/useStockIntake";
import { formatCurrency } from "@/lib/currency";

interface SupplierSettlementViewProps {
  userRole: "admin" | "staff";
}

export const SupplierSettlementView = ({ userRole }: SupplierSettlementViewProps) => {
  const { settlements, loading, calculateSettlement, markSettled } = useSettlements();
  const { intakes } = useStockIntake();

  if (loading) return <PageLoader />;

  const unsettledIntakes = intakes.filter(
    (i) => !settlements.some((s) => s.intake_id === i.id)
  );

  const totalPayable = settlements
    .filter((s) => s.status === "pending")
    .reduce((sum, s) => sum + s.payable_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Supplier Settlements</h2>
          <p className="text-muted-foreground">Calculate and manage supplier payables</p>
        </div>
      </div>

      {userRole === "admin" && unsettledIntakes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Calculations</CardTitle>
            <CardDescription>Intakes that need settlement calculation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {unsettledIntakes.map((i) => (
              <div key={i.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{i.supplier?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(i.intake_date).toLocaleDateString()} — {i.quantity_received} pax @ {formatCurrency(i.cost_per_pax)}
                  </p>
                </div>
                <Button size="sm" onClick={() => calculateSettlement(i.id)}>
                  <Calculator className="mr-2 h-4 w-4" /> Calculate
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Settlements ({settlements.length})
            {totalPayable > 0 && (
              <span className="ml-4 text-sm font-normal text-muted-foreground">
                Total pending: {formatCurrency(totalPayable)}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Intake Date</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Sold</TableHead>
                  <TableHead>Wasted</TableHead>
                  <TableHead>Reduction</TableHead>
                  <TableHead>Returned</TableHead>
                  <TableHead>Payable Qty</TableHead>
                  <TableHead>Cost/Pax</TableHead>
                  <TableHead>Payable (RM)</TableHead>
                  <TableHead>Status</TableHead>
                  {userRole === "admin" && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.intake?.supplier?.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.intake ? new Date(s.intake.intake_date).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>{s.total_received}</TableCell>
                    <TableCell>{s.total_sold}</TableCell>
                    <TableCell className="text-orange-600 font-medium">{s.total_wastage || 0}</TableCell>
                    <TableCell className="text-green-600">{s.wastage_reduction || 0 > 0 ? `-${s.wastage_reduction || 0}` : "—"}</TableCell>
                    <TableCell>{s.total_returned}</TableCell>
                    <TableCell className="font-medium">{s.payable_quantity}</TableCell>
                    <TableCell>{formatCurrency(s.cost_per_pax)}</TableCell>
                    <TableCell className="font-bold">{formatCurrency(s.payable_amount)}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "settled" ? "secondary" : "default"}>
                        {s.status}
                      </Badge>
                    </TableCell>
                    {userRole === "admin" && (
                      <TableCell>
                        {s.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => markSettled(s.id)}>
                            <CheckCircle className="mr-1 h-4 w-4" /> Settle
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {settlements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      No settlements calculated yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3">
            {settlements.map((s) => (
              <ResponsiveCard key={s.id}>
                <ResponsiveRow label="Supplier">
                  <span className="font-medium">{s.intake?.supplier?.name}</span>
                </ResponsiveRow>
                <ResponsiveRow label="Intake Date">
                  {s.intake ? new Date(s.intake.intake_date).toLocaleDateString() : "—"}
                </ResponsiveRow>
                <ResponsiveRow label="Received">{s.total_received}</ResponsiveRow>
                <ResponsiveRow label="Sold">{s.total_sold}</ResponsiveRow>
                <ResponsiveRow label="Wasted">
                  <span className="text-orange-600 font-medium">{s.total_wastage || 0}</span>
                </ResponsiveRow>
                {(s.wastage_reduction || 0) > 0 && (
                  <ResponsiveRow label="Reduction">
                    <span className="text-green-600">-{s.wastage_reduction || 0}</span>
                  </ResponsiveRow>
                )}
                <ResponsiveRow label="Returned">{s.total_returned}</ResponsiveRow>
                <ResponsiveRow label="Payable Qty">
                  <span className="font-medium">{s.payable_quantity}</span>
                </ResponsiveRow>
                <ResponsiveRow label="Cost/Pax">{formatCurrency(s.cost_per_pax)}</ResponsiveRow>
                <ResponsiveRow label="Payable (RM)">
                  <span className="font-bold">{formatCurrency(s.payable_amount)}</span>
                </ResponsiveRow>
                <ResponsiveRow label="Status">
                  <Badge variant={s.status === "settled" ? "secondary" : "default"}>
                    {s.status}
                  </Badge>
                </ResponsiveRow>
                {userRole === "admin" && s.status === "pending" && (
                  <ResponsiveRow label="Action">
                    <Button size="sm" variant="outline" onClick={() => markSettled(s.id)}>
                      <CheckCircle className="mr-1 h-4 w-4" /> Settle
                    </Button>
                  </ResponsiveRow>
                )}
              </ResponsiveCard>
            ))}
            {settlements.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No settlements calculated yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

