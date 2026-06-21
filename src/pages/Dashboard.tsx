import { useState, lazy, Suspense } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PoklehDashboard } from "@/components/dashboard/PoklehDashboard";
import { PageLoader } from "@/components/ui/PageLoader";

const AreaManagement = lazy(() => import("@/components/areas/AreaManagement").then(m => ({ default: m.AreaManagement })));
const CustomerManagement = lazy(() => import("@/components/customers/CustomerManagement").then(m => ({ default: m.CustomerManagement })));
const StaffAssignment = lazy(() => import("@/components/staff/StaffAssignment").then(m => ({ default: m.StaffAssignment })));
const StockIntakeForm = lazy(() => import("@/components/stock/StockIntakeForm").then(m => ({ default: m.StockIntakeForm })));
const StockDistributionForm = lazy(() => import("@/components/stock/StockDistributionForm").then(m => ({ default: m.StockDistributionForm })));
const StockReturnForm = lazy(() => import("@/components/stock/StockReturnForm").then(m => ({ default: m.StockReturnForm })));
const SupplierSettlementView = lazy(() => import("@/components/stock/SupplierSettlementView").then(m => ({ default: m.SupplierSettlementView })));
const SuppliersManagement = lazy(() => import("@/components/suppliers/SuppliersManagement").then(m => ({ default: m.SuppliersManagement })));
const SalesEntryForm = lazy(() => import("@/components/sales/SalesEntryForm").then(m => ({ default: m.SalesEntryForm })));
const DebtLedgerView = lazy(() => import("@/components/sales/DebtLedgerView").then(m => ({ default: m.DebtLedgerView })));
const DebtCollectionForm = lazy(() => import("@/components/sales/DebtCollectionForm").then(m => ({ default: m.DebtCollectionForm })));
const ExpenseManagement = lazy(() => import("@/components/expenses/ExpenseManagement").then(m => ({ default: m.ExpenseManagement })));
const SupplierPriceHistoryView = lazy(() => import("@/components/suppliers/SupplierPriceHistoryView").then(m => ({ default: m.SupplierPriceHistoryView })));
const PoklehReports = lazy(() => import("@/components/reports/PoklehReports").then(m => ({ default: m.PoklehReports })));
const DailyClosingWorkflow = lazy(() => import("@/components/closings/DailyClosingWorkflow").then(m => ({ default: m.DailyClosingWorkflow })));
const AuditLogViewer = lazy(() => import("@/components/audit/AuditLogViewer").then(m => ({ default: m.AuditLogViewer })));

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

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <PoklehDashboard user={user} onNavigate={handleNavigate} />;
      case 'areas':
        return <AreaManagement userRole={user.role} />;
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
      case 'pokleh-reports':
        return <PoklehReports userRole={user.role} />;
      case 'daily-closing':
        return <DailyClosingWorkflow userRole={user.role} />;
      case 'audit-logs':
        return user.role === "admin" ? <AuditLogViewer /> : <div className="text-center py-12"><h3 className="text-lg font-semibold mb-2">Access Denied</h3><p className="text-muted-foreground">Only administrators can view audit logs.</p></div>;
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
    <DashboardLayout
      user={user}
      onLogout={onLogout}
      currentPage={currentPage}
      onNavigate={handleNavigate}
    >
      <Suspense fallback={<PageLoader />}>
        {renderContent()}
      </Suspense>
    </DashboardLayout>
  );
};