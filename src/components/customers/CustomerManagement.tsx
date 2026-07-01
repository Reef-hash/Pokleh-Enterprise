import { useState } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import { FormModal } from "@/components/ui/FormModal";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/ui/MobileOptimizedInputs";
import { Plus, Search, Phone, MapPin } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCustomers } from "@/hooks/useCustomers";
import { useTrucks } from "@/hooks/useTrucks";
import { useLanguage } from "@/lib/i18n";
import type { Customer } from "@/types/pokleh";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";

interface CustomerManagementProps {
  userRole: "admin" | "staff";
}

export const CustomerManagement = ({ userRole }: CustomerManagementProps) => {
  const { t } = useLanguage();
  const { trucks } = useTrucks();
  const { customers, loading, addCustomer, updateCustomer, toggleActive } = useCustomers();
  const [search, setSearch] = useState("");
  const [truckFilter, setTruckFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", truck_id: "" });
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <PageLoader />;

  const filtered = customers.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search);
    const matchTruck = truckFilter === "all" || c.truck_id === truckFilter;
    return matchSearch && matchTruck;
  });

  const handleAdd = async () => {
    if (!form.name || !form.truck_id || submitting) { toast.error(t("customer.error-required")); return; }
    setSubmitting(true);
    try {
      const selectedTruck = trucks.find((t) => t.id === form.truck_id);
      const result = await addCustomer({ ...form, truck: selectedTruck });
      if (result.success) {
        setForm({ name: "", phone: "", address: "", truck_id: "" });
        setIsAddOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("customer.title")}
        subtitle={t("customer.subtitle")}
        actionLabel={t("customer.add")}
        actionIcon={Plus}
        onAction={() => setIsAddOpen(true)}
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" placeholder={t("customer.search-placeholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={truckFilter} onValueChange={setTruckFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("customer.all-trucks")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("customer.all-trucks")}</SelectItem>
                {trucks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("customer.count").replace("{count}", filtered.length.toString())}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.name")}</TableHead>
                  <TableHead>{t("common.phone")}</TableHead>
                  <TableHead>{t("common.truck")}</TableHead>
                  <TableHead>{t("customer.debt-balance")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {customers.length === 0 ? t("empty.no-customers") : t("empty.search-filter-no-match")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.phone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span> : "—"}</TableCell>
                    <TableCell><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.truck?.name || "—"}</span></TableCell>
                    <TableCell className={c.debt_balance > 0 ? "text-destructive font-medium" : ""}>
                      {formatCurrency(c.debt_balance)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.active ? "secondary" : "outline"}>{c.active ? t("common.active") : t("common.inactive")}</Badge>
                    </TableCell>
                  </TableRow>
                )))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3">
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {customers.length === 0 ? t("empty.no-customers") : t("empty.search-filter-no-match")}
              </p>
            ) : (
              filtered.map((c) => (
                <ResponsiveCard key={c.id}>
                  <ResponsiveRow label={t("common.name")}>{c.name}</ResponsiveRow>
                  <ResponsiveRow label={t("common.phone")}>{c.phone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span> : "—"}</ResponsiveRow>
                  <ResponsiveRow label={t("common.truck")}><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.truck?.name || "—"}</span></ResponsiveRow>
                  <ResponsiveRow label={t("customer.debt-balance")} className={c.debt_balance > 0 ? "text-destructive font-medium" : ""}>
                    {formatCurrency(c.debt_balance)}
                  </ResponsiveRow>
                  <ResponsiveRow label={t("common.status")}>
                    <Badge variant={c.active ? "secondary" : "outline"}>{c.active ? t("common.active") : t("common.inactive")}</Badge>
                  </ResponsiveRow>
                </ResponsiveCard>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <FormModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        title={t("customer.add-modal-title")}
        description={t("customer.add-modal-desc")}
        submitLabel={t("customer.add-modal-button")}
        submitDisabled={!form.name || !form.truck_id}
        isSubmitting={submitting}
        onSubmit={handleAdd}
        onCancel={() => setForm({ name: "", phone: "", address: "", truck_id: "" })}
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">{t("customer.name-label")}</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t("customer.name-placeholder")}
            />
          </div>

          <PhoneInput
            label={t("customer.phone-label")}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder={t("customer.phone-placeholder")}
          />

          <div>
            <Label htmlFor="address" className="text-sm font-medium">{t("customer.address-label")}</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder={t("customer.address-placeholder")}
            />
          </div>

          <div>
            <Label htmlFor="truck" className="text-sm font-medium">{t("customer.truck-label")}</Label>
            <Select value={form.truck_id} onValueChange={(v) => setForm({ ...form, truck_id: v })}>
              <SelectTrigger id="truck"><SelectValue placeholder={t("customer.truck-select")} /></SelectTrigger>
              <SelectContent>
                {trucks.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormModal>
    </div>
  );
};

