import { offlineDetector } from "@/services/offline";
import { syncEngine } from "@/services/sync";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/errors";
import { db } from "@/lib/db";

export interface PersistConfig<T> {
  entity: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  userId?: string;
  data?: Record<string, unknown>;
  id?: string;
  execute: () => Promise<{ data?: T | null; error?: { message?: string } }>;
  optimistic?: {
    add: () => void;
    remove: () => void;
  };
  onSuccess: (result: T) => void;
  dexiePut?: (result: T) => Promise<void>;
  dexieDelete?: () => Promise<void>;
  cacheOffline?: () => Promise<void>;
  msg: string;
}

export interface PersistResult {
  success: boolean;
  offline?: boolean;
}

export async function persistWrite<T>(config: PersistConfig<T>): Promise<PersistResult> {
  const { entity, action, userId, data, id, execute, optimistic, onSuccess, dexiePut, dexieDelete, cacheOffline, msg } = config;

  if (userId === undefined || userId === null) return { success: false };

  // Offline path
  if (!offlineDetector.isOnline) {
    const tempId = crypto.randomUUID();
    const payload = id ? { ...data, id } : { ...data };
    await syncEngine.enqueue({ entity, entityId: id || tempId, action, payload: payload as Record<string, unknown> });
    if (optimistic) optimistic.add();
    if (cacheOffline) await cacheOffline();
    toast.success("Saved offline — will sync when connected");
    return { success: true, offline: true };
  }

  // Online — optimistic UI
  if (optimistic) optimistic.add();

  // Execute supabase call
  try {
    const { data: result, error } = await execute();
    if (error) {
      toast.error(getUserFriendlyError(error, entity));
      if (optimistic) optimistic.remove();
      return { success: false };
    }
    if (!result) {
      toast.error("No response from server");
      if (optimistic) optimistic.remove();
      return { success: false };
    }

    onSuccess(result as T);
    if (dexiePut) await dexiePut(result as T);
    if (dexieDelete) await dexieDelete();
    toast.success(msg);
    return { success: true };
  } catch (err) {
    toast.error("Connection error. Please try again.");
    if (optimistic) optimistic.remove();
    return { success: false };
  }
}

export async function mergeUnSyncedData<T extends { id: string }>(
  entity: string,
  serverData: T[]
): Promise<T[]> {
  // Get unsynced INSERT operations from queue
  const syncQueue = await db.syncQueue
    .where("entity").equals(entity)
    .filter(item => item.action === "INSERT")
    .toArray();

  const syncedIds = new Set(serverData.map((item: any) => item.id));
  const unsyncedItems = syncQueue
    .filter(item => !syncedIds.has(item.entityId))
    .map(item => ({
      id: item.entityId,
      ...item.payload,
    })) as T[];

  return [...serverData, ...unsyncedItems];
}
