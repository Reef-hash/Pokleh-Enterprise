import { useState, useEffect, useCallback } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { customersRepo } from "@/repositories/customersRepo";
import { db } from "@/lib/db";
import { persistWrite, mergeUnSyncedData } from "@/lib/writeHelper";
import type { Customer, Truck } from "@/types/pokleh";

export const useCustomers = (truckId?: string) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const triggerRefresh = useSyncStore((s) => s.triggerRefresh);

  const fetchCustomers = useCallback(async () => {
    try {
      const { data, error } = await customersRepo.fetchAll(truckId);
      if (error) throw error;
      const result = (data || []) as unknown as Customer[];
      const merged = await mergeUnSyncedData("customers", result);
      setCustomers(merged);
      await db.customers.bulkPut(
        merged.map((c) => ({
          ...c,
          updatedAt: c.updated_at,
          syncedAt: new Date().toISOString(),
        }))
      );
    } catch {
      const cached = await db.customers
        .where("truck_id")
        .equals(truckId || "")
        .toArray();
      if (cached.length > 0) {
        setCustomers(cached as unknown as Customer[]);
      }
    }
  }, [truckId]);

  const addCustomer = async (data: {
    name: string;
    phone?: string;
    address?: string;
    truck_id: string;
    truck?: Truck;
  }) => {
    const { truck, ...insertData } = data;
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const optimistic: Customer = {
      id: tempId,
      name: data.name,
      phone: data.phone ?? null,
      address: data.address ?? null,
      truck_id: data.truck_id,
      truck: truck,
      debt_balance: 0,
      active: true,
      created_at: now,
      updated_at: now,
    } as Customer;
    const result = await persistWrite<Customer>({
      entity: "customers",
      action: "INSERT",
      userId: "system",
      data: data as Record<string, unknown>,
      execute: () => customersRepo.create(insertData),
      optimistic: {
        add: () => setCustomers((prev) => [...prev, optimistic]),
        remove: () => setCustomers((prev) => prev.filter((c) => c.id !== tempId)),
      },
      onSuccess: (customer) =>
        setCustomers((prev) => prev.map((c) => (c.id === tempId ? customer : c))),
      dexiePut: (customer) =>
        db.customers.put({
          ...customer,
          updatedAt: customer.updated_at,
          syncedAt: new Date().toISOString(),
        }),
      cacheOffline: async () => db.customers.put({ ...optimistic, updatedAt: optimistic.created_at, syncedAt: now }),
      msg: "Customer added",
    });
    if (result.success) {
      await triggerRefresh();
    }
    return result;
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    return persistWrite<Customer>({
      entity: "customers",
      action: "UPDATE",
      userId: "system",
      id,
      data: updates as Record<string, unknown>,
      execute: () => customersRepo.update(id, updates as Record<string, unknown>),
      onSuccess: (updated) =>
        setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c))),
      dexiePut: (updated) =>
        db.customers.put({
          ...updated,
          updatedAt: updated.updated_at,
          syncedAt: new Date().toISOString(),
        }),
      msg: "Customer updated",
    });
  };

  const toggleActive = async (id: string, active: boolean) => {
    return updateCustomer(id, { active } as Partial<Customer>);
  };

  const refreshTick = useSyncStore((s) => s.refreshTick);

  useEffect(() => {
    fetchCustomers().finally(() => setLoading(false));
  }, [fetchCustomers, refreshTick]);

  return {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    toggleActive,
    refresh: fetchCustomers,
  };
};
