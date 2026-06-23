import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Package, BarChart3, Users, Shield } from "lucide-react";
import { Dashboard } from "@/pages/Dashboard";
import { useAuth } from "@/hooks/useAuth";
import { useAppBootstrap } from "@/hooks/useAppBootstrap";
import { useNavigate } from "react-router-dom";
import { SplashScreen } from "@/components/ui/PageLoader";

const Index = () => {
  const { user, profile, signOut } = useAuth();
  const { bootPhase, statusMessage, loading } = useAppBootstrap();
  const navigate = useNavigate();

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
            Ice distribution management system — track stock, manage sales, handle debt collections, 
            and generate reports with ease.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="group"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Purpose-built for ice distribution businesses — from stock intake to daily closing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Stock Management</CardTitle>
              <CardDescription>
                Full intake-to-distribution tracking with automated settlement calculations.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Sales & Debt</CardTitle>
              <CardDescription>
                Record sales, manage debt collections, and track customer balances in real time.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Area-Based Operations</CardTitle>
              <CardDescription>
                Assign staff to coverage areas with role-based access and performance tracking.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Daily Closing</CardTitle>
              <CardDescription>
                Automated end-of-day reconciliation with validation and profit calculation.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;