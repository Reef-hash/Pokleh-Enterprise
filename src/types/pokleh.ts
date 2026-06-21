// ============================================================
// Pokleh Enterprise Domain Types (Architecture Freeze v1)
// ============================================================

export type ProductType = 'Air Batu Besar' | 'Air Batu Kecil' | 'Air Batu Hancur';
export const PRODUCT_TYPES: ProductType[] = ['Air Batu Besar', 'Air Batu Kecil', 'Air Batu Hancur'];

export interface Area {
  id: string;
  name: string;
  created_at: string;
}

export interface StaffAreaAssignment {
  id: string;
  staff_id: string;
  area_id: string;
  assigned_date: string;
  ended_date: string | null;
  created_at: string;
  area?: Area;
  profile?: Profile;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  area_id: string;
  debt_balance: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  area?: Area;
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
  product_type: ProductType;
  quantity_received: number;
  cost_per_pax: number;
  notes: string | null;
  created_by: string;
  created_at: string;
  supplier?: Supplier;
}

export interface StockDistribution {
  id: string;
  intake_id: string;
  area_id: string;
  product_type: ProductType;
  quantity_assigned: number;
  created_by: string;
  created_at: string;
  intake?: StockIntake;
  area?: Area;
}

export interface Sale {
  id: string;
  customer_id: string;
  area_id: string;
  product_type: ProductType;
  quantity: number;
  selling_price: number;
  payment_type: "cash" | "debt";
  distribution_id: string | null;
  staff_id: string;
  sale_date: string;
  notes: string | null;
  created_at: string;
  customer?: Customer;
  area?: Area;
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
  customer?: Customer;
  staff?: Profile;
}

export interface StockReturn {
  id: string;
  distribution_id: string;
  area_id: string;
  quantity_returned: number;
  return_date: string;
  created_by: string;
  created_at: string;
  distribution?: StockDistribution;
  area?: Area;
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
}

export interface DailyClosing {
  id: string;
  closing_date: string;
  area_id: string;
  status: "open" | "closed" | "reconciled";
  total_assigned: number;
  total_sold: number;
  total_returned: number;
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
  area?: Area;
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
