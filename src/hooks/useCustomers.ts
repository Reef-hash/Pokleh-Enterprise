import { useState, useEffect, useCallback } from "react";
import { customersRepo } from "@/repositories/customersRepo";
import { db } from "@/lib/db";
import { persistWrite } from "@/lib/writeHelper";
import type { Customer, Area } from "@/types/pokleh";

export const useCustomers = (areaId?: string) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    try {
      const { data, error } = await customersRepo.fetchAll(areaId);
      if (error) throw error;
      const result = (data || []) as unknown as Customer[];
      setCustomers(result);
      await db.customers.bulkPut(
        result.map((c) => ({
          ...c,
          updatedAt: c.updated_at,
          syncedAt: new Date().toISOString(),
        }))
      );
    } catch {
      const cached = await db.customers
        .where("area_id")
        .equals(areaId || "")
        .toArray();
      if (cached.length > 0) {
        setCustomers(cached as unknown as Customer[]);
      }
    }
  }, [areaId]);

  const addCustomer = async (data: {
    name: string;
    phone?: string;
    address?: string;
    area_id: string;
    area?: Area;
  }) => {
    const { area, ...insertData } = data;
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const optimistic: Customer = {
      id: tempId,
      name: data.name,
      phone: data.phone ?? null,
      address: data.address ?? null,
      area_id: data.area_id,
      area: area,
      debt_balance: 0,
      active: true,
      created_at: now,
      updated_at: now,
    } as Customer;
    return persistWrite<Customer>({
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

  useEffect(() => {
    fetchCustomers().finally(() => setLoading(false));
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    toggleActive,
    refresh: fetchCustomers,
  };
};
