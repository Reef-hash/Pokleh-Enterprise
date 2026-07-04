import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { useLanguage } from "@/lib/i18n";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.warn(`404: route not found — ${location.pathname}`);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="text-center">
        <Logo variant="splash" className="justify-center mb-6" showText={false} />
        <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-6">{t("notfound.message")}</p>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("notfound.return-home")}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
