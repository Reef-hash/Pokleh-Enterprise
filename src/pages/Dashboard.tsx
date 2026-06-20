import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { StaffDashboard } from "@/components/dashboard/StaffDashboard";
import { InventoryManagement } from "@/components/inventory/InventoryManagement";
import { ReportsManagement } from "@/components/reports/ReportsManagement";
import { UserManagement } from "@/components/users/UserManagement";
import { OrdersManagement } from "@/components/orders/OrdersManagement";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { SuppliersManagement } from "@/components/suppliers/SuppliersManagement";
import { AreaManagement } from "@/components/areas/AreaManagement";
import { CustomerManagement } from "@/components/customers/CustomerManagement";
import { StaffAssignment } from "@/components/staff/StaffAssignment";
import { StockIntakeForm } from "@/components/stock/StockIntakeForm";
import { StockDistributionForm } from "@/components/stock/StockDistributionForm";
import { StockReturnForm } from "@/components/stock/StockReturnForm";
import { SupplierSettlementView } from "@/components/stock/SupplierSettlementView";
import { SalesEntryForm } from "@/components/sales/SalesEntryForm";
import { DebtLedgerView } from "@/components/sales/DebtLedgerView";
import { DebtCollectionForm } from "@/components/sales/DebtCollectionForm";
import { ExpenseManagement } from "@/components/expenses/ExpenseManagement";
import { SupplierPriceHistoryView } from "@/components/suppliers/SupplierPriceHistoryView";
import { PoklehReports } from "@/components/reports/PoklehReports";
import { DailyClosingWorkflow } from "@/components/closings/DailyClosingWorkflow";
import { AuditLogViewer } from "@/components/audit/AuditLogViewer";
import { useInventory } from "@/hooks/useInventory";

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
  const { items: inventoryData } = useInventory();

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return user.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <StaffDashboard 
            onNavigate={handleNavigate}
          />
        );
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
      case 'inventory':
        return (
          <InventoryManagement 
            inventoryData={inventoryData}
            onUpdateInventory={() => {}}
            userRole={user.role}
          />
        );
      case 'suppliers':
        return (
          <SuppliersManagement userRole={user.role} />
        );
      case 'orders':
        return (
          <OrdersManagement userRole={user.role} />
        );
      case 'reports':
        return (
          <ReportsManagement userRole={user.role} />
        );
      case 'users':
        return (
          <UserManagement userRole={user.role} />
        );
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
      case 'analytics':
        return (
          <AnalyticsDashboard userRole={user.role} />
        );
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
      {renderContent()}
    </DashboardLayout>
  );
};