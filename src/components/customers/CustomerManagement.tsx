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
import { Plus, Search, Phone, MapPin } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { useAreas } from "@/hooks/useAreas";
import type { Customer } from "@/types/pokleh";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";

interface CustomerManagementProps {
  userRole: "admin" | "staff";
}

export const CustomerManagement = ({ userRole }: CustomerManagementProps) => {
  const { areas } = useAreas();
  const { customers, loading, addCustomer, updateCustomer, toggleActive } = useCustomers();
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", area_id: "" });
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <PageLoader />;

  const filtered = customers.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search);
    const matchArea = areaFilter === "all" || c.area_id === areaFilter;
    return matchSearch && matchArea;
  });

  const handleAdd = async () => {
    if (!form.name || !form.area_id || submitting) { toast.error("Please enter a customer name and select an area."); return; }
    setSubmitting(true);
    await addCustomer(form);
    setSubmitting(false);
    setForm({ name: "", phone: "", address: "", area_id: "" });
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Management</h2>
          <p className="text-muted-foreground">Manage customers and their debt balances</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {areas.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customers ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Debt Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {customers.length === 0 ? "No customers yet. Add your first customer." : "No customers match your search or filter."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.phone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span> : "—"}</TableCell>
                  <TableCell><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.area?.name || "—"}</span></TableCell>
                  <TableCell className={c.debt_balance > 0 ? "text-destructive font-medium" : ""}>
                    {formatCurrency(c.debt_balance)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.active ? "secondary" : "outline"}>{c.active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>Add a new ice customer</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Customer name" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" />
            </div>
            <div className="space-y-2">
              <Label>Area *</Label>
              <Select value={form.area_id} onValueChange={(v) => setForm({ ...form, area_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={submitting}>{submitting ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

