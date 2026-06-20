import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calculator, CheckCircle } from "lucide-react";
import { useSettlements } from "@/hooks/useSettlement";
import { useStockIntake } from "@/hooks/useStockIntake";
import { formatCurrency } from "@/lib/currency";

interface SupplierSettlementViewProps {
  userRole: "admin" | "staff";
}

export const SupplierSettlementView = ({ userRole }: SupplierSettlementViewProps) => {
  const { settlements, loading, calculateSettlement, markSettled } = useSettlements();
  const { intakes } = useStockIntake();

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
          <h2 className="text-3xl font-bold tracking-tight">Supplier Settlements</h2>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Intake Date</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Sold</TableHead>
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
        </CardContent>
      </Card>
    </div>
  );
};
