import { useState } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2, Tag } from "lucide-react";
import { useSellingPrices } from "@/hooks/useSellingPrices";
import { useCustomers } from "@/hooks/useCustomers";
import { formatCurrency } from "@/lib/currency";
import { PRODUCT_TYPES, type ProductType } from "@/types/pokleh";

interface SellingPriceManagementProps {
  userRole: "admin" | "staff";
}

export const SellingPriceManagement = ({ userRole }: SellingPriceManagementProps) => {
  const { prices, loading, setPrice, deletePrice } = useSellingPrices();
  const { customers } = useCustomers();

  // Default price edit dialog
  const [editDefault, setEditDefault] = useState<{ open: boolean; product_type: ProductType; id?: string; price: number }>({
    open: false, product_type: "Air Batu Besar", price: 0,
  });

  // Customer override dialog
  const [editCustomer, setEditCustomer] = useState<{
    open: boolean; id?: string; customer_id: string; product_type: ProductType; price: number; notes: string;
  }>({ open: false, customer_id: "", product_type: "Air Batu Besar", price: 0, notes: "" });

  const [submitting, setSubmitting] = useState(false);

  if (loading) return <PageLoader />;

  const defaultPrices = prices.filter((p) => p.customer_id === null);
  const customerOverrides = prices.filter((p) => p.customer_id !== null);

  const openEditDefault = (pt: ProductType) => {
    const existing = defaultPrices.find((p) => p.product_type === pt);
    setEditDefault({ open: true, product_type: pt, id: existing?.id, price: existing?.price_per_pax ?? 0 });
  };

  const handleSaveDefault = async () => {
    setSubmitting(true);
    await setPrice({ id: editDefault.id, product_type: editDefault.product_type, customer_id: null, price_per_pax: editDefault.price });
    setEditDefault((s) => ({ ...s, open: false }));
    setSubmitting(false);
  };

  const handleSaveCustomer = async () => {
    if (!editCustomer.customer_id) return;
    setSubmitting(true);
    await setPrice({
      id: editCustomer.id,
      product_type: editCustomer.product_type,
      customer_id: editCustomer.customer_id,
      price_per_pax: editCustomer.price,
      notes: editCustomer.notes || null,
    });
    setEditCustomer((s) => ({ ...s, open: false }));
    setSubmitting(false);
  };

  const openAddCustomer = () =>
    setEditCustomer({ open: true, id: undefined, customer_id: "", product_type: "Air Batu Besar", price: 0, notes: "" });

  const openEditCustomer = (p: (typeof customerOverrides)[0]) =>
    setEditCustomer({ open: true, id: p.id, customer_id: p.customer_id!, product_type: p.product_type, price: p.price_per_pax, notes: p.notes ?? "" });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Senarai Harga Jual</h2>
        <p className="text-muted-foreground">Tetapkan harga lalai dan harga khusus per pelanggan</p>
      </div>

      {/* Default prices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Tag className="h-4 w-4" /> Harga Lalai (Semua Pelanggan)</CardTitle>
          <CardDescription>Harga ini digunakan apabila tiada harga khusus untuk pelanggan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {PRODUCT_TYPES.map((pt) => {
              const entry = defaultPrices.find((p) => p.product_type === pt);
              return (
                <div key={pt} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{pt}</p>
                    <p className="text-2xl font-bold">{entry ? formatCurrency(entry.price_per_pax) : "—"}<span className="text-sm font-normal text-muted-foreground">/pax</span></p>
                  </div>
                  {userRole === "admin" && (
                    <Button size="sm" variant="ghost" onClick={() => openEditDefault(pt)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Customer-specific overrides */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Harga Khusus Pelanggan ({customerOverrides.length})</CardTitle>
            <CardDescription>Pelanggan tertentu mendapat harga berbeza</CardDescription>
          </div>
          {userRole === "admin" && (
            <Button size="sm" onClick={openAddCustomer}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Override
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {customerOverrides.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Tiada harga khusus lagi</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Harga/Pax</TableHead>
                  <TableHead>Nota</TableHead>
                  {userRole === "admin" && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerOverrides.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.customer?.name ?? p.customer_id}</TableCell>
                    <TableCell><Badge variant="secondary">{p.product_type}</Badge></TableCell>
                    <TableCell className="font-bold">{formatCurrency(p.price_per_pax)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.notes || "—"}</TableCell>
                    {userRole === "admin" && (
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => openEditCustomer(p)}><Pencil className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deletePrice(p.id)}><Trash2 className="h-3 w-3" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit default price dialog */}
      <Dialog open={editDefault.open} onOpenChange={(o) => setEditDefault((s) => ({ ...s, open: o }))}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Harga Lalai — {editDefault.product_type}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Harga Per Pax (RM)</Label>
              <Input type="number" step="0.01" min={0} value={editDefault.price || ""} onChange={(e) => setEditDefault((s) => ({ ...s, price: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDefault((s) => ({ ...s, open: false }))}>Batal</Button>
            <Button onClick={handleSaveDefault} disabled={submitting}>{submitting ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/edit customer override dialog */}
      <Dialog open={editCustomer.open} onOpenChange={(o) => setEditCustomer((s) => ({ ...s, open: o }))}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editCustomer.id ? "Edit" : "Tambah"} Harga Khusus</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pelanggan</Label>
              <Select value={editCustomer.customer_id} onValueChange={(v) => setEditCustomer((s) => ({ ...s, customer_id: v }))} disabled={!!editCustomer.id}>
                <SelectTrigger><SelectValue placeholder="Pilih pelanggan" /></SelectTrigger>
                <SelectContent>
                  {customers.filter((c) => c.active).map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Jenis Produk</Label>
              <Select value={editCustomer.product_type} onValueChange={(v) => setEditCustomer((s) => ({ ...s, product_type: v as ProductType }))} disabled={!!editCustomer.id}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Harga Per Pax (RM)</Label>
              <Input type="number" step="0.01" min={0} value={editCustomer.price || ""} onChange={(e) => setEditCustomer((s) => ({ ...s, price: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-2">
              <Label>Nota (pilihan)</Label>
              <Input value={editCustomer.notes} onChange={(e) => setEditCustomer((s) => ({ ...s, notes: e.target.value }))} placeholder="Contoh: Diskaun regular" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCustomer((s) => ({ ...s, open: false }))}>Batal</Button>
            <Button onClick={handleSaveCustomer} disabled={submitting || !editCustomer.customer_id}>{submitting ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
