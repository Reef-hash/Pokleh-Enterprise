import { useMemo } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { HandshakeIcon } from "lucide-react";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import { WastageAdjustmentForm } from "./WastageAdjustmentForm";
import { useStockWastage } from "@/hooks/useStockWastage";
import { useStockIntake } from "@/hooks/useStockIntake";
import { useTrucks } from "@/hooks/useTrucks";
import { formatCurrency } from "@/lib/currency";

interface WastageAdjustmentsPageProps {
  userRole: "admin" | "staff";
}

export const WastageAdjustmentsPage = ({ userRole }: WastageAdjustmentsPageProps) => {
  const { intakes, loading: intakesLoading } = useStockIntake();
  const { trucks, loading: trucksLoading } = useTrucks();
  const { adjustments, addAdjustment, loading } = useStockWastage();

  const totalReduction = useMemo(() => {
    return adjustments.reduce((sum, a) => sum + a.reduction_quantity, 0);
  }, [adjustments]);

  const totalSavings = useMemo(() => {
    return adjustments.reduce((sum, a) => {
      const intake = intakes.find((i) => i.id === a.intake_id);
      return sum + a.reduction_quantity * (intake?.cost_per_pax || 0);
    }, 0);
  }, [adjustments, intakes]);

  if (intakesLoading || trucksLoading) return <PageLoader />;

  if (userRole !== "admin") {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
        <p className="text-muted-foreground">Only administrators can manage wastage adjustments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Wastage Adjustments</h2>
        <p className="text-muted-foreground">
          Record supplier negotiations — when they agree to reduce wastage charges
        </p>
      </div>

      <WastageAdjustmentForm
        intakes={intakes}
        trucks={trucks}
        onSubmit={addAdjustment}
        isLoading={loading}
      />

      {/* Summary Cards */}
      {adjustments.length > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Adjustments</p>
                <p className="text-2xl font-bold">{adjustments.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Units Reduced</p>
                <p className="text-2xl font-bold text-green-600">{totalReduction}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Savings</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSavings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adjustments List */}
      {adjustments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HandshakeIcon className="h-5 w-5 text-blue-500" />
              Adjustment History
            </CardTitle>
            <CardDescription>Recent supplier negotiations</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Truck</TableHead>
                    <TableHead className="text-right">Wasted</TableHead>
                    <TableHead className="text-right">Reduction</TableHead>
                    <TableHead className="text-right">Cost/Unit</TableHead>
                    <TableHead className="text-right">Savings</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustments.map((adj) => {
                    const intake = intakes.find((i) => i.id === adj.intake_id);
                    const truck = trucks.find((t) => t.id === adj.truck_id);
                    const savings = adj.reduction_quantity * (intake?.cost_per_pax || 0);
                    return (
                      <TableRow key={adj.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {new Date(adj.adjustment_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{intake?.supplier?.name || "Unknown"}</TableCell>
                        <TableCell>{truck?.name || "Unknown"}</TableCell>
                        <TableCell className="text-right text-orange-600">
                          {adj.total_wasted}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          -{adj.reduction_quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(intake?.cost_per_pax || 0)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          {formatCurrency(savings)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {adj.reason || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="block md:hidden space-y-3">
              {adjustments.map((adj) => {
                const intake = intakes.find((i) => i.id === adj.intake_id);
                const truck = trucks.find((t) => t.id === adj.truck_id);
                const savings = adj.reduction_quantity * (intake?.cost_per_pax || 0);
                return (
                  <ResponsiveCard key={adj.id}>
                    <ResponsiveRow label="Date">
                      {new Date(adj.adjustment_date).toLocaleDateString()}
                    </ResponsiveRow>
                    <ResponsiveRow label="Supplier">
                      <span className="font-medium">{intake?.supplier?.name || "Unknown"}</span>
                    </ResponsiveRow>
                    <ResponsiveRow label="Truck">{truck?.name || "Unknown"}</ResponsiveRow>
                    <ResponsiveRow label="Wasted">
                      <span className="text-orange-600">{adj.total_wasted}</span>
                    </ResponsiveRow>
                    <ResponsiveRow label="Reduction">
                      <span className="font-bold text-green-600">-{adj.reduction_quantity}</span>
                    </ResponsiveRow>
                    <ResponsiveRow label="Cost/Unit">
                      {formatCurrency(intake?.cost_per_pax || 0)}
                    </ResponsiveRow>
                    <ResponsiveRow label="Savings">
                      <span className="font-bold text-green-600">{formatCurrency(savings)}</span>
                    </ResponsiveRow>
                    {adj.reason && <ResponsiveRow label="Reason">{adj.reason}</ResponsiveRow>}
                  </ResponsiveCard>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {adjustments.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <HandshakeIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No adjustments recorded yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
