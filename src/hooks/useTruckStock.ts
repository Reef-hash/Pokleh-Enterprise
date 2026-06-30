import { useState, useEffect, useCallback } from "react";
import { trucksRepo } from "@/repositories/trucksRepo";
import { stockRpc } from "@/repositories/stockRepo";
import { PRODUCT_TYPES, type ProductType, type Truck } from "@/types/pokleh";

export interface TruckStockEntry {
  truck: Truck;
  stocks: { productType: ProductType; quantity: number }[];
  total: number;
}

export const useTruckStock = () => {
  const [data, setData] = useState<TruckStockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: trucks, error } = await trucksRepo.fetchAll();
      if (error || !trucks) return;

      const today = new Date().toISOString().split("T")[0];

      const entries: TruckStockEntry[] = await Promise.all(
        (trucks as Truck[]).map(async (truck) => {
          const stocks = await Promise.all(
            PRODUCT_TYPES.map(async (productType) => {
              const { data: qty } = await stockRpc.getAvailableStock(truck.id, productType, today);
              return { productType, quantity: (qty as number) ?? 0 };
            })
          );
          const total = stocks.reduce((sum, s) => sum + s.quantity, 0);
          return { truck, stocks, total };
        })
      );

      setData(entries);
      setLastRefreshed(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, lastRefreshed, refresh };
};
