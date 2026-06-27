// ============================================================
// Pokleh Enterprise Domain Types (Architecture Freeze v1)
// ============================================================

export type ProductType = 'Air Batu Besar' | 'Air Batu Kecil' | 'Air Batu Hancur';
export const PRODUCT_TYPES: ProductType[] = ['Air Batu Besar', 'Air Batu Kecil', 'Air Batu Hancur'];

export type CorrectionStatus = "correction" | "reversal";

export interface Truck {
  id: string;
  name: string;
  created_at: string;
}

export interface StaffTruckAssignment {
  id: string;
  staff_id: string;
  truck_id: string;
  assigned_date: string;
  ended_date: string | null;
  created_at: string;
  truck?: Truck;
  profile?: Profile;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  truck_id: string;
  debt_balance: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  truck?: Truck;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierPriceHistory {
  id: string;
  supplier_id: string;
  cost_per_pax: number;
  effective_date: string;
  created_at: string;
}

export interface StockIntake {
  id: string;
  intake_date: string;
  supplier_id: string;
  truck_id: string;
  product_type: ProductType;
  quantity_received: number;
  cost_per_pax: number;
  notes: string | null;
  created_by: string;
  created_at: string;
  correction_of: string | null;
  correction_status: CorrectionStatus | null;
  supplier?: Supplier;
  truck?: Truck;
}

export interface StockDistribution {
  id: string;
  intake_id: string | null;
  from_truck_id: string;
  to_truck_id: string;
  product_type: ProductType;
  quantity_assigned: number;
  created_by: string;
  created_at: string;
  correction_of: string | null;
  correction_status: CorrectionStatus | null;
  intake?: StockIntake;
  from_truck?: Truck;
  to_truck?: Truck;
}

export interface Sale {
  id: string;
  customer_id: string;
  truck_id: string;
  product_type: ProductType;
  quantity: number;
  selling_price: number;
  payment_type: "cash" | "debt";
  distribution_id: string | null;
  staff_id: string;
  sale_date: string;
  notes: string | null;
  created_at: string;
  correction_of: string | null;
  correction_status: CorrectionStatus | null;
  customer?: Customer;
  truck?: Truck;
  staff?: Profile;
  distribution?: StockDistribution;
}

export interface DebtLedgerEntry {
  id: string;
  customer_id: string;
  entry_type: "sale" | "payment" | "adjustment";
  amount: number;
  reference_type: string;
  reference_id: string;
  balance_before: number;
  balance_after: number;
  created_by: string;
  created_at: string;
  customer?: Customer;
}

export interface DebtCollection {
  id: string;
  customer_id: string;
  amount: number;
  collection_date: string;
  staff_id: string;
  notes: string | null;
  created_at: string;
  correction_of: string | null;
  correction_status: CorrectionStatus | null;
  customer?: Customer;
  staff?: Profile;
}

export interface StockReturn {
  id: string;
  distribution_id: string | null;
  intake_id: string | null;
  truck_id: string;
  quantity_returned: number;
  return_date: string;
  created_by: string;
  created_at: string;
  correction_of: string | null;
  correction_status: CorrectionStatus | null;
  distribution?: StockDistribution;
  intake?: StockIntake;
  truck?: Truck;
}

export interface SupplierSettlement {
  id: string;
  intake_id: string;
  total_received: number;
  total_sold: number;
  total_returned: number;
  payable_quantity: number;
  cost_per_pax: number;
  payable_amount: number;
  settlement_date: string | null;
  status: "pending" | "settled";
  settled_by: string | null;
  created_at: string;
  updated_at: string;
  correction_of: string | null;
  correction_status: CorrectionStatus | null;
  intake?: StockIntake;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  expense_date: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  correction_of: string | null;
  correction_status: CorrectionStatus | null;
}

export interface DailyClosing {
  id: string;
  closing_date: string;
  truck_id: string;
  product_type: ProductType;
  status: "open" | "closed" | "reconciled";
  total_intake: number;
  total_sold: number;
  total_returned: number;
  total_transfer_in: number;
  total_transfer_out: number;
  closing_balance: number;
  cash_sales: number;
  debt_sales: number;
  debt_collections: number;
  expenses_total: number;
  supplier_payable: number;
  profit_estimate: number;
  closed_by: string | null;
  closed_at: string | null;
  reconciled_by: string | null;
  reconciled_at: string | null;
  created_at: string;
  truck?: Truck;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity: string;
  entity_id: string;
  old_values: unknown | null;
  new_values: unknown | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: "admin" | "staff";
  created_at: string;
  updated_at: string;
}

export interface SellingPrice {
  id: string;
  product_type: ProductType;
  customer_id: string | null;
  price_per_pax: number;
  notes: string | null;
  created_at: string;
  customer?: Customer;
}
