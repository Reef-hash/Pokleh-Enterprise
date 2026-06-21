import { useState, useEffect } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, RotateCcw } from "lucide-react";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import { useStockReturn } from "@/hooks/useStockReturn";
import { supabase } from "@/integrations/supabase/client";
import type { StockDistribution } from "@/types/pokleh";
import { toast } from "sonner";

interface StockReturnFormProps {
  userRole: "admin" | "staff";
}

export const StockReturnForm = ({ userRole }: StockReturnFormProps) => {
  const { returns, loading, addReturn } = useStockReturn();
  const [isOpen, setIsOpen] = useState(false);
  const [distributions, setDistributions] = useState<StockDistribution[]>([]);
  const [form, setForm] = useState({ distribution_id: "", area_id: "", quantity_returned: 0, return_date: new Date().toISOString().split("T")[0] });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from("stock_distribution")
      .select("*, intake:stock_intake(*), area:areas(*)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setDistributions((data || []) as unknown as StockDistribution[]));
  }, []);

  if (loading) return <PageLoader />;

  const handleAdd = async () => {
    if (!form.distribution_id || !form.area_id || form.quantity_returned <= 0 || submitting) { toast.error("Please select a distribution and enter a valid quantity."); return; }
    setSubmitting(true);
    try {
      const result = await addReturn(form);
      if (result.success) {
        setForm({ distribution_id: "", area_id: "", quantity_returned: 0, return_date: new Date().toISOString().split("T")[0] });
        setIsOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Stock Returns</h2>
          <p className="text-muted-foreground">Record unsold stock returned from areas</p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Record Return
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Return Records ({returns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Distribution</TableHead>
                <TableHead>Qty Returned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground">{new Date(r.return_date).toLocaleDateString()}</TableCell>
                  <TableCell><Badge variant="secondary">{r.area?.name}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.distribution_id.substring(0, 8)}...</TableCell>
                  <TableCell className="font-medium">{r.quantity_returned} pax</TableCell>
                </TableRow>
              ))}
              {returns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No returns recorded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3">
            {returns.map((r) => (
              <ResponsiveCard key={r.id}>
                <ResponsiveRow label="Date"><span className="text-muted-foreground">{new Date(r.return_date).toLocaleDateString()}</span></ResponsiveRow>
                <ResponsiveRow label="Area"><Badge variant="secondary">{r.area?.name}</Badge></ResponsiveRow>
                <ResponsiveRow label="Distribution"><span className="text-sm text-muted-foreground">{r.distribution_id.substring(0, 8)}...</span></ResponsiveRow>
                <ResponsiveRow label="Qty Returned"><span className="font-medium">{r.quantity_returned} pax</span></ResponsiveRow>
              </ResponsiveCard>
            ))}
            {returns.length === 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">No returns recorded yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Stock Return</DialogTitle>
            <DialogDescription>Record unsold stock returned from an area</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.return_date} onChange={(e) => setForm({ ...form, return_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Distribution</Label>
              <Select value={form.distribution_id} onValueChange={(v) => {
                const dist = distributions.find((d) => d.id === v);
                setForm({ ...form, distribution_id: v, area_id: dist?.area_id || "" });
              }}>
                <SelectTrigger><SelectValue placeholder="Select distribution" /></SelectTrigger>
                <SelectContent>
                  {distributions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.area?.name} — {d.intake?.supplier?.name} ({d.quantity_assigned} pax)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity Returned (pax)</Label>
              <Input type="number" min={0} value={form.quantity_returned || ""} onChange={(e) => setForm({ ...form, quantity_returned: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={submitting}>{submitting ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

