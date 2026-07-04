import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Package, BarChart3, Users, Shield } from "lucide-react";
import { Dashboard } from "@/pages/Dashboard";
import { useAuth } from "@/hooks/useAuth";
import { useAppBootstrap } from "@/hooks/useAppBootstrap";
import { useNavigate } from "react-router-dom";
import { SplashScreen } from "@/components/ui/PageLoader";
import { useLanguage } from "@/lib/i18n";

const Index = () => {
  const { user, profile, signOut } = useAuth();
  const { bootPhase, statusMessage, loading } = useAppBootstrap();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Show branded splash screen during boot
  if (loading) {
    return (
      <SplashScreen
        status={statusMessage}
        userName={profile?.name}
        isAdmin={profile?.role === "admin"}
      />
    );
  }

  if (user && profile) {
    return <Dashboard user={{ 
      id: profile.user_id, 
      email: profile.email, 
      name: profile.name, 
      role: profile.role 
    }} onLogout={signOut} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-3xl mb-8">
            <Package className="h-10 w-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Pokleh Enterprise
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('landing.hero-description')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="group"
            >
              {t('landing.get-started')}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t('landing.everything-title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('landing.everything-description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t('landing.feature-stock-title')}</CardTitle>
              <CardDescription>
                {t('landing.feature-stock-description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t('landing.feature-sales-title')}</CardTitle>
              <CardDescription>
                {t('landing.feature-sales-description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t('landing.feature-truck-title')}</CardTitle>
              <CardDescription>
                {t('landing.feature-truck-description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t('landing.feature-closing-title')}</CardTitle>
              <CardDescription>
                {t('landing.feature-closing-description')}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;