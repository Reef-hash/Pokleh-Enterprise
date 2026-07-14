import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { TriangleAlert, ServerCog, Database, CircleCheck, MessageCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";
import { billingConfig } from "@/config/billing";
import { isBillingLocked, buildBillingWhatsAppLink } from "@/lib/billingLock";

export const BillingLockBanner = () => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  if (!isBillingLocked()) return null;

  const balanceDue = Math.max(billingConfig.projectFee - billingConfig.amountPaid, 0);
  const monthlyInfraCost = billingConfig.monthlyHostingCost + billingConfig.monthlyDatabaseCost;
  const dueDate = new Date(billingConfig.dueDate).toLocaleDateString('ms-MY', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const whatsappLink = buildBillingWhatsAppLink(
    billingConfig.contactPhone,
    t('billing.whatsapp-message')
      .replace('{amount}', formatCurrency(balanceDue))
      .replace('{provider}', billingConfig.providerName)
  );

  return (
    <>
      <Alert className="rounded-none border-x-0 border-t-0 border-b-amber-500/40 bg-amber-500/10 py-2.5 px-3 sm:px-4">
        <TriangleAlert className="h-4 w-4 text-amber-600" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <AlertTitle className="text-sm text-amber-800 dark:text-amber-400">{t('billing.banner-title')}</AlertTitle>
            <AlertDescription className="text-xs text-amber-800/80 dark:text-amber-400/80">
              {t('billing.banner-desc')}
            </AlertDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-500/50 text-amber-700 hover:bg-amber-500/10 shrink-0"
            onClick={() => setOpen(true)}
          >
            {t('billing.view-details')}
          </Button>
        </div>
      </Alert>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('billing.card-title')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
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
              <div className="flex justify-between items-center">
                <span className="font-semibold text-base">{t('billing.balance-due')}</span>
                <span className="text-xl font-bold text-amber-600">{formatCurrency(balanceDue)}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('billing.notice')
                .replace('{provider}', billingConfig.providerName)
                .replace('{date}', dueDate)}
            </p>

            <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-2" />
                {t('billing.whatsapp-cta')}
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
