import { ProtectedRoute } from "./ProtectedRoute";
import { useAuthStore } from "@/stores/authStore";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/i18n";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AccessDenied = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-destructive" />
        <h1 className="text-2xl font-bold mb-2">{t('access-denied.title')}</h1>
        <p className="text-muted-foreground mb-6">
          {t('access-denied.message')}
        </p>
        <Button onClick={() => navigate("/")}>{t('access-denied.return-dashboard')}</Button>
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
