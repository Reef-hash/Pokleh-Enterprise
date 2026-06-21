import { ProtectedRoute } from "./ProtectedRoute";
import { useAuthStore } from "@/stores/authStore";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AccessDenied = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-destructive" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          You do not have permission to access this page. Only administrators can view this section.
        </p>
        <Button onClick={() => navigate("/")}>Return to Dashboard</Button>
      </div>
    </div>
  );
};

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const profile = useAuthStore((s) => s.profile);

  return (
    <ProtectedRoute>
      {profile?.role === "admin" ? children : <AccessDenied />}
    </ProtectedRoute>
  );
};
