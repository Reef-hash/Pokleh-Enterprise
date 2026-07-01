import Dexie, { type Table } from "dexie";

export interface OfflineProfile {
  id?: number;
  user_id: string;
  email: string;
  name: string;
  role: "admin" | "staff";
  syncedAt?: string;
}

export interface OfflineCustomer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  truck_id: string;
  debt_balance: number;
  active: boolean;
  updatedAt: string;
  syncedAt?: string;
}

export interface OfflineTruck {
  id: string;
  name: string;
  syncedAt?: string;
}

export interface OfflineSupplier {
  id: string;
  name: string;
  phone?: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface OfflineStockIntake {
  id: string;
  intake_date: string;
  supplier_id: string;
  truck_id: string;
  product_type: string;
  quantity_received: number;
  cost_per_pax: number;
  notes?: string;
  created_by: string;
  created_at: string;
  syncedAt?: string;
}

export interface OfflineStockDistribution {
  id: string;
  intake_id?: string;
  from_truck_id: string;
  to_truck_id: string;
  product_type: string;
  quantity_assigned: number;
  created_by: string;
  created_at: string;
  syncedAt?: string;
}

export interface OfflineStockReturn {
  id: string;
  distribution_id?: string;
  intake_id?: string;
  truck_id: string;
  quantity_returned: number;
  return_date: string;
  notes?: string;
  created_by: string;
  created_at: string;
  syncedAt?: string;
}

export interface OfflineSupplierSettlement {
  id: string;
  intake_id: string;
  payable_amount: number;
  paid_amount: number;
  settled_date: string;
  notes?: string;
  created_by: string;
  created_at: string;
  syncedAt?: string;
}

export interface OfflineSale {
  id: string;
  customer_id: string;
  truck_id: string;
  product_type: string;
  quantity: number;
  selling_price: number;
  payment_type: "cash" | "debt";
  distribution_id?: string;
  staff_id: string;
  sale_date: string;
  notes?: string;
  created_at: string;
  syncedAt?: string;
}

export interface OfflineDebtLedgerEntry {
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
  syncedAt?: string;
}

export interface OfflineDebtCollection {
  id: string;
  customer_id: string;
  amount: number;
  collection_date: string;
  staff_id: string;
  notes?: string;
  created_at: string;
  syncedAt?: string;
}

export interface SyncQueueItem {
  id?: number;
  entity: string;
  entityId: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  payload: unknown;
  createdAt: string;
  retryCount: number;
  lastError?: string;
  lastAttempt?: string;
}

export interface OfflineAuditLog {
  id?: number;
  user_id: string;
  action: string;
  entity: string;
  entity_id: string;
  old_values?: unknown;
  new_values?: unknown;
  created_at: string;
}

export interface OfflineExpense {
  id: string;
  category: string;
  amount: number;
  expense_date: string;
  notes?: string;
  created_by: string;
  created_at: string;
  syncedAt?: string;
}

export interface OfflineSupplierPriceHistory {
  id: string;
  supplier_id: string;
  cost_per_pax: number;
  effective_date: string;
  created_at: string;
  syncedAt?: string;
}

export interface OfflineDailyClosing {
  id: string;
  closing_date: string;
  truck_id: string;
  product_type: string;
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
  closed_by?: string;
  closed_at?: string;
  reconciled_by?: string;
  reconciled_at?: string;
  created_at: string;
  syncedAt?: string;
}

export interface OfflineStockWastage {
  id: string;
  truck_id: string;
  product_type: string;
  quantity_wasted: number;
  waste_date: string;
  intake_id?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  syncedAt?: string;
}

export interface OfflineWastageAdjustment {
  id: string;
  intake_id: string;
  truck_id: string;
  product_type: string;
  total_wasted: number;
  reduction_quantity: number;
  reason?: string;
  adjustment_date: string;
  approved_by?: string;
  approved_at?: string;
  created_by: string;
  created_at: string;
  syncedAt?: string;
}

export class PoklehDB extends Dexie {
  profiles!: Table<OfflineProfile, number>;
  customers!: Table<OfflineCustomer, string>;
  trucks!: Table<OfflineTruck, string>;
  suppliers!: Table<OfflineSupplier, string>;
  stockIntakes!: Table<OfflineStockIntake, string>;
  stockDistributions!: Table<OfflineStockDistribution, string>;
  stockReturns!: Table<OfflineStockReturn, string>;
  supplierSettlements!: Table<OfflineSupplierSettlement, string>;
  sales!: Table<OfflineSale, string>;
  debtLedger!: Table<OfflineDebtLedgerEntry, string>;
  debtCollections!: Table<OfflineDebtCollection, string>;
  expenses!: Table<OfflineExpense, string>;
  supplierPriceHistory!: Table<OfflineSupplierPriceHistory, string>;
  dailyClosings!: Table<OfflineDailyClosing, string>;
  stockWastages!: Table<OfflineStockWastage, string>;
  wastageAdjustments!: Table<OfflineWastageAdjustment, string>;
  syncQueue!: Table<SyncQueueItem, number>;
  auditLogs!: Table<OfflineAuditLog, number>;

