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
import { CurrencyInput } from "@/components/ui/MobileOptimizedInputs";
import { Plus, Wallet } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useDebtCollection } from "@/hooks/useDebtCollection";
import { useCustomers } from "@/hooks/useCustomers";
import { formatCurrency } from "@/lib/currency";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

interface DebtCollectionFormProps {
  userRole: "admin" | "staff";
}

export const DebtCollectionForm = ({ userRole }: DebtCollectionFormProps) => {
  const { t } = useLanguage();
  const { collections, loading, addCollection } = useDebtCollection();
  const { customers } = useCustomers();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    amount: 0,
    collection_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <PageLoader />;

  const activeDebtors = customers.filter((c) => c.debt_balance > 0);

  const handleAdd = async () => {
    if (!form.customer_id || form.amount <= 0 || submitting) { toast.error(t('debt.error-required')); return; }
    setSubmitting(true);
    try {
      const result = await addCollection(form);
      if (result.success) {
        setForm({ customer_id: "", amount: 0, collection_date: new Date().toISOString().split("T")[0], notes: "" });
        setIsOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const totalCollected = collections.reduce((s, c) => s + c.amount, 0);
  const totalOutstanding = customers.reduce((s, c) => s + c.debt_balance, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('debt.collection-title')}
        subtitle={t('debt.collection-subtitle')}
        actionLabel={t('debt.record-collection')}
        actionIcon={Plus}
        onAction={() => setIsOpen(true)}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t('debt.total-collected')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(totalCollected)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t('debt.outstanding')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">{formatCurrency(totalOutstanding)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('debt.collections').replace('{count}', collections.length.toString())}</CardTitle>
          <CardDescription>{t('debt.collection-desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.date')}</TableHead>
                  <TableHead>{t('common.customer')}</TableHead>
                  <TableHead>{t('common.amount')}</TableHead>
                  <TableHead>{t('debt.table-staff')}</TableHead>
                  <TableHead>{t('common.notes')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collections.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{new Date(c.collection_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{c.customer?.name || "—"}</TableCell>
                    <TableCell className="text-green-600 font-medium">{formatCurrency(c.amount)}</TableCell>
                    <TableCell>{c.staff?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{c.notes || "—"}</TableCell>
                  </TableRow>
                ))}
                {collections.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {t('empty.no-collections')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3">
            {collections.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t('empty.no-collections')}</p>
            ) : (
              collections.map((c) => (
                <ResponsiveCard key={c.id}>
                  <ResponsiveRow label={t('common.date')}>{new Date(c.collection_date).toLocaleDateString()}</ResponsiveRow>
                  <ResponsiveRow label={t('common.customer')}>{c.customer?.name || "—"}</ResponsiveRow>
                  <ResponsiveRow label={t('common.amount')} className="text-green-600 font-medium">{formatCurrency(c.amount)}</ResponsiveRow>
                  <ResponsiveRow label={t('debt.table-staff')}>{c.staff?.name || "—"}</ResponsiveRow>
                  <ResponsiveRow label={t('common.notes')}>{c.notes || "—"}</ResponsiveRow>
                </ResponsiveCard>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <FormModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title={t('debt.modal-title')}
        description={t('debt.modal-desc')}
        submitLabel={t('debt.modal-button')}
        submitDisabled={!form.customer_id || form.amount <= 0}
        isSubmitting={submitting}
        onSubmit={handleAdd}
        onCancel={() => setForm({ customer_id: "", amount: 0, collection_date: new Date().toISOString().split("T")[0], notes: "" })}
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="customer" className="text-sm font-medium">{t('common.customer')}</Label>
            <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
              <SelectTrigger id="customer"><SelectValue placeholder={t('debt.select-debtor')} /></SelectTrigger>
              <SelectContent>
                {activeDebtors.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({formatCurrency(c.debt_balance)})
                  </SelectItem>
                ))}
                {activeDebtors.length === 0 && (
                  <SelectItem value="__none__" disabled>{t('sales.no-customers')}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <CurrencyInput
            label={t('common.amount')}
            currency="RM"
            value={form.amount || ""}
            onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
          />

          <div>
            <Label htmlFor="collection_date" className="text-sm font-medium">{t('common.date')}</Label>
            <Input
              id="collection_date"
              type="date"
              value={form.collection_date}
              onChange={(e) => setForm({ ...form, collection_date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium">{t('expense.notes-label')}</Label>
            <Input
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder={t('expense.notes-placeholder')}
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
};

