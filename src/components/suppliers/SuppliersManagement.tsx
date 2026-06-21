import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit, Trash2, Building2, Phone } from "lucide-react";
import { usePoklehSuppliers } from "@/hooks/usePoklehSuppliers";

interface SuppliersManagementProps {
  userRole: "admin" | "staff";
}

export const SuppliersManagement = ({ userRole }: SuppliersManagementProps) => {
  const { suppliers, loading, addSupplier, updateSupplier, deleteSupplier } = usePoklehSuppliers();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const filtered = suppliers.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.phone?.includes(search)
  );

  const handleAdd = async () => {
    if (!name.trim()) return;
    await addSupplier(name.trim(), phone.trim() || undefined);
    setName("");
    setPhone("");
    setIsAddOpen(false);
  };

  const handleEdit = async () => {
    if (!name.trim() || !editingId) return;
    await updateSupplier(editingId, name.trim(), phone.trim() || undefined);
    setName("");
    setPhone("");
    setEditingId(null);
    setIsEditOpen(false);
  };

  const openEdit = (s: { id: string; name: string; phone?: string | null }) => {
    setEditingId(s.id);
    setName(s.name);
    setPhone(s.phone || "");
    setIsEditOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading suppliers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Supplier Management</h2>
          <p className="text-muted-foreground">Manage ice suppliers</p>
        </div>
        {userRole === "admin" && (
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Supplier
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10" placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suppliers ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Added</TableHead>
                {userRole === "admin" && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <span className="flex items-center gap-2 font-medium">
                      <Building2 className="h-4 w-4 text-muted-foreground" /> {s.name}
                    </span>
                  </TableCell>
                  <TableCell>{s.phone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</span> : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                  {userRole === "admin" && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteSupplier(s.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Supplier</DialogTitle>
            <DialogDescription>Add a new ice supplier</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Supplier name" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>Update supplier information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
