import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PoklehDashboard } from "@/components/dashboard/PoklehDashboard";
import { GuidedTour } from "@/components/help/GuidedTour";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { TruckManagement } from "@/components/trucks/TruckManagement";
import { CustomerManagement } from "@/components/customers/CustomerManagement";
import { StaffAssignment } from "@/components/staff/StaffAssignment";
import { StockIntakeForm } from "@/components/stock/StockIntakeForm";
import { StockDistributionForm } from "@/components/stock/StockDistributionForm";
import { StockReturnForm } from "@/components/stock/StockReturnForm";
import { SupplierSettlementView } from "@/components/stock/SupplierSettlementView";
import { TruckStockView } from "@/components/stock/TruckStockView";
import { SuppliersManagement } from "@/components/suppliers/SuppliersManagement";
import { SalesEntryForm } from "@/components/sales/SalesEntryForm";
import { DebtLedgerView } from "@/components/sales/DebtLedgerView";
import { DebtCollectionForm } from "@/components/sales/DebtCollectionForm";
import { ExpenseManagement } from "@/components/expenses/ExpenseManagement";
import { SupplierPriceHistoryView } from "@/components/suppliers/SupplierPriceHistoryView";
import { SellingPriceManagement } from "@/components/sales/SellingPriceManagement";
import { PoklehReports } from "@/components/reports/PoklehReports";
import { DailyClosingWorkflow } from "@/components/closings/DailyClosingWorkflow";
import { AuditLogViewer } from "@/components/audit/AuditLogViewer";
import { StaffAccountManagement } from "@/components/admin/StaffAccountManagement";

interface User {
  id: string;
  email: string;
  role: 'admin' | 'staff';
  name: string;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const profile = useAuthStore((s) => s.profile);
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    if (profile && !profile.onboarding_completed) {
      setTourOpen(true);
    }
  }, [profile]);

  // Register restart callback for HelpButton
  useEffect(() => {
    useAuthStore.setState({ _restartTourFn: () => setTourOpen(true) });
    return () => useAuthStore.setState({ _restartTourFn: null });
  }, []);

  const handleTourComplete = async () => {
    setTourOpen(false);
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", user.id);
    if (!error) {
      useAuthStore.setState((s) => s.profile ? { profile: { ...s.profile, onboarding_completed: true } } : {});
    }
  };

  const handleTourSkip = async () => {
    setTourOpen(false);
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", user.id);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <PoklehDashboard user={user} onNavigate={handleNavigate} />;
      case 'trucks':
        return <TruckManagement userRole={user.role} />;
      case 'customers':
        return <CustomerManagement userRole={user.role} />;
      case 'staff-assignments':
        return <StaffAssignment userRole={user.role} />;
      case 'stock-intake':
        return <StockIntakeForm userRole={user.role} />;
      case 'stock-distribution':
        return <StockDistributionForm userRole={user.role} />;
      case 'stock-return':
        return <StockReturnForm userRole={user.role} />;
      case 'truck-stock':
        return <TruckStockView />;
      case 'settlements':
        return <SupplierSettlementView userRole={user.role} />;
      case 'suppliers':
        return <SuppliersManagement userRole={user.role} />;
      case 'sales':
        return <SalesEntryForm userRole={user.role} />;
      case 'debt-ledger':
        return <DebtLedgerView />;
      case 'debt-collection':
        return <DebtCollectionForm userRole={user.role} />;
      case 'expenses':
        return <ExpenseManagement userRole={user.role} />;
      case 'price-history':
        return <SupplierPriceHistoryView />;
      case 'selling-prices':
        return <SellingPriceManagement userRole={user.role} />;
      case 'pokleh-reports':
        return <PoklehReports userRole={user.role} />;
      case 'daily-closing':
        return <DailyClosingWorkflow userRole={user.role} />;
      case 'audit-logs':
        return user.role === "admin" ? <AuditLogViewer /> : <div className="text-center py-12"><h3 className="text-lg font-semibold mb-2">Access Denied</h3><p className="text-muted-foreground">Only administrators can view audit logs.</p></div>;
      case 'staff-accounts':
        return user.role === "admin" ? <StaffAccountManagement /> : <div className="text-center py-12"><h3 className="text-lg font-semibold mb-2">Access Denied</h3><p className="text-muted-foreground">Only administrators can manage staff accounts.</p></div>;
      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Page Not Found</h3>
            <p className="text-muted-foreground">The requested page could not be found.</p>
          </div>
        );
    }
  };

  return (
    <>
      <DashboardLayout
        user={user}
        onLogout={onLogout}
        currentPage={currentPage}
        onNavigate={handleNavigate}
      >
        {renderContent()}
      </DashboardLayout>
      <GuidedTour
        open={tourOpen}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
        onNavigate={handleNavigate}
      />
    </>
  );
};