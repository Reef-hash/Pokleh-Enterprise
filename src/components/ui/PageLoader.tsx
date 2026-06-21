import { Loader2 } from "lucide-react";

export const PageLoader = () => (
  <div className="flex items-center justify-center py-16">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);