  constructor() {
    super("PoklehEnterprise");
    this.version(5).stores({
      profiles: "++id, user_id, role",
      customers: "id, name, area_id, active",
      areas: "id, name",
      suppliers: "id, name",
      stockIntakes: "id, supplier_id, created_at",
      stockDistributions: "id, intake_id, staff_id, area_id, created_at",
      stockReturns: "id, distribution_id, created_at",
      supplierSettlements: "id, intake_id, settled_date",
      sales: "id, customer_id, area_id, staff_id, sale_date, payment_type",
      debtLedger: "id, customer_id, entry_type, created_at",
      debtCollections: "id, customer_id, staff_id, collection_date",
      expenses: "id, category, expense_date, created_at",
      supplierPriceHistory: "id, supplier_id, effective_date",
      dailyClosings: "id, closing_date, area_id, status",
      syncQueue: "++id, entity, entityId, createdAt",
      auditLogs: "++id, entity, entity_id, created_at",
    });
    this.version(6).stores({
      profiles: "++id, user_id, role",
      customers: "id, name, truck_id, active",
      areas: null,
      trucks: "id, name",
      suppliers: "id, name",
      stockIntakes: "id, supplier_id, truck_id, product_type, intake_date, created_at",
      stockDistributions: "id, intake_id, from_truck_id, to_truck_id, product_type, created_at",
      stockReturns: "id, distribution_id, intake_id, truck_id, return_date, created_at",
      supplierSettlements: "id, intake_id, settled_date",
      sales: "id, customer_id, truck_id, staff_id, sale_date, payment_type, product_type",
      debtLedger: "id, customer_id, entry_type, created_at",
      debtCollections: "id, customer_id, staff_id, collection_date",
      expenses: "id, category, expense_date, created_at",
      supplierPriceHistory: "id, supplier_id, effective_date",
      dailyClosings: "id, closing_date, truck_id, product_type, status",
      syncQueue: "++id, entity, entityId, createdAt",
      auditLogs: "++id, entity, entity_id, created_at",
    });
    this.version(7).stores({
      profiles: "++id, user_id, role",
      customers: "id, name, truck_id, active",
      trucks: "id, name",
      suppliers: "id, name",
      stockIntakes: "id, supplier_id, truck_id, product_type, intake_date, created_at",
      stockDistributions: "id, intake_id, from_truck_id, to_truck_id, product_type, created_at",
      stockReturns: "id, distribution_id, intake_id, truck_id, return_date, created_at",
      supplierSettlements: "id, intake_id, settled_date",
      sales: "id, customer_id, truck_id, staff_id, sale_date, payment_type, product_type",
      debtLedger: "id, customer_id, entry_type, created_at",
      debtCollections: "id, customer_id, staff_id, collection_date",
      expenses: "id, category, expense_date, created_at",
      supplierPriceHistory: "id, supplier_id, effective_date",
      dailyClosings: "id, closing_date, truck_id, product_type, status",
      stockWastages: "id, truck_id, waste_date, intake_id, created_at",
      wastageAdjustments: "id, intake_id, truck_id, adjustment_date",
      syncQueue: "++id, entity, entityId, createdAt",
      auditLogs: "++id, entity, entity_id, created_at",
    });
  }
}

export const db = new PoklehDB();
