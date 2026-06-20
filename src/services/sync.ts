import { db, type SyncQueueItem } from "@/lib/db";
import { offlineDetector } from "./offline";
import { supabase } from "@/integrations/supabase/client";

const FINANCIAL_TABLES = new Set([
  "sales",
  "debt_ledger",
  "debt_collection",
  "stock_intake",
  "stock_distribution",
  "stock_return",
  "expenses",
  "supplier_settlements",
]);

type SyncStatus = "idle" | "syncing" | "error";
type StatusListener = (status: SyncStatus, error?: string) => void;

class SyncEngine {
  private _status: SyncStatus = "idle";
  private listeners: Set<StatusListener> = new Set();
  private isProcessing = false;
  private unsubscribe: (() => void) | null = null;

  get status(): SyncStatus {
    return this._status;
  }

  start(): void {
    this.unsubscribe = offlineDetector.subscribe((online) => {
      if (online) this.processQueue();
    });
    if (offlineDetector.isOnline) this.processQueue();
  }

  stop(): void {
    if (this.unsubscribe) this.unsubscribe();
  }

  async enqueue(item: Omit<SyncQueueItem, "id" | "createdAt" | "retryCount">): Promise<void> {
    await db.syncQueue.add({
      ...item,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    });
    if (offlineDetector.isOnline) this.processQueue();
  }

  private setStatus(status: SyncStatus, error?: string): void {
    this._status = status;
    this.listeners.forEach((fn) => fn(status, error));
  }

  subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || !offlineDetector.isOnline) return;
    this.isProcessing = true;
    this.setStatus("syncing");

    try {
      const queue = await db.syncQueue.orderBy("createdAt").toArray();
      for (const item of queue) {
        try {
          await this.processItem(item);
          await db.syncQueue.delete(item.id!);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Sync failed";
          if (item.retryCount >= 5) {
            await db.syncQueue.delete(item.id!);
          } else {
            await db.syncQueue.update(item.id!, {
              retryCount: item.retryCount + 1,
              lastError: message,
            });
          }
        }
      }
      this.setStatus("idle");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Queue processing failed";
      this.setStatus("error", message);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processItem(item: SyncQueueItem): Promise<void> {
    const entity = item.entity as keyof typeof supabaseFrom;

    if (FINANCIAL_TABLES.has(item.entity)) {
      const { data: existing } = await supabase
        .from(item.entity)
        .select("id")
        .eq("id", item.entityId)
        .maybeSingle();
      if (existing) return;
    }

    const payload = item.payload as Record<string, unknown>;
    switch (item.action) {
      case "INSERT":
        await supabase.from(item.entity).insert(payload);
        break;
      case "UPDATE":
        await supabase.from(item.entity).update(payload).eq("id", item.entityId);
        break;
      case "DELETE":
        await supabase.from(item.entity).delete().eq("id", item.entityId);
        break;
    }
  }
}

const supabaseFrom = {} as Record<string, unknown>;
export const syncEngine = new SyncEngine();
