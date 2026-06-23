import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, MapPin } from "lucide-react";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAreas } from "@/hooks/useAreas";
import { toast } from "sonner";

interface AreaManagementProps {
  userRole: "admin" | "staff";
}

export const AreaManagement = ({ userRole }: AreaManagementProps) => {
  const { areas, loading, addArea, updateArea, deleteArea } = useAreas();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!name.trim() || submitting) { toast.error("Please enter an area name."); return; }
    setSubmitting(true);
    try {
      const result = await addArea(name.trim());
      if (result.success) {
        setName("");
        setIsAddOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!name.trim() || !editingId || submitting) { toast.error("Please enter an area name."); return; }
    setSubmitting(true);
    try {
      const result = await updateArea(editingId, name.trim());
      if (result.success) {
        setName("");
        setEditingId(null);
        setIsEditOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId || submitting) return;
    setSubmitting(true);
    try {
      const result = await deleteArea(deleteConfirmId);
      if (result.success) {
        setDeleteConfirmId(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (area: { id: string; name: string }) => {
    setEditingId(area.id);
    setName(area.name);
    setIsEditOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading areas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Area Management"
        subtitle="Manage delivery areas"
      >
        {userRole === "admin" && (
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Area</span>
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Areas ({areas.length})</CardTitle>
          <CardDescription>Areas where ice is distributed</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Area Name</TableHead>
                <TableHead>Created</TableHead>
                {userRole === "admin" && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.map((area) => (
                <TableRow key={area.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{area.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(area.created_at).toLocaleDateString()}
                  </TableCell>
                  {userRole === "admin" && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(area)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(area.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {areas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No areas yet. Add your first delivery area.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3">
            {areas.map((area) => (
              <ResponsiveCard key={area.id}>
                <ResponsiveRow label="Area Name">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{area.name}</span>
                  </span>
                </ResponsiveRow>
                <ResponsiveRow label="Created"><span className="text-muted-foreground">{new Date(area.created_at).toLocaleDateString()}</span></ResponsiveRow>
                {userRole === "admin" && (
                  <div className="flex justify-end gap-1 pt-2 border-t">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(area)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(area.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </ResponsiveCard>
            ))}
            {areas.length === 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">No areas yet. Add your first delivery area.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Area</DialogTitle>
            <DialogDescription>Create a new delivery area</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Area Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Area A" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={submitting}>{submitting ? "Creating..." : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Area</DialogTitle>
            <DialogDescription>Update the area name</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Area Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={submitting}>{submitting ? "Updating..." : "Update"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(o) => { if (!o) setDeleteConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Area</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this area? Customers assigned to this area will be affected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={submitting} className="bg-destructive text-destructive-foreground">{submitting ? "Deleting..." : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
