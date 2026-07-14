import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ServerCog, Database, ChevronDown, CircleCheck, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";
import { billingConfig } from "@/config/billing";

export const ServiceStatusCard = () => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(true);

  const balanceDue = Math.max(billingConfig.projectFee - billingConfig.amountPaid, 0);
  const monthlyInfraCost = billingConfig.monthlyHostingCost + billingConfig.monthlyDatabaseCost;

  const dueDate = new Date(billingConfig.dueDate).toLocaleDateString('ms-MY', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const statusBadge = {
    paid: { label: t('billing.status-paid'), className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
    unpaid: { label: t('billing.status-unpaid'), className: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
    overdue: { label: t('billing.status-overdue'), className: 'bg-destructive/15 text-destructive border-destructive/30' },
  }[billingConfig.status];

  return (
    <Card className="border-primary/20 animate-fade-in-up">
      <CardHeader
        className="p-3 sm:p-4 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ServerCog className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">{t('billing.card-title')}</CardTitle>
              <p className="text-xs text-muted-foreground truncate">{t('billing.card-subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={cn("border", statusBadge.className)}>
              {statusBadge.label}
            </Badge>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", !open && "-rotate-90")} />
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 rounded-lg border p-2.5">
              <ServerCog className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{t('billing.hosting')}</p>
                <p className="text-sm font-medium truncate">{billingConfig.hostingProvider}</p>
              </div>
              <CircleCheck className="h-4 w-4 text-emerald-500 shrink-0 ml-auto" />
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-2.5">
              <Database className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{t('billing.database')}</p>
                <p className="text-sm font-medium truncate">{billingConfig.databaseProvider}</p>
              </div>
              <CircleCheck className="h-4 w-4 text-emerald-500 shrink-0 ml-auto" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('billing.infra-notice')
              .replace('{provider}', billingConfig.providerName)
              .replace('{amount}', formatCurrency(monthlyInfraCost))}
          </p>

          <Separator />

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('billing.project-fee')}</span>
              <span>{formatCurrency(billingConfig.projectFee)}</span>
            </div>
            {billingConfig.amountPaid > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('billing.amount-paid')}</span>
                <span>{formatCurrency(billingConfig.amountPaid)}</span>
              </div>
            )}
            <Separator className="my-1.5" />
            <div className="flex justify-between font-semibold text-base">
              <span>{t('billing.balance-due')}</span>
              <span className="text-amber-600">{formatCurrency(balanceDue)}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('billing.notice')
              .replace('{provider}', billingConfig.providerName)
              .replace('{date}', dueDate)}
          </p>

          <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
            <p className="text-xs font-semibold">{t('billing.pay-to').replace('{provider}', billingConfig.providerName)}</p>
            {billingConfig.paymentMethods.map((m) => (
              <div key={m.label} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{m.label}</span>
                <span className="font-medium">{m.value}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs pt-1">
              <span className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{t('billing.contact')}</span>
              <span className="font-medium">{billingConfig.contactName} — {billingConfig.contactPhone}</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
