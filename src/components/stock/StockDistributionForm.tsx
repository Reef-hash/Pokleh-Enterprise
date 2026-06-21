import { useState } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight } from "lucide-react";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import { useStockDistribution } from "@/hooks/useStockDistribution";
import { useStockIntake } from "@/hooks/useStockIntake";
import { useAreas } from "@/hooks/useAreas";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState as useStateFn } from "react";
import { toast } from "sonner";

interface StockDistributionFormProps {
  userRole: "admin" | "staff";
}

export const StockDistributionForm = ({ userRole }: StockDistributionFormProps) => {
  const { distributions, loading, addDistribution } = useStockDistribution();
  const { intakes } = useStockIntake();
  const { areas } = useAreas();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ intake_id: "", area_id: "", quantity_assigned: 0 });
  const [assignedTotals, setAssignedTotals] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from("stock_distribution")
      .select("intake_id, quantity_assigned")
      .then(({ data }) => {
        const totals: Record<string, number> = {};
        (data || []).forEach((d: { intake_id: string; quantity_assigned: number }) => {
          totals[d.intake_id] = (totals[d.intake_id] || 0) + d.quantity_assigned;
        });
        setAssignedTotals(totals);
      });
  }, [distributions]);

  if (loading) return <PageLoader />;

  const selectedIntake = intakes.find((i) => i.id === form.intake_id);
  const alreadyAssigned = assignedTotals[form.intake_id] || 0;
  const remaining = selectedIntake ? selectedIntake.quantity_received - alreadyAssigned : 0;

  const handleAdd = async () => {
    if (!form.intake_id || !form.area_id || form.quantity_assigned <= 0 || submitting) { toast.error("Please select an intake, area, and enter a valid quantity."); return; }
    if (form.quantity_assigned > remaining) return;
    setSubmitting(true);
    await addDistribution(form);
    setSubmitting(false);
    setForm({ intake_id: "", area_id: "", quantity_assigned: 0 });
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Stock Distribution</h2>
          <p className="text-muted-foreground">Distribute stock to delivery areas</p>
        </div>
        {userRole === "admin" && (
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Distribute
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribution Records ({distributions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Intake (Supplier)</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Qty Assigned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {distributions.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{d.intake?.supplier?.name || "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{d.area?.name}</Badge></TableCell>
                  <TableCell className="font-medium">{d.quantity_assigned} pax</TableCell>
                </TableRow>
              ))}
              {distributions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No distributions yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3">
            {distributions.map((d) => (
              <ResponsiveCard key={d.id}>
                <ResponsiveRow label="Date"><span className="text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span></ResponsiveRow>
                <ResponsiveRow label="Intake">{d.intake?.supplier?.name || "—"}</ResponsiveRow>
                <ResponsiveRow label="Area"><Badge variant="secondary">{d.area?.name}</Badge></ResponsiveRow>
                <ResponsiveRow label="Qty Assigned"><span className="font-medium">{d.quantity_assigned} pax</span></ResponsiveRow>
              </ResponsiveCard>
            ))}
            {distributions.length === 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">No distributions yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Distribute Stock</DialogTitle>
            <DialogDescription>Assign stock to a delivery area</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Intake Reference</Label>
              <Select value={form.intake_id} onValueChange={(v) => setForm({ ...form, intake_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select intake" /></SelectTrigger>
                <SelectContent>
                  {intakes.map((i) => {
                    const assigned = assignedTotals[i.id] || 0;
                    const remain = i.quantity_received - assigned;
                    return (
                      <SelectItem key={i.id} value={i.id}>
                        {i.supplier?.name} — {new Date(i.intake_date).toLocaleDateString()} ({remain} pax left)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {remaining > 0 && (
                <p className="text-sm text-muted-foreground">Available: {remaining} pax</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Area</Label>
              <Select value={form.area_id} onValueChange={(v) => setForm({ ...form, area_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity (pax)</Label>
              <Input
                type="number"
                min={1}
                max={remaining || 1}
                value={form.quantity_assigned || ""}
                onChange={(e) => setForm({ ...form, quantity_assigned: parseInt(e.target.value) || 0 })}
              />
              {form.quantity_assigned > remaining && remaining > 0 && (
                <p className="text-sm text-destructive">Cannot exceed available stock ({remaining} pax)</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={submitting || form.quantity_assigned > remaining}>{submitting ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

