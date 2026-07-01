import { useMemo } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { DailyBillView } from "./DailyBillView";
import { useSales } from "@/hooks/useSales";
import { useStockWastage } from "@/hooks/useStockWastage";
import { useStockIntake } from "@/hooks/useStockIntake";
import { useTrucks } from "@/hooks/useTrucks";
import { useDailyBill } from "@/hooks/useDailyBill";
import { useLanguage } from "@/lib/i18n";

interface DailyBillsPageProps {
  userRole: "admin" | "staff";
}

export const DailyBillsPage = ({ userRole }: DailyBillsPageProps) => {
  const { t } = useLanguage();
  const { sales, loading: salesLoading } = useSales();
  const { wastages, adjustments, loading: wastageLoading } = useStockWastage();
  const { intakes, loading: intakesLoading } = useStockIntake();
  const { trucks, loading: trucksLoading } = useTrucks();

  const { dailyBills } = useDailyBill(sales, wastages, adjustments, intakes, trucks);

  const loading = useMemo(() => {
    return salesLoading || wastageLoading || intakesLoading || trucksLoading;
  }, [salesLoading, wastageLoading, intakesLoading, trucksLoading]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t('stock.daily-bills-title')}</h2>
        <p className="text-muted-foreground">
          {t('stock.daily-bills-subtitle')}
        </p>
      </div>

      {userRole === "admin" ? (
        <DailyBillView dailyBills={dailyBills} isLoading={loading} />
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">{t('common.error')}</h3>
          <p className="text-muted-foreground">{t('empty.no-logs')}</p>
        </div>
      )}
    </div>
  );
};
