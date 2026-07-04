import { useMemo, useState } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveCard, ResponsiveRow } from "@/components/ui/ResponsiveTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useDebtLedger } from "@/hooks/useDebtLedger";
import { useCustomers } from "@/hooks/useCustomers";
import { formatCurrency } from "@/lib/currency";
import { useLanguage } from "@/lib/i18n";
import type { DebtLedgerEntry } from "@/types/pokleh";

export const DebtLedgerView = () => {
  const { t } = useLanguage();
  const { entries, loading } = useDebtLedger();
  const { customers } = useCustomers();
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  // Group entries by customer so the ledger reads as one section per
  // customer (name + running total) instead of an interleaved, unsorted
  // history — mirrors a paper ledger book.
  const customerSummaries = useMemo(() => {
    const map = new Map<string, { customerId: string; name: string; entries: DebtLedgerEntry[] }>();
    for (const e of entries) {
      const existing = map.get(e.customer_id);
      if (existing) {
        existing.entries.push(e);
      } else {
        map.set(e.customer_id, {
          customerId: e.customer_id,
          name: e.customer?.name || "—",
          entries: [e],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [entries]);

  if (loading) return <PageLoader />;

  const selected = selectedCustomer
    ? customerSummaries.find((c) => c.customerId === selectedCustomer)
    : null;
  const selectedBalance = selectedCustomer
    ? customers.find((c) => c.id === selectedCustomer)?.debt_balance ?? 0
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t('debt.ledger-title')}</h2>
        <p className="text-muted-foreground">{t('debt.ledger-subtitle')}</p>
      </div>

      {!selected ? (
        <>
          <div className="space-y-2 w-full sm:w-64">
            <Label>{t('debt.filter-by-customer')}</Label>
            <Select value="all" onValueChange={(v) => setSelectedCustomer(v === "all" ? null : v)}>
              <SelectTrigger><SelectValue placeholder={t('debt.all-customers')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('debt.all-customers')}</SelectItem>
                {customerSummaries.map((c) => (
                  <SelectItem key={c.customerId} value={c.customerId}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('debt.customer-summary').replace('{count}', customerSummaries.length.toString())}</CardTitle>
              <CardDescription>{t('debt.customer-summary-desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('common.customer')}</TableHead>
                      <TableHead>{t('debt.transactions-count')}</TableHead>
                      <TableHead>{t('debt.last-activity')}</TableHead>
                      <TableHead>{t('debt.current-balance')}</TableHead>
                      <TableHead className="text-right">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerSummaries.map((c) => {
                      const balance = customers.find((cust) => cust.id === c.customerId)?.debt_balance ?? 0;
                      return (
                        <TableRow
                          key={c.customerId}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedCustomer(c.customerId)}
                        >
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>{c.entries.length}</TableCell>
                          <TableCell>{new Date(c.entries[0].created_at).toLocaleDateString()}</TableCell>
                          <TableCell className={balance > 0 ? "text-destructive font-medium" : "text-green-600 font-medium"}>
                            {formatCurrency(balance)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">{t('debt.view-history')}</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {customerSummaries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          {t('empty.no-debt')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="block md:hidden space-y-3">
                {customerSummaries.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{t('empty.no-debt')}</p>
                ) : (
                  customerSummaries.map((c) => {
                    const balance = customers.find((cust) => cust.id === c.customerId)?.debt_balance ?? 0;
                    return (
                      <ResponsiveCard key={c.customerId} className="cursor-pointer" >
                        <div onClick={() => setSelectedCustomer(c.customerId)} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{c.name}</span>
                            <Button variant="ghost" size="sm">{t('debt.view-history')}</Button>
                          </div>
                          <ResponsiveRow label={t('debt.transactions-count')}>{c.entries.length}</ResponsiveRow>
                          <ResponsiveRow label={t('debt.last-activity')}>{new Date(c.entries[0].created_at).toLocaleDateString()}</ResponsiveRow>
                          <ResponsiveRow
                            label={t('debt.current-balance')}
                            className={balance > 0 ? "text-destructive font-medium" : "text-green-600 font-medium"}
                          >
                            {formatCurrency(balance)}
                          </ResponsiveRow>
                        </div>
                      </ResponsiveCard>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t('common.back')}
            </Button>
            <Card className="flex-1">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{selected.name} — {t('debt.current-balance')}</CardTitle></CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${selectedBalance > 0 ? "text-destructive" : "text-green-600"}`}>
                  {formatCurrency(selectedBalance)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('debt.entries').replace('{count}', selected.entries.length.toString())}</CardTitle>
              <CardDescription>{t('debt.append-only')}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('common.date')}</TableHead>
                      <TableHead>{t('debt.table-type')}</TableHead>
                      <TableHead>{t('common.amount')}</TableHead>
                      <TableHead>{t('debt.table-balance-before')}</TableHead>
                      <TableHead>{t('debt.table-balance-after')}</TableHead>
                      <TableHead>{t('debt.table-reference')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.entries.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{new Date(e.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={
                            e.entry_type === "sale" ? "text-destructive" :
                            e.entry_type === "payment" ? "text-green-600" : "text-muted-foreground"
                          }>
                            {e.entry_type}
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(e.amount)}</TableCell>
                        <TableCell>{formatCurrency(e.balance_before)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(e.balance_after)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{e.reference_type}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="block md:hidden space-y-3">
                {selected.entries.map((e) => (
                  <ResponsiveCard key={e.id}>
                    <ResponsiveRow label={t('common.date')}>{new Date(e.created_at).toLocaleDateString()}</ResponsiveRow>
                    <ResponsiveRow label={t('debt.table-type')}>
                      <span className={
                        e.entry_type === "sale" ? "text-destructive" :
                        e.entry_type === "payment" ? "text-green-600" : "text-muted-foreground"
                      }>
                        {e.entry_type}
                      </span>
                    </ResponsiveRow>
                    <ResponsiveRow label={t('common.amount')}>{formatCurrency(e.amount)}</ResponsiveRow>
                    <ResponsiveRow label={t('debt.table-balance-before')}>{formatCurrency(e.balance_before)}</ResponsiveRow>
                    <ResponsiveRow label={t('debt.table-balance-after')}>{formatCurrency(e.balance_after)}</ResponsiveRow>
                    <ResponsiveRow label={t('debt.table-reference')}>{e.reference_type}</ResponsiveRow>
                  </ResponsiveCard>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
