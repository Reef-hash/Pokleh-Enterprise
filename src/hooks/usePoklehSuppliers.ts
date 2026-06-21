import { useState, useEffect, useCallback } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { suppliersRepo } from "@/repositories/suppliersRepo";
import { db } from "@/lib/db";
import { persistWrite } from "@/lib/writeHelper";
import type { Supplier } from "@/types/pokleh";

export const usePoklehSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuppliers = useCallback(async () => {
    try {
      const { data, error } = await suppliersRepo.fetchAll();
      if (error) throw error;
      const result = (data || []) as Supplier[];
      setSuppliers(result);
      await db.suppliers.bulkPut(
        result.map((s) => ({ ...s, updatedAt: s.updated_at, syncedAt: new Date().toISOString() }))
      );
    } catch {
      const cached = await db.suppliers.toArray();
      if (cached.length > 0) setSuppliers(cached as unknown as Supplier[]);
    }
  }, []);

  const addSupplier = async (name: string, phone?: string) => {
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const optimistic: Supplier = {
      id: tempId,
      name,
      phone: phone || null,
      created_at: now,
      updated_at: now,
    } as Supplier;
    return persistWrite<Supplier>({
      entity: "suppliers",
      action: "INSERT",
      userId: "system",
      data: { name, phone: phone || null },
      execute: () => suppliersRepo.create({ name, phone: phone || null }),
      optimistic: {
        add: () => setSuppliers((prev) => [...prev, optimistic]),
        remove: () => setSuppliers((prev) => prev.filter((s) => s.id !== tempId)),
      },
      onSuccess: (supplier) =>
        setSuppliers((prev) => prev.map((s) => (s.id === tempId ? supplier : s))),
      dexiePut: (supplier) =>
        db.suppliers.put({ ...supplier, updatedAt: supplier.updated_at, syncedAt: new Date().toISOString() }),
      cacheOffline: async () => db.suppliers.put(optimistic as unknown as import("@/lib/db").OfflineSupplier),
      msg: "Supplier added",
    });
  };

  const updateSupplier = async (id: string, name: string, phone?: string) => {
    return persistWrite<Supplier>({
      entity: "suppliers",
      action: "UPDATE",
      userId: "system",
      id,
      data: { name, phone: phone || null },
      execute: () => suppliersRepo.update(id, { name, phone: phone || null }),
      onSuccess: (updated) =>
        setSuppliers((prev) => prev.map((s) => (s.id === id ? updated : s))),
      dexiePut: (updated) =>
        db.suppliers.put({ ...updated, updatedAt: updated.updated_at, syncedAt: new Date().toISOString() }),
      msg: "Supplier updated",
    });
  };

  const deleteSupplier = async (id: string) => {
    return persistWrite<Supplier>({
      entity: "suppliers",
      action: "DELETE",
      userId: "system",
      id,
      execute: async () => {
        const { error } = await suppliersRepo.delete(id);
        if (error) return { data: null, error };
        return { data: { id } as unknown as Supplier, error: undefined };
      },
      onSuccess: () => setSuppliers((prev) => prev.filter((s) => s.id !== id)),
      dexieDelete: () => db.suppliers.delete(id),
      msg: "Supplier deleted",
    });
  };

  const refreshTick = useSyncStore((s) => s.refreshTick);

  useEffect(() => {
    fetchSuppliers().finally(() => setLoading(false));
  }, [fetchSuppliers, refreshTick]);

  return { suppliers, loading, addSupplier, updateSupplier, deleteSupplier, refresh: fetchSuppliers };
};
