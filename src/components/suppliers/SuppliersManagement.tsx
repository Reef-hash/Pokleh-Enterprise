import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormModal } from "@/components/ui/FormModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { PhoneInput, CurrencyInput } from "@/components/ui/MobileOptimizedInputs";
import { Plus, Search, Edit, Trash2, Building2, Phone, DollarSign } from "lucide-react";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { usePoklehSuppliers } from "@/hooks/usePoklehSuppliers";
import { useSupplierPriceHistory } from "@/hooks/useSupplierPriceHistory";
import { useLanguage } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";
import { PRODUCT_TYPES, type ProductType } from "@/types/pokleh";

interface SuppliersManagementProps {
  userRole: "admin" | "staff";
}

export const SuppliersManagement = ({ userRole }: SuppliersManagementProps) => {
  const { t } = useLanguage();
  const { suppliers, loading, addSupplier, updateSupplier, deleteSupplier } = usePoklehSuppliers();
  const { pricesBySupplier, setPrice } = useSupplierPriceHistory();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Price management modal state
  const [priceOpen, setPriceOpen] = useState(false);
  const [priceSupplierId, setPriceSupplierId] = useState<string | null>(null);
  const [priceSupplierName, setPriceSupplierName] = useState("");
  const [priceLines, setPriceLines] = useState<Record<ProductType, string>>(
    PRODUCT_TYPES.reduce((acc, p) => { acc[p] = ""; return acc; }, {} as Record<ProductType, string>)
  );
  const [priceSubmitting, setPriceSubmitting] = useState(false);

  const openPriceModal = (s: { id: string; name: string }) => {
    setPriceSupplierId(s.id);
    setPriceSupplierName(s.name);
    const existing = pricesBySupplier.get(s.id) ?? {};
    setPriceLines(
      PRODUCT_TYPES.reduce((acc, p) => {
        acc[p] = existing[p] !== undefined ? String(existing[p]) : "";
        return acc;
      }, {} as Record<ProductType, string>)
    );
    setPriceOpen(true);
  };

  const handleSavePrices = async () => {
    if (!priceSupplierId || priceSubmitting) return;
    setPriceSubmitting(true);
    try {
      let anySaved = false;
      for (const p of PRODUCT_TYPES) {
        const val = parseFloat(priceLines[p]);
        if (!isNaN(val) && val > 0) {
          await setPrice(priceSupplierId, p, val);
          anySaved = true;
        }
      }
      if (anySaved) {
        setPriceOpen(false);
      } else {
        toast.error("Sila isi sekurang-kurangnya satu harga");
      }
    } finally {
      setPriceSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId || submitting) return;
    setSubmitting(true);
    try {
      const result = await deleteSupplier(deleteConfirmId);
      if (result.success) {
        setDeleteConfirmId(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = suppliers.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.phone?.includes(search)
  );

  const handleAdd = async () => {
    if (!name.trim() || submitting) { toast.error(t("supplier.error-required")); return; }
    setSubmitting(true);
    try {
      const result = await addSupplier(name.trim(), phone.trim() || undefined);
      if (result.success) {
        setName("");
        setPhone("");
        setIsAddOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!name.trim() || !editingId || submitting) { toast.error(t("supplier.error-required")); return; }
    setSubmitting(true);
    try {
      const result = await updateSupplier(editingId, name.trim(), phone.trim() || undefined);
      if (result.success) {
        setName("");
        setPhone("");
        setEditingId(null);
        setIsEditOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
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
        <p className="text-muted-foreground">{t("supplier.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("supplier.title")}
        subtitle={t("supplier.subtitle")}
      >
        {userRole === "admin" && (
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t("supplier.add")}</span>
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10" placeholder={t("supplier.search-placeholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("supplier.count").replace("{count}", filtered.length.toString())}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("supplier.table-name")}</TableHead>
                <TableHead>{t("supplier.table-phone")}</TableHead>
                <TableHead>Harga / Produk</TableHead>
                <TableHead>{t("supplier.table-added")}</TableHead>
                {userRole === "admin" && <TableHead>{t("common.actions")}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={userRole === "admin" ? 4 : 3} className="text-center text-muted-foreground py-8">
                    {suppliers.length === 0 ? t("empty.no-suppliers") : t("empty.search-no-match")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <span className="flex items-center gap-2 font-medium">
                      <Building2 className="h-4 w-4 text-muted-foreground" /> {s.name}
                    </span>
                  </TableCell>
                  <TableCell>{s.phone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</span> : "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {PRODUCT_TYPES.map((p) => {
                        const price = pricesBySupplier.get(s.id)?.[p];
                        return price !== undefined ? (
                          <span key={p} className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs">
                            {p.replace("Air Batu ", "")}: {formatCurrency(price)}
                          </span>
                        ) : null;
                      })}
                      {(!pricesBySupplier.get(s.id) || Object.keys(pricesBySupplier.get(s.id) ?? {}).length === 0) && (
                        <span className="text-xs text-muted-foreground italic">Belum ditetapkan</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                  {userRole === "admin" && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" title="Tetapkan harga" onClick={() => openPriceModal(s)}><DollarSign className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(s.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              )))}
            </TableBody>
          </Table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3">
            {filtered.map((s) => (
              <ResponsiveCard key={s.id}>
                <ResponsiveRow label={t("supplier.table-name")}>
                  <span className="flex items-center gap-2 font-medium">
                    <Building2 className="h-4 w-4 text-muted-foreground" /> {s.name}
                  </span>
                </ResponsiveRow>
                <ResponsiveRow label={t("supplier.table-phone")}>{s.phone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</span> : "—"}</ResponsiveRow>
                <ResponsiveRow label="Harga / Produk">
                  <div className="flex flex-wrap gap-1">
                    {PRODUCT_TYPES.map((p) => {
                      const price = pricesBySupplier.get(s.id)?.[p];
                      return price !== undefined ? (
                        <span key={p} className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs">
                          {p.replace("Air Batu ", "")}: {formatCurrency(price)}
                        </span>
                      ) : null;
                    })}
                    {(!pricesBySupplier.get(s.id) || Object.keys(pricesBySupplier.get(s.id) ?? {}).length === 0) && (
                      <span className="text-xs text-muted-foreground italic">Belum ditetapkan</span>
                    )}
                  </div>
                </ResponsiveRow>
                <ResponsiveRow label={t("supplier.table-added")}>{new Date(s.created_at).toLocaleDateString()}</ResponsiveRow>
                {userRole === "admin" && (
                  <div className="flex justify-end gap-1 pt-2 border-t">
                    <Button variant="ghost" size="sm" title="Tetapkan harga" onClick={() => openPriceModal(s)}><DollarSign className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(s.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                )}
              </ResponsiveCard>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">{suppliers.length === 0 ? t("empty.no-suppliers") : t("empty.search-no-match")}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <FormModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        title={t("supplier.add-modal-title")}
        description={t("supplier.add-modal-desc")}
        submitLabel={t("supplier.add-modal-button")}
        submitDisabled={!name.trim()}
        isSubmitting={submitting}
        onSubmit={handleAdd}
        onCancel={() => { setName(""); setPhone(""); }}
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="add_supplier_name" className="text-sm font-medium">{t("supplier.name-label")}</Label>
            <Input id="add_supplier_name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("supplier.name-placeholder")} />
          </div>
          <PhoneInput label={t("supplier.phone-label")} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("supplier.phone-placeholder")} />
        </div>
      </FormModal>

      <FormModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title={t("supplier.edit-modal-title")}
        description={t("supplier.edit-modal-desc")}
        submitLabel={t("supplier.edit-modal-button")}
        submitDisabled={!name.trim()}
        isSubmitting={submitting}
        onSubmit={handleEdit}
        onCancel={() => { setName(""); setPhone(""); setEditingId(null); }}
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="edit_supplier_name" className="text-sm font-medium">{t("supplier.name-label")}</Label>
            <Input id="edit_supplier_name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <PhoneInput label={t("supplier.phone-label")} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </FormModal>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(o) => { if (!o) setDeleteConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("supplier.confirm-delete-title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("supplier.confirm-delete")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FormModal
        open={priceOpen}
        onOpenChange={setPriceOpen}
        title={`Harga Pembekal — ${priceSupplierName}`}
        description="Tetapkan harga cost per pax untuk setiap produk. Harga ini akan auto-isi semasa terima stok."
        submitLabel="Simpan Harga"
        submitDisabled={priceSubmitting}
        isSubmitting={priceSubmitting}
        onSubmit={handleSavePrices}
        onCancel={() => { setPriceOpen(false); setPriceSupplierId(null); setPriceSupplierName(""); }}
      >
        <div className="space-y-3">
          {PRODUCT_TYPES.map((p) => (
            <div key={p} className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
              <p className="text-sm font-semibold">{p}</p>
              <CurrencyInput
                label="Cost per pax (RM)"
                currency="RM"
                value={priceLines[p] || ""}
                onChange={(e) => setPriceLines((prev) => ({ ...prev, [p]: e.target.value }))}
              />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Harga disimpan sebagai rekod baharu dengan tarikh hari ini. Harga lama kekal sebagai sejarah.
          </p>
        </div>
      </FormModal>
    </div>
  );
};
