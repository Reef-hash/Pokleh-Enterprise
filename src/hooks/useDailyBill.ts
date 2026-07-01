import { useMemo } from "react";
import type { Sale, StockWastage, WastageAdjustment, StockIntake, Truck } from "@/types/pokleh";

export interface DailyBillLine {
  truckId: string;
  truckName: string;
  productType: string;
  wasteDate: string; // ISO date
  intakeId?: string;
  quantitySold: number;
  quantityWasted: number;
  wastageReduction: number;
  payableQuantity: number; // sold + (wasted - reduction)
  costPerPax: number;
  payableAmount: number; // payableQuantity * costPerPax
  supplierName: string;
}

export interface DailyBillSummary {
  date: string;
  truckId: string;
  truckName: string;
  lines: DailyBillLine[];
  totalSold: number;
  totalWasted: number;
  totalReduction: number;
  totalPayable: number;
  totalAmount: number;
}

export const useDailyBill = (
  sales: Sale[],
  wastages: StockWastage[],
  adjustments: WastageAdjustment[],
  intakes: StockIntake[],
  trucks: Truck[]
) => {
  const dailyBills = useMemo(() => {
    const grouped = new Map<string, DailyBillSummary>();

    // Group sales by date, truck, product
    sales.forEach((sale) => {
      const dateKey = `${sale.sale_date}`;
      const truckName = trucks.find((t) => t.id === sale.truck_id)?.name || "Unknown";

      const bill = grouped.get(dateKey) || {
        date: sale.sale_date,
        truckId: sale.truck_id,
        truckName,
        lines: [],
        totalSold: 0,
        totalWasted: 0,
        totalReduction: 0,
        totalPayable: 0,
        totalAmount: 0,
      };

      const existingLine = bill.lines.find(
        (l) => l.truckId === sale.truck_id && l.productType === sale.product_type
      );

      if (existingLine) {
        existingLine.quantitySold += sale.quantity;
      } else {
        const intake = intakes.find(
          (i) =>
            i.truck_id === sale.truck_id &&
            i.product_type === sale.product_type &&
            i.intake_date === sale.sale_date
        );
        bill.lines.push({
          truckId: sale.truck_id,
          truckName,
          productType: sale.product_type,
          wasteDate: sale.sale_date,
          intakeId: intake?.id,
          quantitySold: sale.quantity,
          quantityWasted: 0,
          wastageReduction: 0,
          payableQuantity: sale.quantity,
          costPerPax: intake?.cost_per_pax || 0,
          payableAmount: sale.quantity * (intake?.cost_per_pax || 0),
          supplierName: intake?.supplier?.name || "Unknown",
        });
      }

      grouped.set(dateKey, bill);
    });

    // Add wastage to lines
    wastages.forEach((wastage) => {
      const dateKey = wastage.waste_date;
      const bill = grouped.get(dateKey) || {
        date: wastage.waste_date,
        truckId: wastage.truck_id,
        truckName: wastage.truck?.name || "Unknown",
        lines: [],
        totalSold: 0,
        totalWasted: 0,
        totalReduction: 0,
        totalPayable: 0,
        totalAmount: 0,
      };

      const existingLine = bill.lines.find(
        (l) => l.truckId === wastage.truck_id && l.productType === wastage.product_type
      );

      const intake = wastage.intake_id
        ? intakes.find((i) => i.id === wastage.intake_id)
        : intakes.find(
            (i) =>
              i.truck_id === wastage.truck_id &&
              i.product_type === wastage.product_type &&
              i.intake_date === wastage.waste_date
          );

      if (existingLine) {
        existingLine.quantityWasted += wastage.quantity_wasted;
      } else {
        bill.lines.push({
          truckId: wastage.truck_id,
          truckName: wastage.truck?.name || "Unknown",
          productType: wastage.product_type,
          wasteDate: wastage.waste_date,
          intakeId: wastage.intake_id,
          quantitySold: 0,
          quantityWasted: wastage.quantity_wasted,
          wastageReduction: 0,
          payableQuantity: wastage.quantity_wasted,
          costPerPax: intake?.cost_per_pax || 0,
          payableAmount: wastage.quantity_wasted * (intake?.cost_per_pax || 0),
          supplierName: intake?.supplier?.name || "Unknown",
        });
      }

      grouped.set(dateKey, bill);
    });

    // Apply wastage reductions
    adjustments.forEach((adj) => {
      if (!adj.intake_id) return;

      const bill = Array.from(grouped.values()).find((b) =>
        b.lines.some((l) => l.intakeId === adj.intake_id)
      );
      if (!bill) return;

      const line = bill.lines.find((l) => l.intakeId === adj.intake_id);
      if (line) {
        line.wastageReduction = adj.reduction_quantity;
      }
    });

    // Recalculate payable and totals
    grouped.forEach((bill) => {
      bill.lines.forEach((line) => {
        line.payableQuantity = line.quantitySold + Math.max(0, line.quantityWasted - line.wastageReduction);
        line.payableAmount = line.payableQuantity * line.costPerPax;

        bill.totalSold += line.quantitySold;
        bill.totalWasted += line.quantityWasted;
        bill.totalReduction += line.wastageReduction;
        bill.totalPayable += line.payableQuantity;
        bill.totalAmount += line.payableAmount;
      });
    });

    return Array.from(grouped.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, wastages, adjustments, intakes, trucks]);

  return { dailyBills };
};
