import { useState } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { useDailyClosings } from "@/hooks/useDailyClosings";
import { useAreas } from "@/hooks/useAreas";
import { formatCurrency } from "@/lib/currency";

interface DailyClosingWorkflowProps {
  userRole: "admin" | "staff";
}

export const DailyClosingWorkflow = ({ userRole }: DailyClosingWorkflowProps) => {
  const { closings, loading, closeDay, reconcileDay } = useDailyClosings();
  if (loading) return <PageLoader />;
  const { areas } = useAreas();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [areaId, setAreaId] = useState("");
  const [action, setAction] = useState<"close" | "reconcile">("close");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selectedClosing = closings.find((c) => c.closing_date === date && c.area_id === areaId);
  const selectedArea = areas.find((a) => a.id === areaId);

  const handleConfirm = async () => {
    setConfirmOpen(false);
    if (action === "close") {
      await closeDay(date, areaId);
    } else {
      await reconcileDay(date, areaId);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      open: { label: "Open", variant: "secondary" },
      closed: { label: "Closed", variant: "default" },
      reconciled: { label: "Reconciled", variant: "outline" },
    };
    const s = map[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const canClose = selectedClosing?.status === "open" || !selectedClosing;
  const canReconcile = selectedClosing?.status === "closed";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Daily Closing</h2>
        <p className="text-muted-foreground">Close and reconcile daily operations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Close / Reconcile a Day</CardTitle>
          <CardDescription>Select a date and area, then close or reconcile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Area</Label>
              <Select value={areaId} onValueChange={setAreaId}>
                <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {areaId && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{selectedArea?.name} — {new Date(date).toLocaleDateString()}</span>
                {selectedClosing ? statusBadge(selectedClosing.status) : <Badge variant="secondary">Open (No record)</Badge>}
              </div>
              {selectedClosing && selectedClosing.status === "closed" && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span>Assigned: {selectedClosing.total_assigned}</span>
                  <span>Sold: {selectedClosing.total_sold}</span>
                  <span>Returned: {selectedClosing.total_returned}</span>
                  <span>Cash: {formatCurrency(selectedClosing.cash_sales)}</span>
                  <span>Debt: {formatCurrency(selectedClosing.debt_sales)}</span>
                  <span>Collections: {formatCurrency(selectedClosing.debt_collections)}</span>
                  <span>Expenses: {formatCurrency(selectedClosing.expenses_total)}</span>
                  <span>Profit: {formatCurrency(selectedClosing.profit_estimate)}</span>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Button
                  disabled={!canClose}
                  onClick={() => { setAction("close"); setConfirmOpen(true); }}
                >
                  <Lock className="mr-2 h-4 w-4" /> Close Day
                </Button>
                {userRole === "admin" && (
                  <Button
                    variant="outline"
                    disabled={!canReconcile}
                    onClick={() => { setAction("reconcile"); setConfirmOpen(true); }}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Reconcile
                  </Button>
                )}
              </div>
              {!canClose && action === "close" && selectedClosing && selectedClosing.status !== "open" && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" /> Day is already {selectedClosing.status}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Closing Records ({closings.length})</CardTitle>
          <CardDescription>All closed/reconciled days</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Returned</TableHead>
                <TableHead>Cash</TableHead>
                <TableHead>Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {closings.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{new Date(c.closing_date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{c.area?.name || "—"}</TableCell>
                  <TableCell>{statusBadge(c.status)}</TableCell>
                  <TableCell>{c.total_assigned}</TableCell>
                  <TableCell>{c.total_sold}</TableCell>
                  <TableCell>{c.total_returned}</TableCell>
                  <TableCell>{formatCurrency(c.cash_sales)}</TableCell>
                  <TableCell className={c.profit_estimate >= 0 ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                    {formatCurrency(c.profit_estimate)}
                  </TableCell>
                </TableRow>
              ))}
              {closings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No daily closings yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {action === "close" ? "Close" : "Reconcile"}</DialogTitle>
            <DialogDescription>
              {action === "close"
                ? "This will validate and freeze the day's data. No further edits will be allowed for this date and area."
                : "This will mark the day as reconciled — the final state."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p><strong>Date:</strong> {new Date(date).toLocaleDateString()}</p>
            <p><strong>Area:</strong> {selectedArea?.name}</p>
            {action === "close" && (
              <p className="text-sm text-muted-foreground mt-2">
                Validation: assigned must equal sold + returned
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirm}>
              {action === "close" ? "Close Day" : "Reconcile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

