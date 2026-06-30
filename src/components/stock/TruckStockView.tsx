import { useTruckStock } from "@/hooks/useTruckStock";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck, RefreshCw, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCT_TYPES, type ProductType } from "@/types/pokleh";

const PRODUCT_SHORT: Record<ProductType, string> = {
  "Air Batu Besar": "Besar",
  "Air Batu Kecil": "Kecil",
  "Air Batu Hancur": "Hancur",
};

function quantityColor(qty: number) {
  if (qty === 0) return "text-destructive font-semibold";
  if (qty < 10) return "text-amber-500 font-semibold";
  return "text-emerald-600 font-semibold";
}

function quantityBadge(qty: number) {
  if (qty === 0) return "destructive" as const;
  if (qty < 10) return "secondary" as const;
  return "outline" as const;
}

export const TruckStockView = () => {
  const { data, loading, lastRefreshed, refresh } = useTruckStock();

  // Grand totals per product type across all trucks
  const grandTotals = PRODUCT_TYPES.map((pt) => ({
    productType: pt,
    quantity: data.reduce((sum, entry) => {
      const s = entry.stocks.find((s) => s.productType === pt);
      return sum + (s?.quantity ?? 0);
    }, 0),
  }));
  const grandTotal = grandTotals.reduce((sum, g) => sum + g.quantity, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stok Lori"
        subtitle="Stok semasa yang ada atas setiap lori"
      >
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 sm:mr-2", loading && "animate-spin")} />
          <span className="hidden sm:inline">Muat Semula</span>
        </Button>
      </PageHeader>

      {/* Grand summary card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-muted-foreground" />
              Jumlah Keseluruhan — Semua Lori
            </CardTitle>
            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
              {grandTotal} pax
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {PRODUCT_TYPES.map((pt) => (
                <Skeleton key={pt} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {grandTotals.map(({ productType, quantity }) => (
                <div
                  key={productType}
                  className="rounded-lg border bg-muted/30 p-3 text-center"
                >
                  <p className="text-xs text-muted-foreground mb-1">
                    {PRODUCT_SHORT[productType]}
                  </p>
                  <p className={cn("text-xl", quantityColor(quantity))}>
                    {quantity}
                  </p>
                  <p className="text-xs text-muted-foreground">pax</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-truck cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-2">
                {PRODUCT_TYPES.map((pt) => (
                  <Skeleton key={pt} className="h-9 w-full rounded" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Tiada lori didaftarkan. Tambah lori dalam bahagian Pengurusan → Lori.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map(({ truck, stocks, total }) => (
            <Card key={truck.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    {truck.name}
                  </CardTitle>
                  <Badge variant={total === 0 ? "destructive" : "secondary"}>
                    {total} pax
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2">
                  {stocks.map(({ productType, quantity }) => (
                    <div
                      key={productType}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <span className="text-sm text-muted-foreground">
                        {productType}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm tabular-nums", quantityColor(quantity))}>
                          {quantity}
                        </span>
                        <Badge variant={quantityBadge(quantity)} className="text-xs min-w-[44px] justify-center">
                          pax
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {lastRefreshed && !loading && (
        <p className="text-center text-xs text-muted-foreground">
          Dikemaskini: {lastRefreshed.toLocaleTimeString("ms-MY")}
        </p>
      )}
    </div>
  );
};
