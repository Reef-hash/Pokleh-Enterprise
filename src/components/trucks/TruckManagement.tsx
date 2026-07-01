import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormModal } from "@/components/ui/FormModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Truck as TruckIcon } from "lucide-react";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { useTrucks } from "@/hooks/useTrucks";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

interface TruckManagementProps {
  userRole: "admin" | "staff";
}

export const TruckManagement = ({ userRole }: TruckManagementProps) => {
  const { t } = useLanguage();
  const { trucks, loading, addTruck, updateTruck, deleteTruck } = useTrucks();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!name.trim() || submitting) { toast.error(t("truck.error-required")); return; }
    setSubmitting(true);
    try {
      const result = await addTruck(name.trim());
      if (result.success) {
        setName("");
        setIsAddOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!name.trim() || !editingId || submitting) { toast.error(t("truck.error-required")); return; }
    setSubmitting(true);
    try {
      const result = await updateTruck(editingId, name.trim());
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
      const result = await deleteTruck(deleteConfirmId);
      if (result.success) {
        setDeleteConfirmId(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (truck: { id: string; name: string }) => {
    setEditingId(truck.id);
    setName(truck.name);
    setIsEditOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t("truck.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("truck.title")}
        subtitle={t("truck.subtitle")}
      >
        {userRole === "admin" && (
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t("truck.add")}</span>
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t("truck.count").replace("{count}", trucks.length.toString())}</CardTitle>
          <CardDescription>{t("truck.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("truck.name-label")}</TableHead>
                <TableHead>{t("common.created")}</TableHead>
                {userRole === "admin" && <TableHead>{t("common.actions")}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {trucks.map((truck) => (
                <TableRow key={truck.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TruckIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{truck.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(truck.created_at).toLocaleDateString()}
                  </TableCell>
                  {userRole === "admin" && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(truck)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(truck.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {trucks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    {t("empty.no-trucks")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3">
            {trucks.map((truck) => (
              <ResponsiveCard key={truck.id}>
                <ResponsiveRow label={t("truck.name-label")}>
                  <span className="flex items-center gap-2">
                    <TruckIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{truck.name}</span>
                  </span>
                </ResponsiveRow>
                <ResponsiveRow label={t("common.created")}><span className="text-muted-foreground">{new Date(truck.created_at).toLocaleDateString()}</span></ResponsiveRow>
                {userRole === "admin" && (
                  <div className="flex justify-end gap-1 pt-2 border-t">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(truck)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(truck.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </ResponsiveCard>
            ))}
            {trucks.length === 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">{t("empty.no-trucks")}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <FormModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        title={t("truck.add-modal-title")}
        description={t("truck.add-modal-desc")}
        submitLabel={t("truck.add-modal-button")}
        submitDisabled={!name.trim()}
        isSubmitting={submitting}
        onSubmit={handleAdd}
        onCancel={() => setName("")}
      >
        <div>
          <Label htmlFor="add_truck_name" className="text-sm font-medium">{t("truck.name-label")}</Label>
          <Input
            id="add_truck_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("truck.name-placeholder")}
          />
        </div>
      </FormModal>

      <FormModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title={t("truck.edit-modal-title")}
        description={t("truck.edit-modal-desc")}
        submitLabel={t("truck.edit-modal-button")}
        submitDisabled={!name.trim()}
        isSubmitting={submitting}
        onSubmit={handleEdit}
        onCancel={() => { setName(""); setEditingId(null); }}
      >
        <div>
          <Label htmlFor="edit_truck_name" className="text-sm font-medium">{t("truck.name-label")}</Label>
          <Input
            id="edit_truck_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </FormModal>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(o) => { if (!o) setDeleteConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("truck.confirm-delete-title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("truck.confirm-delete")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={submitting} className="bg-destructive text-destructive-foreground">{submitting ? t("truck.deleting") : t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
